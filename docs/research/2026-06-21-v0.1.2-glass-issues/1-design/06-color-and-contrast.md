# 06 · Color & Contrast 设计规范

> **层级**: 1-design / Color & Contrast
> **创建**: 2026-06-21
> **作用**: 颜色与对比度的硬性规则(基于 WCAG 2.2 + Apple HIG Color)
> **不带具体问题** — 见 `2-issues/`
> **原始资料**:
> - `0-originals/apple/hig/07-color.md`(4 规则)
> - `0-originals/wcag/1.4.3-contrast-minimum.md`(4.5:1 / 3:1)
> - `0-originals/wcag/1.4.11-non-text-contrast.md`(3:1 UI)

---

## 一、4 规则(权威源:Apple HIG Color)

| # | 规则 | 规范 |
|---|---|---|
| 1 | **系统色优先** | 用 `label` / `secondaryLabel` 等系统色,不要硬编码 #000 |
| 2 | **动态适配** | Light/Dark 自动切换,不要做"硬色" |
| 3 | **对比度优先** | 文字 4.5:1,UI 3:1(强制) |
| 4 | **色盲友好** | 不仅靠颜色传递信息,要加 icon / 文字 |

## 二、对比度公式(权威源:WCAG 2.2 §1.4.3)

```
Contrast ratio = (L1 + 0.05) / (L2 + 0.05)
L = 0.2126 × R + 0.7152 × G + 0.0722 × B  (sRGB linear)
```

> 计算工具:WebAIM Contrast Checker

## 三、对比度阈值(权威源:WCAG 2.2)

| 元素类型 | 阈值 | 出处 |
|---|---|---|
| 正文文字(< 18pt / < 14pt bold) | **4.5:1** | WCAG 1.4.3 |
| 大文字(≥ 18pt / ≥ 14pt bold) | **3:1** | WCAG 1.4.3 |
| UI 组件(border / icon) | **3:1** | WCAG 1.4.11 |
| Focus indicator | **3:1** | WCAG 1.4.11 |
| Logo / 装饰文字 | 无要求 | WCAG 1.4.3 incidental |

> **不要四舍五入**:4.499:1 不通过 4.5:1 阈值。

## 四、Color Token 规范

### 文字色(light mode)

| Token | 值 | 用途 | 对比度要求 |
|---|---|---|---|
| `--text-1` | `#1D2939` | H1 / H2 / strong | 4.5:1 |
| `--text-2` | `#475467` | body / nav | 4.5:1 |
| `--text-3` | `#98A2B3` | caption / label | 4.5:1(谨慎) |

### 文字色(dark mode)

| Token | 值 | 用途 |
|---|---|---|
| `--text-1` | `#F2F4F7` | H1 |
| `--text-2` | `#D0D5DD` | body |
| `--text-3` | `#98A2B3` | caption |

### Brand color

| Token | 值 | 用途 | white text 对比 |
|---|---|---|---|
| `--brand-500` | `#165DFF` | primary | **8.6:1** ✅ |
| `--brand-600` | `#1247CC` | hover/pressed | 更高 ✅ |
| `--brand-100` | `#E5EDFF` | tinted bg | n/a |

### Semantic color

| Token | 值 | 用途 |
|---|---|---|
| `--success` | `#12B76A` | success state |
| `--warning` | `#F79009` | warning |
| `--danger` | `#F04438` | destructive |

## 五、玻璃上的文字(关键!)

**玻璃材质上的文字对比度必须实测**:

| 玻璃状态 | 推荐文字色 | 实测对比度 | 通过 |
|---|---|---|---|
| glass-l1 + 白底穿透 | `--text-1` | ≥ 4.5:1 | ✅ |
| glass-l2 + 白底穿透 | `--text-1` | ≥ 4.5:1 | ✅ |
| glass-l3 + 穿透文字 | `--text-1`(粗) | 难保证 | ⚠️ |
| glass-l3 + 浅色穿透 | `--text-3` | 难保证 | ❌ |

> **铁律**:玻璃深度越深,后面穿透越多,**文字必须更深**。`text-3`(#98A2B3)在深穿透背景根本不够。

## 六、High Contrast / Accessibility

| 模式 | 行为 |
|---|---|
| **Reduce Transparency** | 所有玻璃 → 95% alpha 实色,文字保持原 token |
| **Increase Contrast** | 文字色 → 系统 `label`,border → 2px |
| **Dark Mode** | 自动适配 token 反转 |

## 七、Color 与色盲

| 类型 | 比例 | 友好色组合 |
|---|---|---|
| 红绿色盲(最常见) | 8% 男 / 0.5% 女 | 用蓝/黄对比,不用红/绿 |
| 全色盲 | 极罕见 | 完全靠亮度对比 |

> **铁律**:不要"仅靠颜色"传递信息。例如:active tab 必须有 icon tint + label 加粗,不只用 brand 颜色。

---

**引用源**:
- Apple HIG Color — `0-originals/apple/hig/07-color.md`
- WCAG 2.2 §1.4.3 — `0-originals/wcag/1.4.3-contrast-minimum.md`
- WCAG 2.2 §1.4.11 — `0-originals/wcag/1.4.11-non-text-contrast.md`
- Apple HIG Accessibility — `0-originals/apple/hig/08-accessibility.md`