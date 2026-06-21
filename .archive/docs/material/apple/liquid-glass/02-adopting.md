---
title: Adopting Liquid Glass — 实施指南
source: https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass
fetched: 2026-06-14
tags: [liquid-glass, adopting, projects-v1, design-system]
---

# Adopting Liquid Glass — 实施指南

> **对 projects 的价值**：这份是 V1.0 脚手架的"操作手册"，9 大章节对应了所有需要审计的代码点。

## 概述

> If you have an existing app, adopting Liquid Glass doesn't mean reinventing your app from the ground up. Start by building your app in the latest version of Xcode to see the changes.

**核心结论**：
- 不需要重写应用
- 用最新 Xcode 重新构建
- 按本指南各章节审计现有代码

---

## 1. Visual refresh（视觉刷新）

**采用原则**：
- ✅ 使用系统框架的标准组件（bars、sheets、popovers、controls）→ **自动**获得 Liquid Glass
- ❌ 减少在控件/导航元素上**自定义背景**（会覆盖/干扰 Liquid Glass 和 scroll edge effect）

**需要审计的组件**：

| 框架 | 需审计 |
|---|---|
| **SwiftUI** | `NavigationStack` / `NavigationSplitView` / `WindowStyle.titleBar` / `View.toolbar(content:)` |
| **UIKit** | `UINavigationBar` / `UITabBar` / `UIToolbar` / `UISplitViewController` |
| **AppKit** | `NSToolbar` / `NSSplitView` |

**Liquid Glass 自定义 API**：

| 框架 | API |
|---|---|
| SwiftUI | `View.glassEffect(_:in:)` |
| UIKit | `UIGlassEffect` |
| AppKit | `NSGlassEffectView` |

**辅助设置**：
- 在设备的"辅助功能"中可降低透明度 / 减少动效
- ⚠️ 不要在多个自定义控件上**过度**使用 Liquid Glass（会分散对内容的注意力）

---

## 2. App icons（应用图标）

> 📌 完整版本见 [04-app-icons.md](./04-app-icons.md)

**3 大变化**：
- 图标网格更新 → 跨设备视觉一致、与硬件同心
- 图标现在**分层** → 系统自动应用高光、折射等效果
- 4 种外观变体：light / dark / clear / tinted

**6 大设计原则**：
1. 跨平台视觉一致、光学平衡
2. 简化设计（实心、半透明、重叠形状）
3. 让系统处理 masking、blur 等效果
4. 使用 Icon Composer 工具（Xcode 内置 + Apple Design Resources 下载）
5. 使用更新的网格预览
6. 设计时分层：前景 / 中景 / 背景

**Icon Composer 关键功能**：
- 拖入设计 app 导出的图层
- 添加背景、创建分组
- 调整不透明度等属性
- 预览系统效果与多种外观

---

## 3. Controls（控件）

**新外观**：
- Sliders / Toggles 的 knob 在交互时**变形**为 Liquid Glass
- Buttons **流畅变形**为 menus 和 popovers
- 控件形状与硬件圆角**协调一致**
- 提供 **extra-large 尺寸**选项（更多标签/重音空间）

**需审计的控件**：

| 框架 | 控件 |
|---|---|
| **SwiftUI** | `Button` / `Toggle` / `Slider` / `Stepper` / `Picker` / `TextField` |
| **UIKit** | `UIButton` / `UISwitch` / `UISlider` / `UIStepper` / `UISegmentedControl` / `UITextField` |
| **AppKit** | `NSButton` / `NSSwitch` / `NSSlider` / `NSStepper` / `NSSegmentedControl` / `NSTextField` |

**新按钮样式**（替代自定义 Liquid Glass 按钮）：

| 框架 | API |
|---|---|
| **SwiftUI** | `PrimitiveButtonStyle.glass` / `glassProminent` / `glass(_:)` |
| **UIKit** | `UIButton.Configuration.glass()` / `prominentGlass()` / `clearGlass()` / `prominentClearGlass()` |
| **AppKit** | `NSButton.BezelStyle.glass` |

