---
name: threejs-hero
description: Build production-ready immersive Three.js landing/hero pages — foggy 3D world + crisp DOM overlay, mouse-orbit parallax, pointer particles, wireframe scan intro, glass cards with scan-line reveal; responsive to phone/tablet, touch-aware, with a mandatory multi-viewport screenshot loop and a design-review (aesthetic + conversion) pass. Use when asked for a "3D landing page", "Three.js hero", "living/breathing homepage", or to apply the Sylva-style 3D effect to a brand.
---

# Three.js Immersive Hero Pages

Recipe derived from (and verified by replicating) the "Sylva — Step into the living
world" example: a monochromatic foggy 3D world fills the viewport, organic hero
geometry sweeps across the lower half, and ALL text/UI lives in a crisp DOM overlay —
never as 3D text. Single HTML file, < 1 MB of code, 60 fps. The same world can later be
dimmed and reused as a backdrop under a normal content page.

A working reference implementation ships with this skill: `examples/sylva-replica.html`.
Read it before building — it demonstrates every pattern below.

## Architecture (non-negotiables)

1. **One `.html` file + a vendored `vendor/three.module.js` beside it.** Load three
   local-first with a CDN fallback — never CDN-only (first paint waits on the CDN ⇒
   visitors stare at a blank void), and never local-only (`file://` blocks local ES
   module imports with a CORS "origin null" error, so standalone preview dies):
   ```js
   let THREE;
   try { THREE = await import("./vendor/three.module.js"); }        // instant when served
   catch { THREE = await import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js"); }
   ```
   Everything else inline. Card/photo art = inline SVG gradients, never external images.
2. **Three layers + a vignette, fixed, in this z-order:**
   - `.atmo` (z 0) — 2–3 large soft `radial-gradient` light blooms (one behind the
     headline, one near the focal card, one low horizon glow). A flat single-color
     background reads as dead space, not atmosphere.
   - `.ghost` (z 0) — optional giant translucent brand wordmark, **sized so the whole
     word fits the viewport** (total width ≈ 65vw ⇒ ~10.5vw font for a 9-letter word).
     A wordmark that overflows crops into gibberish ("RONTD"). Place it low (top ~70%)
     so the 3D world overlaps it — occlusion sells the depth.
   - `<canvas>` (z 1) — the world, `WebGLRenderer({alpha:true})` with NO
     `scene.background`, so atmo + ghost sit BEHIND the 3D world; body CSS carries
     the background color.
   - `.vignette` (z 1, after canvas) — radial darkening toward the edges; frames the
     shot and pushes the eye to the hero + CTA.
   - `#ui` (z 2) — DOM overlay; `pointer-events:none` on the layer, `auto` on
     interactive elements.
3. **Monochromatic fog world:** `scene.fog = new Fog(WORLD, ~8, ~24)` where `WORLD` ==
   the body background color. Geometry fading into fog at the horizon is the single
   trick that produces the "infinite living world" depth.
4. **Perf budget:** `setPixelRatio(min(devicePixelRatio,2))`, ACESFilmic tone mapping,
   NO shadow maps, InstancedMesh for anything repeated, one hemisphere + one
   directional light.

## ⚠️ The transform trap (this WILL bite you)

Entrance animations, pointer parallax, centering, and card rotation all want the same
CSS `transform` — and silently clobber each other. Separate them:

- **Parallax** → dedicated absolutely-positioned wrapper divs (`.px[data-px]`,
  `inset:0`), shifted via the standalone `translate` property from JS.
- **Entrance** → `.enter` class on the INNER element, animating `opacity` +
  `translate`, flipped by adding `.ready` to `<body>`.
- **Element's own placement** → nav centering via `left:50%; margin-left:-<w/2>px`
  (not translateX), card tilt via the standalone `rotate` property.

Never put two of these on the same element via `transform`.

## Time rules (or headless verification lies to you)

- Drive the intro/scan from **elapsed time** (`clock.elapsedTime`), never by
  accumulating per-frame `dt` — headless Chrome under `--virtual-time-budget` runs few
  rAF frames, so `dt`-accumulated state stalls forever (and real browsers hitch too).
- Creature/state machines driven by `dt` are fine for live motion, but give them a
  snap-to-final in still mode.
- **Build a `?still` mode**: `?still` in the URL ⇒ add `ready still` classes to body,
  force scan progress k=1, snap creatures to their perch, and CSS
  `body.still .enter{transition:none;opacity:1;translate:0 0}` +
  `body.still .art.reveal::after{display:none}`. CSS transitions/animations run on the
  REAL clock, not virtual time — without still mode every screenshot catches them
  mid-fade.

