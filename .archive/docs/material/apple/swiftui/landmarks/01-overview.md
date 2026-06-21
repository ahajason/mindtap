---
title: Landmarks — Building an app with Liquid Glass（总览）
source: https://developer.apple.com/documentation/SwiftUI/Landmarks-Building-an-app-with-Liquid-Glass
fetched: 2026-06-14
tags: [swiftui, sample-code, landmarks, liquid-glass, projects-v1]
---

# Landmarks: Building an app with Liquid Glass（总览）

> **对 projects 的价值**：Apple 官方 Liquid Glass 教学 app。5 个核心技术点中，**3 个**（背景延伸、工具栏分组、自定义徽章）直接对应 projects V1.0 的浮动按钮和概览页设计。

## 概述

> Landmarks is a SwiftUI app that demonstrates how to use the new dynamic and expressive design feature, Liquid Glass.

- **平台**：iPad / iPhone / Mac（Apple Silicon）
- **最低要求**：iOS 26.0+ / macOS 26.0+ / Xcode 26.0+
- **架构**：`NavigationSplitView` 组织导航

## 5 大 Liquid Glass 技术点

| # | 技术点 | 对应子教程 | projects 适用 |
|---|---|---|---|
| 1 | **背景延伸效果**（background extension effect） | [02-background-extension.md](./02-background-extension.md) | P8 打磨 — 概览页 hero 图 |
| 2 | **横向滚动延伸**至 sidebar/inspector 下 | [03-horizontal-scroll.md](./03-horizontal-scroll.md) | 不需要（projects 无横向 scroll） |
| 3 | **工具栏玻璃化 + 分组** | [04-toolbar-glass.md](./04-toolbar-glass.md) | 🔴 **P0** — macOS 桌面端工具栏 |
| 4 | **自定义徽章 + GlassEffectContainer 形变动画** | [05-custom-badges.md](./05-custom-badges.md) | 🟡 P1 — 浮动按钮 + 快速操作 |
| 5 | **Icon Composer 制作新图标** | （在 [app-icons.md](../../liquid-glass/04-app-icons.md) 中） | 🟢 P2 — V1.0 上线前 |

## 核心代码模式（提取）

### 模式 1：NavigationSplitView 主框架

```swift
struct LandmarksView: View {
    @Environment(ModelData.self) var modelData
    @State private var selectedLandmark: Landmark?
    
    var body: some View {
        NavigationSplitView {
            List(...) { ... }
        } content: {
            // 详情 / 列表内容
        } detail: {
            // inspector / detail
        }
    }
}
```

### 模式 2：背景延伸（应用在背景图上，不在前景元素上）

```swift
Image(landmark.backgroundImageName)
    .backgroundExtensionEffect()
    .overlay(alignment: .bottom) {
        // 前景内容（标题 + 按钮）放在 .backgroundExtensionEffect() 之后
        VStack {
            Text(landmark.name)
            Button("Learn More") { ... }
        }
    }
```

### 模式 3：工具栏分组（用 ToolbarSpacer 分离功能组）

```swift
.toolbar {
    ToolbarSpacer(.flexible)
    ToolbarItem { ShareLink(...) }
    ToolbarSpacer(.fixed)  // 固定间距，视觉上分组
    ToolbarItemGroup {
        FavoriteButton()
        CollectionsMenu()
    }
    ToolbarSpacer(.fixed)
    ToolbarItem { Button("Info", systemImage: "info") { ... } }
}
```

### 模式 4：自定义徽章 + 形变动画

```swift
@State private var isExpanded = false
@Namespace private var namespace

GlassEffectContainer(spacing: Constants.badgeGlassSpacing) {
    VStack {
        if isExpanded {
            ForEach(modelData.earnedBadges) { badge in
                BadgeLabel(badge: badge)
                    .glassEffect(.regular, in: .rect(cornerRadius: 16))
                    .glassEffectID(badge.id, in: namespace)
            }
        }
        Button {
            withAnimation { isExpanded.toggle() }
        } label: {
            ToggleBadgesLabel(isExpanded: isExpanded)
        }
        .buttonStyle(.glass)
        .glassEffectID("togglebutton", in: namespace)
    }
}
```

**动画三要素**：
1. `GlassEffectContainer` 包裹
2. `.glassEffectID` 给每个 glass 元素
3. `withAnimation` 包裹状态变更

---

## 与 projects V1.0 的对照

| Landmarks 元素 | projects V1.0 对应 |
|---|---|
| `NavigationSplitView` (sidebar + detail) | macOS 桌面端布局（D20：菜单栏 + 浮动侧栏） |
| `backgroundExtensionEffect` (hero 图) | 概览页首屏大图（可选） |
| 工具栏分组 | macOS 顶部工具栏 — 搜索 + 提醒 + 设置 |
| 浮动徽章 + 形变动画 | **浮动 [+] 按钮 + 快速操作弹窗** ✅ |
| Icon Composer | V1.0 上线前做 |

---

## 原文链接

- https://developer.apple.com/documentation/SwiftUI/Landmarks-Building-an-app-with-Liquid-Glass
- 4 个子教程：见上表
