---
title: HIG — Color
source: https://developer.apple.com/design/human-interface-guidelines/color
fetched: 2026-06-14
tags: [hig, color, liquid-glass, projects-v1]
---

# HIG — Color（颜色）

> **对 projects 的价值**：定义 Liquid Glass 配色规则——**只在最重要的主操作上加颜色**（典型用法：浮动 [+] 按钮的 `.glassProminent`）。

## 5 大最佳实践

1. **Avoid using the same color to mean different things**（颜色一致性）
2. **Make sure all your app's colors work well in light, dark, and increased contrast contexts**（**必读**：要支持 Liquid Glass 自适应）
3. **Test your app's color scheme under a variety of lighting conditions**
4. **Test your app on different devices**（True Tone、color profiles）
5. **Consider how artwork and translucency affect nearby colors**

## Liquid Glass 配色（本章核心）

> By default, Liquid Glass has no inherent color, and instead takes on colors from the content directly behind it. You can apply color to some Liquid Glass elements, giving them the appearance of colored or stained glass.

**3 大规则**：

### 规则 1: 默认 Liquid Glass **无颜色**

默认从**背景内容取色**（透明 + 模糊 + 反射）。**不要默认加 tint**。

### 规则 2: **节制**使用颜色

> If you apply color, reserve it for elements that truly benefit from emphasis, such as status indicators or primary actions.

- ✅ 用颜色强调**主操作**（Done 按钮、提交按钮）
- ❌ **不要**给多个控件的背景加颜色

**正例 vs 反例**：
- ❌ 反：工具栏中**所有按钮**都是蓝色 Liquid Glass 背景
- ✅ 正：工具栏中**只有 Done 按钮**是蓝色，其他默认外观

### 规则 3: 加颜色到**背景**，不**图标/文字**

> To emphasize primary actions, apply color to the background rather than to symbols or text.

```swift
// ✅ 正确：背景 tint
Button("Done") { }
    .buttonStyle(.glassProminent)  // 整个按钮的玻璃背景 tint
    .tint(.blue)

// ❌ 错误：图标 tint
Button { } label: { Image(systemName: "checkmark") }
    .buttonStyle(.glass)  // 标准玻璃
    .foregroundStyle(.blue)  // ❌ icon tint, 不是 background
```

### 规则 4: 避免颜色冲突

> If your app features colorful backgrounds or visually rich content, prefer a monochromatic appearance for toolbars and tab bars.

- 内容层有**彩色背景** → toolbar / tab bar 用**单色**
- 内容层**单色** → 可用 **brand color** 当 accent color

## 系统色 vs 自定义色

### 推荐：系统色

> The system defines colors that look good on various backgrounds and appearance modes, and can automatically adapt to vibrancy and accessibility settings.

**关键警告**：

> Avoid hard-coding system color values in your app. Documented color values are for your reference during the app design process. The actual color values may fluctuate from release to release.

```swift
// ✅ 用 API
.foregroundStyle(.tint)
.background(Color(uiColor: .label))

// ❌ 写死 hex
.foregroundStyle(Color(red: 0.5, green: 0.5, blue: 0.5))
```

### 动态系统色（iOS / iPadOS / macOS / visionOS）

按**语义**定义（按用途，不是按颜色）：

**Backgrounds**：
- `systemBackground` / `secondarySystemBackground` / `tertiarySystemBackground`
- `systemGroupedBackground` / `secondarySystemGroupedBackground` / `tertiarySystemGroupedBackground`（grouped table view 用）

**Foreground**：

| Color | 用途 |
|---|---|
| `label` | 主内容文本 |
| `secondaryLabel` | 次要内容 |
| `tertiaryLabel` | 三级内容 |
| `quaternaryLabel` | 四级内容 |
| `placeholderText` | 占位符 |
| `separator` | 透出的分隔线 |
| `opaqueSeparator` | 不透出的分隔线 |
| `link` | 链接 |

**macOS 特有**：
- `alternateSelectedControlTextColor`
- `alternatingContentBackgroundColors`
- `controlAccentColor`（用户在 System Settings 中选的 accent color）

## 无障碍颜色

### 颜色对比度（WCAG AA）

| 文本大小 | 字重 | 最小对比度 |
|---|---|---|
| ≤ 17 pt | 任意 | 4.5:1 |
| 18 pt | 任意 | 3:1 |
| 任意 | **Bold** | 3:1 |

**Increase Contrast 设置**：开启后颜色差异应**显著加大**。

### 不要只用颜色传达信息

> Avoid relying solely on color to differentiate between objects, indicate interactivity, or communicate essential information.

✅ **提供替代信息**（图标形状、文字标签、声音提示）：

- ❌ ❌ 反：绿色和红色圆点区分"安全/危险"
- ✅ 正：绿色对勾 + 红色八角形 X

### 文化差异

> For example, red communicates danger in some cultures, but has positive connotations in other cultures.

⚠️ **国际化**时考虑颜色含义。

## 色彩管理

| Color space | 用途 |
|---|---|
| **sRGB** | 多数场景（**安全**）|
| **Display P3** | wide color 显示（更鲜艳）|
| **Gray Gamma 2.2** | 灰度 |

**iOS 16+** 优先用 P3 + 16 bits/channel + PNG。

## projects V1.0 配色计划

| 元素 | 颜色策略 | 优先级 |
|---|---|---|
| 浮动 [+] 按钮 | `.glassProminent` + **app accent color** | 🔴 P0 |
| Done / Submit | `.glassProminent` + accent | 🔴 P0 |
| 取消 / 关闭 | `.glass` 单色（**不** tint）| 🔴 P0 |
| 删除 / 危险操作 | `.glass` + `tint(.red)` | 🟡 P1 |
| toolbar 工具按钮 | `.glass` 单色（**不** tint）| 🔴 P0 |
| 文字 | `Color.primary`（动态适配 light/dark）| 🔴 P0 |
| 链接 | `Color.accentColor` | 🟡 P1 |
| 错误提示 | `Color.red`（不要 .pink）| 🟡 P1 |

## 原文链接

- https://developer.apple.com/design/human-interface-guidelines/color
- 相关：[08-accessibility.md](./08-accessibility.md) — 颜色对比度
