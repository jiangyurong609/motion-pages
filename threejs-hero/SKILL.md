---
name: threejs-hero
description: Build production-ready immersive motion pages in the award-site mold — Three.js worlds (foggy heroes, glass product stages with sonar rings, drag-orbit dome galleries, scroll-driven camera journeys with particle morphs) AND non-Three.js motion (raw-WebGL liquid-glass ripple typography, springy draggable poster walls, cursor mask reveals, gesture control) — each a single HTML file with a crisp DOM overlay, responsive to phone/tablet, touch-aware, with a mandatory multi-viewport screenshot loop and a design-review (aesthetic + conversion) pass. Use when asked for a "3D landing page", "Three.js hero", "living/breathing homepage", a 3D product page, a 3D gallery, a scroll-story page, "liquid glass", a ripple/distortion hero, a draggable poster wall, or to apply an award-site motion effect to a brand.
---

# Three.js Immersive Hero Pages

Recipe derived from (and verified by replicating) the "Sylva — Step into the living
world" example: a monochromatic foggy 3D world fills the viewport, organic hero
geometry sweeps across the lower half, and ALL text/UI lives in a crisp DOM overlay —
never as 3D text. Single HTML file, < 1 MB of code, 60 fps. The same world can later be
dimmed and reused as a backdrop under a normal content page.

Working reference implementations ship with this skill — read the one nearest your
task before building:
- `examples/sylva-replica.html` — the foggy hero (every base pattern below);
- `examples/frontdesk-hero.html` — the hero applied to a real SaaS brand;
- `examples/sona-product-hero.html` — glass product stage + sonar rings + orbitals;
- `examples/dome-gallery.html` — drag-orbit dome gallery + click-to-focus fly;
- `examples/boreal-journey.html` — scroll-scrubbed camera rail + particle morphs;
- `examples/pura-liquid-hero.html` — raw-WebGL liquid-glass ripple typography (no three.js);
- `examples/paperworks-posterwall.html` — springy draggable poster wall (no WebGL at all).

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
- **Element's own placement** → nav centering via
  `inset-inline:0; margin-inline:auto; width:fit-content` (never `translate:-50%` —
  the entrance animation owns `translate` and will clobber it, pinning the nav at 50%
  and cropping it off-screen; this exact regression shipped once), card tilt via the
  standalone `rotate` property.

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

## Expanded archetypes (derived from award-site studies — AETHER:1, OpenPurpose, Igloo Inc, Lando Norris, MISC, ITOM)

Beyond the foggy hero, four more page shapes reuse the same architecture (fog world +
DOM overlay + still mode). Working references ship with the skill:
`examples/sona-product-hero.html`, `examples/dome-gallery.html`,
`examples/boreal-journey.html`.

**The fake-bloom kit (use it in EVERY archetype — this is the gap between "correct"
and "award-site").** Post-processing bloom needs addon passes; you don't need them.
What actually makes the reference sites glow:

- **Never render bare `Points`** — default points are SQUARES and read as confetti.
  Always set `map` to a canvas radial-gradient sprite (white core → transparent edge,
  ~3 stops, 64px) with `transparent, depthWrite:false` and usually additive blending.
- **Baked halo texture = bloom.** A 512px canvas radial gradient with a bright ring
  band (~stops .58/.68/.72/.76/.88, peak `rgba(...,.95)` at ~.72) on an additive plane
  IS the glowing-ring/portal look (AETHER's halo, Igloo's portal) — one draw call,
  works under SwiftShader.
- **Fresnel shader for glass** — ~12-line `ShaderMaterial`
  (`vF=pow(1-|dot(n,view)|,2.4)`, alpha `vF*.9+.04`, additive, DoubleSide,
  `depthWrite:false`) over a faint dark fill shell + a `PointLight` INSIDE the object.
  Bright live edges, clear center — real glass read with zero env maps.
  ⚠️ Never `MeshPhysicalMaterial{transmission}`: it renders as an OPAQUE GRAY BLOB
  under SwiftShader and muddy on weak GPUs.
