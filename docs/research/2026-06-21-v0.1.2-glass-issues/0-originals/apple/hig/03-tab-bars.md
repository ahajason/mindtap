---
title: HIG — Tab bars
source: https://developer.apple.com/design/human-interface-guidelines/tab-bars
fetched: 2026-06-14
tags: [hig, tab-bars, navigation, projects-v1]
---

# HIG — Tab bars（标签栏）

> **对 projects 的价值**：V1.1 PRD 明确"底部导航仅「记录」「概览」两栏"——这就是 tab bar。**这是 projects V1.0 的核心导航结构**。

## 核心定义

> A tab bar lets people navigate between top-level sections of your app.

**与 toolbar 的关键区别**：
- ✅ **Tab bar** → 在 app **不同区域**之间导航
- ❌ **Toolbar** → 对**当前视图内容**执行操作

→ **不要**把 tab bar 当 toolbar 用（反之亦然）。

## 6 大最佳实践

1. **Use a tab bar to support navigation, not to provide actions.**
2. **Make sure the tab bar is visible** when people navigate（**例外**：modal view 覆盖时可隐藏）
3. **Use the appropriate number of tabs**（一般不超过 5；多则用 sidebar）
4. **Avoid overflow tabs**（避免 iOS/iPadOS 的 "More" tab——不易发现）
5. **Don't disable or hide tab bar buttons, even when their content is unavailable**（界面会显得不稳定）
6. **Include tab labels** to help with navigation（**单词**最好）

## Liquid Glass 集成

> A tab bar floats above content at the bottom of the screen. Its items rest on a [Liquid Glass](https://developer.apple.com/design/human-interface-guidelines/materials#Liquid-Glass) background that allows content beneath to peek through.

**iOS tab bar 新行为**：
- ✅ **漂浮**在内容之上（Liquid Glass 背景）
- ✅ 内容可**从下方透出**
- ✅ 可附加 accessory（如 Music 的 MiniPlayer）
- ✅ 滚动时可**最小化**（accessory inline）
- ✅ 搜索 tab 可**自动放在尾部**（`Tab(role: .search)`）

## iPadOS：tab bar ↔ sidebar 自动转换

```swift
TabView {
    // ...
}
.tabViewStyle(.sidebarAdaptable)
```

- iPadOS 默认**顶部**显示 tab bar
- 提供"转换为 sidebar"按钮
- 用户切换后偏好会**记住**

## tab bar 规范

| 平台 | 位置 | 行为 |
|---|---|---|
| **iOS** | 屏幕**底部**，漂浮 | 可最小化、可附加 accessory、可放搜索 tab |
| **iPadOS** | 屏幕**顶部** | 可与 sidebar 互转（`.sidebarAdaptable`）|
| **tvOS** | 屏幕顶部 | 高度固定 68pt，可深度定制 |
| **visionOS** | 垂直、leading 侧 | 看着时**自动展开**显示 labels |
| **macOS / watchOS** | 不支持 | — |

## Liquid Glass 相关 API

| API | 用途 | 文档 |
|---|---|---|
| `TabViewStyle.sidebarAdaptable` | tab ↔ sidebar 自动转换 | [doc](https://developer.apple.com/documentation/SwiftUI/TabViewStyle/sidebarAdaptable) |
| `TabViewStyle.tabBarOnly` | 仅 tab bar（不转 sidebar） | [doc](https://developer.apple.com/documentation/SwiftUI/TabViewStyle/tabBarOnly) |
| `Tab(role: .search)` | 搜索 tab（自动放尾部）| — |
| `TabView.tabBarMinimizeBehavior(.onScrollDown)` | 滚动时收起 | [doc](https://developer.apple.com/documentation/SwiftUI/TabBarMinimizeBehavior) |
| `TabViewBottomAccessoryPlacement` | accessory 位置 | [doc](https://developer.apple.com/documentation/SwiftUI/TabViewBottomAccessoryPlacement) |
| `TabViewCustomization` | 允许用户自定义 tab | [doc](https://developer.apple.com/documentation/SwiftUI/TabViewCustomization) |
| `UITab(role: .search)` | UIKit | — |
| `UITabBarController.MinimizeBehavior` | UIKit | [doc](https://developer.apple.com/documentation/UIKit/UITabBarController/MinimizeBehavior) |

## projects V1.0 实施

### V1.1 PRD 约束
> 底部导航仅「记录」「概览」两栏

### 实施

```swift
struct RootView: View {
    var body: some View {
        TabView {
            RecordView()
                .tabItem {
                    Label("记录", systemImage: "square.and.pencil")
                }
            
            OverviewView()
                .tabItem {
                    Label("概览", systemImage: "calendar")
                }
        }
    }
}
```

### 未来扩展（V1.1+）

如果加搜索功能（PRD V1.1 没加），用 `Tab(role: .search)`：

```swift
TabView {
    RecordView().tabItem { Label("记录", systemImage: "square.and.pencil") }
    OverviewView().tabItem { Label("概览", systemImage: "calendar") }
    
    Tab(role: .search) {
        SearchView()
    }
}
```

### iPadOS 自适应

```swift
TabView {
    // ...
}
.tabViewStyle(.sidebarAdaptable)
```

## 相关资源

- [04-sidebars.md](./04-sidebars.md) — sidebar 详细设计
- [05-split-views.md](./05-split-views.md) — split view 详细设计
- [06-toolbars.md](./06-toolbars.md) — toolbar（与 tab bar 对比）

## 原文链接

- https://developer.apple.com/design/human-interface-guidelines/tab-bars
