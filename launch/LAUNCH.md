# Launch plan — motion-pages

Ship order: X/小红书 teaser → Product Hunt → Show HN → directories → community PRs.
Everything links to the showcase: https://motion-pages.pages.dev

**Paste-ready copy lives in the per-channel files:**
[product-hunt.md](product-hunt.md) · [show-hn.md](show-hn.md) ·
[x-thread.md](x-thread.md) · [xiaohongshu.md](xiaohongshu.md) ·
[directories.md](directories.md). This file is the strategy overview.

## Product Hunt

- **Name:** motion-pages
- **Tagline:** Award-site motion pages, one prompt away
- **Description (260):** An open-source Claude Code skill that teaches your AI agent
  to build award-site-style motion pages — 3D worlds, glass product stages, dome
  galleries, scroll journeys, liquid-glass shader typography, springy poster walls —
  as single HTML files, screenshot-verified until they're right. MIT, no build step.
- **First comment (maker):** I kept seeing incredible Awwwards-style sites and
  wondering why AI-generated pages never look like that. The answer isn't the model —
  it's the missing recipes: fog == background color, fake bloom from baked canvas
  glow textures, fresnel glass instead of transmission, spring physics from drag lag.
  So I packaged them as a skill with a self-verification loop: the agent screenshots
  desktop/tablet/phone and iterates until the page is right. Every demo on the site
  is a real page it built. Copy a prompt, paste it into Claude Code (or Cursor with
  SKILL.md as context), get your own world. All MIT. Ask me anything about the
  recipes — the traps section is half the value.
- Assets: demo GIF (assets/demo.gif), 5–7 gallery stills, showcase link.

## Show HN

- **Title:** Show HN: A Claude Code skill that builds award-site Three.js/WebGL
  pages and screenshot-verifies them
- **Body:** 2 paragraphs: (1) what it is + link to showcase + repo; (2) the
  interesting technical bits — headless SwiftShader traps (transmission renders
  opaque, 500px min window), forcing query params (?p=, ?focus=) that turn any
  interactive state into a plain screenshot, analytic ripples instead of FBO water,
  the fake-bloom kit. HN loves the verification loop angle; lead with it.

## X / Twitter thread (6 tweets)

1. Hook: video of PURA liquid typography + "this page is one prompt" + link.
2. The gallery: GIF, "9 live demos, each with a copy-paste prompt."
3. The trick: fake-bloom kit explained in one image (before/after squares vs sprites).
4. The loop: screenshot-verify GIF (BOREAL ?p= sweep) — "the agent checks its own work."
5. Beyond three.js: Paperworks drag video — "spring physics is 15 lines of CSS transforms."
6. CTA: repo link + "MIT, no build step. Star if you want more worlds."

## 小红书 (the audience that sent us here)

- 标题: 「一句 prompt 生成获奖级动效网站？我把配方开源了」
- 正文: Vibe coding 玩家看过来 — 把 AETHER / Igloo / OpenPurpose 那类获奖网站的
  动效拆解成了开源 skill：液态玻璃、粒子变形、玻璃产品台、海报墙全都有。
  每个 demo 都能在线打开，prompt 一键复制，贴进 Claude Code 就能给自己的品牌
  做一个。免费 MIT。附教程截图 + showcase 链接。
- 挂链接: showcase + GitHub。

## Directories (submit once, dofollow where possible)

- GitHub topics: threejs, webgl, claude, ai-agents, landing-page, creative-coding
- awesome-claude-code / awesome-claude-skills lists (PR)
- AlternativeTo, SaaSHub, Uneed, Fazier, aitools.fyi, There's An AI For That
- Anime.js/Three.js community showcases: threejs.org/community (forum post),
  r/threejs, r/webdev Showoff Saturday, r/ClaudeAI
- MotionSites submit-design form (they accept template submissions)

## Timing & metrics

- Tue–Thu launch, 00:01 PT for PH. HN mid-morning ET.
- Success = stars/week, showcase visits, prompt copies (add a click counter later),
  first community PR.

## Later (post-traction)

- Pro Worlds pack (one-time, $49–99): 10–20 brand-ready verified templates + advanced
  skill tier (GLTF + composer bloom, GSAP choreography, gesture control). Core stays MIT.