- **Sparkle sub-cloud** — alongside a big soft-particle cloud, a 2nd `Points` of ~500
  larger glints whose positions COPY random indices of the main cloud each frame
  (they morph for free) with slowly pulsing opacity.
- **Film grain** — a fixed CSS overlay (`SVG feTurbulence` data-URI, `opacity:.06,
  mix-blend-mode:overlay`) placed under the text layer; kills flat-gradient banding
  and adds the cinematic finish every reference site has.
- **Layered gradient atmosphere** behind the canvas (2–3 radial glows + a vertical
  linear ramp), even for light themes — one flat bg color reads as dead space.

- **Glass product stage** (AETHER:1-style earbuds/device hero) — the product floats
  right of the copy column inside a breathing halo + expanding sonar rings: fresnel
  glass case (kit above), emissive buds inside, interior point light, baked halo plane
  + a wide soft nebula plane behind it, thin geometry rings expanding past the halo,
  two counter-rotating wireframe icosahedron shells and a two-layer soft starfield in
  the deep background.
  - Sonar rings: 3 thin `RingGeometry(1.94,2.0)`, additive, staggered phases,
    `scale 1→2.6` with `opacity (1-ph)²*.4`. THIN is the trick — a fat ring reads as
    a donut, not a pulse. In still mode give each ring a DIFFERENT frozen phase so the
    screenshot shows the expanding sequence.
  - Orbital arcs: tilted `EllipseCurve` lines (opacity ~.3) each carrying one small
    glowing dot at `getPointAt((t*speed+phase)%1)`.
  - Put product + rings + orbits in ONE `stage` group; reposition per breakpoint in
    `resize()` (desktop: `x≈+2.3` beside the copy; phone: `y≈+2.1, scale .62` above it).
  - Sound toggle homage: generate a 3-oscillator WebAudio hum (no media files), and
    make ring amplitude/opacity react — an honest, working "Sound: on/off" chip.
- **Dome media gallery** (OpenPurpose-style) — dozens of cards on the inside of a
  sphere, camera at center; drag to orbit, click to fly to a card.
  - DENSITY sells it: ~100 cards in ~8 latitude bands (counts 9…19 per band),
    `position.setFromSphericalCoords(R≈9.5,…)` + `lookAt(0,0,0)`, card height ~1.55.
    Five sparse bands read as floating litter, not a dome.
  - Card art: `CanvasTexture` fake site thumbnails from a SEEDED rand — zero image
    requests, deterministic screenshots. Art-direct them like a portfolio, not a
    wireframe: 4–5 templates (classic site, giant-typography poster, duotone
    image-led, dark product spotlight), ~15% dark cards, occasional accent color, and
    **bake a soft drop shadow into each canvas** (transparent padding +
    `shadowBlur≈22, offsetY≈10`) — the shadows are what make cards pop off the void.
  - Drag orbit with inertia (`v*=.95` on release) + slow idle auto-rotate; disambiguate
    click vs drag by pointer travel (>6 px = drag, swallow the click).
  - Click focus: raycast → tween camera to `cardPos*0.62`, `lookAt(card)`, dim all
    other cards to `opacity .18`, show a DOM caption pill + "Back" (Esc works too).
