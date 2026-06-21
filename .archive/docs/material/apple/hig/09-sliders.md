---
title: HIG — Sliders
source: https://developer.apple.com/design/human-interface-guidelines/sliders
fetched: 2026-06-14
tags: [hig, sliders, liquid-glass, projects-v1]
---

# HIG — Sliders（滑块）

> **对 projects 的价值**：V1.1 PRD 明确「**情绪/能量**：1-10 分**滑动**选择」——这就是 slider。Sliders 是 Liquid Glass 在**瞬时交互**场景下的特例。

## 核心定义

> A slider is a horizontal track with a control, called a thumb, that people can adjust between a minimum and maximum value.

**Liquid Glass 集成（来自 materials.md）**：

> An exception to this is for controls in the content layer with a transient interactive element like [Sliders](/design/human-interface-guidelines/sliders) and [Toggles]; in these cases, the element takes on a Liquid Glass appearance to emphasize its interactivity when a person activates it.

→ **Sliders 在内容层**时，**激活时**采用 Liquid Glass 外观（强调"我正被操作"）。

## 4 大最佳实践

1. **Customize a slider's appearance if it adds value**（左右 icons、颜色）
2. **Use familiar slider directions**（leading = min, trailing = max）
3. **Consider supplementing a slider with a text field and stepper**（精确输入）
4. **Use tick marks to increase clarity**（macOS）

## 平台差异

| 平台 | 行为 |
|---|---|
| **iOS, iPadOS** | **不要**用于音量（用 MPVolumeView）|
| **macOS** | linear / circular，**有 tick marks**，thumb 实时显示值 |
| **visionOS** | **优先 horizontal**（侧向手势比纵向更自然）|
| **watchOS** | discrete steps 或 continuous bar；可两侧按钮增减 |
| **tvOS** | 不支持 |

## SwiftUI / UIKit / AppKit API

| 框架 | API | 文档 |
|---|---|---|
| **SwiftUI** | `Slider` | [doc](https://developer.apple.com/documentation/SwiftUI/Slider) |
| **UIKit** | `UISlider` | [doc](https://developer.apple.com/documentation/UIKit/UISlider) |
| **AppKit** | `NSSlider` | [doc](https://developer.apple.com/documentation/AppKit/NSSlider) |

## SwiftUI 实施

### 基础用法

```swift
@State private var energy: Double = 5  // 1-10

Slider(value: $energy, in: 1...10, step: 1) {
    Text("能量")
} minimumValueLabel: {
    Image(systemName: "tortoise")
} maximumValueLabel: {
    Image(systemName: "hare")
}
```

### 配套 text field + stepper

```swift
HStack {
    Slider(value: $energy, in: 1...10, step: 1)
    Text("\(Int(energy))")
        .frame(minWidth: 30)
    Stepper("", value: $energy, in: 1...10)
        .labelsHidden()
}
```

## projects V1.0 实施

### 情绪/能量打卡（🔴 P0 PRD V1.1）

**PRD V1.1 原文**：
> **情绪/能量**：1-10 分滑动选择，默认 5 分，操作后自动保存

**实施**：

```swift
struct MoodEnergySlider: View {
    @State private var value: Double = 5
    @Environment(\.modelContext) var context
    
    var body: some View {
        VStack(spacing: 16) {
            Text("能量")
                .font(.title2)
                .foregroundStyle(.secondary)
            
            Text("\(Int(value))")
                .font(.system(size: 64, weight: .bold))
                .contentTransition(.numericText())
            
            Slider(value: $value, in: 1...10, step: 1) {
                Text("能量")
            } minimumValueLabel: {
                Image(systemName: "tortoise.fill")
                    .foregroundStyle(.secondary)
            } maximumValueLabel: {
                Image(systemName: "hare.fill")
                    .foregroundStyle(.secondary)
            }
            .onChange(of: value) { _, newValue in
                // 退出自动保存
                let record = Record(type: .moodEnergy, payload: ["value": Int(newValue)])
                context.insert(record)
            }
        }
        .padding(24)
    }
}
```

## 相关资源

- [../liquid-glass/03-hig-materials.md#sliders-与-toggles-例外](../liquid-glass/03-hig-materials.md) — Sliders 在内容层的 Liquid Glass 例外
- [../swiftui/01-key-apis.md](../swiftui/01-key-apis.md) — 完整 API 速查
- [01-buttons.md](./01-buttons.md) — 按钮设计

## 原文链接

- https://developer.apple.com/design/human-interface-guidelines/sliders
