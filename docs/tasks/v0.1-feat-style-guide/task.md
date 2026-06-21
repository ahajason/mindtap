# feat(style-guide): 侧栏路由 + 三段式演示页

> 创建: 2026-06-21

## Why
V0.1.0 唯一交付物是 style guide,这是把"设计语言可看"落地的最后一步。
没有演示页,11 个 ui 组件和 3 份设计文档都只是文本,无法验证 Liquid Glass
视觉效果是否符合 spec。

## What
路由表 + layout + 演示页。

## Done when
- [ ] App.tsx 用 react-router 7 个路由
- [ ] StyleGuideLayout 含 Sidebar + Outlet
- [ ] 7 个 routes 文件齐
- [ ] 演示页三段式(PageHeader + Tabs 切预览/代码/属性)工作
- [ ] npm run tauri dev 启动看到 sidebar + 7 个路由可点