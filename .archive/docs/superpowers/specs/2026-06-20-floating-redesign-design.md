# Mindtap 浮窗重构 v3 · 设计文档

> **状态**:设计中(D 方案收尾 + 自检通过,待用户最终复核 → 进 writing-plans)
> **创建**:2026-06-20
> **作者**:Jason + Claude
> **关联**:V1.5 浮窗在多轮真机测试中暴露 3 个外观问题 — (1) Light Glassmorphism 不够清透,像"奶白贴纸"; (2) 折叠↔展开过渡离跳,玻璃本身有"形变"但内容是离散切换;(3) 展开态同时塞 Timer-detail + Form,违背 "1 视图 = 1 焦点" 项目铁律。本设计是 V1.5 的视觉补丁,**不改 4 状态任务机 / 不改 IPC / 不改设置面板**,只重写浮窗 React 组件树与 glassic token。

---

## 1. 背景与目标

### 1.1 现状(V1.5 痛点)

| # | 痛点 | 证据 |
|---|---|---|
| 1 | 玻璃不透明 | 用户反馈: "Light Glassmorphism 不如人意, 不够清透" — V1.5 用 α=0.5 / blur 40,深色背景下像"贴在玻璃上的磨砂贴纸" |
| 2 | 动画不流畅 | 用户反馈: "动画不够流畅" — V1.5 用 5 帧 keyframes,内容是离散切换而非平滑形变 |
| 3 | 展开态组件重复 | 用户反馈: "展开态的 focus 块复用迭代块的, 避免重复内容出现" — V1.5 折叠态 focus 块和展开态 FocusBlock 是两套 DOM |
| 4 | 展开态堆两套 sub-panel | brainstorm audit 发现:V1.5 把 Timer-detail 和 Form 同时显示,违背"1 视图 = 1 焦点" |
| 5 | 决策丢失 | audit 跑 9 个并行 agent 比对 15 条决策,发现 **8 LOST + 2 AMBIGUOUS + 4 PRESERVED + 1 demo 自洽** |

### 1.2 v3 战略定位

**v3 不引入新交互,只重写浮窗视觉与组件结构,恢复 brainstorm 已定的 15 条决策**:

- **Glass 配方重写**:Light Glassmorphism 推到 Apple HIG 实际范围(α=0.22 OKLCH / blur 24 / saturate 140% / brightness 104% v4 调色板),让背景"穿过"玻璃。
- **动画用 CSS grid-template-rows**:同一组 DOM 节点用 CSS 切 variant,无 keyframes 离散跳,过渡 320ms cubic-bezier(0.25, 0.46, 0.45, 0.94)。
- **Segmented mutex**:展开态用 ⏱ / ＋ segmented 单选,两个 sub-panel 互斥。
- **Form-first 默认**:展开态默认显示 Form 而非 Timer(沿用 D-07 B 方案)。
- **Form submit 解耦**:主 CTA "保存(⌘S)" 只创建记录,timer 启动走独立动作(沿用 D-04 B 方案)。
- **DOM 复用**:折叠态 focus 块和展开态头部共用同一组节点(`.shared-header`),无 React 重渲染。

### 1.3 目标指标

| 指标 | 目标 | 验证方式 |
|---|---|---|
| 玻璃透明度 | α≤0.25 OKLCH + saturate≥140% in v4 调色板(折叠态) | screenshot 对比 `.superpowers/brainstorm/.../floating-final-v3.html` |
| 玻璃折射 | liquid-glass-react WebGL 外壳显示 iOS 26 弹性折射(折叠态静态,展开态 0.35 elasticity) | 视觉对比 + Playwright `toHaveScreenshot` |
| 动画顺滑度 | 折叠↔展开过渡 320ms,无视觉跳变 | 录屏对比 |
| 决策覆盖率 | 17 条决策(原 15 + D-16/D-17)全部 PRESERVED,0 LOST | audit 复查(重跑 workflow) |
| 跨平台一致 | macOS / Windows / Linux 视觉等价(legacy 平台走低 saturate `variant="legacy"`) | 三平台真机 + Playwright 双引擎基线 |
| 浮窗唤起延迟 | < 200ms(同 V1.5) | 回归测试不退化 |
| 浮窗首次绘制 | < 100ms(WebGL 外壳初始化不计) | Lighthouse / Performance API |
| 视觉回归 | Playwright `toHaveScreenshot` 12 场景基线 diff < 0.1% | `npx playwright test` |

### 1.4 不做(Out of Scope)

- 不改 4 状态任务机(pending / active / paused / done)
- 不改 V1.5 已有的 IPC commands(`start_timer` / `pause_timer` / `resume_timer` / `complete_task` 等保持原签名)
- 不改设置面板(autostart / 全局快捷键修改仍走托盘)
- 不引入 duration chips(V1.5 task 命令只接 content/dueAt,不接 duration)
- 仅新增 1 个 backend command:`task_aggregate_today()`(D-06 副标题用,见 § 4.2),其他 command 不动
- 不改浮窗尺寸上限(360×auto 仍生效)
- 不改全局快捷键(⌘+⇧+Space)
- 不改 SQLite schema(`record` / `task` 表结构沿用 V1.5)

### 1.5 依赖选择铁律(4 级阶梯)

> **stdlib > 已有 dep > 第三方 >> 自己手写**

每个新引入的依赖必须先走这 4 级阶梯逐级评估:

