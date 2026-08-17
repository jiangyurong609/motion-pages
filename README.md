# threejs-hero — a Claude Code skill for immersive 3D landing pages

A [Claude Code](https://claude.com/claude-code) skill that teaches the agent to build
**Sylva-style immersive Three.js hero pages** as a single HTML file (+ a vendored
three.js): a foggy monochromatic 3D world, organic geometry sweeping the lower half,
crisp DOM overlay UI, mouse-orbit parallax, pointer particles, a Death-Stranding-style
wireframe scan intro, glass cards with scan-line reveals, and a small living creature —
no build step, **responsive down to phones, touch- and reduced-motion-aware**, verified
via a multi-viewport headless-Chrome screenshot loop **plus a design-review (aesthetic +
conversion) pass**, so the result is ready to mount in a production webapp on day 1.

| Sylva replica (bundled example) | Wireframe scan intro | Applied to a real brand |
|---|---|---|
| ![Sylva replica](assets/sylva-still.png) | ![Scan intro](assets/sylva-intro.png) | ![FrontDesk hero](assets/frontdesk-still.png) |

## Install

```bash
git clone https://github.com/jiangyurong609/threejs-hero-skill.git
cp -r threejs-hero-skill/threejs-hero ~/.claude/skills/
```

Then in Claude Code, prompts like these will route through the skill:

- "Build me a 3D landing page for my brand, orbit using the mouse, add particles to pointer"
- "Recreate this in Three.js in a single HTML file. Self-verify until perfect."
- "Give the hero a wireframe intro like the field-scanning effect in Death Stranding"
- "Add a butterfly that lands on the branch and flies away on mouse-over"

## What the skill encodes

- **Architecture**: 3 fixed layers — ghost brand wordmark (z0), transparent WebGL
  canvas (z1), DOM overlay UI (z2). Text is always DOM, never 3D.
- **The one fog trick**: `scene.fog` color == page background color ⇒ infinite depth.
- **The transform trap**: parallax, entrance animations, centering, and card tilt must
  live on separate elements / separate CSS properties (`translate`, `rotate`) or they
  silently clobber each other.
- **Time rules**: intro driven by elapsed time (never accumulated per-frame deltas),
  plus a `?still` URL mode so headless screenshots are deterministic.
- **Effect recipes**: tube-geometry limbs + instanced fuzz (14k cones), pointer-biased
  particle drift, low-poly wireframe scan clones, scan-line card reveals, creature
  state machine (fly → rest → flee), traveling pulses.
- **Self-verify loop**: headless Chrome + SwiftShader screenshots at desktop, tablet,
  and phone sizes; how to catch silent JS/shader failures; and the headless traps that
  fake failures (`--disable-gpu` kills WebGL, Chrome's ~500px minimum window width
  silently crops narrow shots — use an iframe harness for true phone renders).
- **Design-review pass**: after the technical loop, re-read the still as a principal
  designer + CRO lead — value scan test, CTA squint test, trust-line adjacency, no
  dead micro-text, wordmark integrity, visible light, intro ≤ ~2.5 s, and a click-
  through audit of every link/button (honest labels, real destinations).
- **Production loading**: vendored `three.module.js` with local-first import + CDN
  fallback (never blank-void on a slow CDN, never dead on `file://` CORS), UI reveal
  keyed to the first rendered frame with a plain-script failsafe.
- **Responsive + touch**: phone/tablet breakpoints (single-column phone layout with
  one peeking card), idle camera drift for pointer-less touch devices,
  `prefers-reduced-motion` support.
- **Ship checklist**: mounting into a real app — static assets, verified routes and
  anchors, meta/OG, a11y, perf sanity.

## Bundled examples

- [`threejs-hero/examples/sylva-replica.html`](threejs-hero/examples/sylva-replica.html)
  — replica study of the original nature scene (open it in a browser, move the mouse,
  hover the butterfly).
- [`threejs-hero/examples/frontdesk-hero.html`](threejs-hero/examples/frontdesk-hero.html)
  — the same recipe re-themed for a real SaaS brand
  ([FrontDesk](https://frontdeskhq.co), an AI phone receptionist): the mossy branches
  become glowing call-wires, the butterfly becomes a message spark, call pulses flow
  into a receptionist orb. This one shows the full production treatment — conversion-
  first hero column, working demo modal, glass stat chips, atmosphere + vignette,
  phone/tablet layouts, touch idle-drift, reduced-motion support.

Verify either file locally:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --enable-unsafe-swiftshader --window-size=1440,900 \
  --screenshot=out.png --virtual-time-budget=8000 \
  "file://$PWD/threejs-hero/examples/sylva-replica.html?still"
```

## Credits

- Inspired by [Meng To](https://twitter.com/MengTo)'s "Sylva — Into the living world"
  demo and his write-up on prompting Opus 5 to build Three.js landing pages
  (inspiration he cited: <https://instagram.com/p/DYVXOx6kdmq>). The bundled Sylva
  example is an original-code replica study of that design, included for education.
- Built and verified with Claude Code.

## License

MIT — see [LICENSE](LICENSE). The Sylva visual design belongs to its original author;
the replica is included as an educational study.
