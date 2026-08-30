#!/usr/bin/env node
// motion-pages audit — Impeccable-style design lint for single-file motion pages.
// Zero dependencies: drives headless Chrome over raw CDP (Node ≥22 for WebSocket).
//
//   node scripts/audit.mjs page.html            # human report, exit 1 on any FAIL
//   node scripts/audit.mjs page.html --json     # machine output
//   node scripts/audit.mjs https://site.dev     # URLs work too
//   node scripts/audit.mjs page.html --viewport=phone   # desktop|tablet|phone
//
// Rules are the SKILL.md design-review pass + AI-slop lint, made executable.
// FAIL = ship blocker (wire into CI: `node scripts/audit.mjs page.html || exit 1`).
// WARN = judgment call surfaced for the design-review read.

import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import zlib from 'node:zlib';

// ---------- args ----------

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const jsonOut = flags.has('--json');
const vpFilter = [...flags].find((f) => f.startsWith('--viewport='))?.split('=')[1];
const target = args.find((a) => !a.startsWith('--'));
if (!target) {
  console.error('usage: node scripts/audit.mjs <page.html|url> [--json] [--viewport=desktop|tablet|phone]');
  process.exit(2);
}
const pageUrl = /^https?:\/\//.test(target)
  ? target
  : pathToFileURL(resolve(target)).href;

const CHROME =
  process.env.CHROME_BIN ??
  ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
   '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
    .find((p) => existsSync(p));
if (!CHROME) {
  console.error('Chrome not found — set CHROME_BIN');
  process.exit(2);
}

const VIEWPORTS = [
  {name: 'desktop', width: 1600, height: 900, mobile: false},
  {name: 'tablet', width: 820, height: 1180, mobile: true},
  {name: 'phone', width: 390, height: 844, mobile: true},
].filter((v) => !vpFilter || v.name === vpFilter);

const SETTLE_MS = 2800;

// ---------- tiny CDP client ----------

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== undefined) {
        const p = this.pending.get(msg.id);
        if (p) {
          this.pending.delete(msg.id);
          msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
        }
      } else {
        (this.listeners.get(msg.method) ?? []).forEach((fn) => fn(msg.params, msg.sessionId));
      }
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
    '--headless=new', '--remote-debugging-port=0', '--no-first-run',
    '--hide-scrollbars', '--force-color-profile=srgb', '--mute-audio',
    '--allow-file-access-from-files',
  ], {stdio: ['ignore', 'ignore', 'pipe']});
  const wsUrl = await new Promise((res, rej) => {
    let buf = '';
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) res(m[1]);
    });
    proc.on('exit', () => rej(new Error('chrome exited before devtools url')));
    setTimeout(() => rej(new Error('chrome devtools url timeout')), 15000);
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, {once: true});
    ws.addEventListener('error', rej, {once: true});
  });
  return {proc, cdp: new CDP(ws)};
}

// ---------- minimal PNG decode (Chrome screenshots: 8-bit RGB/RGBA, no interlace) ----------

function decodePNG(b64) {
  const buf = Buffer.from(b64, 'base64');
  let off = 8, width = 0, height = 0, channels = 4;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const colorType = data[9];
      channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
      if (data[8] !== 8 || !channels || data[12] !== 0) return null; // unsupported
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.allocUnsafe(height * stride);
  const paeth = (a, b, c) => {
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      let v = row[x];
      if (f === 1) v += a; else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1; else if (f === 4) v += paeth(a, b, c);
      cur[x] = v & 0xff;
    }
  }
  return {width, height, channels, data: out};
}

const relLum = (r, g, b) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

function regionStats(png, rect, scale = 1) {
  const x0 = Math.max(0, Math.floor(rect.x * scale)), y0 = Math.max(0, Math.floor(rect.y * scale));
  const x1 = Math.min(png.width, Math.ceil((rect.x + rect.w) * scale));
  const y1 = Math.min(png.height, Math.ceil((rect.y + rect.h) * scale));
  let n = 0, sum = 0, sum2 = 0, rs = 0, gs = 0, bs = 0;
  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const i = (y * png.width + x) * png.channels;
      const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
      const l = relLum(r, g, b);
      sum += l; sum2 += l * l; rs += r; gs += g; bs += b; n++;
    }
  }
  if (!n) return null;
  const mean = sum / n;
  return {mean, std: Math.sqrt(Math.max(0, sum2 / n - mean * mean)),
          r: rs / n, g: gs / n, b: bs / n, n};
}