| 优先级 | 候选源 | 示例 |
|---|---|---|
| **1 · stdlib** | 浏览器原生 / Node 内置 / React 内置 | CSS transition / @keyframes / WAAPI / useState / useEffect |
| **2 · 已有 dep** | `package.json` 已装的包(可主版本升级) | `@base-ui/react` / `tailwindcss@^4.3.1` 升级 / `tw-animate-css` / `sonner` / `lucide-react` |
| **3 · 第三方** | 公开 npm 包,需评估活跃度 + bundle + 维护状态 | **`liquid-glass-react`**(2.8k star,2026-05 活跃,WebGL 外壳) |
| **4 · 自己手写** | **远劣于第三方** — 维护成本高,边缘 case 多 | 默认避免 |

**D 方案定位(2026-06-20 用户拍板)**:
- **Tier 1 升级**:**Tailwind v3.4 → v4.3** — OKLCH 调色板 + `color-mix(in oklch, ...)` + 内置 `backdrop-filter` + `@property` 动画 = 直击"玻璃闷灰"根因(同半日工作量,0 新增 dep 名)
- **Tier 3 引入**:**`liquid-glass-react`** — SVG `feDisplacementMap` + WebGL shader 模拟 iOS 26 弹性折射,包装整个浮窗外壳;React 19 peer 标 alpha,需自验
- **0 自写**:不写 GlassSurface 自封装;不写折射 shader

**禁止用"硬禁某库"逃避评估** — 每个库都按 4 级阶梯走,够用即可。V1.5 → V1.6 加新需求时,再走一轮评估。

---

## 2. 设计铁律(沿用 + 强化)

> **3 秒记录 / 1 秒查看 / 0 思考成本 + 1 视图 = 1 焦点**

| 维度 | v3 落地 |
|---|---|
| 3 秒记录 | Form 默认展开,主 CTA "保存(⌘S)" 一步完成,timer 启动走单独路径 |
| 1 秒查看 | 折叠态 240×36 永远显示 active task 名 + elapsed + 暂停按钮 |
| 0 思考成本 | segmented 互斥单选,无"两个面板同时存在"的二义性 |
| 1 视图 = 1 焦点 | Timer / Form 二选一 mutex,通过 segmented 切换 |

---

## 3. 关键决策(D-01 ~ D-17)

> 决策编号沿用 brainstorm audit(`wf_5344d25c-253/journal.jsonl`)的 D-01 ~ D-15;**D-16 / D-17 为 2026-06-20 用户拍板 D 方案后新增**。

### 3.1 玻璃配方(D-01, D-10)

| ID | 决策 | 理由 |
|---|---|---|
| **D-01** | B-2 Windows fallback(α=0.72/0.78)+ 舞台背景用 #C8C8C8 单色 | backdrop-filter 不可用时仍可读,v3.1 比 v3.0 调降避免"白瓷" |
| **D-10** | 玻璃配方 v3.1:α=0.22 / blur 24 / saturate 220 / brightness 104%(折叠),展开态升 α=0.30 + border 0.42 + 36px halo | Apple HIG Liquid Glass 实测 α≈0.18~0.25;saturate 补偿色彩损失 |

### 3.2 动画(D-11)

| ID | 决策 | 理由 |
|---|---|---|
| **D-11** | `grid-template-rows: 0fr → 1fr` + inner `overflow: hidden` + `min-height: 0` | 三件套缺一不可;比 keyframes 平滑且无需 WAAPI |

### 3.3 交互(D-02, D-04, D-07, D-12)

| ID | 决策 | 理由 |
|---|---|---|
| **D-02** | 展开态顶部 segmented(⏱ / ＋)单选 mutex | 不允许两个 sub-panel 同时存在;1 视图 = 1 焦点 |
| **D-04** | Form 主 CTA = "保存(⌘S)",只创建记录;timer 启动走 Timer sub-panel 独立动作 | 不再让 submit 按钮在不同 record type 间隐式 flip 语义 |
| **D-07** | 默认 sub-panel = Form | 用户进入浮窗主要场景是"快速记一笔",Form 优先 |
| **D-12** | 拖动阈值 4px;折叠态可拖,展开态不可拖(只 close + 内部交互);btn 短路 drag | 短按 = 切换状态,长按 = 移动窗口 |

### 3.4 组件结构(D-03, D-05, D-06, D-13)

| ID | 决策 | 理由 |
|---|---|---|
| **D-03** | Form 头 = A 方案(📄 doc icon + 任务名 + "当前 Focus" 副标题) | 把 active task 作为工作上下文显式暴露,无 task 时退化为中性 ✚ |
| **D-05** | 折叠态 5 元素(呼吸 → 标题 → 时间 → ⏸ → ＋) | B 方案比 A 多一个内联暂停按钮,bar 仍 36px 高 |
| **D-06** | Timer sub-panel A 骨架 + "今日累计 X:XX:XX · N 段" 副标题 | 视觉冲击 + 上下文双收 |
| **D-13** | DOM 复用:折叠态和展开态共用同一组节点,纯 CSS 切 variant | 不重建 React 节点,无重渲染成本 |

### 3.5 状态机(D-09)

| ID | 决策 | 理由 |
|---|---|---|
| **D-09** | 呼吸 v6 自然档:2 层光晕 + 4→16px 扩散 + brightness 1→1.15 + 2.8s ease-in-out | 三态 active=绿 #5BCBA0 / paused=橙 #F5A623 / done=灰 #98A2B3(灰禁动画) |

### 3.6 控件(D-08, D-14, D-15)

