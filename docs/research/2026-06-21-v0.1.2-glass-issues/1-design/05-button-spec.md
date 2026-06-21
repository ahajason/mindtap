# 05 · Button 设计规范

> **层级**: 1-design / Button
> **创建**: 2026-06-21
> **作用**: Button 必须遵守的规范
> **不带具体问题** — 见 `2-issues/`
> **原始资料**:
> - `0-originals/apple/hig/01-buttons.md`(3 属性 / 4 Role / 44x44pt 最小)
> - `0-originals/apple/liquid-glass/01-overview.md`(Liquid Glass 凸起高度)

---

## 一、Button 在分层中的归属

**Button 是 L1 控制层。** 默认不透明;只在 toolbar / floating action 场景使用玻璃。

## 二、3 属性(权威源:Apple HIG Buttons)

| 属性 | 说明 |
|---|---|
| **Style** | 视觉风格(filled / tinted / plain / glass) |
| **Role** | 行为角色(primary / secondary / destructive / cancel) |
| **Size** | 物理尺寸(mini / small / regular / large) |

## 三、4 Role 映射(权威源:Apple HIG Buttons)

| Role | 用途 | 视觉 | 触发后果 |
|---|---|---|---|
| **primary** | 当前页主要动作 | filled + brand color | 提交 / 创建 |
| **secondary** | 次要动作 | tinted / outline | 辅助 |
| **destructive** | 删除 / 移除 | filled + systemRed | 不可逆操作 |
| **cancel** | 关闭弹窗 | plain | 取消 |

## 四、Style 矩阵

| Style | 背景 | 文字 | 边框 | 适用 |
|---|---|---|---|---|
| **filled** | brand / system color | white | 无 | primary |
| **tinted** | `tint @ 15%` | tint color | 无 | secondary |
| **plain** | transparent(default)/ `rgba(0,0,0,0.04)`(hover) | label | 无 | toolbar icon |
| **glass** | glass depth-1 + tint | label | 1px highlight | floating action |

## 五、几何规范

| 维度 | 值 |
|---|---|
| **最小高度** | 32pt(`regular`) |
| **最小触摸目标** | 44x44pt(Apple HIG) |
| **水平 padding** | 16px(`regular`)/ 12px(`small`)/ 8px(`mini`) |
| **圆角** | 8-10px(`--radius-control`) |
| **字号** | 14pt(`regular`)/ 13pt(`small`)/ 12pt(`mini`) |
| **字重** | medium(500) |

## 六、4 状态视觉

| 状态 | 视觉变化 |
|---|---|
| **default** | 基础 |
| **hover** | 背景 +8% darkness(不改变 hue) |
| **active/pressed** | 背景 -4% lightness(scale 0.98) |
| **disabled** | alpha 0.4,无 hover 反馈 |
| **focus** | 2px outline brand color,offset 2px |

## 七、玻璃 Button(仅特殊场景)

> **不推荐普通场景使用** — 玻璃 button 在内容层会降低可读性。

允许场景:
- **Floating action button**(右下角浮窗)
- **Toolbar icon button**(在玻璃 toolbar 内)

不允许:
- 主表单的 submit button
- 弹窗里的确认 button
- 内容区的所有 button

## 八、对比度(WCAG 2.2)

| 组合 | 对比度 | 出处 |
|---|---|---|
| white text on `#165DFF`(brand) | 8.6:1 ✅ | WCAG AA |
| `label` on tinted bg | ≥ 4.5:1 | WCAG 1.4.3 |
| disabled state | 无要求 | WCAG 1.4.3 incidental |

## 九、Icon Button

| 元素 | 规范 |
|---|---|
| 尺寸 | 28x28pt(content)/ 44x44pt(touch) |
| Icon | 16x16pt(content)/ 24x24pt(touch) |
| 圆角 | 6-8px |
| Hover bg | `rgba(0,0,0,0.04)` |
| Tooltip | 300ms delay 显示 |

## 十、无障碍

| 维度 | 规范 |
|---|---|
| VoiceOver | `<button>` + `aria-label`(icon-only 时必需) |
| 键盘 | Tab 聚焦,Enter / Space 触发 |
| Focus ring | 2px brand,≥ 3:1 对比 |
| Reduce Motion | 无 spring 动画,无 scale 反馈 |

---

**引用源**:
- Apple HIG Buttons — `0-originals/apple/hig/01-buttons.md`
- Apple Liquid Glass — `0-originals/apple/liquid-glass/01-overview.md`
- WCAG 2.2 — `0-originals/wcag/1.4.3-contrast-minimum.md`