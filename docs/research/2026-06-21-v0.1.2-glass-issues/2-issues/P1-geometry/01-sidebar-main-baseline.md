# P1 · Sidebar 标题跟 Main H1 不在同垂直基线

> **优先级**: 🟠 P1(几何一致性,影响视觉对齐)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §三 + [`1-design/00-design-principles.md`](../../1-design/00-design-principles.md) §四"跨窗口一致性"
> **关联原始**:
> - `0-originals/apple/hig/04-sidebars.md`(Split View 顶部对齐)
> - `0-originals/apple/hig/05-split-views.md`(三栏同 baseline)

---

## 一、问题表现(Image #4-#8 实测)

| 元素 | 垂直位置(y) |
|---|---|
| macOS traffic light | 8-28px |
| Sidebar 标题 "轻念·Mindtap" | ~72px(mt-10 + padding) |
| Main H1 | ~28px(mt-3 + padding) |

视觉上:**Sidebar 标题跟 Main H1 不在同水平线**,显得"两个独立容器"。

## 二、根因

`StyleGuideLayout` 里 Sidebar 跟 Main 用**不同的 padding / margin**:

```css
/* Sidebar 当前 */
aside { mt-10 p-4 }  /* mt-10 = 40px + p-4 = 16px = 56px top */

/* Main 当前 */
main { mt-3 p-4 }    /* mt-3 = 12px + p-4 = 16px = 28px top */
```

没有共享 alignment baseline,各自独立计算 top padding。

## 三、设计匹配

[`1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) §三几何规范:

| 维度 | 值 |
|---|---|
| **Sidebar 顶部 padding** | 44-48px(macOS titlebar 28pt + 间距) |
| **Main 顶部 padding** | 跟 Sidebar **同 baseline** |

[`1-design/00-design-principles.md`](../../1-design/00-design-principles.md) §四"跨窗口一致性":

> 同类组件(Sidebar / Toolbar)在所有页面表现一致

[`0-originals/apple/hig/05-split-views.md`](../../0-originals/apple/hig/05-split-views.md):

> Sidebar / Content / Detail 在同一窗口内,共享同一根 baseline(顶部对齐)

## 四、解决路径

### 路径 G-1:CSS Grid 共享 row

```css
.layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: auto 1fr;  /* header row + content row */
  align-items: start;
}

.sidebar-header { grid-row: 1; padding-top: 44px; }
.main-header    { grid-row: 1; padding-top: 44px; }  /* 同一 row,同一 top */
```

| 优点 | 严格 baseline 对齐 |
|---|---|

### 路径 G-2:统一 padding 变量

```css
:root { --layout-top-padding: 44px; }
aside, main { padding-top: var(--layout-top-padding); }
```

| 优点 | 简单 |
| 缺点 | 不如 G-1 灵活(若需要 Sidebar 内容更靠顶) |

## 五、推荐

**G-2 立即**(简单)+ **G-1 后续**(若 Sidebar 内容需要更灵活布局)

理由:
- G-2 解决 80% 的对齐问题,1-2 行 CSS
- G-1 是 CSS Grid 范式,适合复杂 split-view 布局

## 六、自检

| 检查项 | 方法 |
|---|---|
| Sidebar 标题跟 Main H1 顶部 y 坐标相同 | dev tools 查 `getBoundingClientRect().top` |
| Sidebar header padding = Main header padding | 视觉对比 |
| macOS traffic light 跟 Sidebar 标题间距 ≥ 16px | 视觉 |

---

**引用源**:
- 设计规范 — [`1-design/02-sidebar-spec.md`](../../1-design/02-sidebar-spec.md) + [`1-design/00-design-principles.md`](../../1-design/00-design-principles.md)
- 原始资料 — `0-originals/apple/hig/04-sidebars.md` + `0-originals/apple/hig/05-split-views.md`