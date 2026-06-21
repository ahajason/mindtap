# P2 · 玻璃 shadow 蓝色调偏离 Apple Liquid Glass 规范

> **优先级**: 🟡 P2(视觉细节,跟 brand 调色不冲突但偏离系统)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §四 玻璃深度
> **关联原始**:
> - `0-originals/apple/liquid-glass/03-hig-materials.md`(玻璃材质应中性)
> - `0-originals/microsoft/acrylic.md`(recipe: background → blur → exclusion → tint → noise,**tint 是唯一染色环节**)

---

## 一、问题现状(代码实测)

`src/index.css:83,93,103`:

```css
/* glass-l1 */
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.6),
  0 8px 32px rgba(0, 30, 80, var(--glass-shadow-1));  /* rgba(0, 30, 80, 0.08) — 蓝色 */

/* glass-l2 */
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.7),
  0 8px 32px rgba(0, 30, 80, var(--glass-shadow-2));  /* rgba(0, 30, 80, 0.10) — 蓝色 */

/* glass-l3 */
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.8),
  0 8px 32px rgba(0, 30, 80, var(--glass-shadow-3));  /* rgba(0, 30, 80, 0.12) — 蓝色 */
```

**问题**:shadow 用 `rgba(0, 30, 80, ...)` — 蓝色调(RGB 偏蓝),偏离 Apple Liquid Glass 规范(中性灰或黑色)+ 跟 glassic spec 设计语言不一致。

## 二、范式违反

| 范式 | 规范 | 当前 |
|---|---|---|
| Apple Liquid Glass shadow | 中性灰 + 系统色 | 蓝色 |
| Microsoft Acrylic tint 唯一染色 | shadow 留中性,tint 负责染色 | 违反 |
| mindtap spec 设计意图 | 不明(可能在 .archive/) | 待查证 |

**Apple 规范意图**:玻璃 shadow 应表达"凸起 + 折射",由 inset highlight + 外阴影共同表达,**外阴影应是中性灰或黑色**,不应该带 brand hue。

## 三、设计匹配

[`1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §四 玻璃深度对照表 + §五 降级路径:

> 阴影应中性,无 brand hue

## 四、解决路径

### 路径 S-1:shadow 改中性黑(推荐)

```css
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.6),
  0 8px 32px rgba(0, 0, 0, var(--glass-shadow-1));  /* 中性黑 */
```

| 优点 | 严格 Apple Liquid Glass 范式 |
| 缺点 | 可能失去蓝色调的"科技感"(品牌取舍) |

### 路径 S-2:shadow 用系统色 `--shadow-color`

```css
:root { --shadow-color: 0, 0, 0; }  /* light mode */
@media (prefers-color-scheme: dark) { :root { --shadow-color: 0, 0, 0; } }  /* 后续 V0.1.3+ */

box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.6),
  0 8px 32px rgba(var(--shadow-color), var(--glass-shadow-1));
```

| 优点 | 未来 Dark mode 适配容易 |
| 缺点 | +1 CSS var |

### 路径 S-3:保留蓝色,降低 alpha(妥协)

```css
0 8px 32px rgba(0, 30, 80, 0.04);  /* 0.08 → 0.04,蓝色更弱 */
```

| 优点 | 1 行改动,保留品牌调 |
| 缺点 | 不解决范式问题 |

## 五、推荐

**S-2**(系统性最好,为 V0.1.3+ Dark mode 铺路)

## 六、自检

| 检查项 | 方法 |
|---|---|
| shadow 颜色中性化 | grep `rgba(0, 30, 80` 改 `rgba(0, 0, 0` |
| 视觉:glass 容器阴影不再偏蓝 | 视觉对比 |
| 跟 brand color 不冲突(主色 #165DFF 在视觉焦点,shadow 不抢) | 视觉 |

---

**引用源**:
- 设计规范 — [`1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §四
- 原始资料 — `0-originals/apple/liquid-glass/03-hig-materials.md` + `0-originals/microsoft/acrylic.md`