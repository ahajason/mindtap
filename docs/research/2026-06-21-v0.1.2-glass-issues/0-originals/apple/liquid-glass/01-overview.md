---
title: Liquid Glass — 技术总览
source: https://developer.apple.com/documentation/technologyoverviews/liquid-glass
fetched: 2026-06-14
tags: [liquid-glass, overview, projects-v1, design-system]
---

# Liquid Glass — 技术总览

> **对 projects 的价值**：V1.0 的视觉设计语言基石。所有 macOS 原生（NSVisualEffectView）+ 其他端 CSS 近似的方案都基于这层定义。

## 定义（Apple 原文）

Interfaces across Apple platforms feature a new dynamic material called **Liquid Glass**, which combines the optical properties of glass with a sense of fluidity. Learn how to adopt this material and embrace the design principles of Apple platforms to create beautiful interfaces that establish hierarchy, create harmony, and maintain consistency across devices and platforms.

**关键词**：dynamic material（动态材料）、optical properties of glass（玻璃的光学特性）、fluidity（流体感）。

## 关键事实

| 维度 | 内容 |
|---|---|
| 平台 | iOS / iPadOS / macOS / tvOS / watchOS / visionOS |
| 适用范围 | SwiftUI、UIKit、AppKit 标准组件（控件 + 导航）**自动**获得外观 |
| 自定义元素 | 也可以实现，但应**节制**使用，避免分散注意力 |
| 引入方式 | **不需要**从零重写应用；从最新 Xcode 重新构建 + 遵循 HIG |
| 8 维度设计（用户已详述） | 4 层玻璃结构 / 统一大圆角 / 组件玻璃化 / 4 种图标样式 / 3 级 Z 轴 / 动效 / 色彩 / Mac 专属 |

## 5 大采用建议（来自 Apple）

1. **Embrace the visual refresh** for materials, controls, and app icons
2. **Provide a universal navigation and search experience** across platforms
3. **Ensure your interface's organization and layout** looks consistent with other apps
4. **Adopt best practices** for windows, modals, menus, and toolbars
5. **Test your app** to ensure it provides a great experience across platforms

## 示例 app：Landmarks

> 📌 详细分解见 `../swiftui/landmarks/`

Apple 提供的官方 Liquid Glass 教学 app，运行在 iPad / iPhone / Mac，使用 SwiftUI + Liquid Glass 演示：

- `NavigationSplitView` 组织导航
- 4 个 Liquid Glass 关键技术点（背景延伸、横向滚动、工具栏玻璃、徽章动画）
- Icon Composer 制作新 app icon

## 视频清单（WWDC 2025）

| 编号 | 主题 |
|---|---|
| 219 | Liquid Glass 总览 / 设计语言 |
| 356 | Liquid Glass 深入 |
| 323 | 应用 Liquid Glass 到自定义视图 |
| 284 | 控件与导航 |
| 310 | 跨平台设计原则 |

详见 `../wwdc/wwdc25-videos.md`。

## 相关链接

- [Adopting Liquid Glass（实施指南）](./02-adopting.md)
- [HIG Materials](./03-hig-materials.md)
- [Landmarks 总体介绍](../swiftui/landmarks/01-overview.md)
- 原文：https://developer.apple.com/documentation/technologyoverviews/liquid-glass
