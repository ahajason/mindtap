---
title: Landmarks — Displaying custom activity badges
source: https://developer.apple.com/documentation/SwiftUI/Landmarks-Displaying-custom-activity-badges
fetched: 2026-06-14
tags: [swiftui, sample-code, landmarks, glass-effect-container, animation, projects-v1]
---

# Landmarks: Displaying custom activity badges

> **对 projects 的价值**：🟡 **P1**。浮动 [+] 按钮 + 快速操作弹窗的形变动画直接套用此模式。这是 projects "3 秒记录" 体验的关键。

## 概述

> The sample displays the badges in a vertical view that includes a toggle button for showing or hiding the badges. ... By configuring the badges to use Liquid Glass, the badges gain the advantage of using the morphing animation when you show or hide the badges.

**核心**：使用 `GlassEffectContainer` 组合多个 glass 元素 + 给每个元素 `.glassEffectID()` + `withAnimation` → 系统自动提供**液体形变动画**。

## 4 步实施

### Step 1: 用 ViewModifier 让徽章在其他视图中可用

```swift
private struct ShowsBadgesViewModifier: ViewModifier {
    func body(content: Content) -> some View {
        ZStack {
            content
            HStack {
                Spacer()
                VStack {
                    Spacer()
                    BadgesView()
                        .padding()
                }
            }
        }
    }
}

extension View {
    func showsBadges() -> some View {
        modifier(ShowsBadgesViewModifier())
    }
}
```

### Step 2: 切换按钮用 `.buttonStyle(.glass)`

```swift
Button {
    withAnimation {
        isExpanded.toggle()
    }
} label: {
    ToggleBadgesLabel(isExpanded: isExpanded)
}
.buttonStyle(.glass)
```

### Step 3: 每个徽章用 `.glassEffect(_:in:)`

```swift
BadgeLabel(badge: $0)
    .glassEffect(.regular, in: .rect(cornerRadius: Constants.badgeCornerRadius))
```

### Step 4: 在 `GlassEffectContainer` 中组合并给每个元素 ID

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
            withAnimation {
                isExpanded.toggle()
            }
        } label: {
            ToggleBadgesLabel(isExpanded: isExpanded)
                .frame(width: Constants.badgeShowHideButtonWidth,
                       height: Constants.badgeShowHideButtonHeight)
        }
        .buttonStyle(.glass)
        #if os(macOS)
        .tint(.clear)
        #endif
        .glassEffectID("togglebutton", in: namespace)
    }
    .frame(width: Constants.badgeFrameWidth)
}
```

## 形变动画 3 要素（必记）

| 要素 | 作用 |
|---|---|
| `GlassEffectContainer` | **性能**：组合多个 glass 元素，自动优化渲染 |
| `View.glassEffectID(_:in:)` | **身份**：让系统知道哪些元素是"同一个"，跨动画保持关联 |
| `withAnimation { ... }` | **触发**：包裹状态变更，告诉系统开始形变动画 |

**形变原理**：
- 状态变化时，按钮和徽章**合并为一个视图**
- 然后**像液体一样**改变形状、分离、移动到新位置
- 反向动画：分离的徽章形变 + 合并回按钮

## 关键 API

| API | 用途 | 文档 |
|---|---|---|
| `GlassEffectContainer` | 组合多个 glass 元素 | [doc](https://developer.apple.com/documentation/SwiftUI/GlassEffectContainer) |
| `View.glassEffect(_:in:)` | 给视图应用 Liquid Glass | [doc](https://developer.apple.com/documentation/SwiftUI/View/glassEffect(_:in:)) |
| `View.glassEffectID(_:in:)` | 给 glass 元素 ID（用于 morph 动画） | [doc](https://developer.apple.com/documentation/SwiftUI/View/glassEffectID(_:in:)) |
| `.buttonStyle(.glass)` | 玻璃按钮 | [doc](https://developer.apple.com/documentation/SwiftUI/PrimitiveButtonStyle/glass) |
| `.rect(cornerRadius:)` | 圆角矩形 shape | — |
| `@Namespace` | SwiftUI 命名空间（动画 ID 匹配） | — |

## projects 适用场景

### 场景 A：浮动 [+] 按钮 + 快速操作弹窗

**核心交互**：点 [+] → 弹出 5 个快速操作（情绪/作息/饮水/灵感/待办）→ 像液体一样从 [+] 分离出去

**伪代码**：
```swift
@State private var isQuickActionExpanded = false
@Namespace private var liquidNamespace

GlassEffectContainer {
    VStack {
        if isQuickActionExpanded {
            QuickActionButton(title: "情绪", icon: "face.smiling")
                .glassEffect(.regular, in: Circle())
                .glassEffectID("mood", in: liquidNamespace)
            
            QuickActionButton(title: "作息", icon: "bed.double")
                .glassEffect(.regular, in: Circle())
                .glassEffectID("sleep", in: liquidNamespace)
            
            // ... 更多
            
        }
        
        Button {
            withAnimation { isQuickActionExpanded.toggle() }
        } label: {
            Image(systemName: "plus")
        }
        .buttonStyle(.glassProminent)
        .glassEffectID("mainButton", in: liquidNamespace)
    }
}
```

### 场景 B：完成 todo 时的形变

完成 todo 时，让 checkbox 形变到列表下一行——细节动效。

## ⚠️ 限制

- 需要 iOS 26.0+ / macOS 26.0+ / Xcode 26.0+
- 在 Web 端无法实现（projects 其他端用 CSS `backdrop-filter` 近似，但形变动画**无对等实现**）

---

## 原文链接

- https://developer.apple.com/documentation/SwiftUI/Landmarks-Displaying-custom-activity-badges
