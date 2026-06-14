---
title: HIG — Buttons
source: https://developer.apple.com/design/human-interface-guidelines/buttons
fetched: 2026-06-14
tags: [hig, buttons, liquid-glass, projects-v1]
---

# HIG — Buttons（按钮）

> **对 projects 的价值**：定义按钮的 3 大属性（Style / Content / Role）+ best practices + 跨平台（特别是 visionOS）的具体规则。是浮动 [+] 按钮、概览 CTA 的设计依据。

## 3 大属性

| 属性 | 含义 |
|---|---|
| **Style** | 视觉风格（size + color + shape） |
| **Content** | symbol（图标）、text label、or both |
| **Role** | 系统定义的语义角色（normal / primary / cancel / destructive） |

## 最佳实践（节选）

### 空间 & 触控

> A button needs a hit region of at least 44x44 pt — in visionOS, 60x60 pt — to ensure that people can select it easily, whether they use a fingertip, a pointer, their eyes, or a remote.

**最小命中区**：
- iOS / iPadOS / watchOS：**44x44 pt**
- visionOS：**60x60 pt**
- macOS / tvOS：未明示（HIG 默认即可）

### Style 选择

> In general, use a button that has a prominent visual style for the most likely action in a view.

- **每个视图最多 1~2 个 prominent 按钮**（否则认知负担过重）
- **用 style 区分**（不要用 size 区分）→ 同样大小的多个按钮 = 一组选项

### 颜色冲突

> Avoid applying a similar color to button labels and content layer backgrounds.

⚠️ 控件/导航的颜色 **不要** 与内容层背景色**太接近**——见 [07-color.md](./07-color.md)。

### 标签 vs 图标

| 用图标 | 用文字 |
|---|---|
| 通用操作（`square.and.arrow.up` = share）| 复杂操作（"Add to Cart"）|
| 节省空间 | 更明确 |

- **优先 SF Symbols**：[https://developer.apple.com/design/human-interface-guidelines/sf-symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols)
- 文字标签用 **title-style capitalization**，**动词开头**（"Add to Cart" 不是 "Cart"）
- 完整标准图标表见 [02-icons.md](./02-icons.md)

## 4 种 Role

| Role | 视觉 | 用途 |
|---|---|---|
| **Normal** | 默认 | 一般操作 |
| **Primary** | 应用 accent color 背景 | 最可能选的按钮（**默认响应 Return 键**）|
| **Cancel** | 标准 | 取消当前操作 |
| **Destructive** | 系统红色 | 危险操作（删除、清空）|

**重要规则**：
- ⚠️ **不要**给破坏性操作分配 primary role——视觉上太突出，用户可能误选
- Primary role 在 sheet / alert 中**自动响应 Return 键**

## 与 Liquid Glass 集成

HIG buttons 章节未直接讲 Liquid Glass button styles，但 adopting.md 给出了对应关系：

| 框架 | API |
|---|---|
| **SwiftUI** | `.buttonStyle(.glass)` / `.glassProminent` / `.glass(_:)` |
| **UIKit** | `UIButton.Configuration.glass()` / `prominentGlass()` / `clearGlass()` / `prominentClearGlass()` |
| **AppKit** | `NSButton.BezelStyle.glass` |

详见 [../liquid-glass/02-adopting.md#3-controls](../liquid-glass/02-adopting.md#3-controls)。

## visionOS 特有

visionOS 按钮的 4 种状态：

| 状态 | 表现 |
|---|---|
| **idle** | 标准外观 |
| **hover** | 鼠标悬停时变亮 |
| **selected** | 反色（白底黑字）|
| **unavailable** | 变暗 |

**visionOS 形状选择**：

| 内容 | 形状 |
|---|---|
| 仅图标 | 圆形 (`ButtonBorderShape.circle`) |
| 仅文字 | 圆角矩形 或 capsule |
| 图标+文字 | capsule |

**visionOS 背景**：
- 在 glass 窗口上 → `Material.thin`
- 漂浮在空中 → glass material（自动）

## projects 适用

| 按钮位置 | 角色 | 样式 | 优先级 |
|---|---|---|---|
| 浮动 [+]（快速操作弹窗）| Primary | `.glassProminent` | 🔴 P0 |
| 概览页"添加新记录" | Primary | `.glass` | 🔴 P0 |
| 打卡弹窗"取消" | Cancel | `.glass` | 🟡 P1 |
| 设置页"清空所有数据" | Destructive | `.glass` + tint(.red) | 🟢 P2 |
| 灵感输入"保存" | Primary | `.glassProminent` | 🟡 P1 |

## 原文链接

- https://developer.apple.com/design/human-interface-guidelines/buttons
- 相关：[02-icons.md](./02-icons.md) — SF Symbols 完整图标表
