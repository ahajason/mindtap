# docs(research): V0.1.2 视觉问题归档 — 3 层分离 28 原始/11 设计/25 问题

> 创建: 2026-06-21

## Why
V0.1.1 玻璃重构后用户反馈大量视觉问题(透明穿透 / focus 混乱 / 内容层玻璃违规 / 圆角字号不一致 等),
直接动手修复会陷入"凭印象改"陷阱。需要先把问题归类、按 P0/P1/P2 排优先级,
每条问题追溯到 Apple HIG / WCAG / Microsoft Acrylic / MDN 等权威原始资料,
再做统一修复。

## What
3 层目录分离:
- `0-originals/`(28 篇):Apple HIG / Liquid Glass / WWDC25 / MDN / WCAG / Microsoft Acrylic / Tauri v2 权威原文
- `1-design/`(11 篇):纯设计规范,不带具体问题
- `2-issues/`(25 篇):按 P0/P1/P2 + 子类归档的具体问题,每篇带修复路径

外加 `docs/superpowers/plans/2026-06-21-v0.1.2-visual-issues-fix.md` 实施计划(6 Phase / 15 Task / 66 Step)。

## Done when
- [x] 0-originals/apple/hig/(01-09)+ liquid-glass/(01-04)+ swiftui/01-02 + landmarks/01-05 + wwdc25-videos.md
- [x] 0-originals/mdn/backdrop-filter + focus-visible
- [x] 0-originals/microsoft/acrylic + fluent2-material
- [x] 0-originals/tauri/v2-window-customization
- [x] 0-originals/wcag/1.4.3 + 1.4.11
- [x] 1-design/00-design-principles + 01-glass-layer-rules + 02-sidebar-spec + 03-toolbar-spec + 04-tab-bar-spec + 05-button-spec
- [x] 1-design/06-color-and-contrast + 07-accessibility + 08-performance + 09-transparency-tier + 10-focus-state-spec
- [x] 2-issues/P0-foundation/(01-05)+ P1-active-inactive/00 + P1-content-layer-glass/(01-03)
- [x] 2-issues/P1-geometry/(01-02)+ P1-layout/01 + P1-spacing/(01-03)+ P1-traffic-light/01 + P1-typography/(01-02)
- [x] 2-issues/P2-accessibility/(01-02)+ P2-performance/01 + P2-text-readability/01 + P2-visual-polish/(01-03)
- [x] docs/superpowers/plans/2026-06-21-v0.1.2-visual-issues-fix.md
- [x] docs/reports/2026-06-21-v0.1.2-visual-issues-fix.md