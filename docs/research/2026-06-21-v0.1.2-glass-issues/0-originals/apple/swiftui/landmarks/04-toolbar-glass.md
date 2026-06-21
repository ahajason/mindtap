---
title: Landmarks — Refining the system provided Liquid Glass effect in toolbars
source: https://developer.apple.com/documentation/SwiftUI/Landmarks-Refining-the-system-provided-glass-effect-in-toolbars
fetched: 2026-06-14
tags: [swiftui, sample-code, landmarks, toolbar, glass, projects-v1]
---

# Landmarks: Refining the system provided Liquid Glass effect in toolbars

> **对 projects 的价值**：🔴 **P0**。macOS 桌面端工具栏的标准实现模式（搜索 + 提醒 + 设置）直接套用此模式。

## 概述

> Organize toolbars into related groupings to improve their appearance and utility.

**关键事实**：**系统自动**给 toolbar items 应用 Liquid Glass——你**不需要**写 `glassEffect()` modifier。**你只需要做一件事**：把按钮**按功能分组**。

## Landmarks 的工具栏内容

在 `LandmarkDetailView` 中，工具栏包含 4 类操作：
1. **share** — 分享地标
2. **favorites** — 添加/移除收藏
3. **collections** — 添加/移除到合集
4. **info** — 显示/隐藏 inspector

## 实施：用 `ToolbarSpacer` 分组

```swift
.toolbar {
    // 弹性间距：把后续 items 推到右侧
    ToolbarSpacer(.flexible)
    
    // 第 1 组：分享
    ToolbarItem {
        ShareLink(item: landmark, preview: landmark.sharePreview)
    }
    
    // 固定间距：视觉上把后续 items 隔开
    ToolbarSpacer(.fixed)
    
    // 第 2 组：收藏 + 合集（一起影响"用户对地标的状态"）
    ToolbarItemGroup {
        LandmarkFavoriteButton(landmark: landmark)
        LandmarkCollectionsMenu(landmark: landmark)
    }
    
    // 固定间距
    ToolbarSpacer(.fixed)
    
    // 第 3 组：信息
    ToolbarItem {
        Button("Info", systemImage: "info") {
            modelData.selectedLandmark = landmark
            modelData.isLandmarkInspectorPresented.toggle()
        }
    }
}
```

## 关键 API

| API | 用途 | 文档 |
|---|---|---|
| `ToolbarSpacer` | 工具栏内的视觉间隔 | [doc](https://developer.apple.com/documentation/SwiftUI/ToolbarSpacer) |
| `SpacerSizing.fixed` | 固定宽度间隔（视觉分组） | [doc](https://developer.apple.com/documentation/SwiftUI/SpacerSizing/fixed) |
| `SpacerSizing.flexible` | 弹性间隔（推到边缘） | — |
| `ToolbarItem` | 单个 toolbar 项 | — |
| `ToolbarItemGroup` | 一组 toolbar 项（共享 background） | — |

## 视觉分组规则

> Determine which toolbar items to group together. Group items that perform similar actions or affect the same part of the interface, and maintain consistent groupings and placement across platforms.

**正例** vs **反例**：

- ❌ 反：Undo / Redo / Markup / More 全部共享一个 background
- ✅ 正：Undo + Redo 一组（编辑历史），Markup + More 一组（更多操作）

**判据**：
- 同一类操作 / 影响同一界面区域
- 跨平台保持一致

## 完整 API 列表（含跨平台）

| 框架 | API |
|---|---|
| **SwiftUI** | `SpacerSizing.fixed` / `ToolbarSpacer` / `ToolbarItem` / `ToolbarItemGroup` |
| **UIKit** | `UIBarButtonItem.fixedSpace(_:)` |
| **AppKit** | `NSToolbarItem.Identifier.space` |

## projects 适用场景

| 工具栏位置 | 按钮组 | 说明 |
|---|---|---|
| **macOS 桌面端顶部** | 搜索 + 提醒 + 设置 | 套用 `ToolbarSpacer(.fixed)` 分组 |
| **概览页工具栏** | 时间筛选 + 导出 | 待 V1.1+ |
| **移动端底部 tab bar** | 记录 + 概览 | 不需要 toolbar（用 `TabView`） |

### projects 浮动 [+] 按钮的工具栏

浮动按钮本身**不是 toolbar**，但其弹出的快速操作弹窗（灵感 / 打卡 / 待办）可能用 `GlassEffectContainer` 组合——见 [05-custom-badges.md](./05-custom-badges.md)。

---

## 原文链接

- https://developer.apple.com/documentation/SwiftUI/Landmarks-Refining-the-system-provided-glass-effect-in-toolbars
