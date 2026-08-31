# X / Twitter — paste-ready

Two parts: **warm-up posts** (Aug 30–31, standalone, build-in-public voice) and the
**launch-day thread** (Sep 1, morning of PH). Char counts noted; all under 280.

---

## Warm-up posts (post 1/day before launch; each stands alone)

### A — The redesign story (image: `assets/redesign-before-after.png`) [~272]

I shipped my project's showcase and realized it looked like a docs page, not a
motion showcase.

So I screenshot-studied how GSAP, Anime.js, Motion and Lenis present themselves,
and rebuilt it — with the same skill the site documents. The hero is now the
product itself.

Before / after ↓

### B — The taste-skill audit (screenshot: the fixed index section) [~262]

Ran the 82k-star taste-skill (the anti-slop design critic) against my own site.

Passed the structural checks. Failed 7 "AI tells" I didn't know I had:
section-number eyebrows, labels overlaid on images, 30-word hero copy…

Fixed in an hour. Audit your landing page before someone else does.

### C — Positioning (media: demo.gif or VOLERA screen recording) [~248]

v0, Lovable and Bolt generate a landing page and hope it looks good.

motion-pages makes the agent prove it: screenshot desktop/tablet/phone → design
review → headless pixel audit → iterate until it passes.

9 demos built this way. All open source:
https://motion-pages.pages.dev

### D — VOLERA clip (video: volera-morph.html, 10s, cursor scattering the flock) [~200]

6,000 particles morphing crane → flock → moon gate. The cursor scatters them.

One self-contained HTML file. Built by an agent from a prompt you can copy off
the site.

https://motion-pages.pages.dev/examples/volera-morph

### E — TEMPO / easing grammar (video: tempo-easing.html replays) [~230]

Motion has grammar: ease-out enters, ease-in exits, linear loops, ONE overshoot
as a signature.

This cheat-sheet demonstrates the rules on itself — every card replays its
curve. Pure DOM, zero requests, one file.

https://motion-pages.pages.dev/examples/tempo-easing

---

## Launch-day thread (6 tweets, morning of PH launch)

### 1 — Hook (video: pura-liquid-hero.html, 10–15s screen recording) [~200]

AI-generated landing pages don't have to look AI-generated.

This liquid-glass hero is one prompt. The whole page is a single HTML file an
agent built and screenshot-verified.

9 live demos, all open source ↓
https://motion-pages.pages.dev

### 2 — The gallery (media: assets/demo.gif) [~195]

It's a Claude Code skill: foggy 3D worlds, glass product stages, dome galleries,
scroll journeys, particle morphs, springy poster walls.

Every demo ships with its full build-spec prompt. Paste it, get your own world.

### 3 — The trick (image: `assets/glow-compare.png`) [~260]

Why do AI pages look flat? Missing recipes, not missing model.

Real bloom post-processing dies in headless Chrome. The fix: bake the glow into
radial-gradient sprite textures. Fog == background color makes geometry melt
into atmosphere. It's all in the skill.

### 4 — The loop (media: `assets/boreal-sweep.gif`) [~235]

The part I care about most: the agent checks its own work.

It screenshots desktop/tablet/phone headlessly and iterates. Interactive states
get forcing params — ?p=0.6 pins a scroll journey mid-flight so even animation
is verifiable.

### 5 — The gate (image: audit.mjs terminal output) [~240]

It also ships a pixel audit: blank-frame detection, contrast ring-sampling,
dead-motion probes, an AI-slop lint (Inter, gradient text, glassmorphism…).

Pages don't ship until `node scripts/audit.mjs page.html` exits 0. All 9 demos
pass it.

### 6 — CTA [~150]

All MIT. Single HTML files, no build step.

Repo: https://github.com/jiangyurong609/motion-pages
Demos + prompts: https://motion-pages.pages.dev

Star it if you want more worlds 🌍

---

## Bluesky / Threads variants

Reuse warm-up A and C verbatim (both platforms allow the same length). On
Threads, put the link in a reply — first-post links get down-ranked.

## Recording notes

- Ready in `assets/`: redesign-before-after.png, glow-compare.png, boreal-sweep.gif, demo.gif.
- Still need screen recordings for A(optional), C/D/E and thread tweet 1:
  16:9, 1600×900 browser window, mouse moving slowly (parallax reads on video),
  each under 20s for autoplay. Tweet 5 needs a terminal screenshot of a passing
  audit run (real output only).
- Post warm-ups from the personal account; quote-RT them from the thread on
  launch day so the story chains.
