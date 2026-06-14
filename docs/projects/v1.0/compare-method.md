---
title: V1 视觉对比方法
tags: [prototype, design-system, projects-v1, methodology]
created: 2026-06-14
---

# V1 视觉对比方法

> 决策"哪种视觉语言适合 Mindtap"时的标准做法。
> 不靠 PPT / 文字描述 / 动效视频——直接产 4 个独立 HTML，在浏览器里**全屏并排对比**。

---

## 1. 4 条反 AI 味的硬约束

1. **背景必须有真实内容**（色块 / 数据 / 任务 / 文本），不是紫色 / 粉橙渐变
2. **玻璃层漂浮在内容上**，不孤立成居中卡片
3. **真实字号 + 真实间距**（1280×800 起做，禁止缩略图或 480×360 mockup）
4. **不用 emoji 当主视觉**；类型 / 几何 / 色块 / 字号对比优先

> AI 味 = 紫粉渐变 + 居中毛玻璃卡片 + 大标题 + emoji 装饰
> 玻璃味 = backdrop-filter + 半透明 + 镜面高光 + 漂浮在真实内容层之上

## 2. Liquid Glass 真正定义（来自 Apple HIG）

不是"毛玻璃"——是"**漂浮在内容层上的功能层**"：

| 特征 | 含义 |
|---|---|
| 玻璃只承载控件和导航 | 标签栏、侧栏、工具栏、浮动按钮、菜单 |
| 玻璃不承载内容 | 卡片、列表、文本、媒体——用 Standard Materials |
| 背景延伸 | sidebar / inspector 打开时，背景图在玻璃下方"镜像 + 模糊"延伸 |
| 镜面高光 | 1px inset border + 顶部 highlight、底部阴影 |
| 控件变形 | 按钮 ↔ menu、slider knob 形变为玻璃 |
| 节制 | 4 个自定义玻璃元素以上即过度 |

## 3. 流程

```
1. brainstorm 阶段
   ↓
   在 .superpowers/brainstorm/<session>/content/ 画 v2-X.html 草稿
   (1280×800 SVG 内联，可单文件打开)
   ↓
2. 用户选 1 个方向（或 4 个都保留）
   ↓
3. 落到 docs/projects/v1.0/prototype/ 下作为正式资产
   ↓
4. docs/projects/v1.0/compare-method.md 更新本次决策（追加章节）
   ↓
5. V1.x 升级时，重做一轮对比
```

## 4. 资产清单

```
docs/projects/v1.0/prototype/
├── index.html              ← 目录页（V1 + V2 + Scaffold 三入口）
├── compare.html            ← V1 旧对比页：4×4 glass matrix（保留决策历史）
│   ├── Q1-light-creative.html
│   ├── Q2-light-strict.html
│   ├── Q3-heavy-creative.html
│   ├── Q4-heavy-strict.html
│   ├── D5-immersive.html
│   ├── D6-productive.html
│   ├── D7-adaptive.html
│   └── D8-expressive.html
├── compare-v2.html         ← V2 新对比页：4 方向真实版面（产品语境）
│   ├── v2-a-macos26.html   ← A · macOS 26 Tahoe
│   ├── v2-b-linear.html    ← B · Linear / Vercel
│   ├── v2-c-editorial.html ← C · 编辑杂志
│   └── v2-d-engdoc.html    ← D · 工程文档
└── scaffold/               ← Scaffold 4 方向（同一产品 4 排版）
    ├── index.html          ← 入口 + 4 方向对照矩阵
    ├── d1-warm-paper.html  ← D1 · 暖纸
    ├── d2-pro-toolbar.html ← D2 · Pro 工具条
    ├── d3-editorial.html   ← D3 · 编辑杂志
    └── d4-engdoc.html      ← D4 · 工程文档
```

## 5. 跳转关系

```
index.html
  ├── compare.html            (V1 视角矩阵：8 个 Liquid Glass 视角)
  │     └── 8 个独立原型 (Q1-Q4 + D5-D8)
  └── scaffold-compare.html   (V3 脚手架首页矩阵：2 强度 × 4 主题 = 8 玻璃方块)
```

