---
title: HIG — App Icons（应用图标）
source: https://developer.apple.com/design/human-interface-guidelines/app-icons
fetched: 2026-06-14
tags: [hig, app-icons, icon-composer, projects-v1, design-system]
---

# HIG — App Icons（应用图标）

> **对 projects 的价值**：V1.0 上线前必须给 Mindtap · 轻念 设计一个**跨 4 端、6 种外观变体**的图标。本文给出 Apple 的完整规范。

## 核心定义

> A unique, memorable icon expresses your app's or game's purpose and personality and helps people recognize it at a glance.

图标出现在：Home Screen、搜索结果、通知、系统设置、分享面板。

---

## 分层设计（Layer Design）

> Although you can provide a flattened image for your icon, layers give you the most control over how your icon design is represented.

| 平台 | 层结构 |
|---|---|
| **iOS / iPadOS / macOS / watchOS** | 背景层 + 1+ 前景层（自动获得 Liquid Glass 属性：高光、折射、半透明） |
| **tvOS** | 2~5 层（视差效果，分离感） |
| **visionOS** | 背景层 + 1~2 上层（3D 效果，alpha 通道产生浮雕感） |

### 4 个核心规则

1. **Prefer clearly defined edges** in foreground layers（避免 soft/feathered edges）
2. **Vary opacity** in foreground layers → 增加深度和活力
3. **Design a background** that both stands out and emphasizes foreground（gradient 必须响应光照）
4. **Prefer vector graphics** when bringing layers into Icon Composer（避免栅格缩放失真）

### Icon Composer 工具

> 包含在 Xcode 中，也可从 [Apple Developer website](https://developer.apple.com/icon-composer) 下载

功能：
- 拖入设计 app 导出的图层
- 定义背景层、调整前景层位置
- 应用 specular highlights / refraction 等效果
- 为 default / dark / mono 外观变体加注释
- 跨系统版本测试预览
- 导出供 Xcode 使用

---

## 图标形状（Icon Shape）

| 平台 | 形状 |
|---|---|
| **iOS / iPadOS / macOS** | 方形 → 系统蒙版为**圆角矩形** |
| **tvOS** | 矩形 → 圆角 |
| **visionOS / watchOS** | 方形 → **圆形**蒙版 |

**关键原则**：
- 提供**未蒙版**的方形/矩形图层
- **保持主要内容居中**避免裁切
- tvOS 注意 **safe zone**（系统可能裁切边缘）

---

## 设计（Design）

### 6 大设计原则

1. **Embrace simplicity** — 简单易识别
2. **Provide a visually consistent icon design** across platforms
3. **Consider basing your icon design around filled, overlapping shapes**（实心 + 重叠 + 透明 + 模糊 = 深度）
4. **Include text only when essential**（无障碍、本地化、尺寸问题）
5. **Prefer illustrations to photos** and avoid replicating UI components
6. **Don't use replicas of Apple hardware products**（版权问题）

---

## 视觉效果（Visual Effects）

> Let the system handle blurring and other visual effects.

- ❌ 不要在图层中包含 specular highlights、drop shadows、beveled edges、blurs、glows
- ✅ 让系统动态应用（系统提供的效果是**动态的**，自定义的是静态的）
- ✅ 用 Icon Composer 创建**层分组**（group-level effects）

---

## 4 种外观（Appearances）

> iOS, iPadOS, and macOS: default, dark, clear, tinted

| 外观 | 用途 |
|---|---|
| **default (light)** | 默认浅色 |
| **dark** | 深色模式 |
| **clear (light / dark)** | 高度透明 |
| **tinted (light / dark)** | 着色 |

**6 种变体**：default、dark、clear light、clear dark、tinted light、tinted dark

**3 条规则**：
1. 跨外观**保持核心视觉特征一致**（不要变元素）
2. 深色和着色图标与系统 app / widgets 协调
3. 用 light 图标作为 dark 图标基础 → 选**互补色**，避免过亮

### Alternate app icons
- iOS / iPadOS / tvOS / visionOS 允许用户在 app 设置中切换 alternate 图标
- ⚠️ Alternate 图标也需要 dark / clear / tinted 变体
- 需通过 App Review

---

## 平台规范

| 平台 | 形状 | 蒙版后形状 | 尺寸 | 样式 | 外观变体 |
|---|---|---|---|---|---|
| **iOS, iPadOS, macOS** | 方形 | 圆角矩形 | 1024x1024 px | 分层 | Default / dark / clear light / clear dark / tinted light / tinted dark |
| **tvOS** | 矩形（横） | 圆角矩形 | 800x480 px | 分层（视差） | N/A |
| **visionOS** | 方形 | 圆形 | 1024x1024 px | 分层（3D） | N/A |
| **watchOS** | 方形 | 圆形 | 1088x1088 px | 分层 | N/A |

### 色彩空间
- sRGB（彩色）
- Gray Gamma 2.2（灰度）
- Display P3（宽色域，**仅 iOS / iPadOS / macOS / tvOS / watchOS**）

---

## 平台特定要点

### tvOS
- ⚠️ **必须留 safe zone**（系统可能裁切边缘）
- 前景层裁切 > 背景层

### visionOS
- ❌ 不要在背景层添加"洞/凹陷"形状（系统阴影 + 高光会让它**突出**而非凹陷）

### watchOS
- ❌ 不要用纯黑背景（与显示屏背景融为一体）

---

## 视频资源（WWDC 2025）

- #220 — Icon Composer
- #361 — App icon 设计

---

## 原文链接 & 相关资源

- 原文：https://developer.apple.com/design/human-interface-guidelines/app-icons
- [Apple Design Resources](https://developer.apple.com/design/resources/) — 模板下载
- [Icon Composer](https://developer.apple.com/icon-composer/)
- [Xcode: Creating your app icon using Icon Composer](https://developer.apple.com/documentation/Xcode/creating-your-app-icon-using-icon-composer)
- [Xcode: Configuring your app icon](https://developer.apple.com/documentation/Xcode/configuring-your-app-icon)