- **Scroll-driven camera journey** (Igloo/ITOM-style) — a fixed canvas under a tall
  scroll track (`#track{height:500vh}`); progress `p = scrollY/max`, smoothed
  (`p += (target-p)*.07`), scrubs the camera along a `CatmullRomCurve3` rail with a
  parallel look-at rail; DOM caption blocks fade per progress segment.
  - **Add a `?p=0..1` override** that pins progress — scrolled states become plain
    `--screenshot` calls (no CDP needed), and every keyframe of the journey is
    verifiable. Generalize this: ANY interactive state a screenshot can't reach by
    itself gets a forcing query param (`?focus=N` for the dome's fly-to, etc.).
  - ⚠️ The rail must clear the terrain: displaced-noise ground WILL rise above a
    low camera mid-path and fill the frame with a featureless slab. Flatten a clearing
    around the subject (`amplitude *= clamp((d-6)/11,0,1)`) and keep rail y above the
    local terrain max; verify with `?p=` shots at 0/.25/.5/.75/.95.
  - Captions over a bright fog world need a scrim (blurred dark glass pill), not just
    text-shadow — white-on-white particles swallow bare text.
- **Particle shape morph** (Igloo's creature / gesture demos) — ONE `Points` cloud
  (~6k, soft sprites + sparkle sub-cloud from the kit), several precomputed
  `Float32Array` target sets. Morph = per-particle smoothstepped lerp with a
  per-particle stagger offset (`s=clamp((blend-stagger*.5)/.5)`), plus
  `sin(ss*π)`-weighted scatter so particles loosen mid-flight and re-condense — that
  scatter is what makes it read as dissolution rather than a cheap tween.
  - Don't sample smooth surfaces — QUANTIZE targets into structure: the igloo is
    brick cells on a hemisphere (rows offset half-a-brick for a running bond, a
    skipped wedge per bottom row forming the entrance arch, plus a half-cylinder
    tunnel); the gaps between cells read as mortar seams. Structure > density.
  - Creature = union of ~9 offset spheres (body/head/ears/paws/snout) sampled
    volumetrically; silhouette matters, detail doesn't — particles forgive crude
    geometry. During the ring act, back the particle torus with the baked halo plane
    + a soft central burst (windowed by scroll: `w=clamp(1-|p-.5|*5)`) — the particles
    alone are a shape; the halo makes it a PORTAL.
- **Cursor mask reveal** (Lando-Norris-style) — mostly DOM: stack alternate hero
  layers (helmet/visor variants) and drive `clip-path:circle(r at x y)` (or a WebGL
  uv-discard mask) from the pointer; snap layer choice to pointer zones so elements
  change the instant the cursor crosses them.

## Motion beyond Three.js (same architecture, no 3D library)

The reference reels are NOT all Three.js — liquid-glass typography and physical
poster walls are raw WebGL / pure DOM. Same non-negotiables apply (single file,
DOM overlay, `?still` mode, screenshot loop).

- **Liquid-glass ripple typography** (`pura-liquid-hero.html`, the OYLA/"Ripple
  Distortion" look) — paint the editorial page ONCE on an offscreen 2D canvas (giant
  serif display type, gradient product orb, captions — this layer is what distorts;
  CTAs/nav stay crisp DOM above), then a raw-WebGL fragment shader over it:
  - **Analytic ripples, not FBO water sim**: keep a pool of ~24 `vec3(x,y,age)`
    uniforms; each fragment sums expanding ring waves
    `sin((d-age*speed)*44) * exp(-band²*260) * exp(-age*1.6)` and displaces the sample
    uv along the radial. Ping-pong float FBOs die on SwiftShader/older GPUs; analytic
    rings are deterministic (still mode = a preset ripple array) and look identical.
  - Liquid-glass lens on the cursor: pull uvs toward the pointer
    (`-inl²*.05`, inl=smoothstep(R,0,d)) + a rim highlight at the lens edge.
  - Chromatic aberration = sample R/G/B with displacement ×1.06/1.0/0.94; wet look =
    add white proportional to the summed wave crest (~.24 — more goes milky).
  - Cover-fit the source texture in-shader (compare canvas vs texture aspect) so
    resize never letterboxes; spawn ripples throttled (~70 ms) on pointermove, a burst
    of 3 on click; idle autopilot drifts the lens and drips ripples so the page is
    never dead.
- **Springy poster wall** (`paperworks-posterwall.html`, MISC-style) — no WebGL at
  all; the paper physics is a spring in CSS transforms:
  - **Infinite wrap**: one COLS×ROWS block of posters tiled 3×3; each cell's screen
    position = `mod(base + offset + B/2, B*3) - B*1.5` per axis — drag forever, no
    edges, 36 DOM nodes total.
  - **Bend from lag, not velocity**: smooth the offset (`o += (target-o)*.14`) and use
    the LAG `(o-target)` as bend energy → target tilt `rotateX/rotateY` (clamped
    ±22–26°), integrated per-poster with a spring (`v += (t-r)*.16; v *= .82`) and a
    per-poster stiffness factor so the wall ripples like sheets, not a rigid grid.
  - Poster art = seeded canvas paintings (bold palette, stacked display words, glyphs,
    zigzags, circled numerals + catalog footer line) — zero image requests.
  - Drag + wheel both pan; momentum on release (`v *= .94`); click-vs-drag gate
    (>6 px travel swallows the click); click → backdrop-blur modal enlarge.
  - Floating UI over busy art needs its own surface: brand chip and hint pill get a
    translucent bg + backdrop blur, never bare text.
- **Gesture control** (webcam demos) — MediaPipe Hands (or FaceLandmarker) mapped onto
  the SAME particle-morph machinery: pinch distance → gather/scatter blend, palm x/y →
  group rotation. Keep it an optional progressive enhancement behind a permission
  prompt; pointer fallback always works.

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
  `left:4%;right:4%;justify-content:space-between`). Two modes depending on the page:
  - *One-screen standalone hero* (`overflow:hidden` demo page): hide the stat chips,
    secondary cards and edge micro-labels; keep ONE card peeking from a bottom corner
    (`right:-24px;bottom:-34px;rotate:4deg`) as an artistic cue.
  - *Scrolling product page*: **reflow, never hide** — real users on real phones notice
    missing stats and cards. Make the hero viewport an auto-height flex column, switch
    the `.px` parallax layers and their children to `position:static`, and use flex
    `order` on the layers to sequence badge → H1 → sub → CTA → trust → chips → ALL
    cards (centered, `width:min(300px,100%)`, slight rotate kept). Gate the DOM
    parallax off on phones (`if (innerWidth <= 740) return`) — touch-drag fires
    pointermove and would shift static flow blocks.
- **Tablet (`741–1180px`)** — keep the collage but shrink cards (~215px), drop one
  chip, and re-check that no card covers the demo button's label.
- **Touch = no `pointermove`, ever.** Gate on a `hasPointer` flag: until the first
  pointer event, drive the camera with a slow idle drift
  (`pointer.x = sin(t*.22)*.35`) so the world still breathes on phones (and on desktop
  before the first mouse move).
- **`prefers-reduced-motion: reduce`** ⇒ treat as still mode (skip scan/entrance, no
  camera drift; ambient particles may remain).

## Study-a-reference workflow ("make my site feel like this URL")

When the user hands you a URL they love, don't guess — browse it, measure it, then
rebuild its MOTION LANGUAGE as original code themed to the user's brand. Never copy
the reference's code, assets, images, fonts-by-file, copy text, or branding: the
deliverable is a study of its patterns applied to the user's content. Say so in the
result.

1. **Capture what it looks like.** Headless screenshots at desktop + phone width; for
   scroll-driven sites use CDP (see §Self-verify) to shoot 0/25/50/75/100% scroll —
   the storyboard IS the spec. If you have browser control, also record: what happens
   on pointer move? on hover? on click? on wheel?
2. **Read the tech signals.** The HTML is usually a thin shell — fetch it, extract
   `<script src>` URLs, fetch those, and grep the BUNDLES:
   ```bash
   curl -sL -A "Mozilla/5.0" "$URL" -o page.html
   grep -oiE '<script[^>]*src="[^"]*"' page.html          # then fetch each src
   grep -oiE 'three|gsap|scrolltrigger|lenis|locomotive|curtains|pixi|\bogl\b|gl_FragColor|fragmentShader|createProgram|IntersectionObserver' \
     bundle.js | tr 'A-Z' 'a-z' | sort | uniq -c | sort -rn
   ```
   Vite/webpack loaders may be tiny stubs that `import()` more chunks — if the grep
   is thin on a clearly-3D site, trust the visual/runtime evidence over the grep.
3. **Map observations → recipes.** Fullscreen canvas + fog + product center →
   §glass product stage; page scrolls but camera moves → §scroll camera journey;
   images wrapped on a sphere/drag → §dome gallery; typography warps under cursor →
   §liquid-glass ripple; cards tilt with drag momentum → §springy poster wall;
   layers swap under the pointer → §cursor mask reveal. Anything unmapped: describe
   the motion precisely (what moves, on what input, with what easing) and synthesize
   from the kit primitives.
4. **Rebuild + verify.** Compose the mapped recipes, theme to the user's brand
   palette/copy, then run the full screenshot loop AGAINST the reference storyboard —
   compare frame by frame at the same scroll depths and fix the biggest visual gap
   each pass.

Prompt vocabulary: "clone the feel of <URL>" / "make my landing page feel like
<URL>" → this workflow.

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
- **Interactive states get forcing params**: any state reached only by user input
  (scroll progress, a focused gallery card, a finished morph) gets a query param that
  pins it (`?p=0.5`, `?focus=40`) — then it's a plain `--screenshot` call. Verify the
  journey at several `?p` keyframes, not just the landing frame.
- **State-class specificity trap**: a state override like `body.focused .disc{opacity:0}`
  silently LOSES to the entrance rule `body.ready .disc.enter{opacity:1}` (more
  specific). The focused screenshot still shows the disc. Make state overrides win
  (`!important` or match specificity) and screenshot the state to prove it.
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
- Media has CONTENT, not just playback: a UI probe proves the player runs, not that
  anything is audible/visible. Before shipping audio/video, verify the asset itself:
  `ffmpeg -i f -af volumedetect -f null /dev/null` (max_volume ≈ -91dB = digital
  silence), and Range-request the deployed URL (expect 206). ffmpeg trap that caused
  this: `-ss` AFTER `-i` keeps source timestamps, so time-anchored filters
  (`afade st=…`) act on the original timeline and can fade the whole clip to zero —
  put `-ss` BEFORE `-i` (resets pts to 0) when combining trims with timed filters.

## Theming a brand

Pick ONE world hue from the brand palette, mute it hard for bg/fog; keep brand accents
for glows, pulses, CTA. Keep marketing copy truthful — pull claims from the brand's
real site, never invent stats. Light-theme brands: pale "dawn fog" world, or ship the
hero deliberately as a premium dark section.

## Prompt vocabulary that maps to this skill

"orbit using mouse" → §orbit · "add particles to pointer" → §particles · "wireframe
intro like Death Stranding" → §scan intro · "scan effect on card images while they
load" → §scan-line reveal · "butterfly that lands and flies away on mouse-over" →
§creature · "3D product page like AETHER / glass earbuds hero" → §glass product stage ·
"gallery dome / sphere of screenshots like OpenPurpose" → §dome media gallery ·
"scroll tells the story like Igloo Inc" / "camera walks through the scene" →
§scroll-driven camera journey · "particles form a shape / logo / creature" →
§particle shape morph · "image changes as the mouse moves over it like Lando Norris"
→ §cursor mask reveal · "liquid glass" / "ripple distortion over the headline" →
§liquid-glass ripple typography · "draggable poster wall" / "posters that flex like
paper" → §springy poster wall · "control it with hand gestures" → §gesture control ·
"recreate this in a single HTML file, self-verify until perfect" → the whole recipe.
