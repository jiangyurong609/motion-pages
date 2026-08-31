# Reddit — paste-ready (one sub per day, never the same text twice)

Read each sub's self-promo rules the day you post. Value-first framing; the
technical writeups ARE the value. Respond to every comment for the first 3 hours.

## r/ClaudeAI — launch week

**Title:** I built a Claude Code skill that makes the agent screenshot-verify
its own landing pages until they stop looking AI-made

**Body:**

The demos: https://motion-pages.pages.dev (9 live pages, each with the full
prompt that built it). Repo (MIT): https://github.com/jiangyurong609/motion-pages

The premise: AI pages look AI-made because the model is missing recipes, not
capability. So the skill teaches the recipes (fog == background color, baked
canvas glow instead of bloom post-processing, fresnel glass instead of
transmission, spring physics from drag lag) and then forces a loop: headless
screenshots at desktop/tablet/phone → a design-review checklist → a pixel audit
script (blank-frame detection, contrast ring-sampling, an AI-slop lint that
flags Inter/gradient-text/glassmorphism) → iterate until the audit exits 0.

Every page ships as one self-contained HTML file, no build step. Happy to answer
anything about the headless-Chrome traps — that's half the skill.

## r/threejs — different day, technical angle

**Title:** Lessons from making Three.js scenes verifiable by headless
screenshots (SwiftShader traps, fake bloom, ?still determinism)

**Body:** Short intro + the traps list (transmission renders opaque in
SwiftShader; a lone render outside rAF never composites — keep the loop running
with a pinned clock; seeded PRNG so ?still renders identical frames; forcing
params like ?p=0.6 to pin scroll journeys mid-flight). Link the Sylva replica
and VOLERA as live examples, repo last. This sub upvotes writeups, not launches.

## r/SideProject — launch day or day after

**Title:** My AI-built showcase looked like AI slop, so I made the agent grade
its own work (before/after inside)

**Body:** The redesign story with `launch/assets/redesign-before-after.png`:
shipped the showcase, realized it looked like a docs page, screenshot-studied
GSAP/Anime.js/Motion/Lenis headlessly, rebuilt it dark with the particle field
as the hero, then ran an 82k-star design-critic skill against it and fixed the
7 tells it caught. Links to showcase + repo at the end.

## r/webdev — Showoff Saturday thread only (comment, don't post)

One paragraph + showcase link. Lead with "single HTML file, no build step" —
that's the crowd's hook.
