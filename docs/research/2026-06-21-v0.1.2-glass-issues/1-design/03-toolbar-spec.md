# 03 · Toolbar 设计规范

> **层级**: 1-design / Toolbar
> **创建**: 2026-06-21
> **作用**: Toolbar 必须遵守的规范
> **不带具体问题** — 见 `2-issues/`
> **原始资料**:
> - `0-originals/apple/hig/06-toolbars.md`(Toolbar 5 最佳实践 + 3 区域)
> - `0-originals/apple/swiftui/landmarks/04-toolbar-glass.md`(Landmarks toolbar 实现)

---

## 一、Toolbar 在分层中的归属

**Toolbar 是 L2 容器层,使用玻璃材质。** 通常放置窗口顶部,跟 Sidebar 共同形成"导航 + 动作"。

## 二、3 区域结构(权威源:Apple HIG Toolbars)

```
┌─────────────────────────────────────────────────┐
│  Leading              Title             Trailing │  ← Toolbar
│  ◀ ◀◀                Title              ⋯ ⤓ ⊕ │     高度 44pt
└─────────────────────────────────────────────────┘
```

| 区域 | 内容 | 对齐 |
|---|---|---|
| **Leading** | 导航(返回 / 上一级) | 左对齐 |
| **Title** | 当前页面标题 | 居中 |
| **Trailing** | 主要动作 + 次要动作 | 右对齐 |

## 三、5 最佳实践(权威源:Apple HIG Toolbars)

| # | 原则 | 规范 |
|---|---|---|
| 1 | **上下文相关** | Toolbar 内容随当前页面变化;不是全局固定 |
| 2 | **actions 可发现** | 主操作 = icon(高对比)+ label;次操作 = icon only |
| 3 | **避免过多 button** | 总数不超过 5-6,超出用 overflow menu(⋯) |
| 4 | **跟 navigation 区分** | Toolbar 是动作,Sidebar / Tab bar 是导航,不要混 |
| 5 | **placeholder 行为** | 滚动时 title 可缩小 / 替换,保持位置 |

## 四、几何规范

| 维度 | 值 |
|---|---|
| **高度** | 44pt(macOS 标准) |
| **左右 padding** | 16px |
| **区域间距** | 8px |
| **Button 高度** | 28-32pt |
| **Button 最小宽度** | 44x44pt(触摸目标) |

## 五、玻璃规范

| 属性 | 值 |
|---|---|
| Material depth | `--glass-depth-2`(薄玻璃) |
| Backdrop-filter | `blur(20px) saturate(180%)` |
| Background | `rgba(255, 255, 255, 0.50)`(Light) |
| Border bottom | `1px solid rgba(0, 0, 0, 0.06)`(区分内容区) |
| Inset top highlight | `inset 0 1px 0 rgba(255, 255, 255, 0.7)` |

## 六、Button 在 Toolbar 中的规则

参考 `05-button-spec.md` —— Toolbar 中的 button 默认是 icon-only。

| 类型 | 视觉 |
|---|---|
| **primary action** | icon + 文字,brand color |
| **secondary action** | icon only,文字 tooltip |
| **destructive** | icon only,red 色(`systemRed`) |

## 七、滚动行为(权威源:`0-originals/apple/swiftui/landmarks/03-horizontal-scroll.md`)

| 行为 | 规范 |
|---|---|
| 滚动时 collapse | 高度从 88pt → 44pt |
| 大标题 → 小标题 | 滚动时字号缩小 |
| 玻璃保持 vibrance | 滚动时 blur 不消失,只是 tint 微变 |

## 八、Title 字体规范

| 元素 | 规范 |
|---|---|
| **字号** | 17pt(Toolbar 标准) / 28pt+(Large title) |
| **字重** | semibold(600) |
| **颜色** | `label`(系统级,自动 Light/Dark) |
| **字体** | system font(SF Pro) |

## 九、无障碍

- Reduce Transparency → 95% alpha 实色
- VoiceOver → 每个 button 有 `aria-label`
- 键盘 → Tab 顺序:Leading → Title(skip) → Trailing
- Focus ring → 2px brand color

---

**引用源**:
- Apple HIG Toolbars — `0-originals/apple/hig/06-toolbars.md`
- SwiftUI Landmarks — `0-originals/apple/swiftui/landmarks/04-toolbar-glass.md`
- WCAG / Apple HIG Accessibility — `0-originals/wcag/` + `0-originals/apple/hig/08-accessibility.md`