| ID | 决策 | 理由 |
|---|---|---|
| **D-08** | 按钮 chrome 默认 B(ghost α=0.15 + hover α=0.55 + scale 0.96 active);A/B/C 三方案在 visual companion 同台对比,用户可在 Phase 6 之前改 | B 是静态轻盈 + hover 有反馈的最佳平衡;demo § 3 留可改入口 |
| **D-14** | Timer hero 56px(spec)+ 副标题"今日累计 X:XX:XX · N 段" | spec 数值;demo 内因容器宽 260px 适配为 32px |
| **D-15** | 不引入 duration chips(15/30/60/90);只保留 type chips(task/idea/check-in) | V1.5 backend 不支持 duration preset;不写未决定的功能 |

### 3.7 技术栈(D-16, D-17) — 2026-06-20 用户拍板 D 后新增

| ID | 决策 | 理由 |
|---|---|---|
| **D-16** | **Tailwind v3.4 → v4.3 主版本升级**(半日工作量) | OKLCH 调色板 + `color-mix(in oklch, ...)` 一等公民,**直击"玻璃闷灰"根因**(sRGB 空间插值色相偏冷发灰);v4 内置 `backdrop-filter` utility + `@property` 动画;shadcn 4.x / base-ui 1.6 / sonner 1.7 / cva / tailwind-merge / lucide-react 全 v4-ready;`@tailwindcss/upgrade` CLI 迁 80% 重命名;`@tailwindcss/vite` 插件替换 `postcss.config.js` |
| **D-17** | 浮窗外层用 **`liquid-glass-react`**(DavidAlphaFox 版,2.8k star,2026-05 活跃)包装 | SVG `feDisplacementMap` + WebGL fragment shader 模拟 iOS 26 弹性折射;`displacementScale={64} saturation={1.4} elasticity={0}` 折叠态静态,`elasticity={0.35}` 展开态动态;Tier 3 第三方(React 19 peer 标 alpha,**需 `pnpm install` 后跑 vitest 自验**;WebGL 在低性能设备可能掉帧,加 fallback) |

---

## 4. 架构

### 4.1 文件改动

```
src/floating/
├── App.tsx                   # 改:用 <OuterShell><FloatShell>...</FloatShell></OuterShell> 包外壳
├── OuterShell.tsx            # 新:D-17 liquid-glass-react 包装(WebGL 折射外壳)
├── FloatShell.tsx            # 新:折叠↔展开壳 + drag/drop + 4px 阈值
├── GlassSurface.tsx          # 新:封装 D-10/D-01 玻璃配方,三档 props(variant="L1"|"L3"|"fallback")
├── SharedHeader.tsx          # 新:D-03 shared header(doc icon + title + sub)
├── Segmented.tsx             # 新:D-02 segmented mutex(⏱ / ＋)
├── FormSubPanel.tsx          # 新:Form sub-panel(type chips + textarea + 保存 CTA)
├── TimerSubPanel.tsx         # 新:Timer sub-panel(hero + meta + 暂停/完成)
├── FoldedBar.tsx             # 新:D-05 折叠 5 元素
├── StatusDot.tsx             # 新:D-09 呼吸 v6(3 态)
└── Button.tsx                # 新:D-08 B 方案按钮(ghost + hover 3D)

src/floating/floating.css    # 改:替换 glass recipe;新增 segmented / shared-header / form / timer 样式
src/index.css                # 改:D-16 迁 v4 `@theme`(OKLCH glass token + backdrop utilities)
postcss.config.js            # 删:v4 走 @tailwindcss/vite 插件
tailwind.config.ts           # 改:D-16 迁 v4 删 extend;glassic token 改 @theme
```

### 4.2 新增 backend command(1 个)

```rust
// src-tauri/src/commands/task.rs
#[tauri::command]
pub async fn task_aggregate_today(
    state: tauri::State<'_, DbState>,
) -> AppResult<TaskAggregateToday> {
    db::task::aggregate_today(&state.0.lock().unwrap())
}

// 返回结构
pub struct TaskAggregateToday {
    pub total_ms: i64,           // 今日累计专注毫秒数
    pub segment_count: i32,      // 今日段数(pending→done 计 1 段)
}
```

**用途**:Timer sub-panel 显示"今日累计 2:15:42 · 6 段"副标题(D-06)。若该 command 失败或后端未实现,前端降级显示"今日累计 0:00:00 · 0 段",不阻塞 UI。active task 上下文走现有 `record_get_active_task()` 取,不重复。

### 4.3 IPC 约定(沿用 V1.5)

浮窗用到的 IPC commands 不变:

| Command | 用途 | 现有 |
|---|---|---|
| `start_timer(id)` | 开始计时(从 pending / paused 触发) | ✓ |
| `pause_timer()` | 暂停 active 任务 | ✓ |
| `resume_timer()` | 恢复 paused 任务 | ✓ |
| `complete_task()` | 完成 active 任务 | ✓ |
| `record_get_active_task()` | 拿 active task 全字段 | ✓ |
| `record_create(...)` | 创建 record(task / idea / check_in) | ✓ |
| **`task_aggregate_today()`** | **新**:今日累计 + 段数 | **本 spec 新增** |

事件订阅不变:

| 事件 | 用途 |
|---|---|
| `focus-changed` | task 状态变更驱动 UI 刷新 |
| `record-updated` | 新增/归档驱动 record 列表刷新 |
| `tick` | 每秒驱动 timer 数字 |

---

## 5. 数据流

### 5.1 折叠态(常态)

