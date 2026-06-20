---
title: HIG — Icons
source: https://developer.apple.com/design/human-interface-guidelines/icons
fetched: 2026-06-14
tags: [hig, icons, sf-symbols, projects-v1]
---

# HIG — Icons（界面图标）

> **对 projects 的价值**：浮动 [+] 按钮、概览 CTA、设置图标都依赖 SF Symbols。Apple 提供了**标准图标 symbol name 速查表**——直接复制粘贴到 SwiftUI 代码。

## 与 App Icons 的区别

| 类型 | 用途 | 复杂程度 |
|---|---|---|
| **App icons**（应用图标）| Home Screen、Settings、通知 | 可用阴影/纹理/高光 |
| **Interface icons**（界面图标）| 工具栏、菜单、按钮 | **简化形状 + 颜色点缀** |

> Interface icons use streamlined shapes and touches of color to communicate a straightforward idea.

## 5 大设计原则

1. **Create a recognizable, highly simplified design**（避免细节过多）
2. **Maintain visual consistency** across all interface icons（同尺寸、同描边粗细、同视角）
3. **Match the weights of interface icons and adjacent text**（文字和图标视觉重量一致）
4. **Provide alternative text labels** for VoiceOver
5. **Avoid using replicas of Apple hardware products**

## 不需要 selected state

> You don't need to provide selected and unselected appearances for an icon that's used in standard system components such as toolbars, tab bars, and buttons. The system updates the visual appearance of the selected state automatically.

→ 用标准 `Button` / `Tab` 组件时，**不要**自己画 selected 状态。

## 文本中的字符图标

如果要显示字符（"A"代表字体格式），要：
- 国际化（Latin/Arabic/Hebrew/Hindi/Japanese/Korean/Thai/Chinese 各有变体）
- RTL（从右到左）要提供翻转版本
- 用 SF Symbols 而不是手绘

## 矢量 vs 位图

- **优先 PDF / SVG**（自动缩放）
- **PNG** 仅在需要阴影 / 纹理时使用

## 标准图标速查（按类别）

> 这是 **Standard icons** 表的核心部分。完整的速查覆盖：Editing / Selection / Text formatting / Search / Sharing / Users / Ratings / Layer ordering / Other。
> 完整版见原文：https://developer.apple.com/design/human-interface-guidelines/icons#Standard-icons

### ✏️ Editing（编辑类）

| Action | Symbol name |
|---|---|
| Cut | `scissors` |
| Copy | `document.on.document` |
| Paste | `document.on.clipboard` |
| Done / Save | `checkmark` |
| Cancel / Close | `xmark` |
| Delete | `trash` |
| Undo | `arrow.uturn.backward` |
| Redo | `arrow.uturn.forward` |
| Compose | `square.and.pencil` |
| Duplicate | `plus.square.on.square` |
| Rename | `pencil` |
| Folder | `folder` |
| Attach | `paperclip` |
| Add | `plus` |
| More | `ellipsis` |

### 🔍 Search（搜索类）

| Action | Symbol name |
|---|---|
| Search | `magnifyingglass` |
| Find / Find and Replace / Find Next | `text.page.badge.magnifyingglass` |
| Filter | `line.3.horizontal.decrease` |

### 📤 Sharing & Exporting（分享/导出）

| Action | Symbol name |
|---|---|
| Share / Export | `square.and.arrow.up` |
| Print | `printer` |

### 👤 Users & Accounts（用户/账户）

| Action | Symbol name |
|---|---|
| Account / User / Profile | `person.crop.circle` |

### 👍 Ratings（评分）

| Action | Symbol name |
|---|---|
| Dislike | `hand.thumbsdown` |
| Like | `hand.thumbsup` |

### 📚 Layer Ordering（图层顺序）

| Action | Symbol name |
|---|---|
| Bring to Front | `square.3.layers.3d.top.filled` |
| Send to Back | `square.3.layers.3d.bottom.filled` |
| Bring Forward | `square.2.layers.3d.top.filled` |
| Send Backward | `square.2.layers.3d.bottom.filled` |

### 🔔 Other

| Action | Symbol name |
|---|---|
| Alarm | `alarm` |
| Archive | `archive` |

## SwiftUI 用法

```swift
// 基本
Image(systemName: "magnifyingglass")

// 加 tint
Image(systemName: "plus")
    .foregroundStyle(.tint)

// 用在 Button
Button {
    // ...
} label: {
    Image(systemName: "plus")
}
```

## projects 适用

| 用途 | Symbol name | 优先级 |
|---|---|---|
| 浮动 [+] 按钮 | `plus` | 🔴 P0 |
| 关闭 / 取消 | `xmark` | 🔴 P0 |
| 搜索 | `magnifyingglass` | 🔴 P0 |
| More 菜单 | `ellipsis` | 🟡 P1 |
| 完成 | `checkmark` | 🟡 P1 |
| 删除 | `trash` | 🟡 P1 |
| 编辑 | `square.and.pencil` | 🟢 P2 |
| 设置 | `gear` (新增，未列在原表) | 🟡 P1 |
| 提醒 / Alarm | `bell` | 🟡 P1 |
| 通知 | `bell.badge` | 🟢 P2 |
| 灵感（灯泡）| `lightbulb` | 🟡 P1 |
| 待办 | `checkmark.circle` | 🟡 P1 |
| 打卡（人脸）| `face.smiling` | 🟡 P1 |
| 饮水 | `drop` | 🟡 P1 |
| 复盘 | `calendar` | 🟢 P2 |

## 原文链接

- https://developer.apple.com/design/human-interface-guidelines/icons
- [SF Symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols)
