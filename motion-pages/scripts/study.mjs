#!/usr/bin/env node
// motion-pages study — "clone the feel of this URL", measured instead of guessed.
// Zero dependencies: drives headless Chrome over raw CDP (Node ≥22 for WebSocket + fetch).
//
//   node scripts/study.mjs https://reference.site            # → study/<host>/spec.md + storyboard PNGs
//   node scripts/study.mjs https://reference.site --out=dir  # choose the output dir
//   node scripts/study.mjs https://reference.site --json     # machine output on stdout as well
//   node scripts/study.mjs page.html                         # local files work too
//
// What it produces (SKILL.md §Study-a-reference workflow, steps 1–3 made executable):
//   storyboard   desktop + phone screenshots at 0/25/50/75/100 % scroll
//   palette      dominant colors from the rendered hero, plus DOM bg / text / accent
//   type         display + body faces, sizes, weight, tracking, case
//   motion       what reacts to what: ambient / pointer / drag / scroll / hover — by pixel diff
//   tech         runtime globals + bundle grep (three, gsap, lenis, shaders, …)
//   recipes      the skill archetypes the observations map to, with confidence
//   prompt       a build-spec prompt to paste into the agent (themed to YOUR brand, not theirs)
//
// The study captures the MOTION LANGUAGE of a site. The rebuild is original code for the
// user's brand — never the reference's code, assets, copy, fonts-by-file, or branding.

import {spawn} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import zlib from 'node:zlib';

// ---------- args ----------

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const jsonOut = flags.has('--json');
const outFlag = [...flags].find((f) => f.startsWith('--out='))?.split('=')[1];
const target = args.find((a) => !a.startsWith('--'));
if (!target) {
  console.error('usage: node scripts/study.mjs <url|page.html> [--out=dir] [--json]');
  process.exit(2);
}
const isUrl = /^https?:\/\//.test(target);
const pageUrl = isUrl ? target : pathToFileURL(resolve(target)).href;
const host = isUrl ? new URL(target).host.replace(/^www\./, '') : resolve(target).split('/').pop().replace(/\.html?$/, '');
const OUT = resolve(outFlag ?? join('study', host));
mkdirSync(OUT, {recursive: true});

const CHROME =
  process.env.CHROME_BIN ??
  ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
   '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
    .find((p) => existsSync(p));
if (!CHROME) {
  console.error('Chrome not found — set CHROME_BIN');
  process.exit(2);
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const DESKTOP = {name: 'desktop', width: 1600, height: 900, mobile: false};
const PHONE = {name: 'phone', width: 390, height: 844, mobile: true};
const SETTLE_MS = +([...flags].find((f) => f.startsWith('--settle='))?.split('=')[1] ?? 3500);
const READY_MAX_MS = 15000; // extra time to outlast preloaders / intro sequences
const DEPTHS = [0, 0.25, 0.5, 0.75, 1];

// ---------- tiny CDP client (same as audit.mjs) ----------

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.listeners = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== undefined) {
        const p = this.pending.get(msg.id);
        if (p) { this.pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result); }
      } else (this.listeners.get(msg.method) ?? []).forEach((fn) => fn(msg.params, msg.sessionId));
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, {resolve: res, reject: rej});
      this.ws.send(JSON.stringify({id, method, params, sessionId}));
    });
  }
  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(fn);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launchChrome() {
  const proc = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=0', '--no-first-run', '--hide-scrollbars',
    '--force-color-profile=srgb', '--mute-audio', '--allow-file-access-from-files',
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  ], {stdio: ['ignore', 'ignore', 'pipe']});
  const wsUrl = await new Promise((res, rej) => {
    let buf = '';
    proc.stderr.on('data', (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) res(m[1]); });
    proc.on('exit', () => rej(new Error('chrome exited before devtools url')));
    setTimeout(() => rej(new Error('chrome devtools url timeout')), 15000);
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res, {once: true}); ws.addEventListener('error', rej, {once: true}); });
  return {proc, cdp: new CDP(ws)};
}

// ---------- PNG decode + pixel helpers ----------

function decodePNG(b64) {
  const buf = Buffer.from(b64, 'base64');
  let off = 8, width = 0, height = 0, channels = 4;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      const colorType = data[9];
      channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
      if (data[8] !== 8 || !channels || data[12] !== 0) return null;
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.allocUnsafe(height * stride);
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0, b = prev ? prev[x] : 0, c = prev && x >= channels ? prev[x - channels] : 0;
      let v = row[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) v += paeth(a, b, c);
      cur[x] = v & 0xff;
    }
  }
  return {width, height, channels, data: out};
}

// fraction of sampled pixels that changed noticeably between two frames (optionally inside a rect)
function frameDiff(a, b, rect) {
  if (!a || !b || a.width !== b.width || a.height !== b.height) return null;
  const x0 = rect ? Math.max(0, Math.floor(rect.x)) : 0, y0 = rect ? Math.max(0, Math.floor(rect.y)) : 0;
  const x1 = rect ? Math.min(a.width, Math.ceil(rect.x + rect.w)) : a.width;
  const y1 = rect ? Math.min(a.height, Math.ceil(rect.y + rect.h)) : a.height;
  let n = 0, d = 0;
  for (let y = y0; y < y1; y += 3) for (let x = x0; x < x1; x += 3) {
    const i = (y * a.width + x) * a.channels;
    const dd = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
    if (dd > 24) d++;
    n++;
  }
  return n ? d / n : null;
}

const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return {h: 0, s: 0, l};
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return {h: ((h * 60) + 360) % 360, s, l};
}

// dominant colors: 4-bit quantize → count → merge neighbours → top N with share
function palette(png, n = 6) {
  const counts = new Map();
  let total = 0;
  for (let y = 0; y < png.height; y += 4) for (let x = 0; x < png.width; x += 4) {
    const i = (y * png.width + x) * png.channels;
    const key = ((png.data[i] >> 4) << 8) | ((png.data[i + 1] >> 4) << 4) | (png.data[i + 2] >> 4);
    counts.set(key, (counts.get(key) ?? 0) + 1); total++;
  }
  const cells = [...counts.entries()].map(([k, c]) => ({r: ((k >> 8) & 15) * 17, g: ((k >> 4) & 15) * 17, b: (k & 15) * 17, c}))
    .sort((a, b) => b.c - a.c);
  const merged = [];
  for (const cell of cells) {
    const near = merged.find((m) => Math.abs(m.r - cell.r) + Math.abs(m.g - cell.g) + Math.abs(m.b - cell.b) < 60);
    if (near) { near.c += cell.c; continue; }
    merged.push({...cell});
    if (merged.length >= 24) break;
  }
  return merged.slice(0, n).map((m) => ({hex: hex(m.r, m.g, m.b), share: +(m.c / total).toFixed(3), ...rgbToHsl(m.r, m.g, m.b)}));
}

