# 2x2 矩阵玻璃设计变体 — Mindtap V1.0

> **状态**：draft · **日期**：2026-06-14 · **作者**：Claude (brainstorm with Jason)
> **目的**：通过 4 个差异化变体探索 Liquid Glass 的设计空间，避免单一方向收敛

---

## Context

### 问题
- 在 FE-2.13 阶段，主对话单方向推进"强玻璃 + 透明 + 圆角 + 浮动"融合，导致过早收敛到一种设计语言
- 用户原话："设计原型需要对比…避免把路走死"
- Liquid Glass 是一个**谱系**，从"几乎不可见的薄雾"到"iOS 26 完整玻璃"都是合法设计

### 已废弃的 4 变体（FE-2.12）
- ❌ B Editorial — 用户："完全偏离设计"
- ❌ C Pastel Soft — 用户："完全不是毛玻璃"
- ⚠️ A Liquid Glass Pure — 用户："缺圆角 + 缺浮动"
- ⚠️ D Glass Heavy — 用户："玻璃堆叠太重 + 缺透明 + 缺细节"

### 用户原话
> "我觉得既然是设计原型稿，一些细节可以不深究简化实现…当时还是需要有设计对比的，不同思路产生的效果可能就完全不一样了…避免把路走死，是实现时可以考虑使用子代理实现，避免上下文互相干扰。"

---

## 2x2 矩阵

**维度 1：玻璃强度（轻 / 重）**
- 轻：透明叠加 0.2-0.4，blur 16-24px，单层阴影
- 重：透明叠加 0.5-0.7，blur 32-48px，3 段阴影 + 噪点 + 鼠标 specular

**维度 2：@docs 严格度（创意 / 严格）**
- 创意：自由布局/实验性视觉，不强求 HIG 标准
- 严格：严格遵循 HIG Materials 4-tier（ultraThin / thin / regular / thick），只把玻璃用于"功能层"（controls + navigation），不堆叠

### 4 个象限

| | 玻璃强度=轻 | 玻璃强度=重 |
|---|---|---|
| **@docs 严格度=创意** | **Q1 Light Creative** | **Q3 Heavy Creative** |
| **@docs 严格度=严格** | **Q2 Light Strict** | **Q4 Heavy Strict** |

### 象限定义

#### Q1 Light Creative
- **哲学**：极简轻雾玻璃，实验性布局（asymmetry / overlap / 打破网格）
- **material 配方**：
  - 玻璃：`backdrop-filter: blur(16px) saturate(160%)` + 白叠加 0.25-0.35
  - 阴影：单层 `0 8px 24px rgba(0,0,0,0.06)`
  - 噪点：去掉
  - 鼠标 specular：去掉
- **@docs 偏离**：可以"内容 + 玻璃"叠加、可使用非 HIG 颜色、可调整字号比例
- **创新点**：用 grid-break（侧栏与内容重叠）、或用 layout 变化（如侧栏从底部抽屉弹出）

#### Q2 Light Strict
- **哲学**：极简 + 严格遵循 HIG
- **material 配方**：
  - 玻璃：HIG `.regular` = `blur(24px) saturate(180%)` + 白叠加 0.35
  - 玻璃仅用于功能层（menubar / sidebar / FAB / modal / bottom-tab）
  - 内容（records / stats / review）保持纯净，无玻璃
- **@docs 严格**：只允许标准组件形式（不能改布局），但允许视觉细节

#### Q3 Heavy Creative
- **哲学**：强玻璃感 + 创意发挥
- **material 配方**：
  - 玻璃：5 层堆叠（material + 折射 + 边缘 + 阴影 + 噪点 + 鼠标 specular）
  - 背景叠加 0.55-0.7，blur 40-48px
  - 加 radial mask 焦点
- **@docs 偏离**：玻璃可用于"非功能层"（records / stats 卡片也可玻璃），可使用多层玻璃嵌套

#### Q4 Heavy Strict
- **哲学**：强玻璃 + 严格遵循 HIG（与 FE-2.13 方向最接近但用子代理重做）
- **material 配方**：
  - 玻璃：5 层堆叠（material + 折射 + 边缘 + 阴影 + 噪点 + 鼠标 specular）
  - 玻璃仅用于功能层
- **@docs 严格**：保持 FE-2.12 A 的所有 HIG 审计项（功能层 / 4-tier / 圆角同心 / title-style / scroll edge）

---

## Base 模板

所有 4 个变体基于同一 material 模板：
- **文件**：`/home/jason/workspace/projects/prototype/index.html`（FE-2.11 后的 A，已含完整功能：menubar / sidebar / records / stats / review / FAB / modal / bottom-tab + 主题切换 + 滚动检测 + 拖拽记忆）
- **不可改**：HTML 结构、JS 交互、CSS 变量名、body 背景 mesh（保证 4 变体有相同的"折射背景"）
- **可改**：仅 .sidebar / .menubar / .modal / .fab / .bottom-tab 的 glass 视觉部分 + 布局实验（仅 Q1 / Q3 创意象限）

---

## 简化要求

按用户原话"设计原型细节可以不深究"：
- 不需要支持深色模式（去掉 `[data-theme="dark"]` 块）
- 不需要响应式（去掉 `@media` 块）
- 不需要 stagger 入场动画（去掉 `@keyframes fade-up` 应用）
- 不需要 JS 拖拽 / 主题切换 / 弹窗（去掉 `<script>` 块）
- 保留：HTML body 结构 + 4 个功能层玻璃的核心 CSS

---

## 子代理分派规则

每个子代理 prompt 必须包含：
1. **material 路径**：`/home/jason/workspace/projects/prototype/index.html`
2. **象限配方**：Q1 / Q2 / Q3 / Q4 的 glass 视觉细节
3. **简化清单**：上面"简化要求"列表
4. **输出路径**：`/home/jason/workspace/projects/prototype/Q[1-4]-[name].html`
5. **必须保留**：HTML body 完整结构（menubar / sidebar / records / stats / review / FAB / modal）
6. **必须可访问**：在浏览器中打开能看到玻璃效果
7. **独立工作**：4 个子代理之间不共享上下文，独立做差异化

---

## 验证

1. 启动 `python3 -m http.server 8765` 在 `/home/jason/workspace/projects`
2. 浏览器访问 4 个文件：
   - `http://localhost:8765/prototype/Q1-light-creative.html`
   - `http://localhost:8765/prototype/Q2-light-strict.html`
   - `http://localhost:8765/prototype/Q3-heavy-creative.html`
   - `http://localhost:8765/prototype/Q4-heavy-strict.html`
3. 检查每个变体的"玻璃强度"和"@docs 严格度"是否与配方一致
4. 更新 `compare.html` 链接 4 个变体

---

## 不在范围

- 不做选型决策（4 个变体都是合法的"探索"）
- 不合并 4 个变体
- 不重写 HTML 结构
- 不动 JS 交互
- 不重做 typography / 颜色

---

## 决策记录

- **2026-06-14**：4 个变体设计完成，准备分派子代理
