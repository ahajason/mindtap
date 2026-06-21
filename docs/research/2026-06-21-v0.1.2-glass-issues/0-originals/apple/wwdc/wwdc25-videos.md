---
title: WWDC 2025 — Liquid Glass & Design 相关视频索引
source: 多页 Apple Developer 文档
fetched: 2026-06-14
tags: [wwdc, wwdc25, video, liquid-glass, design, projects-v1]
---

# WWDC 2025 — Liquid Glass & Design 相关视频索引

> **对 projects 的价值**：V1.0 设计系统建立过程中，**视频比文档更直观**。建议在以下时间点观看：
> - **P2 架构**（本周）：看 #219 / #220 / #356 建立整体认知
> - **P3 脚手架**（开发启动）：看 #284 / #323 准备工具栏和自定义视图代码
> - **P8 打磨**：按需看 #310 跨平台设计原则

## 视频清单（7 个）

| # | 视频 | 主题分类 | 推荐优先级 | 关联文档 |
|---|---|---|---|---|
| **219** | [Liquid Glass 总览](https://developer.apple.com/videos/play/wwdc2025/219) | 设计语言 | 🔴 必看 | [liquid-glass 总览](../liquid-glass/01-overview.md) |
| **220** | [Icon Composer](https://developer.apple.com/videos/play/wwdc2025/220) | App 图标 | 🟢 P2 | [HIG app-icons](../liquid-glass/04-app-icons.md) |
| **284** | [控件与导航](https://developer.apple.com/videos/play/wwdc2025/284) | 控件 / 导航 | 🔴 必看 | [adopting 第 3、4 章节](../liquid-glass/02-adopting.md#3-controls) |
| **310** | [跨平台设计原则](https://developer.apple.com/videos/play/wwdc2025/310) | 设计原则 | 🟡 建议 | [HIG materials](../liquid-glass/03-hig-materials.md) |
| **323** | [应用 Liquid Glass 到自定义视图](https://developer.apple.com/videos/play/wwdc2025/323) | 自定义视图 | 🟡 建议 | [adopting 第 1 章节](../liquid-glass/02-adopting.md) |
| **356** | [Liquid Glass 深入](https://developer.apple.com/videos/play/wwdc2025/356) | 设计语言 | 🟡 建议 | [liquid-glass 总览](../liquid-glass/01-overview.md) |
| **361** | [App icon 设计](https://developer.apple.com/videos/play/wwdc2025/361) | App 图标 | 🟢 P2 | [HIG app-icons](../liquid-glass/04-app-icons.md) |

## 推荐观看顺序

### 阶段 1：建立认知（P2 架构，~2 小时）
1. **#219** Liquid Glass 总览（40 min）— 整体设计语言
2. **#310** 跨平台设计原则（30 min）— 平台差异
3. **#284** 控件与导航（40 min）— 主要交互元素

### 阶段 2：代码准备（P3 脚手架，~1.5 小时）
1. **#323** 应用 Liquid Glass 到自定义视图（35 min）— 自定义代码模式
2. **#356** Liquid Glass 深入（40 min）— 高级用法

### 阶段 3：图标设计（V1.0 上线前，~1 小时）
1. **#220** Icon Composer（30 min）— 工具使用
2. **#361** App icon 设计（30 min）— 设计原则

## 关键视频笔记

### #219 — Liquid Glass 总览
- 介绍 4 层动态玻璃结构
- 3 级 Z 轴分层（内容 / 操作 / 导航弹窗）
- 4 种图标样式（浅 / 深 / 着色 / 透明）
- 跨平台统一性

### #220 — Icon Composer
- 工具位置：Xcode 内置 + Apple Developer 下载
- 拖入图层 → 调整属性 → 预览系统效果 → 导出
- 支持 default / dark / mono 三种外观变体注释

### #284 — 控件与导航
- 标准组件**自动**获得 Liquid Glass
- 4 种新的 button styles（glass / glassProminent / glass / 参数化）
- Tab bar 自动适应为 sidebar（`sidebarAdaptable`）
- Split views 支持 fluid resize
- 背景延伸效果（`backgroundExtensionEffect`）

### #310 — 跨平台设计原则
- watchOS Liquid Glass 变化极小（**不需要**重新构建）
- tvOS 在获得焦点时采用 Liquid Glass
- 性能铁律：自定义 Liquid Glass **必须**用 `GlassEffectContainer`

### #323 — 应用到自定义视图
- `View.glassEffect(_:in:)` modifier 用法
- `View.glassEffectID(_:in:)` + `GlassEffectContainer` 实现形变动画
- "sparely use" 原则

### #356 — Liquid Glass 深入
- 高级 API 细节
- 性能优化
- 跨设备适配

### #361 — App icon 设计
- 分层设计原则
- 6 种外观变体（default / dark / clear light / clear dark / tinted light / tinted dark）
- 跨平台规格

---

## 抓取视频脚本（如需）

> 📌 WWDC 视频本身是流媒体（.mp4），但 Apple 通常会提供 **subtitles (.vtt) / transcript (.txt) / slides (.pdf)** 等附件，路径模式：
> - `https://devstreaming-cdn.apple.com/videos/wwdc/2025/219/.../proxies_video/{id}_subtitles.vtt`
>
> 如果需要抓 transcript，可通过 `curl` 直接下载这些静态资源。

---

## 视频列表来源

- [liquid-glass 总览](../liquid-glass/01-overview.md) 列出 #219/356/323/284/310
- [HIG app-icons](../liquid-glass/04-app-icons.md) 列出 #220/361