```
用户拖动 / 不拖
  → FloatShell.mousedown → mousemove(>4px = drag, <4px = click)
  → 折叠态 drag: CSS transform / left / top(无 React state)
  → 折叠态 click: FloatShell.isExpanded = true

FloatShell 渲染 FoldedBar
  → StatusDot(从 record.status 派生 active/paused/done)
  → title(record.content 截断)
  → time(record.duration_ms + tick 增量)
  → ⏸ 按钮(paused ↔ ▶)
  → ＋ 按钮(打开 Form,segmented 切到 form)
```

### 5.2 展开态(用户点开)

```
FloatShell.isExpanded = true
  → GlassSurface variant="L3"(α=0.30 + border 0.42 + 36px halo)
  → grid-template-rows 0fr → 1fr(320ms cubic-bezier)

展开态渲染:
  → SharedHeader(doc icon + record.content + "当前 Focus" sub)
  → Segmented(⏱ active / ＋ active 二选一,默认 ＋ per D-07)
  → FormSubPanel(active) 或 TimerSubPanel(active)
  → CloseBtn(右上角 ×)
```

### 5.3 Form sub-panel

```
FormSubPanel 渲染:
  → TypeChips(task / idea / check_in,默认 task)
  → Textarea(content 初始值)
  → CTA "保存(⌘S)"

用户输入 → React state(本地)→ 点击保存:
  → invoke('record_create', { kind, content, dueAt })
  → 后端写入 record 表 + emit('record-updated', ())
  → 前端 hook 刷新 record 列表
  → Form textarea 清空,浮窗仍展开(可继续记录)
  → 不自动启动 timer(D-04 解耦)
```

### 5.4 Timer sub-panel

```
TimerSubPanel 渲染(根据 status 切 action pair,action 二选一):
  → status=active:   Actions = [⏸ 暂停, ⏹ 完成](D-02 mutex)
  → status=paused:   Actions = [▶ 继续, ⏹ 完成]
  → status=done:     Actions = [↶ 撤销](单按钮,无 pair)
  → Hero 56px tabular-nums(record.duration_ms + tick 增量)
  → Meta "今日累计 X:XX:XX · N 段"(invoke('task_aggregate_today'))
  → Hint "⌘+⇧+P 完成 · ⌘+⇧+Spc 暂停"

用户点 ⏸:
  → invoke('pause_timer')
  → 后端 L2 累加 duration_ms + emit('focus-changed', Task)
  → 前端 hook 刷新,timer 数字冻结 + StatusDot 变橙
```

### 5.5 拖动 vs 点击(D-12)

```
mousedown(展开态下,只允许内部控件交互):
  if isExpanded:
    if target.closest('[data-no-expand],[data-close],button,textarea,.type-chip,.segmented'):
      return(交给控件自身处理)
    return(展开态空白区域不响应)
  if target.closest('[data-no-expand]'): return
  记录 startX/startY + offsetX/offsetY,isDragging=true

mousemove:
  if !isDragging: return
  if Math.hypot(dx, dy) < 4: return(还未超阈值,不算 drag)
  dragStarted = true
  更新 left/top(限制在父容器 rect 内)

mouseup:
  if !dragStarted: 短按 → toggleExpand
  else: 静默(已拖,不再触发 toggle)
```

**说明**:`[data-no-expand]` 是折叠态按钮的统一短路标记(同时阻止拖动 + 阻止展开,见 HTML demo § 1)。`[data-close]` 只在展开态出现,关闭按钮独占。

---

## 6. Glassic token 落地

### 6.1 配方数值(对齐 D-10 v3.1 + D-01 + D-16 OKLCH)

> **D-16 落地**:α 数值在 Tailwind v4 `@theme` 块中以 **OKLCH 表达**(`oklch(L c h / α)`),v4 `@theme` 自动生成 `bg-glass-L1/3` 等工具类;sRGB 空间的 `bg-white/35` 在 OKLCH 空间下色相不偏不发灰。`saturate(220%)` 在 OKLCH 底色上不再需要补偿色相,只补亮度。

| 元素 | folded (L1) | expanded (L3) | fallback | macOS 12 (legacy) |
|---|---|---|---|---|
| 背景 | `oklch(1 0 0 / 0.22)` | `oklch(1 0 0 / 0.30)` | `oklch(0.85 0 0 / 0.72)` | `oklch(1 0 0 / 0.28)` |
| 边框 | `oklch(1 0 0 / 0.32)` | `oklch(1 0 0 / 0.42)` | `oklch(0.9 0 0 / 0.85)` | `oklch(1 0 0 / 0.40)` |
| blur | 24px | 24px | — | 16px |
| saturate | 140%(OKLCH 不再需 220%) | 140% | — | 120% |
| brightness | 104% | 104% | — | 104% |
| inset 高光(顶) | 0.78 | 0.85 | 1.0 | 0.80 |
| inset 高光(底) | 0.14 | 0.18 | 0.30 | 0.16 |
| 外 halo | 24px | 36px | 24px | 22px |
| 圆角 | 16px | 20px | 16px | 16px |
| 持续时间 | 320ms cubic-bezier(0.25, 0.46, 0.45, 0.94) |||

**D-17 WebGL 折射外壳**(包在 `<OuterShell>` 中,作用于整窗):

| 参数 | 折叠态 | 展开态 |
|---|---|---|
| `displacementScale` | 64 | 96 |
| `blurAmount` | 0.1 | 0.15 |
| `saturation` | 1.4 | 1.6 |
| `aberrationIntensity` | 3 | 4 |
| `elasticity` | 0.0(静态)| 0.35(动态)|
| `mode` | `'standard'` | `'polar'` |

### 6.2 内层元素 α 收敛

