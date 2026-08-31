# Positioning — where motion-pages sits and why it wins

One sentence, use everywhere:

> **motion-pages is the only tool where the agent must prove the page looks
> good before it ships.** Everyone else generates and hopes.

## The competitive map (5 categories, different edge against each)

| Category | Who | Their output | Our edge |
|---|---|---|---|
| AI prompt-to-site | v0, Lovable, Bolt, Framer AI, Webflow AI | React/Tailwind component grids (the "AI slop" look) | Output class: worlds (Three.js fog, shaders, particles), not layouts |
| Visual motion tools | Framer, Webflow, Spline, Rive, Unicorn Studio | Subscription + editor + runtime lock-in | One MIT HTML file you own, prompt-driven, any static host |
| Motion libraries | GSAP, Motion, Anime.js, Lenis, Three.js/R3F | Ingredients; you still design + code the scene | We encode the design judgment (easing grammar, layer stack, review) |
| Templates/galleries | Awwwards, Codrops, ThemeForest, template marts | The same file everyone bought | The spec that regenerates the page in *your* brand, plus clone-the-feel |
| Agent skills | frontend-design, Impeccable, taste-skill | Prose guidelines | Runtime tooling: pixel audit, slop lint, still-mode determinism, 9 audited references |

## The defensible claim

The verify loop is structural, not aspirational:
screenshot desktop/tablet/phone → design review checklist → `scripts/audit.mjs`
pixel audit (blank frames, contrast ring-sampling, dead motion, AI-slop lint)
→ iterate until exit 0. The tooling is public and runnable; all 9 demos pass it.

## What we honestly don't do (don't overclaim)

No visual editor (non-devs → Framer), no CMS/hosting/multi-page apps,
requires an agent + tokens, zero brand recognition today. The winning frame is
narrow: **award-site landing pages, one prompt, one file, verified** — never
"AI website builder".

## Voice notes

- Show, don't claim: every assertion links to a runnable demo or the audit.
- Never dunk on competitors by name in posts; the category contrast ("generate
  and hope") is enough. The table above is for our own copy decisions.