## The effect catalog (compose per project)

- **Organic hero limbs** — 3 sweeping `CatmullRomCurve3` → `TubeGeometry` curves in the
  LOWER half only: one long limb across the bottom, one rising toward the cards, one
  faint and deep (z ≈ −10). Keep limbs slim (radius .35–.55 at camera z ≈ 10.5, fov 42)
  with air between them — fat tubes read as ropes, not landscape.
- **Fuzz (moss/texture)** — one `InstancedMesh` of ~14k tiny cones (r .026, h .09),
  positions hugging each tube surface (`point + dir.normalize()*r*(.85+rand*.3)`),
  upward-biased random directions, scale .5–1.5, per-instance `setColorAt` with HSL
  jitter (hue .25±.06, sat .3–.5, light .2–.4 for moss). A second sparse InstancedMesh
  adds micro-details (white flowers, sparks).
- **Deep scenery silhouettes (3rd depth plane)** — 4–6 bare vertical shapes at
  z ≈ −10…−14 so the fog almost swallows them: tree trunks with one lean limb for a
  forest, utility poles with a crossarm for an urban/tech world — whatever the brand's
  world implies. Vary height/lean, share the scan's fade-in materials. Without this
  plane the world reads as tubes floating in a void; with it, the fog implies a whole
  landscape (the reference's background trees).
- **"Orbit using mouse"** — pointer → small target offset
  (±1.0 x, ∓0.6 y), `camera.position.lerp(target,.045)` every frame, `lookAt` fixed.
  DOM `.px` wrappers translate −pointer·(6–24 px) at different rates per layer.
- **"Particles to pointer"** — 800 `Points`, slow upward drift + sine sway, additive
  blending, `depthWrite:false`; each frame nudge x toward the pointer's world x
  (`x += (px*7 − x)*dt*.01`) so dust condenses around the cursor; respawn at bottom.
- **Wireframe scan intro (Death Stranding)** — for each limb also add a LOW-POLY wire
  clone (`TubeGeometry(curve, 34, r*1.02, 7)`, `MeshBasicMaterial{wireframe}`) — low
  segment counts give the clean triangulated scan look; full-res wireframe is noise.
  All final materials start `transparent:true, opacity:0`; over ~1.4 s (elapsed-time
  driven, smoothstepped) fade finals 0→1 and wires .55→0. **Intro budget: the page must
  feel settled by ~2.5 s** — longer intros test as "slow", not cinematic. Flip
  `body.ready` from the FIRST RENDERED FRAME (+ ~0.9 s), never a fixed timeout: if the
  lib loads slowly the whole choreography just shifts later instead of UI floating over
  a blank void. Add a ~3 s plain-`<script>` fallback that adds `.ready` anyway so a
  WebGL failure never leaves the page blank.
- **Scan-line image reveal** — `::after` overlay on card art: dark cover with a bright
  2 px line, `background-size:100% 220%`, keyframe sweeps `background-position` to
  −120%, `forwards`, staggered delays per card.
- **A living creature** — butterfly: two `PlaneGeometry` wings hinged at the body
  (`geometry.translate(w/2,0,0)`, second wing `rotation.z=π`), flap =
  `sin(t*18)` on `rotation.y`. State machine fly → rest (on a limb, +0.75 y) → flee
  when pointer's world-projected point comes within 1.5 units, then loop. Adapt the
  creature to the brand (butterfly, bird, glowing spark, paper plane).
- **Traveling pulses** — glowing spheres riding `curve.getPointAt((t*speed+off)%1)`
  toward a converging point; good for "flow" metaphors (calls, data, energy).

## DOM overlay kit (matches the reference look)

- Pill navbar top-center, `backdrop-filter:blur(16px)`, dark 50% bg — with the
  reference's full state system (a color-change-only nav reads as basic):
  - logo chip: white ROUNDED-SQUARE (radius ~13px, not a circle) with a monochrome
    brand glyph, raised shadow, playful hover (`rotate(-6deg) scale(1.05)`);
  - EVERY link gets an 11px stroke icon + uppercase letter-spaced label (10.5px `.18em`);
  - active link: SOLID white pill, dark text, raised shadow — not a translucent wash;
  - hover: a raised pill materializes — vertical gradient bg, hairline
    `rgba(255,255,255,.14)` border, `translateY(-1px)`, inner top light + drop shadow;
  - the nav's own CTA (Enter/Start free): visually distinct at rest — bordered
    glass pill, or a mini shader-gradient pill for conversion-focused brands.
- Hero reads top-to-bottom in ONE left column: category badge → headline (Quicksand
  500, ~56–60px, 2 lines, one value word in a gradient `background-clip:text` accent) →
  **subheadline DIRECTLY UNDER the H1** (≥15px, key value phrases in `<b>`) → CTA row.
  Never park the explainer paragraph beside the headline in tiny muted type — that is
  where the core value goes to die.
- CTA row: the primary CTA must be the highest-contrast element on the page —
  brand-gradient fill + colored glow shadow; a dark pill on a dark world is camouflage.
  Label = action + time-to-value ("Start free — live in 5 minutes →"). Secondary
  demo button beside it: glowing pulsing ring + a TEXT label naming the content and its
  honest length ("Hear it answer a call · 1½-minute demo") — bare play circles get
  ignored, and check the real media duration (`mdls -name kMDItemDurationSeconds`),
  not the filename.
- Trust line: ✓-marked risk reversals ("No credit card · Keep your number · Cancel
  anytime") sit DIRECTLY UNDER the CTA row at ≥13px — risk reversal works at the point
  of decision, never orphaned in a far corner of the viewport.
- Glass cards: white `#f7f8f4`, 22px radius, 9px padding, art block 15px radius with
  inline-SVG gradient art, kicker (10px uppercase) + 18.5px claim, small circular
  action button bottom-right; standalone `rotate:±1.4deg`; deep soft shadow.
- Stat chips: frosted-glass pills (blur + border, matching the nav) with a small-caps
  label over a ~21px bold value — bare floating micro-text over the world is invisible.
- Every interactive element must WORK on day 1: demo button opens a `<video>` modal
  (Esc / backdrop / × close, `aria-label`s, `preload="metadata"`, `<source>` list =
  local-relative file then site-absolute fallback); nav/CTA links point at the REAL
  app's routes and verified anchor ids (`/#how`, `/onboarding`) — relative when the
  hero will be mounted in the app, absolute only for a standalone share.

## Fluid UI layer (shader buttons + cursor light — the difference between "basic three.js" and the reference)

The reference's fluidity is mostly NOT in the 3D scene — it's that every interactive
surface behaves like a lit object. Pure CSS + ~10 lines of JS, no libraries:

- **Shader button** (primary CTA, key pills) — four layers on one element:
  1. glass gradient base stacked over the brand fill:
     `background:linear-gradient(180deg,rgba(255,255,255,.15),transparent 40%[,rgba(0,0,0,.28)]), <brand>`
     plus `inset 0 1px 0 rgba(255,255,255,.2)` top rim;
  2. **idle specular sweep** — a blurred diagonal white streak (`::before`, ~42% wide,
     `rotate:14deg`, `filter:blur(5px)`) gliding across every ~5.5s
     (`@keyframes sheen{0%,55%{left:-45%}85%,100%{left:115%}}`) — the button breathes
     even when idle;
  3. **cursor-following light** — `::after` radial gradient centered at
     `var(--mx) var(--my)`, `opacity:0→1` on hover;
  4. hover bloom: lift −2px + brighter outer glow; `:active{scale(.97)}`;
  5. **backlit under-glow on hover** (the reference's signature) — the button looks lit
     from behind its bottom edge: stack a second radial in the same `::after`
     (`radial-gradient(115% 95% at 50% 132%, <glow>, transparent 58%)`) plus a bottom
     outer shadow (`0 14px 38px -8px <glow>`) and a bottom inset
     (`inset 0 -12px 26px -14px <glow>`). Glow color is brand light: warm dawn gold for
     nature themes, the accent (e.g. violet) for tech brands. Tint the sheen streak the
     same temperature.
- **Frosted-glass play disc** — not a flat translucent circle: vertical gradient going
  milky toward the bottom (`rgba(255,255,255,.03) → .16 @62% → .32`),
  `backdrop-filter:blur(7px)` so the world refracts through it, bright bottom inner rim
  (`inset 0 -9px 18px -6px rgba(255,255,255,.38)`), top hairline; hover brightens the
  glass and scales 1.07.
  Needs `overflow:hidden` and content wrapped above the pseudos (`.cta>*{z-index:2}`).
- **JS** — one `pointermove` listener per shader surface (CTA, nav bar, AND each nav
  link — `".cta, nav, nav a"`) writing element-local `--mx/--my` percentages from
  `getBoundingClientRect()`.
- **Nav glass** — cursor light on the pill bar, plus a scoped light inside each
  link's hover pill (`nav a::after` radial at `--mx/--my`; `display:none` on
  `.active` — light on a solid white pill is invisible noise). The hovered pill's
  fill follows the pointer instead of being a static gradient.
- **Cards** — lift on the WRAPPER (`.cardpos:hover{translate:0 -6px}` — the wrapper has
  no `.enter`, so no transform-trap conflict), tilt flattens to `rotate:0`, shadow
  deepens, art scales 1.05 over .8s; corner icon button inverts + `scale(1.12)
  rotate(8deg)` on hover.
- **Play/demo rings** — slow ripple outward (`scale .92→1.16`, fade), staggered ~1.7s.
- **Easing system** — `:root{--e:cubic-bezier(.22,1,.36,1)}` (expo-out) on every
  micro-interaction, .35–.5s. Default `ease .2s` is what makes a page feel "basic".
- **⚠️ Stagger-delay trap** — entrance `.d1–.d5` classes set `transition-delay` that
  would lag every hover FOREVER. Add `body.settled .enter{transition-delay:0s}` and
  flip `.settled` ~1.6s after `.ready` (immediately in still mode). Also disable
  sheen/ripple keyframes under `body.still` (they run on the REAL clock and break
  deterministic screenshots) and under `prefers-reduced-motion`.

## Responsive + touch (mandatory — this ships to phones on day 1)

Absolute desktop positioning collapses into a card-pile on a 390px screen. Two
breakpoints minimum:

- **Phone (`max-width:740px`)** — single column: nav becomes a full-width bar
  (logo left, CTA right, middle links hidden; don't try to keep it center-pinned —
  `left:4%;right:4%;justify-content:space-between`). Hero/sub/CTA span `left/right:6%`;
  CTA full-width; trust ✓s stack vertically. HIDE the stat chips, secondary cards and
  edge micro-labels; keep ONE product card peeking from a bottom corner
  (`right:-24px;bottom:-34px;rotate:4deg`) as an artistic cue.
- **Tablet (`741–1180px`)** — keep the collage but shrink cards (~215px), drop one
  chip, and re-check that no card covers the demo button's label.
- **Touch = no `pointermove`, ever.** Gate on a `hasPointer` flag: until the first
  pointer event, drive the camera with a slow idle drift
  (`pointer.x = sin(t*.22)*.35`) so the world still breathes on phones (and on desktop
  before the first mouse move).
- **`prefers-reduced-motion: reduce`** ⇒ treat as still mode (skip scan/entrance, no
  camera drift; ambient particles may remain).

## Build order (follow strictly)

1. Static DOM overlay + palette (verify with a screenshot before any 3D).
2. Scene + fog + lights + camera. 3. Limbs + fuzz instancing. 4. Orbit parallax
   (canvas + DOM). 5. Particles. 6. Pulses/creature. 7. Wireframe scan intro.
8. Card scan reveals + staggered entrance. 9. Responsive breakpoints + touch fallback.
10. Screenshot-verify loop (all viewports). 11. Design-review pass (below).
12. Polish: color balance, fog distances, easing.

## Self-verify loop (mandatory — "self-verify until perfect")

Headless Chrome renders WebGL via SwiftShader:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"   # mac
"$CHROME" --headless=new --enable-unsafe-swiftshader --window-size=1600,900 \
  --screenshot=out.png --virtual-time-budget=8000 "file:///abs/path/page.html?still"
```

- Screenshot **all three viewports**: 1600×900 (desktop), 820×1180 (tablet),
  390×844 (phone) — plus a no-param desktop shot at `--virtual-time-budget=1100`
  (mid-scan: wireframe should be clearly visible).
- READ the screenshots and compare against the reference/brief: layer order, limb
  composition (lower half, air between), text contrast, card legibility, creature
  visible, nothing clipped, ghost wordmark fully readable.
- A fully black/empty canvas ⇒ JS error before first frame: re-run with
  `--enable-logging=stderr 2>&1 | grep -iE "error|uncaught"`.

Headless traps (each one produces a FALSE failure or false pass):

- `--disable-gpu` throws inside `new WebGLRenderer()` — the whole module dies, so you
  get UI-less ghost-only shots. Use `--enable-unsafe-swiftshader` (or
  `--use-angle=swiftshader`) instead.
- **Chrome enforces a ~500px minimum window width** (old AND new headless): a
  `--window-size=390,...` shot silently renders the layout at 500px and crops the PNG —
  the right edge looks clipped when the CSS is actually fine. For true phone renders,
  load the page in a `<iframe style="width:390px;height:844px">` harness (needs
  `--allow-file-access-from-files`) and crop the iframe region.
- Layout doubt ≠ screenshot truth: when a shot contradicts the CSS, inject a debug
  `<script>` logging `getComputedStyle` + `getBoundingClientRect` + `innerWidth` into a
  COPY of the page and read the console — measure before churning on "fixes".
- **Scrolled states need CDP, not `--screenshot`**: once the page scrolls (URL
  fragments, anchor links, scroll-linked effects), Chrome's `--screenshot` CLI can
  return a fully blank capture even though layout and paint are fine. Drive Chrome
  over the DevTools Protocol instead (`--remote-debugging-port`, `Target.createTarget`
  → `Runtime.evaluate` to scroll/measure → `Page.captureScreenshot`), and use
  `Emulation.setDeviceMetricsOverride` for true phone viewports (also bypasses the
  500px window minimum). Measure `scrollY`/rects in the same session so you never
  debug a tooling artifact as a layout bug.
- **Hover states ARE screenshotable**: make a debug copy with
  `sed 's/:hover/.dbg/g' page.html > dbg.html`, append a script adding `.dbg` to one
  nav link, the CTA, and the play disc, then screenshot in `?still` mode. Verify the
  raised nav pill, the backlit under-glow, and the glass brightening — don't ship
  hover styling on faith.

## Design-review pass (aesthetic + conversion — after the technical loop passes)

Rendering correctly is not the same as being designed well. Re-read the settled
desktop still as a principal designer + CRO lead. Every item below has caused a real
revision round; check all of them:

1. **Value scan test** — in 5 seconds a stranger can answer: what is it, who is it
   for, what do I get? (badge = category, H1 = promise, subhead = concrete mechanics).
2. **Squint test** — squint at the shot: the FIRST element that pops must be the
   primary CTA, the second the headline. If the CTA doesn't win, raise its contrast,
   not its size.
3. **Trust adjacency** — risk-reversal ✓s touching the CTA row, ≥13px.
4. **No dead micro-text** — any number or claim worth showing gets ≥20px value type in
   a glass chip; if it's not worth that size, cut it.
5. **Wordmark integrity** — background brand text fully readable, partially occluded
   by the world (depth), never cropped by the viewport (gibberish).
6. **Light exists** — the frame has visible light sources (atmo blooms + vignette),
   not one flat fill color.
7. **One winner per region** — no two elements of equal visual weight competing in the
   same corner; mute or move the loser.
8. **Intro stopwatch** — reload and count: settled ≤ ~2.5 s, and the scene is NEVER
   blank while UI is visible.
9. **Interaction audit** — click every link and button in the real browser: correct
   destinations, demo plays with sound, Esc closes, labels honest (durations, stats).
   Then HOVER everything: every interactive element must respond as a lit object
   (sheen, cursor light, eased lift — see §Fluid UI). If buttons only change color,
   the page reads as "basic three.js demo", not the reference.
10. Then `open page.html` for motion feel — easing, flap speed, parallax amplitude are
    judgment calls headless can't make.

## Ship checklist (mounting into a real webapp)

- Copy `vendor/three.module.js` + media into the app's static dir (`public/`); keep
  the local-first import path valid from the mounted route.
- Links: relative, pointing at anchor ids/routes that exist in the app (grep them).
- Meta: `<title>`, meta description, OG/Twitter image, favicon (inherit the app's).
- A11y: `aria-label` on icon-only buttons, Esc/backdrop close on modals, visible focus,
  `prefers-reduced-motion` handled, text contrast ≥ 4.5:1 over the world (text-shadow
  counts).
- Perf sanity: pixelRatio clamped, no shadow maps, instancing for repeats, video
  `preload="metadata"` — then Lighthouse the mounted route.

## Theming a brand

Pick ONE world hue from the brand palette, mute it hard for bg/fog; keep brand accents
for glows, pulses, CTA. Keep marketing copy truthful — pull claims from the brand's
real site, never invent stats. Light-theme brands: pale "dawn fog" world, or ship the
hero deliberately as a premium dark section.

## Prompt vocabulary that maps to this skill

"orbit using mouse" → §orbit · "add particles to pointer" → §particles · "wireframe
intro like Death Stranding" → §scan intro · "scan effect on card images while they
load" → §scan-line reveal · "butterfly that lands and flies away on mouse-over" →
§creature · "recreate this in Three.js in a single HTML file, self-verify until
perfect" → the whole recipe.
