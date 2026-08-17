---
name: threejs-hero
description: Build immersive Three.js landing/hero pages as a single self-contained HTML file — foggy 3D world + crisp DOM overlay, mouse-orbit parallax, pointer particles, wireframe scan intro, glass cards with scan-line reveal. Use when asked for a "3D landing page", "Three.js hero", "living/breathing homepage", or to apply the Sylva-style 3D effect to a brand.
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

1. **One self-contained `.html` file.** Three.js via CDN import map
   (`{"imports":{"three":"https://unpkg.com/three@0.170.0/build/three.module.js"}}`).
   Everything else inline. Card/photo art = inline SVG gradients, never external images.
2. **Three layers, fixed, in this z-order:**
   - `.ghost` (z 0) — optional giant translucent brand wordmark (~36vw, white at 3%).
   - `<canvas>` (z 1) — the world, `WebGLRenderer({alpha:true})` with NO
     `scene.background`, so the ghost text sits BEHIND the 3D world; body CSS carries
     the background color.
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
- **"Orbit using mouse"** — pointer → small target offset
  (±1.0 x, ∓0.6 y), `camera.position.lerp(target,.045)` every frame, `lookAt` fixed.
  DOM `.px` wrappers translate −pointer·(6–24 px) at different rates per layer.
- **"Particles to pointer"** — 800 `Points`, slow upward drift + sine sway, additive
  blending, `depthWrite:false`; each frame nudge x toward the pointer's world x
  (`x += (px*7 − x)*dt*.01`) so dust condenses around the cursor; respawn at bottom.
- **Wireframe scan intro (Death Stranding)** — for each limb also add a LOW-POLY wire
  clone (`TubeGeometry(curve, 34, r*1.02, 7)`, `MeshBasicMaterial{wireframe}`) — low
  segment counts give the clean triangulated scan look; full-res wireframe is noise.
  All final materials start `transparent:true, opacity:0`; over ~2.2 s (elapsed-time
  driven, smoothstepped) fade finals 0→1 and wires .55→0. Flip `body.ready` at ~2.3 s
  (setTimeout) to stagger the DOM entrance after the scan.
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

- Pill navbar top-center: icon disc + 3–4 uppercase letter-spaced links (10.5px,
  `.18em`), one active filled pill, `backdrop-filter:blur(16px)`, dark 50% bg.
- Hero: left-aligned light-weight rounded-font headline (Quicksand 500, ~56px,
  2 lines), small muted paragraph to its right, dark pill CTA with icon.
- Glass cards: white `#f7f8f4`, 22px radius, 9px padding, art block 15px radius with
  inline-SVG gradient art, kicker (10px uppercase) + 18.5px claim, small circular
  action button bottom-right; standalone `rotate:±1.4deg`; deep soft shadow.
- Floating stat chips: tiny label + bold value with a `❋` marker, text-shadow for
  legibility over the world; vertical `DISCOVER` micro-label on the right edge.
- Ghost play-button with concentric `::before/::after` rings.

## Build order (follow strictly)

1. Static DOM overlay + palette (verify with a screenshot before any 3D).
2. Scene + fog + lights + camera. 3. Limbs + fuzz instancing. 4. Orbit parallax
   (canvas + DOM). 5. Particles. 6. Pulses/creature. 7. Wireframe scan intro.
8. Card scan reveals + staggered entrance. 9. Screenshot-verify loop. 10. Polish:
   color balance, fog distances, easing.

## Self-verify loop (mandatory — "self-verify until perfect")

Headless Chrome renders WebGL via SwiftShader:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"   # mac
"$CHROME" --headless=new --enable-unsafe-swiftshader --window-size=1440,900 \
  --screenshot=out.png --virtual-time-budget=8000 "file:///abs/path/page.html?still"
```

- `?still` shot (settled composition) + a no-param shot at `--virtual-time-budget=1100`
  (mid-scan: wireframe should be clearly visible) are the two standard checks.
- READ the screenshots and compare against the reference/brief: layer order, limb
  composition (lower half, air between), text contrast, card legibility, creature
  visible, nothing clipped, ghost text subtle (barely there).
- A fully black/empty canvas ⇒ JS error before first frame: re-run with
  `--enable-logging=stderr 2>&1 | grep -iE "error|uncaught"`.
- Iterate until the still could pass as a dribbble shot, then `open page.html` for
  real-time motion feel (headless can't judge easing).

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
