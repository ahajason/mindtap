# P0-2 · 内容层错误使用 Liquid Glass(违反 4 铁律)

> **优先级**: 🔴 P0(架构性根因,影响全部子页面)
> **创建**: 2026-06-21
> **关联设计**: [`../../1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §一 + §二 L3
> **关联原始**:
> - `0-originals/apple/liquid-glass/03-hig-materials.md`(4 铁律 §1:"不要在内容层使用 Liquid Glass")
> - `0-originals/microsoft/acrylic.md`(in-app acrylic 用于 supporting UI,**不**用于 content)

---

## 一、问题表现

V0.1.1 玻璃容器重构后,StyleGuide 的 6 个子页面(Surface / Button / Input / Feedback / Overlay / Tokens)**全部用 `glass-l3` 包裹**,导致内容(文字、列表、示例控件)直接处于玻璃材质下。

## 二、根因

违反 Apple HIG Liquid Glass **铁律 1** — "不要在内容层使用 Liquid Glass":

| 铁律 | 当前 | 违反 |
|---|---|---|
| ❌ 内容层不用 Liquid Glass | 6 子页面 glass-l3 包裹 | ❌ |
| ✅ 节制使用(一屏 ≤ 5 个独立 glass) | 子页面 glass-l3 + Sidebar glass-l2 + Card glass-l3 = >5 | ❌ |
| ✅ clear 仅丰富背景时使用 | 滥用 clear/regular | ⚠️ |
| ✅ regular 适用多数 | 多处用 depth-3(thick)做内容容器 | ⚠️ |

**权威源**:`0-originals/apple/liquid-glass/03-hig-materials.md` §"铁律"

## 三、设计匹配

[`1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md) §二 L3 内容层规定:

> **玻璃使用:绝对禁止**
> - 背景必须实色 / 极浅半透明(≥ 92% alpha)
> - 文字必须可读,WCAG 4.5:1 强制

## 四、3 层结构 vs 当前实施

| 层级 | 应使用 | 当前 | 状态 |
|---|---|---|---|
| **L1 控制**(Button / Input) | 不透明 + brand | glass-l3 ❌ | 错误 |
| **L2 容器**(Sidebar / Toolbar / Card) | glass depth-2/3 | ✅ | 正确 |
| **L3 内容**(Text / List) | **实色 / ≥ 92% alpha** | glass-l3 ❌ | **错误** |

## 五、解决路径

### 路径 F-1:Sub-page 容器去除 glass-l3,改 `bg-white/85` 或 `bg-white/95`

```css
/* 6 个 sub-page 的容器 */
.subpage {
  /* 删除: backdrop-filter / glass-l3 */
  background: rgba(255, 255, 255, 0.95);
}
```

| 改动量 | 1 文件 CSS(`src/index.css`) |
|---|---|
| 解决 | L3 内容层恢复可读性 |
| 保留 | Sidebar / Toolbar glass |

### 路径 F-2:保留 Card glass-l3,但 Card 之间用实色分隔

```css
.card { glass-l3 }  /* 保留 */
.section-divider { background: rgba(245,249,255,0.5) }  /* 实色分隔 */
```

| 改动量 | 较小 |
|---|---|
| 优点 | 视觉层次保留 |
| 缺点 | Card 之间的 glass-l3 seam 风险(权威源:Microsoft Acrylic"不要 edge-to-edge 多层") |

### 路径 F-3:全部实色,放弃 glass

不推荐 — V0.1.1 重构成果浪费。

## 六、推荐

**F-1 优先**(最干净)。L3 内容层用实色,L2 容器层保留 glass,层次最清晰。

## 七、自检

| 检查项 | 方法 |
|---|---|
| 6 个 sub-page 的 root 容器不再 glass-l3 | dev tools 查 className |
| Card 内部文字对比度 ≥ 4.5:1 | WebAIM checker |
| 同时存在的独立 glass 元素 ≤ 5 | 目测 + 查 DOM |
| L1 控件(Button / Input)仍可识别 | 视觉对比 |

---

**引用源**:
- 设计规范 — [`1-design/01-glass-layer-rules.md`](../../1-design/01-glass-layer-rules.md)
- 原始资料 — `0-originals/apple/liquid-glass/03-hig-materials.md` + `0-originals/microsoft/acrylic.md`