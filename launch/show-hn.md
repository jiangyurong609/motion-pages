# Show HN — paste-ready

Post mid-morning ET (9:30–11:00), Tue–Thu. URL field = the showcase, not the repo
(repo is linked in the text; HN prefers the thing people can experience).

**Title** (80 max, this is 79):
Show HN: Claude Code skill that builds award-site WebGL pages and verifies them

**URL:** https://motion-pages.pages.dev

**Text:**

I kept wondering why AI-generated landing pages never look like Awwwards
winners. It turned out not to be a model problem — the models just don't know
the recipes. So I wrote them down as an open-source Claude Code skill:
motion-pages (https://github.com/jiangyurong609/motion-pages). Every demo on
the showcase is a single self-contained HTML file the agent actually built, and
each one has a copy-paste prompt so you can generate your own version.

The technically interesting part is the self-verification loop. The agent
screenshots its own output headlessly at desktop/tablet/phone sizes and
iterates — which surfaced a pile of traps worth knowing even outside this
project: SwiftShader renders `transmission` materials opaque (so glass is faked
with fresnel), headless windows under ~500px silently clamp, and interactive
states can't be screenshot-verified unless the page exposes forcing query
params (?p=0.6 to pin a scroll journey mid-flight, ?still to freeze
intros). Water ripples are analytic ring functions instead of FBO simulation so
they survive software rendering. Bloom is baked radial-gradient sprites, not
post-processing. All MIT, no build step — curious what recipes HN would add.

## Comment-thread prep (likely questions)

- "Why single-file HTML?" → verifiability + zero-setup; the agent can screenshot
  a file:// page without a dev server, and users can save/remix one file.
- "Does it need Claude specifically?" → No; SKILL.md works as pasted context in
  Cursor/Codex etc. Claude Code just auto-loads it.
- "Isn't this just prompts?" → The skill is mostly *constraints + traps*
  (what breaks in headless rendering) plus verified reference implementations —
  the part models don't have in training data.
- "The demos look samey" → 7 different archetypes; link the dome gallery and
  poster wall (non-3D, spring physics in CSS transforms).
