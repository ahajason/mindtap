---
title: HIG — Accessibility
source: https://developer.apple.com/design/human-interface-guidelines/accessibility
fetched: 2026-06-14
tags: [hig, accessibility, liquid-glass, projects-v1]
---

# HIG — Accessibility（无障碍）

> **对 projects 的价值**：Liquid Glass 的 2 个核心无障碍设置——**Reduce Transparency**（降低透明度）和 **Reduce Motion**（减少动效）—— projects 必须**响应**这 2 个设置。详见后文"特殊考虑"部分。

## 3 大原则

| 原则 | 含义 |
|---|---|
| **Intuitive** | 使用熟悉、一致的交互 |
| **Perceivable** | 不依赖单一通道（视觉/听觉/触觉都可）|
| **Adaptable** | 适配系统的无障碍设置 |

## 4 类辅助功能

### 👁️ 视觉（Vision）

| 主题 | 要求 |
|---|---|
| **支持 Dynamic Type** | 至少能放大到 **200%**（watchOS 140%）|
| **推荐默认字号** | iOS/iPadOS 17pt、macOS 13pt、tvOS 29pt、visionOS 17pt、watchOS 16pt |
| **颜色对比度** | WCAG AA 标准（见 [07-color.md](./07-color.md)）|
| **优先用系统色** | 自动适配 Increase Contrast |
| **不仅用颜色** | 同时用形状、文字 |
| **VoiceOver** | 描述界面和内容 |

**默认/最小字号**：

| Platform | Default | Minimum |
|---|---|---|
| iOS, iPadOS | 17 pt | 11 pt |
| macOS | 13 pt | 10 pt |
| tvOS | 29 pt | 23 pt |
| visionOS | 17 pt | 12 pt |
| watchOS | 16 pt | 12 pt |

### 👂 听觉（Hearing）

- 音频/视频**配字幕**（captions / subtitles）
- 音频 + **触觉反馈**（haptics）
- 音频 + **视觉提示**（visual cues）

### 🦾 行动能力（Mobility）

**最小控件尺寸**：

| Platform | Default | Minimum |
|---|---|---|
| iOS, iPadOS | 44x44 pt | 28x28 pt |
| macOS | 28x28 pt | 20x20 pt |
| tvOS | 66x66 pt | 56x56 pt |
| visionOS | 60x60 pt | 28x28 pt |
| watchOS | 44x44 pt | 28x28 pt |

**间距**：
- 带 bezel 元素：~12pt padding
- 无 bezel 元素：~24pt padding

**手势**：
- 优先**简单手势**
- 提供**替代交互**（不只用 swipe）
- 支持 **Voice Control**

### 🗣️ 言语（Speech）

- 键盘导航（**Full Keyboard Access**）
- **Switch Control**（开关控制）

### 🧠 认知（Cognitive）

- 简单直观的操作
- **最小化**计时元素
- 游戏难度可调
- 媒体**不自播**
- 闪烁灯光**允许关闭**
- **Be cautious with fast-moving and blinking animations**（详见面板）

## 🎯 特殊考虑：Liquid Glass 的 2 个无障碍设置

### Reduce Transparency（降低透明度）

**原理**：用户开启此设置后，**Liquid Glass 的透明效果降低**，变得更不透明以保证可读性。

**Apple 系统的行为**：
- 使用**标准 SwiftUI / UIKit / AppKit 组件** → **自动**响应此设置
- ⚠️ **自定义 Liquid Glass 效果**（如 `.glassEffect()` modifier）需要**手动**响应

**检测 API**：

```swift
// SwiftUI
@Environment(\.accessibilityReduceTransparency) var reduceTransparency

// UIKit
UIAccessibility.isReduceTransparencyEnabled

// AppKit
NSWorkspace.shared.accessibilityDisplayShouldReduceTransparency
```

**响应代码**：

```swift
// SwiftUI
.glassEffect(reduceTransparency ? .regular : .regular)  // 用更不透明变体
// 或条件性地不应用 .glassEffect()
```

### Reduce Motion（减少动效）

**原理**：用户开启此设置后，**Liquid Glass 的形变动画减弱**——`GlassEffectContainer` 内的形变可能**退化为简单淡入淡出**。

**Apple 系统的行为**：
- 系统应用**更少**的动画和形变
- **Core Animation 自动降低**关键帧数

**检测 API**：

```swift
// SwiftUI
@Environment(\.accessibilityReduceMotion) var reduceMotion

// UIKit
UIAccessibility.isReduceMotionEnabled
```

**响应代码**：

```swift
// SwiftUI
withAnimation(reduceMotion ? .none : .spring) {
    isExpanded.toggle()
}
```

## 颜色对比度（补充 07-color.md）

| 文本大小 | 字重 | 最小对比度 |
|---|---|---|
| ≤ 17 pt | 任意 | 4.5:1 |
| 18 pt | 任意 | 3:1 |
| 任意 | **Bold** | 3:1 |

**Increase Contrast**：开启后颜色差异**显著加大**。

## 工具

- **Accessibility Inspector**（Xcode 内置）：检查无障碍问题
- **Accessibility Nutrition Labels**：在 App Store 标注无障碍特性

## projects V1.0 必检项

| 检查项 | 方法 | 优先级 |
|---|---|---|
| 浮动 [+] 按钮 ≥ 44x44 pt | 测量 | 🔴 P0 |
| 概览页文字支持 Dynamic Type | `.font(.body)` 而非 `.font(.system(size: 14))` | 🔴 P0 |
| 快速记录弹窗响应 Reduce Transparency | `@Environment(\.accessibilityReduceTransparency)` | 🔴 P0 |
| 形变动画响应 Reduce Motion | `withAnimation(reduceMotion ? .none : ...)` | 🔴 P0 |
| 所有按钮有 accessibilityLabel | `.accessibilityLabel("快速记录")` | 🔴 P0 |
| 颜色对比度 ≥ WCAG AA | 用 Accessibility Inspector | 🔴 P0 |
| 屏幕阅读器能朗读"3 个项目已记录" | VoiceOver 测试 | 🟡 P1 |

## 实施代码模板

```swift
struct FloatingAddButton: View {
    @Environment(\.accessibilityReduceTransparency) var reduceTransparency
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    @State private var isExpanded = false
    
    var body: some View {
        // 根据 Reduce Transparency 选择变体
        Group {
            if reduceTransparency {
                // 不透明替代
                Circle().fill(.ultraThinMaterial)
            } else {
                // 正常 Liquid Glass
                Circle().glassEffect()
            }
        }
        .accessibilityLabel("快速记录")
        .accessibilityAddTraits(.isButton)
        .onTapGesture {
            // 根据 Reduce Motion 选择动画
            if reduceMotion {
                isExpanded.toggle()
            } else {
                withAnimation(.spring) {
                    isExpanded.toggle()
                }
            }
        }
    }
}
```

## 原文链接

- https://developer.apple.com/design/human-interface-guidelines/accessibility
- 相关：[07-color.md](./07-color.md) — 颜色对比度
- 视频：[wwdc 10120](https://developer.apple.com/videos/play/wwdc2021/10120) — 键盘导航