// ---------- in-page inspection (one evaluate, returns everything DOM-derived) ----------

const INSPECT_JS = String.raw`(() => {
  const out = {};
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' &&
           s.display !== 'none' && +s.opacity > 0.05 &&
           r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };
  const sel = (el) => {
    if (el.id) return '#' + el.id;
    let s = el.tagName.toLowerCase();
    if (el.classList.length) s += '.' + [...el.classList].slice(0, 2).join('.');
    return s;
  };
  const all = [...document.querySelectorAll('*')];
  const visible = all.filter(vis);

  // display font of the biggest heading
  const headings = visible.filter((el) => /^H[1-3]$/.test(el.tagName));
  const h1 = headings.sort((a, b) =>
    parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize))[0];
  out.displayFont = h1 ? getComputedStyle(h1).fontFamily : null;

  // gradient text
  out.gradientText = [];
  for (const el of visible) {
    const s = getComputedStyle(el);
    if ((s.webkitBackgroundClip === 'text' || s.backgroundClip === 'text') &&
        s.backgroundImage.includes('gradient')) {
      out.gradientText.push({sel: sel(el), bg: s.backgroundImage.slice(0, 200)});
    }
  }

  // transitions census on interactive elements
  const isInteractive = (el) =>
    el.matches('a,button,[role=button],[onclick],input,summary') ||
    getComputedStyle(el).cursor === 'pointer';
  // top-level only: svg/path/span children inherit cursor:pointer and are noise
  const interactive = visible.filter((el) =>
    isInteractive(el) && !(el.parentElement && el.parentElement.closest('a,button,[role=button],[onclick],summary')) &&
    !/^(svg|path|circle|rect|g|line|polyline|use)$/i.test(el.tagName));
  out.interactiveCount = interactive.length;
  out.defaultEase = 0; out.customBezier = 0; out.deadHover = [];
  for (const el of interactive) {
    const s = getComputedStyle(el);
    const dur = parseFloat(s.transitionDuration) || 0;
    if (s.transitionTimingFunction.includes('cubic-bezier')) out.customBezier++;
    else if (s.transitionTimingFunction === 'ease' && dur > 0 && dur <= 0.25) out.defaultEase++;
    if (dur === 0 && !el.closest('canvas')) out.deadHover.push(sel(el));
  }
  out.deadHover = out.deadHover.slice(0, 8);

  // border radii diversity
  const radii = new Set();
  let rounded = 0;
  for (const el of visible) {
    if (el.getBoundingClientRect().width < 40) continue;
    const r = getComputedStyle(el).borderTopLeftRadius;
    if (r && r !== '0px') { radii.add(r); rounded++; }
  }
  out.rounded = rounded; out.radiiDistinct = radii.size;

  // emoji bullets
  const emojiRe = /^[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
  out.emojiBullets = visible.filter((el) =>
    (el.tagName === 'LI' || el.matches('p,div')) &&
    el.children.length === 0 && emojiRe.test(el.textContent.trim())).length;

  // purple gradient bg + glass combo
  const bodyBg = getComputedStyle(document.body).backgroundImage +
                 getComputedStyle(document.documentElement).backgroundImage;
  out.bodyGradient = bodyBg.includes('gradient') ? bodyBg.slice(0, 300) : null;
  out.glassCount = visible.filter((el) =>
    getComputedStyle(el).backdropFilter.includes('blur')).length;

  // CSS text scans (single-file pages: all sheets are same-origin)
  let css = '';
  for (const sh of document.styleSheets) {
    try { for (const r of sh.cssRules) css += r.cssText + '\n'; } catch {}
  }
  // CSS media query OR JS matchMedia handling both count (single-file pages
  // keep scripts inline, so outerHTML sees them)
  out.hasReducedMotion = /prefers-reduced-motion/.test(css) ||
    /prefers-reduced-motion/.test(document.documentElement.outerHTML);
  out.hasFocusStyle = /:focus/.test(css);
  out.hasCubicBezierCSS = /cubic-bezier/.test(css);
  out.animCount = document.getAnimations ? document.getAnimations().length : -1;

  // infinite loops with easing (stutter check)
  out.easedLoops = [];
  for (const el of all) {
    const s = getComputedStyle(el);
    if (s.animationIterationCount.includes('infinite') &&
        s.animationName !== 'none' &&
        !/linear/.test(s.animationTimingFunction) &&
        /rotate|spin|orbit|marquee|scroll/i.test(s.animationName)) {
      out.easedLoops.push({sel: sel(el), name: s.animationName, tf: s.animationTimingFunction});
    }
  }
  out.easedLoops = out.easedLoops.slice(0, 5);

  // stagger-delay trap: settled page but interactive elements still carry delay
  out.delayTrap = interactive.filter((el) => {
    const d = parseFloat(getComputedStyle(el).transitionDelay) || 0;
    return d > 0.05;
  }).slice(0, 8).map(sel);

  // phone: overflow + tap targets + micro text
  out.scrollWidth = document.scrollingElement.scrollWidth;
  out.innerWidth = innerWidth;
  out.smallTaps = interactive.filter((el) => {
    const r = el.getBoundingClientRect();
    return Math.min(r.width, r.height) < 32 && Math.max(r.width, r.height) < 80;
  }).slice(0, 8).map(sel);
  out.microText = visible.filter((el) => {
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    return hasText && parseFloat(getComputedStyle(el).fontSize) < 11;
  }).slice(0, 8).map(sel);

  // a11y: unnamed icon buttons
  out.unnamed = [...document.querySelectorAll('a,button,[role=button]')].filter((el) => {
    if (!vis(el)) return false;
    const name = (el.textContent.trim() || el.getAttribute('aria-label') ||
      el.getAttribute('title') || el.querySelector('img[alt]')?.alt || '').trim();
    return !name;
  }).slice(0, 8).map(sel);

  // meta
  out.title = document.title;
  out.hasViewportMeta = !!document.querySelector('meta[name=viewport]');
  out.hasDescription = !!document.querySelector('meta[name=description]');
  out.canvas = [...document.querySelectorAll('canvas')].map((c) => {
    const r = c.getBoundingClientRect();
    return {x: r.x, y: r.y, w: r.width, h: r.height};
  });

  // text rects for contrast sampling (largest few)
  out.textRects = [];
  for (const el of visible) {
    if (!el.matches('h1,h2,h3,p,a,button,span,li')) continue;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 2);
    if (!hasText) continue;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    const m = s.color.match(/\d+/g);
    if (!m) continue;
    out.textRects.push({sel: sel(el), x: r.x, y: r.y, w: r.width, h: r.height,
      color: m.slice(0, 3).map(Number), size: parseFloat(s.fontSize),
      shadow: s.textShadow !== 'none'});
  }
  out.textRects = out.textRects
    .sort((a, b) => b.size - a.size).slice(0, 12);

  // hue extraction helper data for gradient rules
  return out;
})()`;