## 6. V1 → V3 演进

V1 的 compare.html 是 4×4 glass matrix（**8 视角**对照）—— Q1-Q4 是 light/heavy × creative/strict 四象限，D5-D8 是 4 种主色沉浸变体。

V3 的 scaffold-compare.html 是 4×4 glass matrix（**8 玻璃方块**对照）—— 2 强度（Subtle / Balanced）× 4 主题（暖纸 / 工程白 / 暖黑 / 冷灰）。

V2（4 方向 1280×800 整窗产品页）已被否决 —— 概念本身错误（错把"产品页"当"玻璃研究"）。Scaffold 子目录（4 个 D1-D4）也已被弃用。

| 维度 | V1 (compare.html) | V3 (scaffold-compare.html) |
|---|---|---|
| 解决的问题 | 8 视角中哪个最像 Apple HIG 演示 | 脚手架首页 chrome 用哪个玻璃强度 + 主题 |
| 候选数 | 8 (2 套 × 4 变体) | 8 (2 强度 × 4 主题) |
| 单元 | 单玻璃块（独立 HTML） | 200×300 mini chrome chip（同页 8 个） |
| 视口 | 1280×800 单文件 | scrollable 一页（max-width 1280px） |
| 决策 | 二维矩阵选象限 | 2 强度 × 4 主题正交选 variant |

## 7. 何时用 V1 模式（唯一风格）

**只用 V1 4×4 matrix 模式**。V2（1280×800 整窗产品页）和 Scaffold（4 方向整窗）已弃用 —— 这两个模式的概念本身错误，错把"产品页"当"玻璃研究"。

何时开新一轮 V3：
- 玻璃 token 变了（强度档位 / 透明度区间 / 颜色色板）
- 脚手架首页 chrome 的策略变了（新增维度如 2 强度 → 3 强度，4 主题 → 6 主题）
- 升级版本时（V1.1 / V1.2）脚手架语境变了

**绝不**：
- 开 N 个独立整窗 HTML 文件（1280×800 全屏）做对比
- 用 4 方向 4 排版语言（编辑杂志 / 工程文档 / macOS 26 / Linear）做对比
- 把"产品页 demo"当作"玻璃研究"

## 8. 反例：典型的 AI 味（避免）

```css
/* ❌ AI 味 */
body {
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
  /* 紫粉渐变 marketing landing */
}
.surface {
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(24px) saturate(180%);
  border-radius: 20px;
  padding: 28px 32px;
  max-width: 480px;
  /* 居中孤岛 */
}

h1 { font-size: 28px; font-weight: 600; }
/* 默认 sans-serif */
```

```css
/* ✅ 玻璃味 + 非 AI 味 */
body {
  background: var(--bg);
  /* 暖米白 / 工程白 / 黑色 — 不是渐变 */
}
.glass {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6),
              inset 0 -1px 0 rgba(0, 0, 0, 0.04),
              0 8px 24px rgba(0, 0, 0, 0.05);
  /* 镜面高光 + 漂浮在内容上 — 不是孤岛 */
}
/* 内容层在玻璃下，玻璃只承载控件/导航 */
```

## 9. V1 4×4 matrix 模式为什么赢（2026-06-14 沉淀）

V1 4×4 matrix 模式（即 8 chip + 1 stats + 8 perspective card 的"一站式对照页"）是项目**唯一保留**的对比模式。V2（1280×800 整窗产品页）和 Scaffold（4 方向整窗）都被否决，原因都指向同一个根。

### 9.1 V2 / Scaffold 失败的根因

