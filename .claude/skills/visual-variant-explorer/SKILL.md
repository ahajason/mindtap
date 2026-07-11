---
name: visual-variant-explorer
description: 接收"业务描述 + 铁律文件路径"，输出 3-5 个不同方向的视觉原型 HTML，集成在单个 live switcher 页面。铁律不固定（Apple HIG Liquid Glass / Material Design 3 / 公司 design system 都可），由用户在调用时指定文件路径。适用于视觉方案探索阶段：每个 prototype 在字体/配色/装饰/密度/空间 上走极端，但必须严格守铁律，避开 AI 味（紫粉渐变 / 居中孤岛毛玻璃）与硬边硬阴影（border: 2px solid / 4×4 box-shadow）。所有 skin 集成在**右下角极简矩阵浮窗**中并列显示（4×2 / 2×4 网格 + mini 缩略图），点击切换，不做"循环切换一个一个看"模式。
---

# visual-variant-explorer

通用「基于铁律做视觉探索」skill。给定业务描述 + 一份 design system 文档（铁律），产出 3-5 个**真正不同**的视觉方向，集成在单个 live switcher HTML 页面里供用户并排对比。

## When to use this skill

**触发**:
- 用户说"基于 [某 design system / 铁律文件] 探索视觉方向"
- 用户说"在 [Apple HIG / Material Design / 公司 DS] 基础上做几个差异化原型"
- 用户说"想看 N 个不同的视觉方向，不要 PPT，要能在浏览器里切"
- 用户在视觉决策早期，候选方向不明朗

**不触发**:
- 决策已定，需要落一个具体页面 → 用 `frontend-design`
- 用户只要改色/改间距等小修 → 直接改 CSS
- 用户要的是 4 方向 1280×800 整窗产品页 → 概念错误（见 anti-patterns §4.2）
- 铁律文件不存在或没指定 → 停下来问用户要

## Inputs

调用时需要：

| 参数 | 必填 | 说明 |
|---|---|---|
| `business` | ✓ | 业务描述（一段话 / 一份 prd / 一组 use case） |
| `iron_rules_path` | ✓ | 铁律文件路径（本地绝对路径或相对路径），可多个 |
| `n` | ✗ | 方向数，默认 4（推荐 3-5） |
| `output_dir` | ✗ | 输出位置，默认 `prototype/<batch-name>/` |

调用示例：

```
基于 docs/material/apple/liquid-glass/01-overview.md 这份铁律，
为"极简记录 APP"做 4 个不同方向的视觉原型，输出到 prototype/v3-explore/。
```

## Process

### 步骤 1 · 读铁律，提取 hard constraints

读用户提供的铁律文件。识别**硬约束**（不能违反的规则）：

- 哪些视觉元素被禁用 / 强制限量（如 Apple HIG "玻璃只在 chrome"、"≤4 个玻璃元素"）
- 哪些 material / token 是规定的（如 Apple "regular / clear / Standard / Thick" 四种 material）
- 哪些反 AI 味的具体规则（无紫粉渐变 / 无居中孤岛 / 无硬边硬阴影）

详见 `references/iron-rules-extraction.md` 的提取方法论。

### 步骤 2 · 确认差异轴

光有铁律不够 —— 4 个方向必须**真正不同**。从以下 4 个轴里挑 N 个组合：

| 轴 | 极端 | 说明 |
|---|---|---|
| **字体** | 衬线 (serif) ↔ 无衬线 (sans) ↔ 等宽 (mono) ↔ 表现体 (display) | 字形/字重/字距 |
| **配色** | 暖（米黄/砖红）↔ 冷（蓝灰/青）↔ 单色（黑白灰）↔ 高饱和（霓虹） | 主色 + 中性色 + accent |
| **装饰** | 极简（无）↔ 几何（点线面）↔ 有机（手绘/噪点）↔ 工业（粗线/条码） | 装饰元素密度 |
| **密度** | sparse（大留白）↔ dense（紧凑列表）↔ bento（卡片网格）↔ editorial（杂志流） | 空间布局 |
| **动效** | 静态 ↔ 微动效 ↔ 高动效（page transition / stagger） | @keyframes 数量 |

**强制要求**: 4 个方向不能在 (字体 + 配色 + 装饰) 三轴上同时相似。至少在两个轴上有明显差异。

### 步骤 3 · 每个方向写"铁律自检"

写每个方向前，列出：
- 用了哪几个 material / 变体（Apple HIG: regular / clear / Standard / Thick 选哪几个）
- 玻璃元素 ≤ 4 吗？（如果是 Apple HIG 限制）
- 硬约束有没有违反？
- 跟其他 3 个方向的差异是什么？

