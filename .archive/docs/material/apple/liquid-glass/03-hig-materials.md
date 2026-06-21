---
title: HIG — Materials（材质）
source: https://developer.apple.com/design/human-interface-guidelines/materials
fetched: 2026-06-14
tags: [hig, materials, liquid-glass, projects-v1, design-system]
---

# HIG — Materials（材质）

> **对 projects 的价值**：HIG 的 Materials 章节定义了 **Liquid Glass 与 Standard materials 的边界**——前者是控件/导航层，后者是内容层。这是 projects V1.0 设计系统的"分层宪法"。

## 定义

> A material is a visual effect that creates a sense of depth, layering, and hierarchy between foreground and background elements.

Apple 平台提供 **两类** 材质：

| 类型 | 用途 |
|---|---|
| **Liquid Glass** | 跨平台统一的设计语言；呈现控件和导航，不遮挡底层内容 |
| **Standard materials** | 在内容层内**视觉差异化** |

---

## Liquid Glass 详解

### 核心原则

> Liquid Glass forms a distinct functional layer for controls and navigation elements — like tab bars and sidebars — that floats above the content layer, establishing a clear visual hierarchy between functional elements and content.

**4 条铁律**：

1. **不要在内容层使用 Liquid Glass**（除非是 Sliders / Toggles 这类**瞬时交互**元素）
2. **节制使用** Liquid Glass 效果——标准组件**自动获得**，自定义时仅限最重要的功能元素
3. **仅在视觉丰富的背景上**用 clear 变体
4. **regular 变体**适用于多数情况（弹窗、侧栏、提醒）

### 两种变体

| 变体 | 视觉 | 适用场景 |
|---|---|---|
| **`.regular`** | 模糊 + 调暗背景以保文字可读 | 多数系统组件、含大量文字的组件、alerts、sidebars、popovers |
| **`.clear`** | 高度透明，背景视觉细节突出 | 媒体背景（照片/视频）上方、要求沉浸感的场景 |

**clear 变体的对比度调整**：
- 背景**亮** → 加 35% 不透明度的**深色** dimming 层
- 背景**暗** → 不需要 dimming 层（AVKit 媒体控件自带）

### SwiftUI API
- `View.glassEffect(_:in:)` — 详见 [../swiftui/01-key-apis.md](../swiftui/01-key-apis.md)
- `Glass.regular` / `Glass.clear` — 变体枚举

---

## Standard materials（标准材质）

> Use standard materials and effects — such as blur, vibrancy, and blending modes — to convey a sense of structure in the content beneath Liquid Glass.

**重要警示**：
> Avoid selecting a material or effect based on the apparent color it imparts to your interface, because system settings can change its appearance and behavior. Instead, match the material or vibrancy style to your specific use case.

→ **按语义选材质，不要按颜色选**。

**可读性规则**：
- 系统定义的 **vibrant colors** 在材质上保证可读性
- 不要用 systemGray3 等低饱和色（示例图明确反对）
- **always use vibrant colors on top of materials**

**对比 vs 分离的权衡**：
- 厚材质（更不透明）→ 文字/细线元素对比更好
- 薄材质（更透明）→ 保留更多背景上下文

### SwiftUI API
- `Material` — 详见 [../swiftui/01-key-apis.md](../swiftui/01-key-apis.md)

---

## 平台考量

### iOS / iPadOS

4 种标准材质（自薄到厚）：

| 材质 | 用途 |
|---|---|
| `.ultraThin` | 需要浅色方案的全屏视图 |
| `.thin` | 浅色方案的部分覆盖视图 |
| `.regular`（默认）| 部分覆盖视图 |
| `.thick` | 需要深色方案的部分覆盖视图 |

**iOS/iPadOS 的 vibrant 层级**：

| 元素 | 可用值 |
|---|---|
| Labels | `label` (默认) / `secondaryLabel` / `tertiaryLabel` / `quaternaryLabel`（避免在 thin / ultraThin 上用） |
| Fills | `fill` (默认) / `secondaryFill` / `tertiaryFill` |
| Separator | 单个默认值 |

### macOS

- 多个标准材质 + vibrant 版本的 Specifications
- 2 个 background blending modes：**behind window** / **within window**
- 需测试：什么时候 vibrancy 增强外观 / 改善沟通

### tvOS

- Liquid Glass 出现在导航元素和系统体验中（Top Shelf / Control Center）
- 获得焦点的 image views / buttons 采用 Liquid Glass
- 标准材质仍可使用：

| 材质 | 推荐用途 |
|---|---|
| `.ultraThin` | 需要浅色方案的全屏视图 |
| `.thin` | 需要浅色方案的覆盖视图 |
| `.regular` | 覆盖视图 |
| `.thick` | 需要深色方案的覆盖视图 |

### visionOS

- 窗口使用**不可修改的**系统材质 *"glass"* ——根据物理环境/虚拟内容自适应
- **没有 Dark Mode**（glass 自动适应环境亮度）
- **优先透明而非不透明**（避免"压迫感"）
- 自定义组件的材质选择：
  - `Material.thin` → 交互元素（按钮、选中项）
  - `Material.regular` → 视觉分离（侧栏、表格分组）
  - `Material.thick` → 在 `regular` 背景上的暗色元素
- 3 个 vibrancy 层级：`label` / `secondaryLabel` / `tertiaryLabel`

### watchOS

- 全屏 modal view **必须用材质提供上下文**（不能去掉/替换默认材质背景）

---

## 相关资源

### HIG 相关章节
- [Color](/design/human-interface-guidelines/color)
- [Accessibility](/design/human-interface-guidelines/accessibility)
- [Dark Mode](/design/human-interface-guidelines/dark-mode)

### 开发者文档
- [Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass)
- [SwiftUI: View.glassEffect(_:in:)](https://developer.apple.com/documentation/SwiftUI/View/glassEffect(_:in:))
- [SwiftUI: Material](https://developer.apple.com/documentation/SwiftUI/Material)
- [UIKit: UIVisualEffectView](https://developer.apple.com/documentation/UIKit/UIVisualEffectView)

---

## 原文链接

- https://developer.apple.com/design/human-interface-guidelines/materials
