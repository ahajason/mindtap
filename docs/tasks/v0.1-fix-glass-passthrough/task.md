# fix(layers): body base color + 6 子页面去除 glass-l3

> 创建: 2026-06-21

## Why
V0.1.1 透明窗口交付后,WebView 完全透明,后面 macOS 窗口(终端、GitLab login 等)
的文字直接穿透到 Sidebar/Main 容器后面(用户 Image #4-#8 实测)。
同时 V0.1.1 玻璃容器重构给 6 个 StyleGuide 子页面全用 `glass-l3` 包裹,
违反 Apple HIG Liquid Glass 4 铁律 §1:"不要在内容层使用 Liquid Glass"。

不修:透明穿透导致视觉混乱 / 内容层文字对比度不达标(WCAG 4.5:1)/ 一屏 ≥ 6 个 glass 违反节制原则。

## What
body 加 92% alpha base color 锚点 + 6 子页面改 `contentContainer`(L3 实色 95%)。

## Done when
- [x] body background: transparent → rgba(245,249,255,0.92) (解决穿透)
- [x] src/lib/styles.ts: `contentContainer` 常量(L3 内容层容器)
- [x] 6 子页面 root `<section>` 改 `contentContainer`
- [x] grep `glass-l3` src/routes/ → 0 处
- [x] 玻璃 vibrance 仍保留,base color 提供锚点