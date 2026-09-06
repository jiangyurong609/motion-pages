# Changelog

## Unreleased

- **New archetype — HOLLOWMERE, live game-world hero** (`hollowmere-world.html`,
  three.js, audit-clean, zero textures/models/images): an indie isometric RPG's landing
  page whose hero is the game — a procedural weald (vertex-coloured terrain with a road,
  instanced trees/ferns/grass/rocks/flagstones, ruins, a campfire with additive flames
  and ember points, blob shadows instead of shadow maps) and a knight assembled from
  primitives on pivots who walks where you click, lights three waystones for the HUD
  quest, and plays the hotbar verbs (strike, guard, dodge, nightfall, rest); autopilot
  when idle; a time-of-day scalar; the trailer is the same scene through a perspective
  camera in three letterboxed shots; press screenshots are rendered once by the same
  renderer. `?tod=` pins the hour, `?still` freezes. Recipe in SKILL.md, build-spec
  prompt, showcase card, bench entry (eleven re-themable archetypes).
- **New archetype — ALDER, scroll-scrubbed process reveal** (`alder-build.html`, pure
  DOM + one 2D canvas, audit-clean): a 500vh track with a sticky stage; scroll progress
  raises a timber cabin through survey → piers → deck → frame → shell → lights-on at
  dusk, drawn isometrically with a single `drawScene(p,t)` timeline (no image assets),
  five crossfading captions, a ticked progress bar, then a hand-off into the business
  page (stats, three "projects" rendered by the same scene function, process, quote
  form). `?p=` pins, `?still` freezes time. Recipe in SKILL.md, build-spec prompt, bench
  entry (ten re-themable archetypes).

## 0.2.0 — 2026-09-05

Eleven archetypes, a measured study tool, and a bench that remixes every plate for
your brand.

- **`scripts/study.mjs`** — "clone the feel of this URL", measured: storyboard at five
  scroll depths (desktop + phone), pixel-diff probes for idle / pointer / drag /
  hover / scroll / wheel reactivity, palette from rendered pixels, type from computed
  styles, bundle grep with chunk following, recipe mapping with confidence, and a
  build-spec prompt. Pierces closed shadow roots for canvas geometry. CI checks it
  recognises three of the bundled archetypes.
- SKILL.md §Study-a-reference now starts with the tool; `study <url>` joins the
  command vocabulary.
- **Two new archetypes** (recipes + single-file demos + build-spec prompts, both pure
  DOM, both audit-clean): **HALDE — cursor-trail image reveal** (`halde-trail.html`:
  prints surface under the pointer and peel away along its path; pooled nodes, seeded
  canvas photographs, idle autopilot, click burst) and **KILN — horizontal scroll-snap
  story** (`kiln-horizontal.html`: the wheel drives a sideways rail of five chapters
  with three-speed parallax from local progress, soft snapping, `?p=` forcing param).
- **Showcase bench upgrade**: all nine re-themable archetypes selectable (three rebuild
  live, the rest preview their reference plate), a brand-hex input that derives the
  hue, a dark/light tone switch, a "↻ Remix for my brand" link on every card that
  lands in the bench pre-selected, and the copied prompt is now the plate's full
  build-spec with a THEME block (brand, tagline, palette, tone) prepended. Every
  configuration is a shareable `#bench?…` URL that restores on load.
- Audit: canvases outside the viewport no longer trip `tech/canvas-alive`; text on an
  element with its own opaque background is contrast-checked against that background
  (pill buttons stopped reporting false 1.0:1).

## 0.1.0 — 2026-09-04

First tagged release — everything since launch (2026-09-01).

- The skill: nine archetype recipes (foggy Three.js hero, glass product stage,
  drag-orbit dome gallery, scroll-driven camera journey, particle shape morph,
  liquid-glass ripple typography, springy poster wall, cursor mask reveal, easing
  grammar), each with a bundled single-file demo and a full build-spec prompt.
- Self-verify loop: multi-viewport headless-Chrome screenshots + design-review pass.
- Runtime tooling: `scripts/audit.mjs` (zero-dep design lint, ~22 rules × 3
  viewports, CI-gateable) and `scripts/picker.js` (DevTools element → agent context).
- Showcase site with inline-playing demos, Playground prompt generator, and
  `llms.txt` for non-Claude agents.
- Plugin-marketplace install: `/plugin marketplace add jiangyurong609/motion-pages`.
- CI: every bundled demo passes the audit at desktop / tablet / phone.
