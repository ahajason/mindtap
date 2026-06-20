---
title: Landmarks — Applying a background extension effect
source: https://developer.apple.com/documentation/SwiftUI/Landmarks-Applying-a-background-extension-effect
fetched: 2026-06-14
tags: [swiftui, sample-code, landmarks, background-extension, projects-v1]
---

# Landmarks: Applying a background extension effect

> **对 projects 的价值**：**P2**（V1.1+ 考虑）。需要 sidebar/inspector 布局时才有用。

## 概述

> The background extension effect blurs and extends the image under the sidebar or inspector panel when open.

**效果**：sidebar 打开时，背景图在 sidebar 下方"延伸"（实际是**镜像 + 模糊**），产生 edge-to-edge 沉浸感。

## 3 步实施

### Step 1: 对齐到 leading / trailing 边缘

```swift
ScrollView(showsIndicators: false) {
    LazyVStack(alignment: .leading, spacing: Constants.standardPadding) {
        LandmarkFeaturedItemView(landmark: modelData.featuredLandmark!)
            .flexibleHeaderContent()
        //...
    }
    // ⚠️ ScrollView 和 VStack 都没有 padding
}
```

### Step 2: 应用 modifier

```swift
Image(landmark.backgroundImageName)
    .backgroundExtensionEffect()
```

### Step 3: 只对图片应用，前景元素放在 overlay 中

```swift
Image(decorative: landmark.backgroundImageName)
    .backgroundExtensionEffect()
    .overlay(alignment: .bottom) {
        VStack {
            Text("Featured Landmark")
            Text(landmark.name)
            Button("Learn More") {
                modelData.path.append(landmark)
            }
        }
    }
```

## 行为细节

### Sidebar 打开时（leading 方向延伸）
- 系统取图片 leading 端的**一段**（与 sidebar 等宽）
- **水平翻转**该段，朝 leading 方向放置
- **加模糊** → 放在 sidebar 下方

### Inspector 打开时（trailing 方向延伸）
- 系统取图片 trailing 端的**一段**（与 inspector 等宽）
- **水平翻转**该段，朝 trailing 方向放置
- **加模糊** → 放在 inspector 下方

## 关键 API

| API | 文档 |
|---|---|
| `View.backgroundExtensionEffect()` | [doc](https://developer.apple.com/documentation/SwiftUI/View/backgroundExtensionEffect()) |

## 跨平台

- **iOS / iPadOS / macOS**：✅
- **UIKit 等价**：`UIBackgroundExtensionView`
- **AppKit 等价**：`NSBackgroundExtensionView`

## projects 适用场景

| 场景 | 是否需要 | 说明 |
|---|---|---|
| 概览页 hero 图 | 🟢 P2 | 仅当 V1.0 桌面端有 sidebar + inspector 时 |
| 浮动 [+] 按钮的背景 | ❌ | 按钮本身已用 glass，不需要背景延伸 |
| 灵感列表 / 打卡列表 | ❌ | 简单列表，Liquid Glass 标准即可 |

---

## 原文链接

- https://developer.apple.com/documentation/SwiftUI/Landmarks-Applying-a-background-extension-effect
