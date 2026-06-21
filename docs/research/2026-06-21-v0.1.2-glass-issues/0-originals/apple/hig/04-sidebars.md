---
title: HIG — Sidebars
source: https://developer.apple.com/design/human-interface-guidelines/sidebars
fetched: 2026-06-14
tags: [hig, sidebars, navigation, projects-v1]
---

# HIG — Sidebars（侧栏）

> **对 projects 的价值**：macOS 桌面端布局（D20：B-glass）的核心——"菜单栏 + 浮动侧栏"。同时 iPadOS 也能用。

## 核心定义

> A sidebar appears on the leading side of a view and lets people navigate between areas of your app or top-level collections of content, like folders and playlists.

**适用场景**：
- 需要**大量垂直/水平空间**时
- 想要**多层级导航**
- 想要比 tab bar **更多**导航选项

## 与 Tab bar 的关系

> For many apps, you don't need to choose between a tab bar or sidebar for navigation; instead, you can adopt a style of tab bar that provides both.

→ **不必二选一**。iPadOS / macOS 的 `sidebarAdaptable` 让你**自动**获得两者。

## 6 大最佳实践

1. **Extend visually rich content beneath the sidebar**（用 `backgroundExtensionEffect`）
2. **When possible, let people customize the contents of a sidebar**
3. **Group hierarchy with disclosure controls**（用 Disclosure controls）
4. **Consider using familiar symbols**（SF Symbols）
5. **Consider letting people hide the sidebar**（macOS / iPadOS）
6. **Show no more than two levels of hierarchy**（深则用 split view）

## 背景延伸（Liquid Glass 集成）

> In iOS, iPadOS, and macOS, ... sidebars can float above content in the Liquid Glass layer. To reinforce the separation, you can extend content beneath the sidebar either by letting it horizontally scroll or by applying a background extension effect.

**实现**：
```swift
Image(landmark.backgroundImageName)
    .backgroundExtensionEffect()  // 详见 ../swiftui/landmarks/02-background-extension.md
```

## 自定义侧栏内容

> A sidebar lets people navigate to important areas in your app, so it works well when people can decide which areas are most important.

→ 允许用户**拖拽**侧栏项**重新排序**、**显示/隐藏**。

## Sidebar 图标颜色

> By default, sidebar icons use your app's App accent colors. ... make sure your sidebar icons display the color people choose.

- 默认跟随**系统 accent color**
- 例外：Mail VIP 用黄色表示重要性（用 sparingly）

## 平台差异

| 平台 | 侧栏位置 | 行为 |
|---|---|---|
| **iOS, iPadOS** | leading 侧 | 可与 tab bar 互转（`.sidebarAdaptable`）|
| **macOS** | leading 侧 | 行高可设 small/medium/large；用户可在 General 设置里改 |
| **visionOS** | 窗口内 leading 侧 | 窗口扩大以容纳侧栏；通常不隐藏 |
| **tvOS / watchOS** | 不支持 | — |

## SwiftUI API

| API | 用途 | 文档 |
|---|---|---|
| `TabViewStyle.sidebarAdaptable` | tab bar → sidebar 自动转换 | [doc](https://developer.apple.com/documentation/SwiftUI/TabViewStyle/sidebarAdaptable) |
| `NavigationSplitView` | sidebar + content + detail 三栏 | [doc](https://developer.apple.com/documentation/SwiftUI/NavigationSplitView) |
| `ListStyle.sidebar` | 列表用 sidebar 样式 | [doc](https://developer.apple.com/documentation/SwiftUI/ListStyle/sidebar) |
| `UICollectionLayoutListConfiguration.Appearance.sidebar` | UIKit sidebar 样式 | [doc](https://developer.apple.com/documentation/UIKit/UICollectionLayoutListConfiguration-swift.struct/Appearance-swift.enum/sidebar) |
| `NSSplitViewController` | AppKit split view | [doc](https://developer.apple.com/documentation/AppKit/NSSplitViewController) |

## projects V1.0 实施

### macOS 桌面端（D20 B-glass 决策）

```swift
// macOS 浮动侧栏
struct MacRootView: View {
    @State private var selectedCategory: RecordCategory? = nil
    
    var body: some View {
        NavigationSplitView {
            // 侧栏
            List(SidebarCategory.allCases, selection: $selectedCategory) { category in
                Label(category.title, systemImage: category.icon)
                    .tag(category)
            }
            .navigationSplitViewColumnWidth(min: 180, ideal: 220)
        } detail: {
            // 主内容
            CategoryDetailView(category: selectedCategory)
        }
    }
}
```

### iPadOS（V1.0+ 可选）

让 tab bar 自动转 sidebar：

```swift
TabView {
    // ...
}
.tabViewStyle(.sidebarAdaptable)
```

## 相关资源

- [03-tab-bars.md](./03-tab-bars.md)
- [05-split-views.md](./05-split-views.md)
- [../swiftui/landmarks/02-background-extension.md](../swiftui/landmarks/02-background-extension.md)

## 原文链接

- https://developer.apple.com/design/human-interface-guidelines/sidebars
