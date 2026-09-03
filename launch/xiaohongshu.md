# 小红书 — paste-ready

## 「一句 prompt」系列（9/1 起，隔天一更，垂直 9:16 · 22s · Remotion `Xhs-*` 合成）

首发两条反响不错 → 转成栏目连载。每期一个 demo：3s 成品钩子 → 打 prompt →
自检卡 → 成品大字幕 → 「关注看下一期」留钩。视频在 `video/out/xhs-ep*.mp4`，
片尾预告下一期，所以要按顺序发。**每期正文都直接带链接**（motion-pages.pages.dev +
GitHub 仓库，明文），发完 10 分钟内再补一条置顶评论重复链接（正文链接不可点，评论区好复制）。

### 第 1 期 · VOLERA（`out/xhs-ep1-volera.mp4`）✓ 已发布，已过审（9/2 晚：458 浏览 / 17 赞 / 14 收藏 / 2 转发）
- **标题（≤20 字）：** 6000个粒子，一句prompt捏出来的
- **正文：** 光标一碰，鸟群四散；点一下，重组成月门。
  这不是 AE，是浏览器里 6000 个实时粒子——而且整页只有一个 HTML 文件。
  我把「怎么让 AI 写出这种页面」的配方做成了开源 skill，把视频里那句 prompt
  贴进 Claude Code 就能给自己的品牌捏一个。它还会自己截图三个尺寸检查，
  不满意自己改。
  在线 demo：motion-pages.pages.dev
  GitHub：github.com/jiangyurong609/motion-pages（MIT 开源）
  关注看下一期：液态玻璃文字 🫧
- **话题：** #vibecoding #AI编程 #threejs #前端 #独立开发
- **封面：** 用「智能推荐封面」选鹤群展翅帧（金色粒子横贯画面那帧）

### 第 2 期 · PURA（`out/xhs-ep2-pura.mp4`）✓ 已发布 9/2（审核中，purity 液态字封面）
- **标题：** 这行字是液态玻璃做的，还能搅动
- **正文（实发版）：** 光标伸进去搅一下，标题的字真的会流动——shader 实时折射，
  不是视频特效。整页只有一个 HTML 文件，零构建。配方做成了开源 skill，把视频里
  那句 prompt 贴进 Claude Code，就能给自己的标题也来一行液态玻璃字。发布前它还会
  自己截图三个尺寸检查，不满意自己改。
  在线 demo：motion-pages.pages.dev
  GitHub：github.com/jiangyurong609/motion-pages（MIT 开源）
  这是「一句 prompt」系列第 2 期，关注看下一期：往下滚，穿过一整片雾 🌫
- **话题：** 同上
- **封面：** purity 液态字变形帧

### 第 3 期 · BOREAL（`out/xhs-ep3-boreal.mp4`）
- **标题：** 往下滚，穿过一整片雾
- **正文：** 滚轮就是镜头轨道：雾中穹顶 → 粒子居民。雾色 == 背景色，几何体
  融进大气——这是获奖站最常用的一招，配方在开源 skill 里。
  在线 demo：motion-pages.pages.dev
  GitHub：github.com/jiangyurong609/motion-pages
- **话题：** 同上
- **封面：** 粒子居民特写帧

### 后续期数（素材待录）：dome-gallery（360° 穹顶画廊）→ paperworks（弹簧
海报墙）→ tempo（动效语法课，最适合涨粉的知识型内容）→ fernline / sona /
sylva。跑完 9 期后做一期合集（「9 个获奖级动效，每个一句 prompt」）。

---


发布时机：PH 上线同一天或前一天晚上（引流）。

## 预热 post（8/30–31，改版故事，图：launch/assets/redesign-before-after.png）

**✓ 已发布 8/30，已过审上线**（账号 Yodaa）— 标题「被吐槽AI味太重，我把官网重做了一遍」，
3 图（前后对比 / 新首页 / 9 demo），话题 #独立开发。

**✓ 视频版也已发布 8/30（审核中）** — 标题「一句prompt生成获奖级网站动效」，
launch-16x9-zh.mp4（38s），封面选了 BOREAL 雾中穹顶帧（默认首帧全黑，别用）。

**待办（手机 App 上 10 秒）：给两条笔记各补一条置顶评论：**
> 链接来了：
> 在线 demo：motion-pages.pages.dev
> GitHub：github.com/jiangyurong609/motion-pages（MIT 开源）

**标题：** 被吐槽"AI 味太重"后，我把官网重做了一遍

**正文：** 用户说我的项目官网"像 Claude 文档页，看不出任何优势"。认了。
于是我用无头浏览器把 GSAP / Anime.js / Motion / Lenis 的官网全截图研究了一遍，
然后用这个项目自己的 skill 把官网重做了：hero 直接放了一个 6000 粒子的实时
3D 场景（就是产品本身），又跑了 82k star 的 taste-skill 当"设计审判官"，
修掉了 7 个自己都没意识到的 AI 味细节。前后对比见图 ↓
项目开源 MIT，评论区放链接。

---

## 标题（20 字内）

一句 prompt 生成获奖级动效网站，配方开源了

## 正文

Vibe coding 玩家看过来 👀

刷到过 AETHER / Igloo / OpenPurpose 那种获奖级动效网站吧？我把它们的动效配方
拆解成了一个开源 Claude Code skill：

🌫 雾气 3D 世界（雾色 == 背景色，几何体融进大气）
💧 液态玻璃 shader 文字
🫧 玻璃产品展台（假 fresnel 玻璃，无头浏览器也能渲染）
🖼 360° 穹顶画廊
🌊 滚动叙事长页
📌 弹簧物理海报墙

重点是它会自己验收：agent 对桌面/平板/手机三个尺寸截图，不满意就自己改，
直到像样为止。网站上 9 个 demo 全是它自己写出来的真实页面。

每个 demo 都有一键复制的 prompt，贴进 Claude Code（Cursor 也行，把 SKILL.md
当上下文喂进去）就能给自己的品牌做一个。

免费 MIT 开源，单 HTML 文件，不用配环境。

## 图片（9 图）

1. demo.gif 转视频或封面图（PURA 液态文字截图 + 大字标题）
2–8. 七个 demo 截图（assets/*-still.png）
9. 教程步骤截图（复制 prompt → 贴进 Claude Code → 得到页面，3 步拼图）

## 挂链接

- showcase: https://motion-pages.pages.dev
- GitHub: https://github.com/jiangyurong609/motion-pages
- 评论区置顶链接（正文链接会被限流，主链接放评论）

## 标签

#vibecoding #ClaudeCode #AI编程 #前端 #网页设计 #开源项目 #threejs #独立开发

## 格式参考（来自 2026-08 爆款 skill 视频的拆解）

跑量的 skill 视频都是同一套结构，发视频版时照抄：

- 封面/标题:「用这 N 个 skill 做出 XX」句式 + 大号橙色粗体两行标题
- 结构: 编号清单（1. 2. 3.…），每个 skill 给一句"以前 vs 现在"对比
- 画面: 屏录实操 + 大字幕常驻底部（默认静音观看），黑板式转场卡分隔
- 钩子: 前 3 秒直接放最炫的成品效果，不放脸、不放logo
- CTA: 结尾"具体怎么装我下期讲，关注不迷路"式留钩