| 元素 | 旧 | 新 | 备注 |
|---|---|---|---|
| `.segmented` bg | 0.35 | 0.22 | 跟主玻璃一致 |
| `.type-chip` bg | 0.40 | 0.22 | |
| `.textarea-mini` bg | 0.40 | 0.22 | |
| `.timer-btn` bg | 0.50 | 0.28 | |
| `.shared-header` divider α | 0.06 | 0.04 | |

### 6.3 平台 fallback

| 平台 | backdrop-filter | 配方档 |
|---|---|---|
| macOS 13+ | blur(24) saturate(220) brightness(104) | L1 / L3 |
| macOS 12 | blur(16) saturate(180) | legacy |
| Windows 11 | blur(24) saturate(220) brightness(104) | L1 / L3 |
| Windows 10 / backdrop-filter 不可用 | 无 | fallback 实色 α=0.72 |
| Linux GNOME(支持 backdrop-filter) | blur(24) saturate(220) brightness(104) | L1 / L3 |
| Linux 其他 / 不可用 | 无 | fallback 实色 α=0.72 |

**检测方式**:CSS `@supports (backdrop-filter: blur(24px))` 包裹三档;legacy 由 user-agent 判断 macOS 12(`navigator.userAgent` 含 `Mac OS X 10_15_*`)或不饱和度低于 200% 时降级。

**所有 variant 对应 GlassSurface props**:
- `variant="L1"` → 折叠态默认(L1)
- `variant="L3"` → 展开态默认(L3)
- `variant="fallback"` → `@supports not (backdrop-filter: ...)`
- `variant="legacy"` → macOS 12 / 老 Linux

### 6.4 Tailwind v4 集成 + OuterShell 包装(D-16 + D-17 落地)

#### 6.4.1 Tailwind v3.4 → v4.3 迁移

`src/index.css` 改为 v4 CSS-first config,glassic token 迁到 `@theme`:

```css
/* src/index.css */
@import "tailwindcss";
@plugin "@tailwindcss/forms";

@theme {
  /* Glass 背景 - OKLCH 调色板(D-16) */
  --color-glass-L1: oklch(1 0 0 / 0.22);
  --color-glass-L3: oklch(1 0 0 / 0.30);
  --color-glass-fb: oklch(0.85 0 0 / 0.72);
  --color-glass-legacy: oklch(1 0 0 / 0.28);

  /* Glass 边框 - OKLCH */
  --color-glass-border-L1: oklch(1 0 0 / 0.32);
  --color-glass-border-L3: oklch(1 0 0 / 0.42);
  --color-glass-border-fb: oklch(0.9 0 0 / 0.85);

  /* Backdrop utilities */
  --backdrop-blur-glass: 24px;
  --backdrop-blur-glass-legacy: 16px;
  --backdrop-saturate-glass: 140%;
  --backdrop-saturate-glass-legacy: 120%;
  --backdrop-brightness-glass: 104%;

  /* 状态色(呼吸 v6 三态) */
  --color-status-active: #5BCBA0;
  --color-status-paused: #F5A623;
  --color-status-done: #98A2B3;

  /* 圆角 */
  --radius-glass-sm: 16px;
  --radius-glass-lg: 20px;

  /* 字体族(Geist Variable 已装未注册) */
  --font-sans: "Geist Variable", system-ui, -apple-system, sans-serif;
}
```

> v4 自动从 `@theme` 变量生成 utility:`bg-glass-L1` / `bg-glass-L3` / `bg-glass-fb` / `backdrop-blur-glass` / `backdrop-saturate-glass` / `backdrop-brightness-glass` / `rounded-glass-sm` / `rounded-glass-lg` 等。

**配套删除**:
- `tailwindcss-animate@1.0.7`(2023-04 停更,`tw-animate-css@1.4.0` 接管)
- `autoprefixer`(v4 内置)
- `postcss.config.js`(v4 走 `@tailwindcss/vite` 插件)

**v4 配套安装**:
- `tailwindcss@^4.3.1` + `@tailwindcss/vite`(替换 `tailwindcss@^3.4.19` + postcss 链)
- `@tailwindcss/forms@latest`(shadcn Input/Select 跨浏览器 reset)
- `tailwind.config.ts` 删除 `extend` 段(全量迁 `@theme`)

#### 6.4.2 OuterShell · WebGL 折射外壳(D-17)

`src/floating/OuterShell.tsx`:

```tsx
import LiquidGlass from 'liquid-glass-react'
import type { ReactNode } from 'react'

interface Props {
  isExpanded: boolean
  children: ReactNode
}

/**
 * D-17 落地:用 liquid-glass-react 包整个浮窗,
 * 实现 iOS 26 风格的弹性折射(背景图透过浮窗边缘时变形)
 */
export function OuterShell({ isExpanded, children }: Props) {
  return (
    <LiquidGlass
      displacementScale={isExpanded ? 96 : 64}
      blurAmount={isExpanded ? 0.15 : 0.1}
      saturation={isExpanded ? 1.6 : 1.4}
      aberrationIntensity={isExpanded ? 4 : 3}
      elasticity={isExpanded ? 0.35 : 0.0}
      mode={isExpanded ? 'polar' : 'standard'}
      style={{ borderRadius: 16, overflow: 'hidden' }}
    >
      {children}
    </LiquidGlass>
  )
}
```

**WebGL fallback**:`liquid-glass-react` 在 `WebGLRenderingContext` 不可用时降级为普通 div(无折射);不阻塞浮窗,仅视觉损失。检测方式:`'WebGLRenderingContext' in window`。

#### 6.4.3 GlassSurface · CSS 玻璃层(原 v3.1 配方)