// ---------- rule evaluation ----------

const isSlopFont = (ff) => ff && /^(inter|system-ui|-apple-system|arial|roboto|helvetica)/i.test(ff.split(',')[0].replace(/["']/g, '').trim());

function gradientHasBluePurple(bg) {
  const cols = [...(bg ?? '').matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)]
    .map((m) => m.slice(1, 4).map(Number));
  const hues = cols.map(([r, g, b]) => {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx === mn || mx - mn < 30) return null; // grayish
    let h;
    if (mx === r) h = ((g - b) / (mx - mn)) % 6;
    else if (mx === g) h = (b - r) / (mx - mn) + 2;
    else h = (r - g) / (mx - mn) + 4;
    return ((h * 60) + 360) % 360;
  }).filter((h) => h !== null);
  return hues.some((h) => h >= 190 && h <= 250) && hues.some((h) => h >= 255 && h <= 320);
}

function evaluateRules(vp, d, png, stillDiff, consoleErrors) {
  const R = [];
  const rule = (id, level, ok, msg) => R.push({id, level: ok ? 'pass' : level, msg: ok ? undefined : msg});

  // --- slop lint ---
  rule('slop/display-font', 'fail', !isSlopFont(d.displayFont),
    `display heading uses ${d.displayFont?.split(',')[0]} — pick an editorial face (SKILL.md §slop lint)`);
  const badGrad = d.gradientText.filter((g) => gradientHasBluePurple(g.bg));
  rule('slop/gradient-text', 'fail', badGrad.length === 0,
    `blue→purple gradient text on ${badGrad.map((g) => g.sel).join(', ')}`);
  rule('slop/default-ease', d.hasCubicBezierCSS ? 'warn' : 'fail',
    d.defaultEase < 3,
    `${d.defaultEase} interactive elements ride default 'ease' ≤.25s — define an easing set (§Easing grammar)`);
  rule('slop/uniform-radius', 'warn', !(d.rounded >= 6 && d.radiiDistinct === 1),
    `${d.rounded} rounded boxes share one radius — vary radius with role`);
  rule('slop/emoji-bullets', 'warn', d.emojiBullets < 3,
    `${d.emojiBullets} emoji-led text blocks`);
  rule('slop/purple-glass', 'fail',
    !(gradientHasBluePurple(d.bodyGradient) && d.glassCount >= 2),
    'purple-gradient background + glassmorphism cards — the canonical AI-slop combo');

  // --- motion grammar ---
  rule('motion/easing-vocabulary', 'warn', d.hasCubicBezierCSS || d.interactiveCount === 0,
    'no cubic-bezier anywhere — page is running on browser defaults');
  rule('motion/eased-loops', 'warn', d.easedLoops.length === 0,
    `infinite loops with easing (reads as stutter): ${d.easedLoops.map((l) => l.sel + '→' + l.name).join(', ')}`);
  rule('motion/reduced-motion', 'fail',
    d.hasReducedMotion || (d.animCount === 0 && d.canvas.length === 0),
    'page animates but has no prefers-reduced-motion handling');
  rule('motion/stagger-trap', 'fail', d.delayTrap.length === 0,
    `interactive elements still carry transition-delay after settle (hover lag): ${d.delayTrap.join(', ')}`);
  rule('motion/dead-hover', 'warn', d.deadHover.length <= d.interactiveCount * 0.3,
    `${d.deadHover.length}/${d.interactiveCount} interactive elements have no transition at all: ${d.deadHover.join(', ')}`);

  // --- technical ---
  rule('tech/console-errors', 'fail', consoleErrors.length === 0,
    `${consoleErrors.length} console error(s): ${consoleErrors.slice(0, 3).join(' | ')}`);
  if (png) {
    const whole = regionStats(png, {x: 0, y: 0, w: vp.width, h: vp.height});
    rule('tech/not-blank', 'fail', whole && whole.std > 0.01,
      'screenshot is a near-uniform frame — page renders blank at settle');
    for (const c of d.canvas.slice(0, 2)) {
      if (c.w < 50 || c.h < 50) continue;
      const st = regionStats(png, c);
      rule('tech/canvas-alive', 'warn', st && st.std > 0.004,
        'canvas region is a flat fill — world may not be rendering (fog==bg is fine, zero variance is not)');
    }
    // contrast: sample big text rects against the actual rendered pixels
    const weak = [];
    for (const t of d.textRects) {
      if (t.w < 20 || t.h < 8) continue;
      const st = regionStats(png, t);
      if (!st) continue;
      const textL = relLum(...t.color);
      const c = contrast(textL, st.mean);
      const min = t.size >= 24 ? 2.2 : 3.0; // rendered-average heuristic, below WCAG on purpose
      if (c < min) weak.push(`${t.sel} (${c.toFixed(1)}:1 @${Math.round(t.size)}px)`);
    }
    rule('tech/contrast', 'warn', weak.length === 0,
      `text may sink into the world: ${weak.slice(0, 5).join(', ')}`);
  }
  rule('tech/title', 'fail', !!d.title?.trim(), 'empty <title>');
  rule('tech/viewport-meta', 'fail', d.hasViewportMeta, 'missing <meta name=viewport> — phone rendering breaks');
  rule('tech/description', 'warn', d.hasDescription, 'missing meta description');
  if (vp.name === 'phone') {
    rule('tech/phone-overflow', 'fail', d.scrollWidth <= d.innerWidth + 2,
      `horizontal overflow: scrollWidth ${d.scrollWidth} > viewport ${d.innerWidth}`);
    rule('tech/tap-targets', 'warn', d.smallTaps.length === 0,
      `tap targets under 32px: ${d.smallTaps.join(', ')}`);
  }
  rule('tech/micro-text', 'warn', d.microText.length === 0,
    `text below 11px (dead micro-text — grow it or cut it): ${d.microText.join(', ')}`);
  if (stillDiff !== null) {
    rule('tech/still-mode', 'warn', stillDiff < 0.002,
      `?still=1 frame still changes (${(stillDiff * 100).toFixed(2)}% px) — deterministic screenshots impossible`);
  }

  // --- a11y ---
  rule('a11y/unnamed-controls', 'fail', d.unnamed.length === 0,
    `icon buttons with no accessible name: ${d.unnamed.join(', ')}`);
  rule('a11y/focus-style', 'warn', d.hasFocusStyle, 'no :focus styles anywhere in CSS');

  return R;
}

// ---------- main ----------

const {proc, cdp} = await launchChrome();
const results = [];
try {
  for (const vp of VIEWPORTS) {
    const {targetId} = await cdp.send('Target.createTarget', {url: 'about:blank'});
    const {sessionId} = await cdp.send('Target.attachToTarget', {targetId, flatten: true});
    const consoleErrors = [];
    cdp.on('Runtime.exceptionThrown', (p, sid) => {
      if (sid === sessionId) consoleErrors.push(p.exceptionDetails?.exception?.description?.split('\n')[0] ?? p.exceptionDetails?.text);
    });
    cdp.on('Runtime.consoleAPICalled', (p, sid) => {
      if (sid === sessionId && p.type === 'error')
        consoleErrors.push(p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200));
    });
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride',
      {width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: vp.mobile}, sessionId);

    const loaded = new Promise((res) => {
      const h = (p, sid) => { if (sid === sessionId) res(); };
      cdp.on('Page.loadEventFired', h);
      setTimeout(res, 15000);
    });
    await cdp.send('Page.navigate', {url: pageUrl}, sessionId);
    await loaded;
    await sleep(SETTLE_MS);

    const {result} = await cdp.send('Runtime.evaluate',
      {expression: INSPECT_JS, returnByValue: true}, sessionId);
    const d = result.value;
    if (!d) throw new Error('in-page inspection returned nothing');

    // Long scan-intros may legitimately settle after our first sample — only
    // flag the stagger trap if the delay persists well past any intro.
    if (d.delayTrap.length) {
      await sleep(3000);
      const re = await cdp.send('Runtime.evaluate', {expression:
        `[...document.querySelectorAll('a,button,[role=button]')].filter(el =>
           (parseFloat(getComputedStyle(el).transitionDelay)||0) > 0.05)
          .slice(0,8).map(el => el.tagName.toLowerCase() +
            (el.classList.length ? '.'+[...el.classList].slice(0,2).join('.') : ''))`,
        returnByValue: true}, sessionId);
      d.delayTrap = re.result.value ?? [];
    }

    const shot = await cdp.send('Page.captureScreenshot', {format: 'png'}, sessionId);
    const png = decodePNG(shot.data);

    // still-mode determinism (desktop only): two frames 700ms apart must match
    let stillDiff = null;
    if (vp.name === 'desktop') {
      const stillUrl = pageUrl + (pageUrl.includes('?') ? '&' : '?') + 'still=1';
      await cdp.send('Page.navigate', {url: stillUrl}, sessionId);
      await sleep(1800);
      const a = decodePNG((await cdp.send('Page.captureScreenshot', {format: 'png'}, sessionId)).data);
      await sleep(700);
      const b = decodePNG((await cdp.send('Page.captureScreenshot', {format: 'png'}, sessionId)).data);
      if (a && b && a.data.length === b.data.length) {
        let diff = 0;
        for (let i = 0; i < a.data.length; i += 16) {
          if (Math.abs(a.data[i] - b.data[i]) > 4) diff++;
        }
        stillDiff = diff / (a.data.length / 16);
      }
    }

    results.push({viewport: vp.name, rules: evaluateRules(vp, d, png, stillDiff, consoleErrors)});
    await cdp.send('Target.closeTarget', {targetId});
  }
} finally {
  proc.kill();
}

// ---------- report ----------

let failCount = 0;
if (jsonOut) {
  console.log(JSON.stringify({page: target, results}, null, 2));
  failCount = results.flatMap((r) => r.rules).filter((r) => r.level === 'fail').length;
} else {
  console.log(`\nmotion-pages audit — ${target}\n`);
  for (const {viewport, rules} of results) {
    const pass = rules.filter((r) => r.level === 'pass').length;
    const warns = rules.filter((r) => r.level === 'warn');
    const fails = rules.filter((r) => r.level === 'fail');
    failCount += fails.length;
    console.log(`${viewport.padEnd(8)} ✓ ${pass} pass · ⚠ ${warns.length} warn · ✗ ${fails.length} fail`);
    for (const r of fails) console.log(`  ✗ ${r.id.padEnd(24)} ${r.msg}`);
    for (const r of warns) console.log(`  ⚠ ${r.id.padEnd(24)} ${r.msg}`);
  }
  console.log(failCount ? `\n✗ ${failCount} blocker(s) — fix before shipping.` : '\n✓ ship-ready (audit passed; run the human design-review pass too).');
}
process.exit(failCount ? 1 : 0);