// ---------- in-page inspection ----------

const INSPECT_JS = String.raw`(() => {
  const out = {};
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05 &&
      r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
  const all = [...document.querySelectorAll('body *')];
  const visible = all.filter(vis);
  const textOf = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
  const fontOf = (s) => s.fontFamily.split(',')[0].replace(/["']/g, '').trim();

  // type: biggest visible heading-ish text = display; most common paragraph = body
  const cands = visible.filter((el) => /^(H1|H2|H3|P|SPAN|DIV|A|LI)$/.test(el.tagName) &&
    [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1));
  const bySize = cands.map((el) => ({el, s: getComputedStyle(el)})).sort((a, b) => parseFloat(b.s.fontSize) - parseFloat(a.s.fontSize));
  // a single giant glyph is a watermark, not the display face — need a real word
  const disp = bySize.find(({el}) => textOf(el).length >= 3) ?? bySize[0];
  out.visibleTextChars = visible.reduce((a, el) => a + [...el.childNodes].filter((n) => n.nodeType === 3).reduce((b, n) => b + n.textContent.trim().length, 0), 0);
  out.display = disp ? {
    text: textOf(disp.el).slice(0, 80), font: fontOf(disp.s), size: parseFloat(disp.s.fontSize),
    weight: disp.s.fontWeight, tracking: disp.s.letterSpacing, lineHeight: disp.s.lineHeight,
    transform: disp.s.textTransform, color: disp.s.color, italic: disp.s.fontStyle === 'italic',
  } : null;
  const paras = visible.filter((el) => el.tagName === 'P' && textOf(el).length > 40);
  const bodyEl = paras[0] ?? cands.find((el) => textOf(el).length > 40);
  const bs = bodyEl ? getComputedStyle(bodyEl) : null;
  out.body = bs ? {font: fontOf(bs), size: parseFloat(bs.fontSize), lineHeight: bs.lineHeight, color: bs.color,
    measure: Math.round(bodyEl.getBoundingClientRect().width)} : null;
  const fonts = {};
  for (const {s} of bySize) { const f = fontOf(s); fonts[f] = (fonts[f] ?? 0) + 1; }
  out.fonts = Object.entries(fonts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([f]) => f);
  out.monoUsed = bySize.some(({s}) => /mono|courier|menlo|consolas|jetbrains/i.test(s.fontFamily));

  // colors from DOM
  const bg = (el) => getComputedStyle(el).backgroundColor;
  out.bodyBg = bg(document.body) !== 'rgba(0, 0, 0, 0)' ? bg(document.body) : bg(document.documentElement);
  const ctas = visible.filter((el) => el.matches('a,button,[role=button]') && textOf(el).length > 1 && textOf(el).length < 40)
    .map((el) => ({text: textOf(el), bg: bg(el), color: getComputedStyle(el).color, radius: getComputedStyle(el).borderRadius,
      w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height}))
    .filter((c) => c.bg !== 'rgba(0, 0, 0, 0)');
  out.ctas = ctas.slice(0, 4);

  // layout
  out.scrollHeight = document.scrollingElement.scrollHeight; out.innerHeight = innerHeight; out.innerWidth = innerWidth;
  out.sections = document.querySelectorAll('section, main > *, [class*="section"]').length;
  out.fixedNav = !!visible.find((el) => /^(NAV|HEADER)$/.test(el.tagName) && /fixed|sticky/.test(getComputedStyle(el).position));
  const big = (el) => { const r = el.getBoundingClientRect(); return (Math.min(r.right, innerWidth) - Math.max(r.left, 0)) *
    (Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / (innerWidth * innerHeight); };
  out.canvases = [...document.querySelectorAll('canvas')].map((c) => {
    const r = c.getBoundingClientRect(); const s = getComputedStyle(c);
    let kind = 'none';
    for (const t of ['webgl2', 'webgl', '2d']) { try { if (c.getContext(t)) { kind = t; break; } } catch {} }
    return {x: r.x, y: r.y, w: r.width, h: r.height, cover: +big(c).toFixed(2), fixed: /fixed|sticky/.test(s.position) ||
      /fixed|sticky/.test(getComputedStyle(c.parentElement ?? c).position), kind, z: s.zIndex};
  }).filter((c) => c.w > 50 && c.h > 50);
  out.videos = [...document.querySelectorAll('video')].filter(vis).map((v) => ({cover: +big(v).toFixed(2), autoplay: v.autoplay, src: (v.currentSrc || '').slice(0, 80)}));
  out.heroImages = [...document.querySelectorAll('img, picture')].filter(vis).filter((el) => big(el) > 0.25).length;
  out.imageCount = document.querySelectorAll('img').length;
  out.svgCount = document.querySelectorAll('svg').length;

  // CSS motion census
  let css = '';
  for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) css += r.cssText + '\n'; } catch {} }
  out.cssKeyframes = (css.match(/@keyframes/g) ?? []).length;
  out.cssBeziers = [...new Set((css.match(/cubic-bezier\([^)]*\)/g) ?? []))].slice(0, 6);
  out.cssTransitions = (css.match(/transition[^;:]*:\s*[^;]*\d\.?\d*m?s/g) ?? []).length;
  out.hasReducedMotion = /prefers-reduced-motion/.test(css);
  out.animRunning = document.getAnimations ? document.getAnimations().length : -1;
  out.transformed3d = visible.filter((el) => /matrix3d|perspective/.test(getComputedStyle(el).transform) ||
    getComputedStyle(el).perspective !== 'none').length;
  // 3D scenes built from DOM: perspective / preserve-3d live on CONTAINERS (often invisible wrappers)
  out.perspective3d = all.filter((el) => { const s = getComputedStyle(el); return s.perspective !== 'none' || s.transformStyle === 'preserve-3d'; }).length;
  out.perspectiveChildren = all.filter((el) => el.parentElement && (getComputedStyle(el.parentElement).perspective !== 'none' ||
    getComputedStyle(el.parentElement).transformStyle === 'preserve-3d') && el.getBoundingClientRect().width > 40).length;
  out.clipMasks = visible.filter((el) => { const s = getComputedStyle(el); return s.clipPath !== 'none' || s.maskImage !== 'none' || s.webkitMaskImage !== 'none'; }).length;
  out.mixBlend = visible.filter((el) => getComputedStyle(el).mixBlendMode !== 'normal').length;
  out.backdropBlur = visible.filter((el) => (getComputedStyle(el).backdropFilter || '').includes('blur')).length;
  out.grabCursor = visible.filter((el) => /grab/.test(getComputedStyle(el).cursor)).length;
  out.customCursor = getComputedStyle(document.body).cursor === 'none' || !!document.querySelector('[class*="cursor"]');
  out.splitChars = document.querySelectorAll('[class*="char"], [class*="word"] > span, .split-line span').length;
  out.smoothScrollEl = !!document.querySelector('[data-scroll-container], .lenis, [data-lenis-prevent], .locomotive-scroll, [data-scroll]');
  out.scrollBehavior = getComputedStyle(document.documentElement).scrollBehavior;
  out.snap = getComputedStyle(document.documentElement).scrollSnapType !== 'none' || getComputedStyle(document.body).scrollSnapType !== 'none';
  out.horizontalOverflow = [...document.querySelectorAll('*')].some((el) => { const s = getComputedStyle(el);
    return /auto|scroll/.test(s.overflowX) && el.scrollWidth > el.clientWidth + 100 && el.clientWidth > innerWidth * 0.7; });
  // a translated rail wider than 2.5 viewports = horizontal storytelling driven by transform
  out.wideRail = all.some((el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width >= innerWidth * 2.5 && r.height >= innerHeight * 0.6 && s.transform !== 'none'; });
  // pointer-spawned DOM layers: many absolutely positioned image-bearing boxes stacked with distinct z-indexes
  const stacked = all.filter((el) => { const s = getComputedStyle(el); return s.position === 'absolute' && s.zIndex !== 'auto' &&
    (s.backgroundImage !== 'none' || el.querySelector('img, canvas, [style*="background-image"]')) && el.getBoundingClientRect().width > 60; });
  out.stackedImages = stacked.length; out.stackedZ = new Set(stacked.map((el) => getComputedStyle(el).zIndex)).size;

  // runtime globals = strongest tech evidence
  const g = window;
  out.globals = {
    three: !!(g.THREE || document.querySelector('script[src*="three"]')), gsap: !!g.gsap, scrollTrigger: !!(g.ScrollTrigger || g.gsap?.plugins?.scrollTrigger),
    lenis: !!(g.Lenis || g.lenis), locomotive: !!g.LocomotiveScroll, pixi: !!g.PIXI, spline: !!document.querySelector('spline-viewer, canvas[data-spline], iframe[src*="spline"]'),
    lottie: !!(g.lottie || g.bodymovin || document.querySelector('lottie-player, [data-lottie]')), framer: !!document.querySelector('[data-framer-name], [data-framer-component-type]'),
    webflow: !!g.Webflow, next: !!g.__NEXT_DATA__ || !!document.getElementById('__next'), nuxt: !!g.__NUXT__ || !!g.$nuxt, curtains: !!g.Curtains,
    barba: !!g.barba, swup: !!g.swup, splitting: !!g.Splitting, matter: !!g.Matter,
  };
  out.scripts = [...document.scripts].map((s) => s.src).filter(Boolean).slice(0, 24);
  out.title = document.title; out.description = document.querySelector('meta[name=description]')?.content ?? '';
  out.copy = visible.filter((el) => /^(H1|H2)$/.test(el.tagName)).map(textOf).filter(Boolean).slice(0, 6);
  return out;
})()`;

