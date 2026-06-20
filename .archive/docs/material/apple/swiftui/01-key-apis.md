---
title: Liquid Glass 关键 SwiftUI / UIKit / AppKit API 速查
source: 多页 Apple Developer 文档（adopting-liquid-glass, Landmarks × 4, HIG materials, HIG app-icons）
fetched: 2026-06-14
tags: [swiftui, uikit, appkit, liquid-glass, projects-v1, api-reference]
---

# Liquid Glass 关键 API 速查

> **对 projects 的价值**：V1.0 脚手架需要这些 API 来实施 Liquid Glass 设计系统。已按 6 大类别分组，方便查找。
>
> **最低 SDK 要求**：iOS 26.0+ / macOS 26.0+ / Xcode 26.0+（Landmarks 4 个示例均标记此 availability）

---

## 1. Glass Effect（玻璃效果）

### SwiftUI

| API | 说明 | 文档 |
|---|---|---|
| `View.glassEffect(_:in:)` | 给**自定义视图**应用 Liquid Glass | [doc](https://developer.apple.com/documentation/SwiftUI/View/glassEffect(_:in:)) |
| `View.glassEffectID(_:in:)` | 给 glass 元素一个 ID（用于 morph 动画） | [doc](https://developer.apple.com/documentation/SwiftUI/View/glassEffectID(_:in:)) |
| `Glass.regular` | 标准变体（模糊 + 调暗） | [doc](https://developer.apple.com/documentation/SwiftUI/Glass/regular) |
| `Glass.clear` | 透明变体（适合媒体背景） | [doc](https://developer.apple.com/documentation/SwiftUI/Glass/clear) |

### UIKit

| API | 说明 | 文档 |
|---|---|---|
| `UIGlassEffect` | 自定义视图的玻璃效果 | [doc](https://developer.apple.com/documentation/UIKit/UIGlassEffect) |

### AppKit

| API | 说明 | 文档 |
|---|---|---|
| `NSGlassEffectView` | 自定义视图的玻璃效果 | [doc](https://developer.apple.com/documentation/AppKit/NSGlassEffectView) |

**Landmarks 自定义徽章示例**：
```swift
BadgeLabel(badge: $0)
    .glassEffect(.regular, in: .rect(cornerRadius: Constants.badgeCornerRadius))
```

---

## 2. Glass Container（玻璃容器 — 性能关键）

### SwiftUI

| API | 说明 | 文档 |
|---|---|---|
| `GlassEffectContainer` | **必须**用此容器组合多个 glass 元素，自动优化渲染 | [doc](https://developer.apple.com/documentation/SwiftUI/GlassEffectContainer) |

**Landmarks 自定义徽章示例**：
```swift
GlassEffectContainer(spacing: Constants.badgeGlassSpacing) {
    VStack(alignment: .center, spacing: Constants.badgeButtonTopSpacing) {
        if isExpanded {
            VStack(spacing: Constants.badgeSpacing) {
                ForEach(modelData.earnedBadges) {
                    BadgeLabel(badge: $0)
                        .glassEffect(.regular, in: .rect(cornerRadius: Constants.badgeCornerRadius))
                        .glassEffectID($0.id, in: namespace)
                }
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

⚠️ **性能铁律**：自定义 Liquid Glass 效果**必须**用 `GlassEffectContainer` 组合，否则渲染性能差。

---

## 3. Background Extension（背景延伸）

### SwiftUI

| API | 说明 | 文档 |
|---|---|---|
| `View.backgroundExtensionEffect()` | 让背景在 sidebar/inspector 下**延伸**（实际是镜像 + 模糊） | [doc](https://developer.apple.com/documentation/SwiftUI/View/backgroundExtensionEffect()) |

### UIKit / AppKit
- `UIBackgroundExtensionView`
- `NSBackgroundExtensionView`

**使用规则**：
1. ✅ 视图对齐到 leading / trailing 边缘（不要 padding）
2. ✅ `backgroundExtensionEffect()` 加在**背景图**上
3. ❌ 不要在 title/button 等前景元素上加此 modifier

**Landmarks 示例**：
```swift
Image(landmark.backgroundImageName)
    .backgroundExtensionEffect()
    .overlay(alignment: .bottom) {
        VStack {
            Text("Featured Landmark")
            Text(landmark.name)
            Button("Learn More") { modelData.path.append(landmark) }
        }
    }
```

---

## 4. Button Styles（按钮样式 — 玻璃化）

### SwiftUI

| API | 说明 | 文档 |
|---|---|---|
| `.buttonStyle(.glass)` | 标准玻璃按钮 | [doc](https://developer.apple.com/documentation/SwiftUI/PrimitiveButtonStyle/glass) |
| `.buttonStyle(.glassProminent)` | 显著玻璃按钮 | [doc](https://developer.apple.com/documentation/SwiftUI/PrimitiveButtonStyle/glassProminent) |
| `.buttonStyle(.glass(_:))` | 参数化玻璃按钮 | [doc](https://developer.apple.com/documentation/SwiftUI/PrimitiveButtonStyle/glass(_:)) |

### UIKit

| API | 说明 | 文档 |
|---|---|---|
| `UIButton.Configuration.glass()` | 标准玻璃 | [doc](https://developer.apple.com/documentation/UIKit/UIButton/Configuration-swift.struct/glass()) |
| `.prominentGlass()` | 显著玻璃 | [doc](https://developer.apple.com/documentation/UIKit/UIButton/Configuration-swift.struct/prominentGlass()) |
| `.clearGlass()` | 透明玻璃 | [doc](https://developer.apple.com/documentation/UIKit/UIButton/Configuration-swift.struct/clearGlass()) |
| `.prominentClearGlass()` | 显著透明玻璃 | [doc](https://developer.apple.com/documentation/UIKit/UIButton/Configuration-swift.struct/prominentClearGlass()) |

### AppKit
- `NSButton.BezelStyle.glass`

---

## 5. Toolbar（工具栏）

### SwiftUI

| API | 说明 | 文档 |
|---|---|---|
| `ToolbarSpacer` | 工具栏内的视觉间隔 | [doc](https://developer.apple.com/documentation/SwiftUI/ToolbarSpacer) |
| `SpacerSizing.fixed` | 固定宽度间隔 | [doc](https://developer.apple.com/documentation/SwiftUI/SpacerSizing/fixed) |
| `ToolbarSpacer(.flexible)` | 弹性间隔 | — |
| `ToolbarSpacer(.fixed)` | 固定间隔 | — |
| `ToolbarContent.hidden(_:)` | 隐藏整个 toolbar item | [doc](https://developer.apple.com/documentation/SwiftUI/ToolbarContent/hidden(_:)) |
| `View.toolbar(content:)` | 提供 toolbar 内容 | [doc](https://developer.apple.com/documentation/SwiftUI/View/toolbar(content:)) |

### UIKit / AppKit
- `UIBarButtonItem.fixedSpace(_:)`
- `NSToolbarItem.Identifier.space`
- `UIBarButtonItem.isHidden`
- `NSToolbarItem.isHidden`

**Landmarks 工具栏分组示例**：
```swift
.toolbar {
    ToolbarSpacer(.flexible)
    ToolbarItem {
        ShareLink(item: landmark, preview: landmark.sharePreview)
    }
    ToolbarSpacer(.fixed)
    ToolbarItemGroup {
        LandmarkFavoriteButton(landmark: landmark)
        LandmarkCollectionsMenu(landmark: landmark)
    }
    ToolbarSpacer(.fixed)
    ToolbarItem {
        Button("Info", systemImage: "info") {
            modelData.isLandmarkInspectorPresented.toggle()
        }
    }
}
```

---

## 6. Navigation（导航）

### SwiftUI

| API | 说明 | 文档 |
|---|---|---|
| `NavigationSplitView` | 主导航容器（sidebar + content + 可选 inspector） | [doc](https://developer.apple.com/documentation/SwiftUI/NavigationSplitView) |
| `View.inspector(isPresented:content:)` | inspector 面板 | [doc](https://developer.apple.com/documentation/SwiftUI/View/inspector(isPresented:content:)) |
| `TabViewStyle.sidebarAdaptable` | tab bar 自动适应为 sidebar | [doc](https://developer.apple.com/documentation/SwiftUI/TabViewStyle/sidebarAdaptable) |
| `Tab(role: .search)` | 搜索 tab（自动放尾部） | — |
| `TabView.tabBarMinimizeBehavior(.onScrollDown)` | 滚动时收起 tab bar | — |

### UIKit / AppKit
- `UITabBarController.Mode.tabSidebar`
- `UISplitViewController` / `UISplitViewController.Column.inspector`
- `NSSplitViewController` / `NSSplitViewItem.init(inspectorWithViewController:)`
- `UINavigationBar` / `UITabBar` / `UIToolbar`
- `NSToolbar` / `NSSplitView`

---

## 7. Scroll Edge & Safe Area（滚动边缘 & 安全区）

### SwiftUI

| API | 说明 | 文档 |
|---|---|---|
| `View.scrollEdgeEffectStyle(_:for:)` | 滚动时边缘的样式（保持文字可读） | [doc](https://developer.apple.com/documentation/SwiftUI/View/scrollEdgeEffectStyle(_:for:)) |
| `View.safeAreaBar(edge:alignment:spacing:content:)` | 自定义 safe area bar | [doc](https://developer.apple.com/documentation/SwiftUI/View/safeAreaBar(edge:alignment:spacing:content:)) |

### UIKit
- `UIScrollEdgeElementContainerInteraction`

---

## 8. Shapes（圆角同心形状）

### SwiftUI

| API | 说明 | 文档 |
|---|---|---|
| `ConcentricRectangle` | 与父容器**同心**的圆角矩形 | [doc](https://developer.apple.com/documentation/SwiftUI/ConcentricRectangle) |
| `Shape.rect(corners:isUniform:)` | 自定义圆角矩形 | [doc](https://developer.apple.com/documentation/SwiftUI/Shape/rect(corners:isUniform:)) |

### UIKit
- `UIView.cornerConfiguration`
- `UICornerConfiguration`

---

## 9. Materials（材质）

### SwiftUI

| API | 说明 | 文档 |
|---|---|---|
| `Material` | 标准材质类型 | [doc](https://developer.apple.com/documentation/SwiftUI/Material) |
| `Material.ultraThin` | 超薄 | [doc](https://developer.apple.com/documentation/SwiftUI/Material/ultraThin) |
| `Material.thin` | 薄 | [doc](https://developer.apple.com/documentation/SwiftUI/Material/thin) |
| `Material.regular` | 标准（默认） | [doc](https://developer.apple.com/documentation/SwiftUI/Material/regular) |
| `Material.thick` | 厚 | [doc](https://developer.apple.com/documentation/SwiftUI/Material/thick) |

### UIKit
- `UIVisualEffectView` / `UIBlurEffect` / `UIVibrancyEffect`
- `UIVibrancyEffectStyle.label` / `secondaryLabel` / `tertiaryLabel` / `quaternaryLabel`
- `UIVibrancyEffectStyle.fill` / `secondaryFill` / `tertiaryFill` / `separator`

### AppKit
- `NSVisualEffectView` / `NSVisualEffectView.Material` / `BlendingMode`

---

## 10. Layout & Forms（布局 & 表单）

### SwiftUI

| API | 说明 | 文档 |
|---|---|---|
| `FormStyle.grouped` | 分组表单样式（自动应用新布局指标） | [doc](https://developer.apple.com/documentation/SwiftUI/FormStyle/grouped) |
| `Section.init(content:header:)` | section header（改用 title-case） | [doc](https://developer.apple.com/documentation/SwiftUI/Section/init(content:header:)) |
| `View.confirmationDialog(_:isPresented:titleVisibility:presenting:actions:)` | action sheet | [doc](https://developer.apple.com/documentation/SwiftUI/View/confirmationDialog(_:isPresented:titleVisibility:presenting:actions:)-9ibgk) |

---

## 11. Focus（焦点 — tvOS 必备）

### SwiftUI
- `View.focusable(_:)` — 让视图可获焦
- `EnvironmentValues.isFocused` — 当前焦点状态

### UIKit
- `UIFocusItem` / `UIControl.State.focused`

---

## 12. 兼容旧 SDK（过渡用）

> 添加到 Info.plist 可保留旧外观：

```xml
<key>UIDesignRequiresCompatibility</key>
<true/>
```

详见 [BundleResources/Information-Property-List/UIDesignRequiresCompatibility](https://developer.apple.com/documentation/BundleResources/Information-Property-List/UIDesignRequiresCompatibility)

---

## 在 projects V1.0 中的优先级

| 类别 | 优先级 | 原因 |
|---|---|---|
| **Button Styles (.glass)** | 🔴 P0 | 浮动 [+] 按钮和概览 CTA 都需要 |
| **Toolbar / ToolbarSpacer** | 🔴 P0 | macOS 桌面端的菜单栏替代品 |
| **NavigationSplitView** | 🔴 P0 | macOS 桌面端必备（Q2 决策 D20） |
| **Material (.regular/.thin/.thick)** | 🟡 P1 | 其他端 CSS backdrop-filter 近似 |
| **GlassEffectContainer** | 🟡 P1 | 浮动按钮 + 多个 quick action 组合时 |
| **glassEffect** (自定义) | 🟢 P2 | V1.0 标准组件够用；自定义留 V1.1+ |
| **backgroundExtensionEffect** | 🟢 P2 | 需要侧栏/检查器布局时才用 |
| **Icon Composer** | 🟢 P2 | V1.0 上线前再做 |
| **tvOS focus / search** | ⚪ 不需要 | projects 不上 tvOS |