`src/floating/GlassSurface.tsx`(保留):

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'

const glass = cva(
  // 基础:blur + saturate + brightness + 圆角 + 边框(无背景色,variant 控制)
  ['rounded-glass-sm backdrop-blur-glass backdrop-saturate-glass backdrop-brightness-glass border'],
  {
    variants: {
      variant: {
        L1: 'bg-glass-L1 border-glass-border-L1',
        L3: 'bg-glass-L3 border-glass-border-L3',
        fb: 'bg-glass-fb border-glass-border-fb',  // Windows fallback
        legacy: 'bg-glass-legacy backdrop-blur-glass-legacy backdrop-saturate-glass-legacy',
      },
    },
    defaultVariants: { variant: 'L1' },
  }
)

type Props = VariantProps<typeof glass> & React.HTMLAttributes<HTMLDivElement>

export function GlassSurface({ variant, className, ...rest }: Props) {
  return <div className={twMerge(glass({ variant }), className)} {...rest} />
}
```

**架构层次**(自外而内):

```
<OuterShell>           ← D-17:WebGL 折射外壳(liquid-glass-react)
  <FloatShell>         ← D-12:折叠↔展开壳 + drag/drop + 4px 阈值
    <GlassSurface>     ← D-10/D-01/D-16:CSS backdrop-filter + OKLCH 玻璃
      <SharedHeader /> ← D-03
      <Segmented />    ← D-02
      <FormSubPanel /> / <TimerSubPanel />  ← D-04 / D-07
      <FoldedBar />    ← D-05(折叠态)
      <StatusDot />    ← D-09
      <Button />       ← D-08
    </GlassSurface>
  </FloatShell>
</OuterShell>
```

**GlassSurface 4 variant**:
- `variant="L1"` → 折叠态默认(L1)
- `variant="L3"` → 展开态默认(L3)
- `variant="fb"` → `@supports not (backdrop-filter: ...)` Windows fallback
- `variant="legacy"` → macOS 12 / 老 Linux(blur 16 / saturate 120)

---

## 7. 测试

### 7.1 单元测试

**React 组件单元测试**(vitest + React Testing Library):

| 模块 | 测试 | 关键不变量 |
|---|---|---|
| `FloatShell` | toggleExpand | isExpanded flip,grid-template-rows 触发过渡 |
| `FloatShell` | drag 4px 阈值 | dx/dy < 4 不算 drag;≥ 4 进入拖动模式 |
| `FloatShell` | expanded 时禁止 drag | mousedown 在 expanded 状态下空白区域 return |
| `Segmented` | 互斥单选 | 点 timer → timer active,form 失活;反之亦然 |
| `Button`(D-08) | hover 反馈 | mouseenter → bg α 0.15→0.55;mousedown → scale 0.96 |
| `StatusDot`(D-09) | 3 态色 | active=#5BCBA0 / paused=#F5A623 / done=#98A2B3 |
| `StatusDot` | done 禁动画 | animation-name = none |
| `TimerSubPanel` | action pair 切换 | status=active → [⏸, ⏹];paused → [▶, ⏹];done → [↶] |

**Rust 单元测试**(cargo test):

| 模块 | 测试 | 关键不变量 |
|---|---|---|
| `db::task::aggregate_today` | SQL aggregate | 返回 total_ms / segment_count 正确 |
| `db::task::aggregate_today` | 空表 | total_ms=0, segment_count=0 |
| `db::task::aggregate_today` | 跨日边界 | 只统计今日,昨日不计入 |

### 7.2 集成测试

| 场景 | 步骤 | 期望 |
|---|---|---|
| 折叠态点空白 | mousedown 在 folded bar 空白处 | isExpanded = true,320ms 过渡 |
| 折叠态拖动 | mousedown → mousemove 50px → mouseup | bar 移动 50px,不展开 |
| 折叠态短按 | mousedown → mouseup(无移动) | isExpanded = true |
| 展开态 segmented 切换 | 点 ⏱ → 点 ＋ → 点 ⏱ | timer ↔ form sub-panel 互斥切换,DOM 不重建 |
| 展开态点空白 | mousedown 在 sub-panel 内部 | 无副作用(不折叠) |
| 展开态 close | 点 × | isExpanded = false,反向过渡 |
| Form 保存 | 输入内容 → 点 "保存 (⌘S)" | record 创建成功,textarea 清空,record 列表刷新 |
| 跨平台 | 三平台真机打开浮窗 | macOS / Windows / Linux 视觉等价 |

### 7.3 视觉回归(D-16 自动化)

**工具**:新装 `@playwright/test`(devDep,Agent 3 推荐)。`tauri webview` 不暴露 CDP 给 Playwright,故**用纯 HTML demo + Vite dev server + Playwright `chromium` + `webkit` 双引擎基线**:

```bash
npm i -D @playwright/test
npx playwright install chromium webkit
```

**基线生成**:

```ts
// tests/visual/floating.spec.ts
import { test, expect } from '@playwright/test'

const SCENARIOS = [
  { name: 'dark-code', bg: '#1a1a2e' },
  { name: 'notion-paper', bg: '#f7f6f3' },
  { name: 'photo-vivid', bg: 'linear-gradient(...)' },
  { name: 'fallback-gray', bg: '#C8C8C8' },
] as const

const STATES = ['folded', 'expanded-form', 'expanded-timer'] as const

