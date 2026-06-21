# P2-1 · 文字对比度:text-3 在穿透背景下不够

> **优先级**: 🟡 P2(WCAG AA 失败,文字可读性)
> **创建**: 2026-06-21
> **状态**: 🟡 **待解决**(V0.1.3+ 延后,本 plan 未覆盖)
> **关联设计**: [`../../1-design/06-color-and-contrast.md`](../../1-design/06-color-and-contrast.md) §五
> **关联原始**:
> - `0-originals/wcag/1.4.3-contrast-minimum.md`(4.5:1 强制)
> - `0-originals/apple/hig/07-color.md`(动态适配 + 对比度优先)
> - `0-originals/microsoft/acrylic.md`("Don't place accent-colored text on your acrylic surfaces")

---

## 一、问题表现(Image #6 实测)

StyleGuide 子页面的标签文字(例:`text-3 #98A2B3` 的 "primary / secondary / ghost / icon")在 glass-l3 + 穿透文字的背景下,**对比度严重不足**。

| 文字 | token | 值 | 玻璃背景 | 实测对比 | WCAG AA(4.5:1) |
|---|---|---|---|---|---|
| Sidebar 标题 | text-2 | `#475467` | glass-l2 + 穿透 | 待实测 | ⚠️ |
| Main H1 | text-1 | `#1D2939` | glass-l3 + 穿透 | 待实测 | 边界 |
| NavLink default | text-2 | `#475467` | glass-l2 | 待实测 | ⚠️ |
| **标签 `text-3`** | **`#98A2B3`** | glass-l3 + 穿透 | **< 3:1** | **❌** |
| NavLink active | white | brand #165DFF | — | 8.6:1 ✅ | ✅ |

## 二、根因

`text-3(#98A2B3)` 本身对比度就低,在纯白背景上仅 2.85:1(WCAG 失败)。叠加玻璃穿透后,**对比度进一步降到 < 3:1**。

## 三、设计匹配

[`1-design/06-color-and-contrast.md`](../../1-design/06-color-and-contrast.md) §五"玻璃上的文字":

> **铁律**:玻璃深度越深,后面穿透越多,**文字必须更深**。`text-3(#98A2B3)` 在深穿透背景根本不够。

权威源 WCAG 1.4.3 + Microsoft Acrylic "Legibility considerations":

> We don't recommend placing accent-colored text on your acrylic surfaces because these combinations are likely to not pass minimum contrast ratio requirements at the default 14px font size.

## 四、解决路径

### 路径 C-1:穿透背景下,`text-3` 升 `text-2`(优先)

```css
/* 在 glass-l2/l3 内的所有 text-3 元素强制升 text-2 */
.glass-l2 .text-3,
.glass-l3 .text-3 {
  color: var(--text-2);  /* #475467 */
  font-weight: 500;       /* 字重 medium */
}
```

### 路径 C-2:穿透背景区域改用更深文字 token

```css
:root {
  --text-passthrough: #344054;  /* 比 text-1 略浅,但比 text-2 深 */
}
.glass-l3 { color: var(--text-passthrough); }
```

### 路径 C-3:解决 P0-1(穿透根因)后,玻璃背景变干净,text-3 自然恢复

**根本方案** — 路径 B-1 / B-2 body 半透明 base color 实施后,穿透消失,文字对比度自动恢复。

## 五、推荐

**C-1 立即**(应急)+ **C-3 根本**(P0-1 解决后自然恢复)

## 六、自检

| 检查项 | 方法 |
|---|---|
| 所有标签文字在 glass 背景下对比度 ≥ 4.5:1 | WebAIM checker 逐元素测 |
| `text-3` 在 glass 容器内不再使用 | grep `.glass-l2 .text-3` / `.glass-l3 .text-3` |
| 标签字重 ≥ medium(500) | 视觉 |
| WCAG 1.4.11 3:1 UI 组件(icon / border) | WebAIM checker |

---

**引用源**:
- 设计规范 — [`1-design/06-color-and-contrast.md`](../../1-design/06-color-and-contrast.md) §五
- 原始资料 — `0-originals/wcag/1.4.3-contrast-minimum.md` + `0-originals/apple/hig/07-color.md` + `0-originals/microsoft/acrylic.md`