### 步骤 4 · 写单个 live switcher HTML

模板见 `assets/skin-switcher-template.html`。要点：

- **同份 DOM**：所有 skin 共享同一份 HTML 结构
- **`[data-skin="X"]` 隔离**：每个 skin 的 CSS 用属性选择器前缀，**不污染其他 skin**
- **CSS 变量驱动**：颜色/间距/blur 全走 CSS 变量，skin 切换只改 `:root` 上的变量集
- **极简矩阵浮窗**（**不是**循环切换胶囊）：固定**右下角**，4×2 / 2×4 网格，每格 = mini 缩略图（用 skin 主题色填充 + 字母 ID + 名字），点击切换。当前选中高亮 accent 色
- **快捷键**（可选 power user）：A-H 字母键直接切换（仅在非 input 元素聚焦时）
- **可视差异显著**：不能只是"换换颜色" —— 字体 / 装饰 / 布局密度也要变
- **不要"循环切换"模式**（一个一个点切走主区看）：**所有 skin 在浮窗里并列可见**，方便对比

### 步骤 5 · 写批次入口

每个输出批次必须有 `index.html` 作为本批次索引（**不是**对比入口），列出本批次所有 skin 文件 + 简单说明。

并在 `prototype/index.html`（项目级入口）的 JSON map 追加一条记录，让项目导航能发现这个批次。

### 步骤 6 · 自检 → 提交

提交前自检：

- [ ] N 个 skin 在 4 维度（字体/配色/装饰/密度）上至少 2 维有显著差异
- [ ] 每个 skin 严格守铁律（无违反项）
- [ ] 任意两个 skin 不"看起来像"（不是同色 + 同字体的微调）
- [ ] 每个 skin 的 `.glass` 元素数 ≤ 4（Apple HIG 限制）
- [ ] 无 `border: Npx solid var(--ink)` 类的硬边
- [ ] 无 `box-shadow: Npx Npx 0 var(--ink)` 类的硬阴影
- [ ] 无紫粉渐变 / 居中孤岛毛玻璃卡片等 AI 味
- [ ] `data-skin` 切换时，类名不互相影响

## Anti-patterns

来自 mindtap V1.0（2026-06-14）实际用户反馈的 5 类错位：

### 4.1 视觉重复（A3 B3 同色系）

**问题**: 4 方向里有 2 个用了相同色调（如深黑 + 金 + 斜体），看起来像同一方向的微调。
**根因**: 只在 (颜色) 一维上做差异，字体 + 装饰没动。
**修法**: 强制 4 维度选 ≥ 2 维做差异。

### 4.2 整窗产品页 = 概念错误

**问题**: 开 4 个 1280×800 整窗 HTML 做对比，每个都是完整产品 demo。
**根因**: 把"产品页"当"视觉研究对象"。
**修法**: 研究对象是**视觉语言本身**（玻璃强度 / 字体 / 装饰 / 密度），不是"完整产品页"。用单页 live switcher，1 份 DOM + N 个 skin。

### 4.3 硬边 + 硬阴影

**问题**: 用了 `border: 2px solid var(--ink)` + `box-shadow: 4px 4px 0 var(--ink)`，看起来像包豪斯 / Brutalism。
**根因**: 误以为"几何感" = "粗黑边"。
**修法**: 视觉语言里**禁用** `border: Npx solid` + `box-shadow: 0 0 0` 类硬投影。装饰用 inset highlight（玻璃镜面）+ soft shadow（低不透明度长投影）替代。

### 4.4 节制违规（4 列密集玻璃）

**问题**: 1 页里塞 4 列玻璃卡片 + 多层 backdrop-filter 元素。
**根因**: 把"丰富" = "多玻璃"。
**修法**: Apple HIG 4 铁律之一是"≤ 4 个自定义玻璃元素"。超出即违规。装饰 / 卡片用 Standard material（不透明 / 半透明 solid）。

### 4.5 AI 味（紫粉渐变 + 居中孤岛）

**问题**: `background: linear-gradient(135deg, #667eea, #764ba2, #f093fb)` + `max-width: 480px` 居中毛玻璃卡。
**根因**: 默认 marketing landing 套路。
**修法**: 背景必须是真实内容层（任务 / 数据 / 文本 / 色块组合），玻璃只漂浮在 chrome（topbar / sidebar / fab / inspector）上，不承载内容。

### 4.6 类名交叉污染

**问题**: 4 个 skin 共享类名（`.card`、`.button`），切换 `data-skin` 时样式互相覆盖。
**根因**: 没用属性选择器隔离。
**修法**: 全部 skin-specific 规则加 `[data-skin="X"]` 前缀（如 `[data-skin="A1"] .card`）。