for (const bg of SCENARIOS) {
  for (const state of STATES) {
    test(`floating.${bg.name}.${state}`, async ({ page }) => {
      await page.setContent(/* load floating-final-v3.html with bg + state */)
      await expect(page.locator('.float-shell')).toHaveScreenshot(
        `floating-${bg.name}-${state}.png`,
        { maxDiffPixelRatio: 0.001 }  // 0.1% 阈值
      )
    })
  }
}
```

**生成/更新基线**:`npx playwright test --update-snapshots`;**回归测试**:`npx playwright test`(差异 > 0.1% 失败)。

**视觉回归清单**(12 场景自动比对,替代原手核清单):

| 场景 | 折叠态 | 展开-Form | 展开-Timer |
|---|---|---|---|
| dark-code | ✓ | ✓ | ✓ |
| notion-paper | ✓ | ✓ | ✓ |
| photo-vivid | ✓ | ✓ | ✓ |
| fallback-gray | ✓ | ✓ | ✓ |

**手动核对**(`floating-final-v3.html` 的 visual companion 仍保留):

- [ ] WebGL 折射在 `displacementScale=64` 折叠态下可见
- [ ] WebGL 折射在 `displacementScale=96 + elasticity=0.35` 展开态下动态(可拖动观察)
- [ ] OKLCH 玻璃底色在深色背景下不偏冷发灰(对比 sRGB `bg-white/22`)
- [ ] Liquid Glass fallback(WebGL 不可用)无白屏,降级为普通 div

### 7.4 决策覆盖率(audit 重跑)

| ID | PRESERVED 期望 | 验证方式 |
|---|---|---|
| D-01 | Windows fallback 实色 #C8C8C8 + α=0.72/0.78 | 第 4 场景视觉对比 |
| D-02 | segmented 互斥单选 | unit + 集成 |
| D-03 | shared-header 含 active task | 视觉对比 |
| D-04 | CTA "保存(⌘S)" 不 flip 语义 | 视觉 + 集成 |
| D-05 | 折叠态 5 元素 | 视觉 |
| D-06 | 副标题"今日累计 X:XX:XX · N 段" | 视觉 + `task_aggregate_today` 单测 |
| D-07 | 默认 sub-panel = Form | 视觉 |
| D-08 | B 方案按钮 + A/B/C 对比面板 | 视觉 |
| D-09 | v6 呼吸 + 3 态 | 视觉 + unit |
| D-10 | OKLCH α=0.22 / blur 24 / saturate 140% / brightness 104% | 视觉 |
| D-11 | grid-template-rows 0fr → 1fr + inner overflow:hidden + min-height:0 | unit |
| D-12 | 4px 阈值 + 展开态不可拖 | unit |
| D-13 | DOM 复用(CSS 切 variant,无 React 重渲染) | 集成 |
| D-14 | Timer hero 56px | spec 数值,实现固定 |
| D-15 | 无 duration chips | 视觉 + 集成(代码 grep) |
| **D-16** | Tailwind v4 `@theme` OKLCH 调色板生效;`bg-glass-L1/3` 工具类自动生成 | `npx tsc --noEmit` + Playwright 视觉对比 v3.1 |
| **D-17** | `<OuterShell>` 包装生效;折叠态静态折射,展开态动态(0.35 elasticity) | Playwright 视觉对比 + 拖动观察 |

---

## 8. 风险与缓解

| 风险 | 等级 | 缓解 |
|---|---|---|
| Windows 10 / Linux GNOME 某些 WM 不支持 backdrop-filter | 中 | D-01 fallback 实色 α=0.72 已就位;`@supports` 检测 |
| `task_aggregate_today` 后端未实现时阻塞 UI | 低 | 前端降级显示 0:00:00 · 0 段 + 错误 toast |
| grid-template-rows 在 Safari < 16 不支持 0fr → 1fr 形变 | 低 | macOS 13+ 是底线,Safari 16 内置 |
| 浮窗拖到屏幕外 | 低 | mousemove 时限制 left/top 在父容器内,鼠标松开后下次唤起位置不变 |
| 用户期望 "保存(⌘S)" 后自动启动计时(老 V1.5 行为) | 中 | 新用户首次使用展示 tooltip:"保存仅创建记录,启动计时切 ⏱ 面板" |
| **D-16 风险**:`tailwindcss-animate@1.0.7` 删除后,现有 `tailwindcss-animate` 动画类(`animate-in/out` 等)需迁到 `tw-animate-css@1.4.0` 命名 | 中 | `grep -r "animate-in\\|animate-out" src/` 列出影响面,迁完再 rm;`npx tsc --noEmit` + `npx vitest run` 全绿 |
| **D-16 风险**:Tailwind v4 升级后,PostCSS 配置 / Vite 插件切换可能导致现有 CSS 编译失败 | 中 | `npx @tailwindcss/upgrade` 自动迁 80%;保留 `tailwind.config.ts` 备份,失败可回滚;Playwright 视觉回归基线作为客观验证 |
| **D-17 风险**:`liquid-glass-react@latest` 标 React 19 alpha peer dep,本项目 React 19.1.0 可能报 warning 或类型错误 | 中 | `pnpm install` 后立刻跑 `npx tsc --noEmit` + `npx vitest run`;若 alpha 阻塞,`pnpm i liquid-glass-react@next` 或本地 fork |
| **D-17 风险**:WebGL 在低性能设备 / 远程桌面 / 虚拟桌面可能掉帧(< 30fps) | 低 | `liquid-glass-react` 内部有 `'WebGLRenderingContext' in window` 检测;不可用时降级为普通 div,无折射但 UI 正常;`<noscript>` 兜底 |
| **D-17 风险**:`@supports not (backdrop-filter)` 平台(Windows 7/8 / 老 Linux)同时失去 WebGL 折射 + CSS 玻璃 | 低 | 走 GlassSurface `variant="fb"` 实色 α=0.72 fallback,OuterShell 检测后渲染为 div 不包 LiquidGlass |

---

## 9. 迁移路径

### 9.0 阶段 0 — 技术栈升级(D-16 + D-17,半天)

> **必须最先做**,后续阶段都依赖此处的 `@theme` token / OuterShell 包装。

**9.0.1 Tailwind v3.4 → v4.3 升级**(D-16,2-3h):

```bash
# 1. 装新包
npm i tailwindcss@^4.3.1 @tailwindcss/vite @tailwindcss/forms
npm i -D @playwright/test
npx playwright install chromium webkit

