---
title: HIG — Toolbars
source: https://developer.apple.com/design/human-interface-guidelines/toolbars
fetched: 2026-06-14
tags: [hig, toolbars, navigation, projects-v1]
---

# HIG — Toolbars（工具栏）

> **对 projects 的价值**：macOS 桌面端**顶部**工具栏（搜索 + 提醒 + 设置）的设计依据。Landmarks 4 个子教程（04-toolbar-glass）已经示范了 SwiftUI 实现。

## 核心定义

> A toolbar provides convenient access to frequently used commands, controls, navigation, and search.

**3 类内容**：
1. 当前视图的**标题**
2. **导航控件**（back/forward、search）
3. **操作**（buttons、menus）

**与 tab bar 的关键区别**：
- ✅ **Toolbar** → 对**当前视图内容**执行操作
- ❌ **Tab bar** → 在 app **不同区域**之间导航

## 5 大最佳实践

1. **Choose items deliberately to avoid overcrowding**（系统自动加 overflow menu，不要手动加）
2. **Add a More menu to contain additional actions**（macOS / iPadOS）
3. **Reduce the use of toolbar backgrounds and tinted controls**（让系统处理）
4. **Avoid applying a similar color to toolbar item labels and content layer backgrounds**
5. **Prefer using standard components in a toolbar**（自动同心圆角）

## 3 个区域

| 区域 | 内容 |
|---|---|
| **Leading edge** | 返回按钮、侧栏开关、**视图标题**、**文档菜单**（**不可自定义**）|
| **Center area** | 常用控制、视图标题（macOS / iPadOS **可自定义**）|
| **Trailing edge** | inspector 按钮、search、**More menu**、**主操作**（如 Done；**始终可见**）|

## 标题规则

- **提供有用标题**（不要用 app 名）
- **≤ 15 字符**（短词或短语）
- 单窗口时**可省略**（避免与内容重复）

## 操作规则

1. **优先最常用**的操作
2. **Prefer simple, recognizable symbols**（用 SF Symbols，**不要**带 border）
3. **Use `.prominent` style** for key actions (Done, Submit) — 放在 trailing edge
4. **Always include accessibility label** for icon-only buttons

## Item 分组（Landmarks 同款）

- 同一类操作 / 影响同一界面区域 → **同一组**
- 跨平台**保持一致**的分组和位置
- **最多 3 组**（再多会显得杂乱）
- **文字标签**和**图标标签**的 actions 用 `fixed` spacer **分开**（避免被误认为一个 action）

## 平台差异

| 平台 | 行为 |
|---|---|
| **iOS** | 顶部**导航栏**；**大标题** → 滚动时变小 |
| **iPadOS** | 可与 **tab bar 共存**顶部水平空间 |
| **macOS** | 窗口**顶部 frame**内；**每个 toolbar item 都要有对应的 menu bar 命令**（用户可能隐藏 toolbar）|
| **visionOS** | 窗口**底部边缘**、z 轴稍前；**系统标准 toolbar**（带 variable blur 背景）|
| **watchOS** | 4 个角 + 顶部底部；可贴在滚动内容上方 |

## Liquid Glass 集成

> A toolbar can adopt Liquid Glass, and provide a grouping mechanism for toolbar items, letting you choose which actions to display together.

**iOS 26 新能力**：
- ✅ 工具栏采用 Liquid Glass（**自动**）
- ✅ 提供**分组机制**（`ToolbarSpacer`）
- ✅ 系统自动管理 overflow menu

详见 [../swiftui/landmarks/04-toolbar-glass.md](../swiftui/landmarks/04-toolbar-glass.md) 实施代码。

## SwiftUI API 速查

| API | 用途 | 文档 |
|---|---|---|
| `View.toolbar(content:)` | 提供 toolbar 内容 | [doc](https://developer.apple.com/documentation/SwiftUI/View/toolbar(content:)) |
| `ToolbarItem` | 单个 toolbar 项 | — |
| `ToolbarItemGroup` | 一组 toolbar 项 | — |
| `ToolbarSpacer` | 视觉间隔 | [doc](https://developer.apple.com/documentation/SwiftUI/ToolbarSpacer) |
| `SpacerSizing.fixed` / `.flexible` | 间隔尺寸 | [doc](https://developer.apple.com/documentation/SwiftUI/SpacerSizing/fixed) |
| `ToolbarContent.hidden(_:)` | 隐藏 toolbar 项 | [doc](https://developer.apple.com/documentation/SwiftUI/ToolbarContent/hidden(_:)) |
| `ScrollEdgeEffectStyle` | 滚动时 toolbar 边缘样式 | [doc](https://developer.apple.com/documentation/SwiftUI/ScrollEdgeEffectStyle) |

## projects V1.0 适用

### macOS 桌面端（🔴 P0）

```swift
struct MacOverviewView: View {
    var body: some View {
        OverviewContentView()
            .toolbar {
                ToolbarSpacer(.flexible)
                
                // 第 1 组：搜索
                ToolbarItem(placement: .primaryAction) {
                    Button { /* open search */ } label: {
                        Image(systemName: "magnifyingglass")
                    }
                }
                
                ToolbarSpacer(.fixed)
                
                // 第 2 组：提醒 + 设置
                ToolbarItemGroup {
                    Button { /* open reminders */ } label: {
                        Image(systemName: "bell")
                    }
                    Button { /* open settings */ } label: {
                        Image(systemName: "gear")
                    }
                }
            }
    }
}
```

### iOS（V1.0+ 可选）

iOS 用 `navigationBarLeading` / `navigationBarTrailing` placement：

```swift
.toolbar {
    ToolbarItem(placement: .navigationBarLeading) {
        Button { /* ... */ } label: { Image(systemName: "magnifyingglass") }
    }
    ToolbarItem(placement: .navigationBarTrailing) {
        Button { /* ... */ } label: { Image(systemName: "ellipsis.circle") }
    }
}
```

## 相关资源

- [01-buttons.md](./01-buttons.md) — toolbar 中按钮的设计规则
- [02-icons.md](./02-icons.md) — SF Symbols 选择
- [../swiftui/landmarks/04-toolbar-glass.md](../swiftui/landmarks/04-toolbar-glass.md) — 完整实施

## 原文链接

- https://developer.apple.com/design/human-interface-guidelines/toolbars