### 4.7 错位（variant 实验轴上的"极简"误放）

**问题**: 矩阵的 B 行（variant 实验轴）放了一个"极致节制的 regular 变体" —— 但"regular"本身在 Apple HIG 里就是默认 baseline，**单独**拎出来不构成"variant 实验"。
**根因**: 把"极端值"和"实验维度"混了。
**修法**: 矩阵的每个轴 = 真正的设计变量。regular / clear / Standard / Thick 是 material 变体，不是"实验轴"。实验轴应该是 (强度档位 / 主色 / 装饰密度 / 排版方向) 之一。

## Output structure

每次调用产出的文件清单（在 `<output_dir>/`，默认 `prototype/<batch-name>/`）：

```
prototype/
└── <batch-name>/
    ├── index.html              ← 本批次索引（列出所有 skin）
    ├── scaffold-live.html      ← live switcher HTML（1 份 DOM + N 个 skin）
    └── (可选) <其他辅助文件>
```

并在 `prototype/index.html`（项目级入口）的 JSON map 追加：

```json
{
  "name": "<批次名>",
  "version": "v<版本>",
  "description": "<一句话>",
  "path": "./<batch-name>/index.html",
  "files": <文件数>,
  "created": "<YYYY-MM-DD>"
}
```

## Examples

### 例 1 · Apple HIG Liquid Glass · 极简记录 APP · 4 方向（mindtap V2 实战）

详见 `examples/mindtap-v1.md`。

输入：
- 业务：极简记录 APP（标题 + 文本 + 标签 + 时间戳）
- 铁律：`docs/material/apple/liquid-glass/01-overview.md`（玻璃只在 chrome / ≤4 玻璃元素 / clear 变体只在富背景 / 区分 Standard 与 Glass material）
- N = 4

输出：4 行 × 2 列变体
- **A 行 · regular 变体（基线）**:
  - A1 Editorial（衬线 + 暖米白 + 报刊流）
  - A2 Lab（无衬线 + 工程白 + dense 列表）
  - A3 Salon（衬线 italic + 深黑 + editorial）
  - A4 Notebook（无衬线 + 暖白 + 纸张纹理）
- **B 行 · clear 变体 / Standard material / 节制实验**:
  - B1 Photo（clear 变体 + 富背景图 + 浮在图上）
  - B2 Terminal（mono + 纯黑 + dense 命令行）
  - B3 Glass Thick（Standard material · thick 变体 · 不透明）
  - B4 Bento（bento 网格 + Standard material · 3 列不玻璃）

实际产物：`prototype/v2-scaffold-live/scaffold-live-v2.html`

### 例 2 · Material Design 3 · 任务管理 APP · 3 方向

输入：
- 业务：团队任务管理 APP
- 铁律：Material Design 3 guidelines（dynamic color / elevation 5 档 / filled / outlined / text 三种 button 变体）
- N = 3

可能的 3 方向：
- **M1 Dynamic Bright**（dynamic color + bright tonal palette + 强 elevation）
- **M2 Neutral Pro**（neutral static + monospace density + low elevation）
- **M3 Editorial Dark**（dark theme + serif headings + flat elevation）

## Bundled resources

| 文件 | 作用 |
|---|---|
| `references/iron-rules-extraction.md` | 怎么从 design system 文件读出 hard constraints |
| `assets/skin-switcher-template.html` | ~200 行精简 live switcher 模板（1 DOM + 4 skin 示例） |
| `examples/mindtap-v1.md` | mindtap V2 4 方向实战案例（详细分析每个 skin 的差异轴 + 铁律自检） |

## 不做的事

- **不**输出 PPT / 文档 / Figma 文件 —— 只产 HTML
- **不**做"哪个最好看"的主观推荐 —— 决策是用户的事
- **不**在铁律不清晰时硬编 —— 停下来问用户
- **不**复用前一批次的 skin ID（A1, A2, B1 等）—— 每批次用新 ID，避免跨批次混淆

## 失败模式

| 失败 | 修法 |
|---|---|
| 4 个 skin 看起来"差不多" | 拉差异轴，强制 ≥ 2 维不同 |
| 某个 skin 违反铁律 | 重写该 skin 的 material / 装饰，重做自检 |
| 切换 data-skin 时类名污染 | 全部规则加 `[data-skin="X"]` 前缀 |
| 浏览器打开 switcher 报错 | 检查 `data-skin` 拼写、`:root` 变量集、CSS 选择器语法 |
| 加载慢 / 字体闪烁 | 把字体 `<link>` 放 `<head>` 顶部，preconnect 字体 CDN |