# 2. 升级(自动迁 80%)
npx @tailwindcss/upgrade

# 3. 删旧包
npm rm tailwindcss-animate autoprefixer
rm postcss.config.js

# 4. 注册 Geist 字体到 @theme
#    (改 src/index.css)
```

**9.0.2 OuterShell 接入**(D-17,1-2h):

```bash
pnpm add liquid-glass-react
```

写 `src/floating/OuterShell.tsx`(见 § 6.4.2),`src/floating/App.tsx` 包一层 `<OuterShell isExpanded={isExpanded}>`。

**9.0.3 验证**:
- `npx tsc --noEmit` → 0 error(若 liquid-glass-react 报 React 19 alpha 警告,记录但不阻塞)
- `npx vitest run` → 全绿
- `npx playwright test` → 4 场景 baseline 截图无变化(或 diff < 0.1%)

### 9.1 阶段 1 — 代码与样式准备(零用户感知)

1. 创建 `GlassSurface.tsx` / `FloatShell.tsx` / `SharedHeader.tsx` / `Segmented.tsx` 等新组件,先不接入浮窗 App.tsx
2. 新增 `task_aggregate_today` Rust command + 前端 wrapper
3. 把 `src/styles/glass.css` 的 `--glass-*` token 迁到 `src/index.css` 的 `@theme` 块(OKLCH 表达,见 § 6.4.1)
4. 写单测 + 集成测试

### 9.2 阶段 2 — 替换组件树

1. `src/floating/App.tsx` 替换为 `<OuterShell isExpanded><FloatShell><SharedHeader /><Segmented /><FormSubPanel /></FloatShell></OuterShell>`
2. 浮窗入口 `tauri.conf.json` 不动(尺寸 / decorations 不变)
3. 内测 + 真机对照 `floating-final-v3.html`
4. 跑 Playwright 视觉回归:`npx playwright test`,12 场景 baseline diff < 0.1%

### 9.3 阶段 3 — audit 重跑

1. 重跑 `wf_5344d25c-253` workflow(同 9 个 audit agent)
2. 期望:17 条决策(原 15 + D-16/D-17)全 PRESERVED,0 LOST
3. 失败则回到 Phase 4 修

---

## 10. 不在本文档范围

- V1.5 其他 spec:`docs/specs/2026-06-14-浮动窗口快速记录-design.md` / `2026-06-14-浮动窗口与托盘管理-design.md` / `2026-06-19-主窗改造为设置页-design.md`
- V1.6+:可能的新交互(通知中心 / 浮窗拖动吸附)
- 后端 schema 演进:本文档不改 SQLite schema,`record` / `task` 表结构沿用 V1.5

---

## 附录 A · 决策 ID ↔ brainstorm 决策文件对照

| ID | 来源 brainstorm 文件 | 行/段 |
|---|---|---|
| D-01 | `state-table.html` | 8 态验收表 + B-2 渐变 |
| D-02 | `state-table.html` | segmented mutex |
| D-03 | `form-header.html` | Form 头 A/B |
| D-04 | `form-submit.html` | submit 解耦 |
| D-05 | `folded-density.html` | 折叠态密度 B |
| D-06 | `timer-layout-v2.html` | Timer A 骨架 + 副标题 |
| D-07 | `default-subpanel.html` | 默认 sub-panel B |
| D-08 | `button-style.html` | 按钮 chrome B |
| D-09 | `glass-quality-v6.html` | 呼吸 v6 |
| D-10 | `glass-clear-demo.html`(自洽) | 玻璃配方 |
| D-11 | `glass-clear-demo.html`(自洽) | grid-template-rows |
| D-12 | `glass-clear-demo.html`(自洽) | 4px 阈值 |
| D-13 | `glass-clear-demo.html`(自洽) | DOM 复用 |
| D-14 | `timer-layout-v2.html` | 56px vs 32px |
| D-15 | `glass-clear-demo.html`(捏造) | duration chips 删除 |
| **D-16** | `.planning/2026-06-20-floating-redesign/synthesis-6-agents.md`(Agent C)| Tailwind v3.4 → v4.3 升级 |
| **D-17** | `.planning/2026-06-20-floating-redesign/synthesis-6-agents.md`(Agent B)| liquid-glass-react 浮窗外壳 |

## 附录 B · audit journal 路径

`/Users/jason/.claude/projects/-private-var-www-mindtap/a5c9a412-e898-4d1d-9ee9-15b5be33a7dc/subagents/workflows/wf_5344d25c-253/journal.jsonl`(集成结果 D-01~D-15)

## 附录 C · 视觉锚点 demo

`/private/var/www/mindtap/.superpowers/brainstorm/58461-1781923154/content/floating-final-v3.html`(1100+ 行,单文件 vanilla HTML,可拖动,内嵌决策索引)
