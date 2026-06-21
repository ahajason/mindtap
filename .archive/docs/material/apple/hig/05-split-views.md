---
title: HIG — Split views
source: https://developer.apple.com/design/human-interface-guidelines/split-views
fetched: 2026-06-14
tags: [hig, split-views, navigation, projects-v1]
---

# HIG — Split views（分栏视图）

> **对 projects 的价值**：macOS 桌面端"菜单栏 + 浮动侧栏"布局（侧栏 + 内容 + inspector）的容器。`NavigationSplitView` 是 SwiftUI 实现。

## 核心定义

> A split view manages the presentation of multiple adjacent panes of content, each of which can contain a variety of components, including tables, collections, images, and custom views.

**典型 3 栏结构**：

| 栏 | 内容 |
|---|---|
| **Sidebar（leading）** | 顶级项目/合集（如文件夹、播放列表）|
| **Content（middle）** | 子合集 / 项目列表 |
| **Detail / Inspector（trailing）** | 项目详情 / 上下文属性 |

## 最佳实践

1. **Persistently highlight the current selection in each pane** that leads to the detail view
2. **Consider letting people drag and drop content between panes**
3. **Set reasonable defaults for minimum and maximum pane sizes**（macOS）
4. **Prefer the thin divider style**（macOS，1pt 宽）
5. **Consider letting people hide a pane when it makes sense**

## 平台差异

| 平台 | 行为 |
|---|---|
| **iOS** | 仅在 **regular**（非 compact）环境使用；iPhone portrait 太窄 |
| **iPadOS** | 支持 2 栏（Mail）或 3 栏（Keynote）；窗口尺寸**流式调整** |
| **macOS** | 支持**垂直 / 水平 / 混合**；有 divider 可拖动 |
| **tvOS** | 默认 1/3 + 2/3；用于内容筛选 |
| **visionOS** | 用于**补充信息展示**（不要为这事开新窗口）|
| **watchOS** | list view 和 detail view **二选一**全屏；多 detail 用 vertical tab view |

## SwiftUI / UIKit / AppKit API

| 框架 | API | 文档 |
|---|---|---|
| **SwiftUI** | `NavigationSplitView` | [doc](https://developer.apple.com/documentation/SwiftUI/NavigationSplitView) |
| **SwiftUI** | `HSplitView` / `VSplitView` | [doc](https://developer.apple.com/documentation/SwiftUI/HSplitView) |
| **SwiftUI** | `View.inspector(isPresented:content:)` | [doc](https://developer.apple.com/documentation/SwiftUI/View/inspector(isPresented:content:)) |
| **UIKit** | `UISplitViewController` | [doc](https://developer.apple.com/documentation/UIKit/UISplitViewController) |
| **UIKit** | `UISplitViewController.Column.inspector` | [doc](https://developer.apple.com/documentation/UIKit/UISplitViewController/Column/inspector) |
| **AppKit** | `NSSplitViewController` | [doc](https://developer.apple.com/documentation/AppKit/NSSplitViewController) |
| **AppKit** | `NSSplitViewItem.init(inspectorWithViewController:)` | [doc](https://developer.apple.com/documentation/AppKit/NSSplitViewItem/init(inspectorWithViewController:)) |
| **AppKit** | `NSSplitView.DividerStyle` | [doc](https://developer.apple.com/documentation/AppKit/NSSplitView/DividerStyle-swift.enum) |

## SwiftUI 3 栏示例

```swift
struct ContentView: View {
    @State private var selectedItem: Item? = nil
    @State private var inspectorVisible = false
    
    var body: some View {
        NavigationSplitView {
            // 侧栏
            List(items) { item in
                Text(item.name)
            }
        } content: {
            // 内容
            ItemListView()
        } detail: {
            // 详情
            ItemDetailView(item: selectedItem)
        }
        .inspector(isPresented: $inspectorVisible) {
            ItemInspectorView()
        }
    }
}
```

## projects V1.0 适用

### macOS 桌面端（🔴 P0 D20）

```swift
struct MacRootView: View {
    @State private var selectedCategory: RecordCategory? = nil
    @State private var inspectorVisible = false
    
    var body: some View {
        NavigationSplitView {
            // 侧栏：6 大类记录
            List(SidebarCategory.allCases, selection: $selectedCategory) { category in
                Label(category.title, systemImage: category.icon)
                    .tag(category)
            }
        } detail: {
            // 主内容：选中的类别的当日记录
            if let category = selectedCategory {
                CategoryRecordListView(category: category)
            } else {
                ContentUnavailableView("选择类别", systemImage: "sidebar.left")
            }
        }
        // 可选 inspector：选中记录的详情
        .inspector(isPresented: $inspectorVisible) {
            RecordInspectorView()
        }
    }
}
```

### iPadOS（V1.0+ 可选）

iPadOS 自动用 `NavigationSplitView` 替代 iPhone 的 `TabView`（用 size class 自动判断）。

## 相关资源

- [03-tab-bars.md](./03-tab-bars.md) — tab bar
- [04-sidebars.md](./04-sidebars.md) — sidebar
- [../swiftui/01-key-apis.md#6-navigation](../swiftui/01-key-apis.md) — API 速查

## 原文链接

- https://developer.apple.com/design/human-interface-guidelines/split-views
