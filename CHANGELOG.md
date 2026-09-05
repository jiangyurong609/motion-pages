# Changelog

## Unreleased

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
