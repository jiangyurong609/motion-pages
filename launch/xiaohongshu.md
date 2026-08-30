# 小红书 — paste-ready

发布时机：PH 上线同一天或前一天晚上（引流）。

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