| 错误 | V2 错在哪 | Scaffold 错在哪 |
|---|---|---|
| 把"产品页"当"玻璃研究" | 4 个 1280×800 整窗，每个都是完整产品 demo | 4 个 1280×800 整窗，每个都是 scaffold home 完整排版 |
| 把"分散文件"当"矩阵" | 4 个独立 HTML，跨文件对比靠脑补 | 5 个独立 HTML（index + d1-d4），靠导航跳转对比 |
| 把"内容排版语言"当"脚手架首页" | 编辑杂志 / 工程文档 / 报表 / Linear 4 种排版都跑一遍 | 暖纸 / Pro / 编辑 / 工程文档 4 种排版都跑一遍 |
| 把"整窗固定视口"当"严肃" | 1280×800 锁死窗口，scrollable 都不要 | 同上，1280×800 锁死 |

V2 / Scaffold 失败的根因：**对比的"研究对象"是产品页（1280×800 整窗），不是玻璃本身**。

V1 4×4 matrix 赢，是因为它的研究对象是**玻璃本身**：
- 8 chip = 8 段小玻璃方块（不锁视口）
- 1 stats table = 8 段玻璃的量化对比（数据可比）
- 8 perspective card = 4-dim 结构化描述（4 维度都可对）

### 9.2 V1 模式的具体形态

#### 区块 1 · Header
```
kicker（小字大字距）  +  h1（serif italic）  +  lead（长描述）  +  badges（圆角小 tag）
```
- 字体：Fraunces (serif italic) + Manrope (sans)
- 不锁 1280×800，max-width 1280px 居中即可
- scrollable 页面

#### 区块 2 · Hero · 8 quick-jump chips
- 4 col × 2 row 网格
- 每个 chip = 一段**小玻璃方块**（不是整窗产品页）
- chip 内部可以是一个迷你 chrome 演示（topbar + sidebar + main + fab 各占 1 行）
- 8 chip 用不同 accent 颜色区分（粉/橙/紫/蓝/绿/灰/天蓝/玫红）
- 点击 chip → 滚到对应 perspective card

#### 区块 3 · Stats table
- 8 行 × 6 列
- 列：variant / 行数 / chip 数 / @keyframes / backdrop-filter / 强度 / 主题
- 横向对比一眼可扫
- tfoot 行加粗 + accent 颜色，标"合计"

#### 区块 4 · 8 perspective card
- 每张 card 是 `.glass` surface
- card head：字母 avatar（48×48 colored） + 名字（serif） + tag（mono 小字）
- card body：2×2 grid of 4 p4 子块
  - **核心定位** — 这个 variant 的玻璃策略一句话
  - **原则体现** — Content First / Adaptive Material / Readability / Functional Design 各几星
  - **特色属性** — 具体 CSS 数值（blur / saturate / 阴影层数 / 颜色）
  - **独特价值** — 这个 variant 提供了别的 variant 给不了什么

#### 区块 5 · Theme toggle
- fixed 右上角，半径 50% 玻璃圆按钮
- 点击切 light/dark
- dark 主题用相同 token 镜像（`body.dark` 重写 `--bg` / `--ink` / `--glass-bg`）

### 9.3 反 AI 味的 V1 模式 4 条硬约束

1. **chip 必须是小玻璃方块**（200×300 量级），不是整窗产品页
2. **同页对照** —— 8 个 variant 在一张 scrollable 页上，max-width 1280px
3. **维度结构化** —— 8 个 perspective card 用同一套 4-dim 描述，可比
4. **stats 量化** —— 一行数据能看出哪个 variant 实现得多/少

V2 / Scaffold 的反 AI 味 4 条是另一套（不锁 1280×800 / 真实内容 / 玻璃只飘 chrome / 玻璃不孤立居中），**两条都满足才真正反 AI 味**。

### 9.4 决策时不要做的 3 件事

1. ❌ "哪个好看"决策 —— 8 个都好看，要看哪个最**不 AI 味**
2. ❌ 让用户"你挑" —— 4 variant 都通过说明没立场，必须有团队立场
3. ❌ 加 4 方向 1280×800 整窗 HTML —— 概念本身错误

## 10. 相关链接

- [Apple HIG · Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass)
- [Landmarks · Building an app with Liquid Glass](https://developer.apple.com/documentation/SwiftUI/Landmarks-Building-an-app-with-Liquid-Glass)
- 本地资料：`docs/material/apple/liquid-glass/`