// ---------- bundle grep (tech signals from the source, not just the runtime) ----------

const SIGNALS = [
  ['three', /\bthree\b|THREE\.|WebGLRenderer/g], ['gsap', /\bgsap\b/g], ['ScrollTrigger', /ScrollTrigger/g],
  ['lenis', /\blenis\b/gi], ['locomotive', /locomotive/gi], ['curtains', /curtains/gi], ['pixi', /\bpixi\b/gi],
  ['ogl', /\bogl\b/g], ['shader', /gl_FragColor|fragmentShader|precision (high|medium)p float|createProgram\(/g],
  ['postprocessing', /EffectComposer|UnrealBloom|postprocessing/g], ['IntersectionObserver', /IntersectionObserver/g],
  ['framer-motion', /framer-motion|motion\.div/g], ['lottie', /lottie|bodymovin/gi], ['splitting', /SplitText|Splitting/g],
  ['physics', /\bmatter-js\b|cannon-es|@dimforge\/rapier|\bMatter\.|\bRAPIER\b/g], ['spline', /spline\.design|@splinetool/g],
  ['webgpu', /navigator\.gpu|WebGPU/g], ['requestAnimationFrame', /requestAnimationFrame/g],
];

async function grepBundles(baseUrl, scriptUrls) {
  const counts = {};
  const fetched = [];
  const seen = new Set();
  const fetchOne = async (u) => {
    let abs;
    try { abs = new URL(u, baseUrl).href; } catch { return null; }
    if (seen.has(abs) || seen.size >= 16) return null;
    seen.add(abs);
    try {
      const res = await fetch(abs, {headers: {'user-agent': UA}, signal: AbortSignal.timeout(12000)});
      if (!res.ok) return null;
      let text = await res.text();
      if (text.length > 4_000_000) text = text.slice(0, 4_000_000);
      fetched.push({url: abs, bytes: text.length});
      for (const [name, re] of SIGNALS) { const n = (text.match(re) ?? []).length; if (n) counts[name] = (counts[name] ?? 0) + n; }
      return {abs, text};
    } catch { return null; }
  };
  const first = (await Promise.all([baseUrl, ...scriptUrls].slice(0, 12).map(fetchOne))).filter(Boolean);
  // Vite/webpack entry files are thin loaders — follow one level of static/dynamic imports into the real chunks
  const chunkUrls = [];
  for (const {abs, text} of first) {
    for (const m of text.matchAll(/(?:from\s*|import\s*\(\s*)["'](\.{0,2}\/[^"']+\.m?js)["']/g)) chunkUrls.push(new URL(m[1], abs).href);
    for (const m of text.matchAll(/["']((?:\.{0,2}\/|https?:\/\/)[^"']*\/(?:chunks?|assets|_next\/static)\/[^"']+\.js)["']/g)) chunkUrls.push(new URL(m[1], abs).href);
  }
  await Promise.all([...new Set(chunkUrls)].slice(0, 8).map(fetchOne));
  return {counts, fetched};
}

// ---------- probes ----------

async function shoot(cdp, sid) { return decodePNG((await cdp.send('Page.captureScreenshot', {format: 'png'}, sid)).data); }

// Sites that seal their DOM in a CLOSED shadow root (anti-scraping) are invisible to
// in-page JS — but the protocol still walks them. Find canvases/videos and their boxes.
async function pierceMedia(cdp, sid) {
  const {root} = await cdp.send('DOM.getDocument', {depth: -1, pierce: true}, sid);
  const found = [];
  let shadowRoots = 0;
  const walk = (n) => {
    if (!n) return;
    if (n.nodeName === 'CANVAS' || n.nodeName === 'VIDEO') found.push(n);
    if (n.shadowRoots) { shadowRoots += n.shadowRoots.length; n.shadowRoots.forEach(walk); }
    (n.children ?? []).forEach(walk);
    if (n.contentDocument) walk(n.contentDocument);
  };
  walk(root);
  const boxes = [];
  for (const n of found.slice(0, 6)) {
    try {
      const {model} = await cdp.send('DOM.getBoxModel', {nodeId: n.nodeId}, sid);
      const q = model.border;
      boxes.push({tag: n.nodeName, x: Math.min(q[0], q[6]), y: Math.min(q[1], q[3]), w: model.width, h: model.height});
    } catch {}
  }
  return {shadowRoots, boxes};
}
async function savePng(cdp, sid, name) {
  const {data} = await cdp.send('Page.captureScreenshot', {format: 'png'}, sid);
  writeFileSync(join(OUT, name), Buffer.from(data, 'base64'));
  return decodePNG(data);
}
async function scrollTo(cdp, sid, frac) {
  await cdp.send('Runtime.evaluate', {expression: `window.scrollTo({top: (document.scrollingElement.scrollHeight - innerHeight) * ${frac}, behavior: 'instant'})`}, sid);
}
async function mouse(cdp, sid, type, x, y, extra = {}) {
  await cdp.send('Input.dispatchMouseEvent', {type, x, y, ...extra}, sid);
}
async function sweep(cdp, sid, w, h, pressed = false) {
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    await mouse(cdp, sid, 'mouseMoved', w * (0.15 + 0.7 * t), h * (0.35 + 0.3 * Math.sin(t * Math.PI * 2)), pressed ? {button: 'left', buttons: 1} : {});
    await sleep(35);
  }
}

async function studyViewport(cdp, vp, opts) {
  const {targetId} = await cdp.send('Target.createTarget', {url: 'about:blank'});
  const {sessionId: sid} = await cdp.send('Target.attachToTarget', {targetId, flatten: true});
  const consoleErrors = [];
  cdp.on('Runtime.exceptionThrown', (p, s) => { if (s === sid) consoleErrors.push(p.exceptionDetails?.exception?.description?.split('\n')[0] ?? p.exceptionDetails?.text); });
  await cdp.send('Runtime.enable', {}, sid);
  await cdp.send('Page.enable', {}, sid);
  await cdp.send('Network.enable', {}, sid);
  await cdp.send('Network.setUserAgentOverride', {userAgent: UA}, sid);
  await cdp.send('Emulation.setDeviceMetricsOverride', {width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: vp.mobile}, sid);
  const loaded = new Promise((res) => { cdp.on('Page.loadEventFired', (p, s) => { if (s === sid) res('load'); }); setTimeout(() => res('timeout'), 25000); });
  const nav = await cdp.send('Page.navigate', {url: pageUrl}, sid);
  if (nav.errorText) throw new Error(`navigation failed: ${nav.errorText}`);
  if (await loaded === 'timeout') console.error(`  (${vp.name}: load event did not fire in 25s — continuing with what rendered)`);
  await sleep(SETTLE_MS);
  // dismiss the obvious cookie walls so the storyboard shows the page, not the banner
  await cdp.send('Runtime.evaluate', {expression: `[...document.querySelectorAll('button, a')].filter(b => /^(accept|accept all|allow all|agree|i agree|ok|got it|同意|接受)$/i.test((b.textContent||'').trim())).slice(0,1).forEach(b => b.click())`}, sid).catch(() => {});
  await sleep(400);

  // Outlast preloaders: keep waiting while the frame is "thin" (no world, no text, no media)
  // or still changing wholesale (an intro sequence), up to READY_MAX_MS.
  const r = {viewport: vp.name, consoleErrors: consoleErrors.slice(0, 5), waitedExtraMs: 0};
  const inspect = async () => (await cdp.send('Runtime.evaluate', {expression: INSPECT_JS, returnByValue: true}, sid)).result.value;
  const thin = (d) => !d.canvases.some((c) => c.cover >= 0.5) && !d.videos.some((v) => v.cover >= 0.4) && d.visibleTextChars < 60 && d.heroImages === 0;
  let prevFrame = await shoot(cdp, sid);
  r.dom = await inspect();
  if (!r.dom) throw new Error('in-page inspection returned nothing');
  while (r.waitedExtraMs < READY_MAX_MS) {
    await sleep(1000);
    r.waitedExtraMs += 1000;
    const frame = await shoot(cdp, sid);
    const churn = frameDiff(prevFrame, frame) ?? 0;
    prevFrame = frame;
    const d = await inspect();
    if (!d) break;
    const wasThin = thin(r.dom);
    r.dom = d;
    if (!thin(d) && churn < 0.35 && !wasThin) break; // rich and settled for two consecutive samples
    if (thin(d) && r.waitedExtraMs >= 5000) {
      // still "thin" after 5s: maybe the DOM is sealed rather than loading — a pierced canvas ends the wait
      const pierced = await pierceMedia(cdp, sid).catch(() => null);
      if (pierced?.boxes.some((b) => b.tag === 'CANVAS' && b.w * b.h > vp.width * vp.height * 0.5) && churn < 0.6) break;
    }
  }
  if (r.waitedExtraMs) console.error(`  (${vp.name}: waited ${r.waitedExtraMs / 1000}s more for the page to settle)`);
  const W = vp.width, H = vp.height;
  if (!r.dom.canvases.length) {
    // nothing reachable from JS — pierce closed shadow roots over the protocol
    const pierced = await pierceMedia(cdp, sid).catch(() => null);
    if (pierced?.boxes.length) {
      const area = W * H;
      const cover = (b) => +(((Math.min(b.x + b.w, W) - Math.max(b.x, 0)) * (Math.min(b.y + b.h, H) - Math.max(b.y, 0))) / area).toFixed(2);
      r.dom.canvases = pierced.boxes.filter((b) => b.tag === 'CANVAS' && b.w > 50 && b.h > 50)
        .map((b) => ({x: b.x, y: b.y, w: b.w, h: b.h, cover: cover(b), fixed: cover(b) >= 0.9, kind: 'sealed (closed shadow root) — see tech signals', z: '?'}));
      r.dom.videos = pierced.boxes.filter((b) => b.tag === 'VIDEO').map((b) => ({cover: cover(b), autoplay: null, src: ''}));
      r.dom.sealed = pierced.shadowRoots;
      console.error(`  (${vp.name}: DOM sealed in ${pierced.shadowRoots} closed shadow root(s) — ${r.dom.canvases.length} canvas found by piercing; type/copy unreadable)`);
    }
  }
  const hero = r.dom.canvases.find((c) => c.cover >= 0.5);
  const probeRect = hero ? {x: hero.x, y: hero.y, w: hero.w, h: hero.h} : null;

  // ambient: does the page move with no input at all?
  await mouse(cdp, sid, 'mouseMoved', 2, H - 2);
  await sleep(200);
  const a0 = await savePng(cdp, sid, `${vp.name}-00.png`);
  await sleep(700);
  const a1 = await shoot(cdp, sid);
  r.ambient = frameDiff(a0, a1);
  r.ambientCanvas = probeRect ? frameDiff(a0, a1, probeRect) : null;
  // a second, longer idle window (≈1.6s) — the drag and wheel probes span that long,
  // so a breathing world must be compared against churn over the same span
  await sleep(900);
  const a2 = await shoot(cdp, sid);
  r.ambientLong = frameDiff(a0, a2, probeRect ?? undefined);

  if (opts.probe) {
    // pointer: sweep the mouse across the hero, compare with the ambient baseline
    await sweep(cdp, sid, W, H);
    await sleep(250);
    const p1 = await shoot(cdp, sid);
    r.pointer = frameDiff(a1, p1);
    r.pointerCanvas = probeRect ? frameDiff(a1, p1, probeRect) : null;
    await savePng(cdp, sid, `${vp.name}-pointer.png`);

    // hover: park on the first CTA and look for a transition
    const cta = await cdp.send('Runtime.evaluate', {expression: `(() => { const el = [...document.querySelectorAll('a,button')].find(e => { const r = e.getBoundingClientRect(); return r.width > 40 && r.height > 20 && r.top > 0 && r.bottom < innerHeight; }); if (!el) return null; const r = el.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; })()`, returnByValue: true}, sid);
    if (cta.result.value) {
      const c = cta.result.value;
      const before = await shoot(cdp, sid);
      await mouse(cdp, sid, 'mouseMoved', c.x + c.w / 2, c.y + c.h / 2);
      await sleep(500);
      const after = await shoot(cdp, sid);
      r.hover = frameDiff(before, after, {x: c.x - 10, y: c.y - 10, w: c.w + 20, h: c.h + 20});
      await mouse(cdp, sid, 'mouseMoved', 2, H - 2);
      await sleep(300);
    }

    // drag: press and pull across the hero, then release and let inertia run
    const d0 = await shoot(cdp, sid);
    await mouse(cdp, sid, 'mousePressed', W * 0.2, H * 0.5, {button: 'left', buttons: 1, clickCount: 1});
    await sweep(cdp, sid, W, H, true);
    await mouse(cdp, sid, 'mouseReleased', W * 0.85, H * 0.5, {button: 'left', buttons: 0, clickCount: 1});
    await sleep(500);
    const d1 = await shoot(cdp, sid);
    await sleep(600);
    const d2 = await shoot(cdp, sid);
    const pointerDrift = Math.max(r.pointer ?? 0, r.ambientLong ?? 0);
    r.drag = frameDiff(d0, d1);
    r.dragInertia = frameDiff(d1, d2);
    r.dragBeyondPointer = (r.drag ?? 0) - pointerDrift;
    await savePng(cdp, sid, `${vp.name}-drag.png`);
    // reset any scroll the drag may have caused
    await scrollTo(cdp, sid, 0);
    await sleep(400);

    // wheel: virtual-scroll sites (no document scroll height) drive the world from wheel deltas
    if (r.dom.scrollHeight <= r.dom.innerHeight * 1.3 && probeRect) {
      const w0 = await shoot(cdp, sid);
      for (let i = 0; i < 6; i++) { await mouse(cdp, sid, 'mouseWheel', W / 2, H / 2, {deltaX: 0, deltaY: 320}); await sleep(120); }
      await sleep(900);
      const w1 = await shoot(cdp, sid);
      r.wheel = frameDiff(w0, w1, probeRect);
      await savePng(cdp, sid, `${vp.name}-wheel.png`);
      for (let i = 0; i < 6; i++) { await mouse(cdp, sid, 'mouseWheel', W / 2, H / 2, {deltaX: 0, deltaY: -320}); await sleep(120); }
      await sleep(600);
    }
  }

  // storyboard + scroll reactivity: does the fixed canvas change as the page scrolls?
  const scrollable = r.dom.scrollHeight > r.dom.innerHeight * 1.3;
  r.scrollable = scrollable;
  r.scrollRatio = +(r.dom.scrollHeight / r.dom.innerHeight).toFixed(1);
  r.storyboard = [`${vp.name}-00.png`];
  if (scrollable) {
    let prevCanvas = a1;
    r.scrollCanvasDiffs = [];
    for (const f of DEPTHS.slice(1)) {
      await scrollTo(cdp, sid, f);
      await sleep(900);
      const name = `${vp.name}-${String(Math.round(f * 100)).padStart(2, '0')}.png`;
      const png = await savePng(cdp, sid, name);
      r.storyboard.push(name);
      if (probeRect && hero.fixed) r.scrollCanvasDiffs.push(frameDiff(prevCanvas, png, probeRect));
      prevCanvas = png;
    }
    await scrollTo(cdp, sid, 0);
  }
  r.heroCanvas = hero ?? null;
  await cdp.send('Target.closeTarget', {targetId});
  return r;
}

// ---------- interpretation ----------

function interpret(desk, phone, tech) {
  const d = desk.dom, g = d.globals, sig = tech.counts;
  const has = (k) => g[k] || (sig[k] ?? 0) > 0;
  const hero = desk.heroCanvas;
  const fx = {};
  fx.webgl = !!(hero && /webgl/.test(hero.kind)) || has('three') || (sig.shader ?? 0) > 2;
  fx.fullscreenWorld = !!(hero && hero.cover >= 0.6);
  const ambient = desk.ambientCanvas ?? desk.ambient ?? 0;
  fx.ambient = ambient > 0.01;
  // a breathing world adds noise to every probe — demand a margin proportional to the idle churn
  fx.pointer = (desk.pointerCanvas ?? desk.pointer ?? 0) - ambient > Math.max(0.02, ambient * 0.5);
  fx.dragAny = (desk.dragBeyondPointer ?? 0) > 0.08;
  fx.drag = fx.dragAny && (desk.dragInertia ?? 0) > Math.max(0.01, ambient * 0.5);
  fx.hover = (desk.hover ?? 0) > 0.05;
  fx.scrollWorld = !!(desk.scrollCanvasDiffs && desk.scrollCanvasDiffs.filter((x) => (x ?? 0) > 0.05).length >= 2);
  const ambientLong = desk.ambientLong ?? ambient;
  fx.wheelWorld = (desk.wheel ?? 0) - ambientLong > Math.max(0.05, ambientLong * 0.35);
  fx.domScene3d = d.perspective3d > 0 && d.perspectiveChildren >= 4;
  fx.longPage = desk.scrollRatio >= 2.5;
  fx.smoothScroll = g.lenis || g.locomotive || d.smoothScrollEl || (sig.lenis ?? 0) > 0 || (sig.locomotive ?? 0) > 0;
  fx.scrollTriggered = g.scrollTrigger || (sig.ScrollTrigger ?? 0) > 0 || (sig.IntersectionObserver ?? 0) > 3;
  fx.domMotion = d.cssKeyframes + d.cssTransitions > 6 || d.animRunning > 0 || has('gsap');
  fx.paper3d = d.transformed3d >= 6 && !fx.fullscreenWorld;
  fx.masks = d.clipMasks >= 3;
  fx.splitText = d.splitChars > 20 || (sig.splitting ?? 0) > 0;
  fx.video = d.videos.some((v) => v.cover > 0.4);
  fx.horizontal = d.horizontalOverflow;
  fx.snap = d.snap;
  fx.customCursor = d.customCursor;

  const recipes = [];
  const add = (recipe, why, conf) => recipes.push({recipe, why, confidence: conf});
  const rawShader = (sig.shader ?? 0) > 0 && !has('three');
  if (fx.fullscreenWorld && fx.webgl && fx.scrollWorld) add('§scroll-driven camera journey', 'fixed full-viewport WebGL canvas that changes frame-to-frame as the page scrolls', 'high');
  if (fx.fullscreenWorld && fx.webgl && fx.wheelWorld && !fx.scrollWorld) add('§scroll-driven camera journey (virtual scroll)', 'page has no scroll height but the WebGL world advances on wheel input — a wheel-scrubbed camera', 'high');
  if (fx.fullscreenWorld && fx.webgl && fx.drag && !rawShader) add('§dome media gallery (drag-orbit)', 'full-viewport WebGL canvas that responds to drag with inertia after release', 'high');
  if (fx.fullscreenWorld && fx.webgl && rawShader && fx.pointer) add('§liquid-glass ripple typography', 'raw WebGL shader (no three.js) filling the viewport and reacting to the cursor — pointer-driven distortion', 'high');
  else if (fx.fullscreenWorld && fx.webgl && fx.pointer && !fx.scrollWorld && !fx.wheelWorld && !fx.drag) add('§foggy hero world + orbit parallax', 'full-viewport WebGL canvas that shifts under pointer movement without scroll dependence', fx.ambient ? 'high' : 'medium');
  if (fx.webgl && !fx.fullscreenWorld && hero) add('§glass product stage', 'WebGL canvas framed inside the layout (a stage, not a world) — treat the object as the hero', 'medium');
  else if (rawShader && d.display && hero && hero.y < d.display.size * 4 && !fx.pointer) add('§liquid-glass ripple typography', 'custom shader code plus a canvas sitting under the headline — type may be distorted through GL', 'low');
  if (fx.domScene3d && fx.dragAny && !fx.fullscreenWorld) add('§springy poster wall', `DOM scene (${d.perspectiveChildren} children under perspective/preserve-3d) that moves under drag${fx.drag ? ' with inertia' : ''}`, 'high');
  else if (fx.dragAny && !fx.fullscreenWorld && !fx.webgl) add('§springy poster wall (flat variant) — draggable DOM canvas with momentum', 'the layout itself moves under drag, no WebGL', 'medium');
  else if (fx.domScene3d || fx.paper3d) add('§springy poster wall / 3D card tilt', `${Math.max(d.transformed3d, d.perspectiveChildren)} elements under perspective transforms — tilt/parallax cards`, 'medium');
  if (fx.masks && fx.pointer && !fx.webgl) add('§cursor mask reveal', 'clip-path/mask layers plus pointer-reactive frames without WebGL', 'medium');
  if (!fx.webgl && fx.pointer && d.stackedImages >= 6 && d.stackedZ >= 4) add('§cursor-trail image reveal', `${d.stackedImages} absolutely-positioned image boxes on ${d.stackedZ} z-levels that appear/move with the pointer — images following the cursor`, 'high');
  if (d.wideRail && desk.scrollable) add('§horizontal scroll-snap story', 'a transform-driven rail ≥2.5 viewports wide on a vertically scrolling page — the wheel runs sideways', 'high');
  if (fx.scrollTriggered && !fx.scrollWorld) add('§scroll-triggered reveals + staggered entrance (DOM overlay kit)', 'ScrollTrigger / IntersectionObserver usage — sections animate in as they enter', 'high');
  if (fx.splitText) add('§split-text headline choreography (DOM overlay kit)', 'headline is split into per-char/word spans — staggered type entrance', 'medium');
  if (fx.smoothScroll) add('smooth-scroll (lenis-style lerp) — reproduce with a scroll lerp, keep native scrollbar', 'lenis/locomotive detected', 'high');
  if (fx.horizontal && !d.wideRail) add('§horizontal scroll-snap story (overflow variant)', 'a wide overflow container drives a sideways track', 'medium');
  if (fx.video && !fx.webgl) add('video-backed hero (cover video + DOM overlay)', 'autoplay cover video is the hero world', 'high');
  if (fx.customCursor) add('custom cursor / cursor light (§fluid UI layer)', 'native cursor hidden or a cursor element present', 'medium');
  if (!recipes.length && fx.domMotion) add('§motion beyond Three.js — DOM/CSS kit + easing grammar', 'no canvas world; motion is CSS keyframes/transitions and JS-driven DOM', 'medium');
  if (!recipes.length) add('static editorial layout — lift the type/palette, add §DOM overlay kit entrances', 'no measurable motion under any probe', 'low');
  return {fx, recipes};
}

const paletteRoles = (cols, bodyBg) => {
  const neutral = (c) => c.s < 0.12 || c.l < 0.06 || c.l > 0.94;
  const bg = cols[0];
  const accents = cols.filter((c) => c !== bg && !neutral(c)).sort((a, b) => b.s - a.s);
  const neutrals = cols.filter((c) => c !== bg && neutral(c));
  return {
    background: bg?.hex, backgroundDom: bodyBg, tone: bg ? (bg.l < 0.35 ? 'dark' : bg.l > 0.75 ? 'light' : 'mid') : '?',
    accents: accents.slice(0, 2).map((c) => c.hex), neutrals: neutrals.slice(0, 2).map((c) => c.hex), all: cols.map((c) => `${c.hex} ${(c.share * 100).toFixed(0)}%`),
  };
};

const faceClass = (name) => !name ? '?' : /mono|courier|menlo|consolas|jetbrains|space mono|ibm plex mono/i.test(name) ? 'monospace'
  : /serif|garamond|playfair|fraunces|canela|editorial|times|georgia|tiempos|freight|cormorant|libre|newsreader|instrument serif|didot|bodoni|baskerville|caslon|minion|palatino|crimson|lora|merriweather|reckless|gt sectra|ogg|migra|zodiak|gambetta/i.test(name) && !/sans/i.test(name) ? 'serif' : 'sans';
const fmtSigned = (v) => v == null ? 'n/a' : (v >= 0 ? '+' : '−') + (Math.abs(v) * 100).toFixed(1) + '%';

// ---------- main ----------

console.error(`study — ${target}\n  out: ${OUT}`);
const {proc, cdp} = await launchChrome();
let desk, phone;
try {
  console.error('  desktop: storyboard + probes…');
  desk = await studyViewport(cdp, DESKTOP, {probe: true});
  console.error('  phone: storyboard…');
  phone = await studyViewport(cdp, PHONE, {probe: false});
} finally {
  proc.kill();
}
console.error('  bundles: grep…');
const tech = isUrl ? await grepBundles(pageUrl, desk.dom.scripts) : {counts: {}, fetched: []};
const heroPng = decodePNG(readFileSync(join(OUT, 'desktop-00.png')).toString('base64'));
const cols = heroPng ? palette(heroPng) : [];
const pal = paletteRoles(cols, desk.dom.bodyBg);
const {fx, recipes} = interpret(desk, phone, tech);

const d = desk.dom;
const disp = d.display, body = d.body;
const typeSummary = disp ? `${disp.font} (${faceClass(disp.font)}) ${Math.round(disp.size)}px/${disp.lineHeight} wt ${disp.weight}${disp.italic ? ' italic' : ''}, tracking ${disp.tracking}${disp.transform !== 'none' ? ', ' + disp.transform : ''}` : 'n/a';
const bodySummary = body ? `${body.font} (${faceClass(body.font)}) ${Math.round(body.size)}px/${body.lineHeight}, measure ≈${body.measure}px` : 'n/a';
const techList = [
  ...Object.entries(d.globals).filter(([, v]) => v).map(([k]) => `${k} (runtime)`),
  ...Object.entries(tech.counts).filter(([k]) => k !== 'requestAnimationFrame').sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ×${n} (bundle)`),
];
const motionLines = [
  `ambient (no input): ${fmtPct(desk.ambientCanvas ?? desk.ambient)} of ${desk.heroCanvas ? 'hero canvas' : 'frame'} changes per 0.7s (${fmtPct(desk.ambientLong)} per 1.6s) → ${fx.ambient ? 'the world breathes on its own' : 'still until touched'}`,
  `pointer sweep: ${fmtSigned((desk.pointerCanvas ?? desk.pointer ?? 0) - (desk.ambientCanvas ?? desk.ambient ?? 0))} over ambient → ${fx.pointer ? 'REACTS to the cursor (parallax/orbit/particles)' : 'no cursor reaction'}`,
  `drag across hero: ${fmtSigned(desk.dragBeyondPointer)} over pointer, inertia ${fmtPct(desk.dragInertia)} after release → ${fx.drag ? 'DRAGGABLE with momentum' : fx.dragAny ? 'drag moves it, no inertia' : 'not draggable'}`,
  `hover on first CTA: ${desk.hover == null ? 'no CTA in the first viewport' : fmtPct(desk.hover) + ' of the button region → ' + (fx.hover ? 'visible hover transition' : 'flat / subtle hover')}`,
  `scroll: page is ${desk.scrollRatio}× viewport${desk.scrollCanvasDiffs?.length ? `; fixed canvas changes ${desk.scrollCanvasDiffs.map(fmtPct).join(' / ')} between depths → ${fx.scrollWorld ? 'SCROLL DRIVES THE WORLD' : 'canvas ignores scroll'}` : fx.scrollTriggered ? '; scroll-triggered DOM reveals' : ''}${desk.wheel != null ? `; wheel input changes the canvas ${fmtPct(desk.wheel)} → ${fx.wheelWorld ? 'WHEEL DRIVES THE WORLD (virtual scroll)' : 'wheel ignored'}` : ''}`,
  `DOM motion: ${d.cssKeyframes} @keyframes, ${d.cssTransitions} transitions, ${d.animRunning} animations running, ${d.transformed3d} 3D-transformed (${d.perspectiveChildren} under perspective containers), ${d.clipMasks} masked, ${d.backdropBlur} blurred, easings ${d.cssBeziers.length ? d.cssBeziers.join(' ') : '(browser defaults)'}`,
];
function fmtPct(v) { return v == null ? 'n/a' : (v * 100).toFixed(1) + '%'; }

const brand = '<YOUR BRAND>';
const prompt = [
  `Using the motion-pages skill, build a single-file motion page for ${brand} that borrows the MOTION LANGUAGE studied at ${target} (storyboard in ${OUT}/) — original code, our own copy, palette and assets; nothing copied from the reference.`,
  ``,
  `Archetype(s): ${recipes.map((r) => r.recipe).join(' + ')}.`,
  `World: ${pal.tone} ${fx.fullscreenWorld ? 'full-viewport ' + (fx.webgl ? 'WebGL world' : 'canvas/video world') : 'framed stage'}; reference tone ≈ ${pal.background} with accents ${pal.accents.join(', ') || '(monochrome)'} — swap in ${brand}'s palette, keep the contrast relationship.`,
  `Type: display ${disp ? faceClass(disp.font) + ' ~' + Math.round(disp.size) + 'px, weight ' + disp.weight + (disp.transform !== 'none' ? ', ' + disp.transform : '') + ', tracking ' + disp.tracking : 'n/a'}; body ${body ? faceClass(body.font) + ' ' + Math.round(body.size) + 'px, measure ~' + body.measure + 'px' : 'n/a'}${d.monoUsed ? '; monospace for labels/eyebrows' : ''}. Pick our own faces in the same class.`,
  `Motion: ${[fx.ambient && 'ambient drift when idle', fx.pointer && 'pointer parallax/orbit', fx.drag && 'drag with inertia', fx.dragAny && !fx.drag && 'drag (no inertia)', fx.scrollWorld && 'scroll scrubs the camera', fx.wheelWorld && 'wheel scrubs the camera (virtual scroll)', fx.scrollTriggered && 'sections reveal on scroll', fx.smoothScroll && 'lerped smooth scroll', fx.hover && 'eased hover states', fx.splitText && 'split-text headline entrance', fx.customCursor && 'custom cursor'].filter(Boolean).join(', ') || 'restrained; entrances only'}. Easing set: ${d.cssBeziers.length ? d.cssBeziers.slice(0, 3).join(' ') : 'define ours per §Easing grammar'}.`,
  `Layout: ${d.fixedNav ? 'fixed nav, ' : ''}${d.sections} sections, ${desk.scrollRatio}× viewport tall${d.ctas[0] ? `; CTA in the reference's register: "${d.ctas[0].text}" (${d.ctas[0].radius} radius)` : ''}.`,
  `Phone: ${phone.dom.canvases.length ? 'the world survives at 390px (' + phone.dom.canvases[0].cover * 100 + '% cover)' : 'no canvas on phone — plan a lighter phone world or a still'}; page is ${phone.scrollRatio}× viewport on phone.`,
  ``,
  `Self-verify at desktop/tablet/phone against the storyboard frames, run scripts/audit.mjs, then the design-review pass. Reduced-motion: still mode.`,
].join('\n');

const spec = `# Study — ${target}

_Generated by \`scripts/study.mjs\` on ${new Date().toISOString().slice(0, 10)}. This documents the reference's motion language so it can be rebuilt as original work for another brand. Do not copy its code, assets, copy, or branding._

${d.sealed ? `> ⚠️ The DOM is sealed inside ${d.sealed} closed shadow root(s): type, copy and CSS are unreadable from script. Canvas geometry was recovered over the protocol; read type and layout from the storyboard PNGs.\n\n` : ''}**Title:** ${d.title || '(none)'}
**Description:** ${d.description || '(none)'}
**Headlines seen:** ${d.copy.map((c) => `“${c}”`).join(' · ') || '(none)'}

## Recipes this maps to

${recipes.map((r) => `- **${r.recipe}** — ${r.why} _(${r.confidence})_`).join('\n')}

## Storyboard

Desktop: ${desk.storyboard.map((s) => `\`${s}\``).join(' ')}${desk.storyboard.length > 1 ? ' (0 → 100 % scroll)' : ' (single screen)'}
Phone: ${phone.storyboard.map((s) => `\`${s}\``).join(' ')}
Probes: \`desktop-pointer.png\` (after cursor sweep) · \`desktop-drag.png\` (after drag + release)${desk.wheel != null ? ' · `desktop-wheel.png` (after wheel input)' : ''}${desk.waitedExtraMs ? `\n_(waited ${desk.waitedExtraMs / 1000}s beyond settle for a preloader/intro to finish)_` : ''}

## Palette (rendered hero, desktop)

- tone: **${pal.tone}** · background ≈ ${pal.background} (DOM body bg: ${pal.backgroundDom})
- accents: ${pal.accents.join(', ') || '(none — monochrome)'} · neutrals: ${pal.neutrals.join(', ') || '—'}
- dominant swatches: ${pal.all.join(' · ')}
- CTA: ${d.ctas[0] ? `“${d.ctas[0].text}” bg ${d.ctas[0].bg} on ${d.ctas[0].color}, radius ${d.ctas[0].radius}, ${Math.round(d.ctas[0].w)}×${Math.round(d.ctas[0].h)}` : 'none found'}

## Type

- display: ${typeSummary}${disp ? `  — “${disp.text}”` : ''}
- body: ${bodySummary}
- families in use: ${d.fonts.join(', ')}${d.monoUsed ? ' (monospace present)' : ''}

## Motion (measured)

${motionLines.map((l) => `- ${l}`).join('\n')}

## Tech signals

${techList.length ? techList.map((t) => `- ${t}`).join('\n') : '- nothing recognisable — likely hand-rolled or heavily bundled; trust the measured motion above'}
${tech.fetched.length ? `\n_grepped ${tech.fetched.length} source(s), ${(tech.fetched.reduce((a, f) => a + f.bytes, 0) / 1024).toFixed(0)} KB_` : ''}
${desk.consoleErrors.length ? `\nConsole errors on load: ${desk.consoleErrors.join(' | ')}` : ''}

## Layout

- ${d.fixedNav ? 'fixed/sticky nav' : 'static nav'} · ${d.sections} section-like blocks · ${desk.scrollRatio}× viewport tall (phone ${phone.scrollRatio}×)
- hero canvas: ${desk.heroCanvas ? `${desk.heroCanvas.kind}, ${Math.round(desk.heroCanvas.cover * 100)}% of viewport, ${desk.heroCanvas.fixed ? 'fixed' : 'in-flow'}` : 'none'} · videos: ${d.videos.length} · large images: ${d.heroImages} · svg: ${d.svgCount}
- phone: ${phone.dom.canvases.length} canvas(es), display ${phone.dom.display ? Math.round(phone.dom.display.size) + 'px' : 'n/a'}

## Build-spec prompt (edit the brand, then paste)

\`\`\`
${prompt}
\`\`\`
`;

writeFileSync(join(OUT, 'spec.md'), spec);
const json = {target, out: OUT, recipes, fx, palette: pal, type: {display: disp, body, fonts: d.fonts}, motion: {
  ambient: desk.ambient, ambientCanvas: desk.ambientCanvas, ambientLong: desk.ambientLong, pointer: desk.pointer, pointerCanvas: desk.pointerCanvas, hover: desk.hover,
  drag: desk.drag, dragInertia: desk.dragInertia, dragBeyondPointer: desk.dragBeyondPointer, wheel: desk.wheel ?? null, scrollCanvasDiffs: desk.scrollCanvasDiffs ?? [], scrollRatio: desk.scrollRatio, waitedExtraMs: desk.waitedExtraMs},
  tech: {globals: d.globals, bundles: tech.counts}, layout: {sections: d.sections, fixedNav: d.fixedNav, heroCanvas: desk.heroCanvas, videos: d.videos},
  storyboard: {desktop: desk.storyboard, phone: phone.storyboard}, prompt};
writeFileSync(join(OUT, 'study.json'), JSON.stringify(json, null, 2));

if (jsonOut) console.log(JSON.stringify(json, null, 2));
else {
  console.log(`\nmotion-pages study — ${target}\n`);
  console.log('recipes:');
  for (const r of recipes) console.log(`  • ${r.recipe}  [${r.confidence}] — ${r.why}`);
  console.log(`\npalette:  ${pal.tone} · bg ${pal.background} · accents ${pal.accents.join(', ') || '—'}`);
  console.log(`type:     ${typeSummary}\n          ${bodySummary}`);
  console.log('motion:'); for (const l of motionLines) console.log(`  ${l}`);
  console.log(`tech:     ${techList.slice(0, 8).join(', ') || '—'}`);
  console.log(`\n→ ${join(OUT, 'spec.md')}  (storyboard PNGs + study.json alongside; the build-spec prompt is at the bottom)`);
}
