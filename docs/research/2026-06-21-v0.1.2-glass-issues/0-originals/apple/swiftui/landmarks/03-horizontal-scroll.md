---
title: Landmarks — Extending horizontal scrolling under a sidebar or inspector
source: https://developer.apple.com/documentation/SwiftUI/Landmarks-Extending-horizontal-scrolling-under-a-sidebar-or-inspector
fetched: 2026-06-14
tags: [swiftui, sample-code, landmarks, horizontal-scroll, projects-v1]
---

# Landmarks: Extending horizontal scrolling under a sidebar or inspector

> **对 projects 的价值**：❌ **不适用**。projects V1.0 无横向滚动视图。

## 概述

> Improve your horizontal scrollbar's appearance by extending it under a sidebar or inspector.

**效果**：当 scroll view **触到** sidebar 或 inspector 边缘时，**系统自动**调整 scroll view 让其能滚到 sidebar/inspector 下方，再滚出屏幕边缘。

## 实施

```swift
ScrollView(.horizontal, showsIndicators: false) {
    LazyHStack(spacing: Constants.standardPadding) {
        // ⚠️ 开头的 Spacer 让内容对齐到标题 padding
        Spacer()
            .frame(width: Constants.standardPadding)
        ForEach(landmarkList) { landmark in
            // ... 横向卡片
        }
    }
    // ⚠️ ScrollView 自身触到 leading / trailing 边缘
}
```

## 关键点

- ✅ ScrollView **触到** sidebar/inspector 边缘
- ✅ 用 Spacer 控制**内容**的内边距（不是 ScrollView 自身）
- ✅ 关闭 `showsIndicators`

## projects 不适用的原因

- V1.1 精简 PRD 中没有横向滚动视图
- 概览页是**时间倒序列表**（垂直滚动）
- 打卡 / 灵感 / 待办都是单列布局

## 跨平台

- **iOS / iPadOS / macOS**：✅
- 无 UIKit / AppKit 等价（SwiftUI-only feature）

---

## 原文链接

- https://developer.apple.com/documentation/SwiftUI/Landmarks-Extending-horizontal-scrolling-under-a-sidebar-or-inspector