**色彩、可读性、滚动边缘**：
- 谨慎使用控件/导航的颜色 → 保证可读性
- 控件不要**过于拥挤或重叠**
- 滚动内容时启用 [scroll edge effect](https://developer.apple.com/documentation/SwiftUI/View/scrollEdgeEffectStyle(_:for:))

**对齐圆角**（与容器同心）：

| 框架 | API |
|---|---|
| SwiftUI | `Shape.rect(corners:isUniform:)` / `ConcentricRectangle` |
| UIKit | `UIView.cornerConfiguration-7l0ja` / `UICornerConfiguration` |

---

## 4. Navigation（导航）

> Liquid Glass 应用在界面的**最上层**，定义你的导航。

**关键设计**：
- 标签栏 (tab bars) 和侧栏 (sidebars) **漂浮**在 Liquid Glass 层
- 明确分离内容层与导航层

**新 API**：

| 框架 | API | 用途 |
|---|---|---|
| **SwiftUI** | `TabViewStyle.sidebarAdaptable` | tab bar 自动适应为 sidebar |
| **UIKit** | `UITabBarController.Mode.tabSidebar` | 同上 |
| **SwiftUI** | `NavigationSplitView` | 标准 sidebar + content 布局 |
| **SwiftUI** | `View.inspector(isPresented:content:)` | inspector 面板 |
| **UIKit** | `UISplitViewController` / `UISplitViewController.Column.inspector` | 同上 |
| **AppKit** | `NSSplitViewController` / `NSSplitViewItem.init(inspectorWithViewController:)` | 同上 |

**背景延伸效果（background extension effect）**：
- 让背景在 sidebar/inspector 下"延伸"
- 实际是镜像相邻内容 + 模糊

| 框架 | API |
|---|---|
| **SwiftUI** | `View.backgroundExtensionEffect()` |
| **UIKit** | `UIBackgroundExtensionView` |
| **AppKit** | `NSBackgroundExtensionView` |

**iOS tab bar 自动收起**：

```swift
TabView {
    // ...
}
.tabBarMinimizeBehavior(.onScrollDown)
```

UIKit 等价：`tabBarMinimizeBehavior = .onScrollDown`

---

## 5. Menus and toolbars（菜单和工具栏）

**新外观**：
- Menus 采用 Liquid Glass
- 常用操作使用 icons（系统按 selector 自动选择 icon）
- **iPadOS 新增 menu bar**（顶部菜单栏，更快访问常用命令）

**工具栏分组**（用 fixed spacer 分离）：

| 框架 | API |
|---|---|
| **SwiftUI** | `SpacerSizing.fixed` / `ToolbarSpacer` |
| **UIKit** | `UIBarButtonItem.fixedSpace(_:)` |
| **AppKit** | `NSToolbarItem.Identifier.space` |

**隐藏工具栏项**（隐藏整个 item，不要隐藏 view）：

| 框架 | API |
|---|---|
| **SwiftUI** | `ToolbarContent.hidden(_:)` |
| **UIKit** | `UIBarButtonItem.isHidden` |
| **AppKit** | `NSToolbarItem.isHidden` |

---

## 6. Windows and modals（窗口和模态）

**窗口**：
- 圆角与控件对齐
- iPadOS 支持窗口控件 + 连续调整大小（不再是预设尺寸间过渡）
- 使用 split views → 连续 resize 流畅过渡

**Modal views**（sheets、action sheets）：
- 采用 Liquid Glass
- Sheets 圆角增大、half sheet 边缘 inset
- 展开到全高时更不透明

**Action sheet 新行为**：
- 从触发它的控件**附近**出现（不是从屏幕底部）
- 激活时**允许**与界面其他部分交互

```swift
// SwiftUI
.confirmationDialog(
    /* ... */
    presenting: ...
)
```

```swift
// UIKit
popoverPresentationController.sourceView = ...
popoverPresentationController.sourceItem = ...
```

---

## 7. Organization and layout（组织与布局）

**变化**：
- 列表、表格、表单的**行高和 padding 增大**（让内容在 Liquid Glass 下"呼吸"）
- Sections 圆角增大，与系统其他控件对齐

**需审计**：
- Section headers **不再全大写** → 改用 title-style 大小写
- 使用 SwiftUI Forms + [grouped form style](https://developer.apple.com/documentation/SwiftUI/FormStyle/grouped)

```swift
// SwiftUI Section with title-case header
Section {
    // content
} header: {
    Text("My Title-Case Header")
}
```

---

## 8. Search（搜索）

**平台默认行为**：
- iPad：toolbar 右上角
- iPhone：toolbar 底部

**API**：
- 搜索 tab 时用 `Tab(role: .search)` 让系统自动放在尾部
- iOS 键盘弹起时搜索栏上滑 → 需测试

```swift
// SwiftUI
Tab(role: .search) {
    // ...
}
```

```swift
// UIKit
UISearchTab { _ in
    // ...
}
```

---

## 9. Platform considerations（平台考量）

| 平台 | 注意事项 |
|---|---|
| **watchOS** | Liquid Glass 变化极小，**不需要**重新构建即可获得外观；但应采用 watchOS 10 标准 toolbar API 和 button styles |
| **tvOS** | 标准按钮/控件在**获得焦点**时采用 Liquid Glass；Apple TV 4K (2nd gen)+ 支持，旧设备保持原外观。需采用标准 focus API |
| **性能** | 自定义 Liquid Glass 效果时，**必须**用 `GlassEffectContainer` 组合，否则性能差 |

**关键性能 API**：
- `GlassEffectContainer` — 组合多个 glass 元素，自动优化渲染

**降级方案**（保持旧 SDK 的外观）：
```xml
<!-- Info.plist -->
<key>UIDesignRequiresCompatibility</key>
<true/>
```

---

## 速查：所有 adopting 中提到的新 API

### SwiftUI
- `View.glassEffect(_:in:)`
- `View.backgroundExtensionEffect()`
- `View.scrollEdgeEffectStyle(_:for:)`
- `View.safeAreaBar(edge:alignment:spacing:content:)`
- `Shape.rect(corners:isUniform:)`
- `ConcentricRectangle`
- `PrimitiveButtonStyle.glass` / `glassProminent` / `glass(_:)`
- `TabViewStyle.sidebarAdaptable`
- `NavigationSplitView`
- `View.inspector(isPresented:content:)`
- `SpacerSizing.fixed`
- `ToolbarSpacer`
- `ToolbarContent.hidden(_:)`
- `Section.init(content:header:)`
- `FormStyle.grouped`
- `View.confirmationDialog(_:isPresented:titleVisibility:presenting:actions:)`
- `View.focusable(_:)`
- `EnvironmentValues.isFocused`
- `GlassEffectContainer`
- `View.glassEffectID(_:in:)`

### UIKit
- `UIGlassEffect`
- `UIButton.Configuration.glass()` / `prominentGlass()` / `clearGlass()` / `prominentClearGlass()`
- `UIScrollEdgeElementContainerInteraction`
- `UIBackgroundExtensionView`
- `UINavigationBar` / `UITabBar` / `UIToolbar` / `UISplitViewController`
- `UIPopoverPresentationController.sourceView` / `sourceItem`
- `UIView.cornerConfiguration`
- `UICornerConfiguration`
- `UIFocusItem` / `UIControl.State.focused`

### AppKit
- `NSGlassEffectView`
- `NSButton.BezelStyle.glass`
- `NSBackgroundExtensionView`
- `NSToolbar` / `NSSplitView` / `NSSplitViewController`
- `NSSplitViewItem.init(inspectorWithViewController:)`
- `NSAlert.beginSheetModal(for:completionHandler:)`
- `NSToolbarItem.Identifier.space`
- `NSToolbarItem.isHidden`

---

## 原文链接

- https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass
