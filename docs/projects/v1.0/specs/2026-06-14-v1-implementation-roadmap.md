---
title: Mindtap V1.0 实施 Roadmap — 技术架构 · 排期 · MVP 范围
date: 2026-06-14
status: draft (待用户 review)
supersedes: —
related:
  - docs/projects/v1.0/prd-v1.2.md
  - docs/superpowers/specs/2026-06-14-liquid-glass-final-overview.md
  - docs/superpowers/specs/2026-06-14-liquid-glass-8-perspective-validation.md
---

# Mindtap V1.0 实施 Roadmap

> **本文档用途**：将探索阶段（8 视角 / docs 体系 / PRD V1.2）所有产出整合为 V1.0 实施的**唯一真理之源**。
>
> **核心问题**：5 项关键决策（MVP 范围 / 设计基线 / Tauri 2 内部栈 / Mac 还原度 / 移动端策略）已全部拍板 — 如何在 12 周内持续交付可演示版本？
>
> **本文范围**：P3-P8 实施阶段的需求 / 架构 / 排期 / 切分 / 数据流 / 错误处理 / 测试 / 验收。
>
> **本文档外**：V1.0 上线后的运维 / 监控 / 推广 / 计费（均不在范围）。

---

## 0. 阅读路径

- **项目经理 / 团队负责人**：第 1、2、3、4、5、12、13、15 节
- **前端工程师**：第 5、6、7、8、9、10、11、12 节
- **后端 / Rust 工程师**：第 5、6、9、10、11 节
- **设计师**：第 7、8、15 节
- **QA / 测试**：第 11、12 节

---

## 1. 一句话总览

**基于 8 视角设计语言 + Tauri 2 + 混合栈（Tailwind + Vanilla CSS + 自研 Liquid Glass 组件 + Drizzle）+ 持续交付节奏，在 12 周内交付"Mac 80→90→95% 渐进 + Windows 80%"的 4 域 MVP（基础存储 / 全局入口 / 高频打卡 / 查看复盘）。**

### 1.1 版本说明（避免二义性）

| 概念 | 含义 | 说明 |
|---|---|---|
| **PRD V1.2** | 产品需求文档版本号 | V1.0（初版）→ V1.1（删账号/云端）→ V1.2（PC 端优先）— 当前生效版本 |
| **V1.0（目标版本）**| projects 首次发布的版本号 | 即"V1.2 PRD 所定义的产品" — 本文 12 周排期的目标产物 |
| **4 域 MVP** | PRD §四 的功能章节划分 | 基础存储 / 全局入口 / 高频打卡 / 查看复盘 |
| **5 类核心操作** | PRD §六 验收的 UI 控件划分 | 情绪 / 作息 / 饮水 / 服药 / 复盘 = 5 个独立 UI 组件（其中 4 个在"高频打卡"域，1 个在"查看复盘"域）|
| **5 项决策（D28-D33）**| 用户 2026-06-14 拍板 | 见第 2.2 节 |

---

## 2. 上下文与 5 项决策

### 2.1 上下文

| 来源 | 关键产出 |
|---|---|
| `docs/projects/v1.0/prd-v1.2.md` | 产品定位 / 7 大功能域 / 3 秒铁律 / 风险登记 / V2.0 演进 |
| `docs/superpowers/specs/2026-06-14-liquid-glass-final-overview.md` | 8 视角总览 / 12 组合 / 4 维度验收 |
| `docs/superpowers/specs/2026-06-14-liquid-glass-8-perspective-validation.md` | 8 视角 7 原则矩阵 / 14 节完整验证 |
| `docs/material/apple/liquid-glass/01-04` | Apple Liquid Glass 设计语言权威定义 |
| `docs/material/apple/hig/01-09` | Apple HIG 9 大章节 |
| `docs/material/apple/swiftui/01-02 + landmarks/01-05` | SwiftUI Liquid Glass 40+ API 实战 |
| 8 视角 prototype files（9 个 HTML）| 14,683 行可运行验证代码 |

### 2.2 5 项已拍板决策（D28-D32）

| # | 决策 | 选项 | 理由 | 来源 |
|---|---|---|---|---|
| **D28** | V1.0 MVP 功能范围 | **核心 4 域**（基础存储 + 全局入口 + 高频打卡 + 查看复盘）| 12 周内可持续交付，4 域足够验证产品假设 | 用户 2026-06-14 |
| **D29** | V1.0 设计基线 | **G 基线 + H 品牌层**（G 跨端架构 + H 4 季主题/动画）| 跨端 + 温度，与 ENFP 人群匹配 | 用户 2026-06-14 |
| **D30** | 排期模式 | **持续交付 + 每周迭代**（每周 demo + 渐进三档）| 风险可控，灵活调整 | 用户 2026-06-14 |
| **D31** | Tauri 2 内部栈 | **混合栈**（Tailwind 4 + Vanilla CSS + shadcn/ui 自研玻璃化 + Drizzle）| 8 视角 14,683 行 CSS 复用 90%，8 周 V1.0 | 用户 2026-06-14 |
| **D32** | Mac 端 Liquid Glass | **逐档渐进**（80% 纯 Web → 90% AppKit → 95% SwiftUI spike 可选）| 与"持续交付"完美契合，R1 风险降级 | 用户 2026-06-14 |
| **D33** | 移动端（iOS/Android）| **暂不决定 V2.0**（符合 PRD V1.2 §十 演进路径）| V1.0 范围聚焦 PC 端 | 用户 2026-06-14 |

---

## 3. 范围与非范围

### 3.1 V1.0 MVP 范围（核心 4 域）

| 域 | 子功能 | 验收（3 秒/1 秒/0 思考）|
|---|---|---|
| **基础存储** | SQLite + Drizzle ORM + rusqlite + IPC | 1 条记录保存 ≤ 0.3 秒；离线 100% |
| **全局入口** | 浮动 + 按钮（可拖动）+ 4 类选择模态 + `Cmd/Ctrl+N` 快捷键 | 任意位置唤起；3 秒内进入模态 |
| **高频打卡** | 情绪/能量滑块（1-10） + 作息双按钮 + 饮水计数 + 服药勾选 | 单次打卡 ≤ 3 秒；自动保存 |
| **查看复盘** | 概览列表（按时间倒序）+ 每日 3 词复盘 + 时间分组 + 当日统计条 | 概览加载 ≤ 1 秒 |

### 3.2 V1.0 严格非范围

| 不做 | 理由 | 推到 |
|---|---|---|
| 灵感捕捉（创意/梦境/金句 + 核心 Todo）| 不在 D28 选的 4 域内 | V1.1 |
| 轻量追踪（习惯打卡 + 消费速记）| 不在 D28 选的 4 域内 | V1.1 |
| 简易设置（标签重命名 + 定时提醒）| 不在 D28 选的 4 域内 | V1.1 |
| 数据导出 / 导入 / 跨设备迁移 | PRD V1.2 D23 决策 | 永不做（用户决策 A）|
| iOS / iPadOS / Android | D33 决策 | V2.0 |
| 多设备实时同步 / 跨端联动 | PRD V1.2 §七 非范围 #6 | 永不做 |
| 社交分享 / 社区 / 好友互动 | PRD V1.2 §七 非范围 #3 | 永不做 |
| 新手引导 / 教程 / 成就 | PRD V1.2 §七 非范围 #5 | 永不做 |
| 多级分类 / 自定义字段 | PRD V1.2 §七 非范围 #1 | 永不做 |
| 数据图表 / 趋势分析 | PRD V1.2 §七 非范围 #2 | 永不做 |

---

## 4. 架构总览

### 4.1 3 层架构

```
┌────────────────────────────────────────────────────────────────┐
│  Tauri 2.x 主进程（Rust）                                       │
│  ├─ 窗口管理（NSWindow / HWND）                                │
│  ├─ 系统集成（菜单栏 / 任务栏 / Dock / 全局快捷键）            │
│  ├─ IPC 桥（WebView ↔ Rust ↔ AppKit 可选）                     │
│  ├─ rusqlite (SQLite)                                          │
│  └─ Tauri Plugins: fs / dialog / notification                  │
├────────────────────────────────────────────────────────────────┤
│  WebView 层（WKWebView / WebView2）                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ React 18 + TypeScript + Vite                            │  │
│  │                                                          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │  │  基础存储 │ │  全局入口 │ │ 高频打卡 │ │ 查看复盘 │    │  │
│  │  │  (sqlite)│ │  (+快速) │ │(情绪作息 │ │(概览3词) │    │  │
│  │  │  schema  │ │   模态)  │ │ 饮水服药) │ │          │    │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │  │
│  │                                                          │  │
│  │  样式: Tailwind 4（layout/utility）                       │  │
│  │        + Vanilla CSS（Liquid Glass 4 档，8 视角复用）     │  │
│  │  状态: Zustand · 路由: React Router v6                   │  │
│  │  表单: React Hook Form + Zod                             │  │
│  │  组件: shadcn/ui（基础）+ 自研玻璃化（Liquid Glass）      │  │
│  │  ORM: Drizzle（TS）+ rusqlite（Rust）                     │  │
│  └──────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│  Mac 增强层（3 档渐进 · D32 · 对齐 6 Sprint 排期）              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 第 1 档（Sprint 1-2）: 纯 Web（80%）                   │  │
│  │ ├─ Mac 80% · Windows 80%                                │  │
│  │ ├─ 跨平台一致，CSS backdrop-filter                       │  │
│  │ └─ 产物：V0.1（S1）+ V0.5（S2 = 80% 还原可演示）          │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ 第 2 档（Sprint 5）: AppKit 桥接（90%）                  │  │
│  │ ├─ Mac 90% · Windows 80%                                │  │
│  │ ├─ 4 个核心区：sidebar / modal / toolbar / card           │  │
│  │ └─ 产物：V0.98（90% + 4 季主题 + 4 核心区 AppKit 玻璃化） │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ 第 3 档（Sprint 6）: SwiftUI 嵌入 spike（95% 可选）      │  │
│  │ ├─ Mac 95% · Windows 80%                                │  │
│  │ ├─ R1 风险 spike 验证，失败停在 90%                      │  │
│  │ └─ 产物：V1.0 RC（95% 或 90% 还原）                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### 4.2 数据流（WebView → Tauri → SQLite）

```
用户点击 "+快速记录"
  ↓
React (RecordModal.tsx)
  ↓
Zustand (quickCheckInStore)
  ↓
React Hook Form 收集数据
  ↓
invoke('save_record', { type: 'mood', payload: { score: 8 } })
  ↓
Tauri Command (Rust: commands.rs)
  ↓
rusqlite.execute("INSERT INTO records ...")
  ↓
Drizzle 查询 / Tauri Event 推回 WebView
  ↓
React 重新渲染（概览列表 + 统计条）
```

**关键约束**：
- 记录保存 ≤ 0.3 秒（PRD V1.2 §五）
- 概览加载 ≤ 1 秒（PRD V1.2 §五）
- 全部离线，无网络请求

### 4.3 项目目录结构

```
projects/
├─ src/                              # React 前端
│  ├─ components/                    # UI 组件
│  │  ├─ glass/                      # 自研 Liquid Glass 组件（8 视角复用）
│  │  │  ├─ GlassContainer.tsx       # 4 档材质容器
│  │  │  ├─ Sidebar.tsx              # 浮动侧栏
│  │  │  ├─ Menubar.tsx              # 顶部菜单栏
│  │  │  ├─ RecordModal.tsx          # 4 类选择模态
│  │  │  └─ FAB.tsx                  # 浮动 + 按钮
│  │  ├─ basic/                      # shadcn/ui 基础组件（玻璃化）
│  │  ├─ domain/                     # 4 域业务组件
│  │  │  ├─ MoodSlider.tsx           # 情绪滑块
│  │  │  ├─ SleepButtons.tsx         # 作息按钮
│  │  │  ├─ WaterCounter.tsx         # 饮水计数
│  │  │  ├─ MedCheckbox.tsx          # 服药勾选
│  │  │  ├─ Overview.tsx             # 概览列表
│  │  │  └─ DailyReview.tsx          # 每日 3 词
│  │  └─ layout/                     # 布局组件
│  ├─ routes/                        # React Router v6 路由
│  │  ├─ records.tsx
│  │  ├─ overview.tsx
│  │  └─ root.tsx
│  ├─ stores/                        # Zustand 状态
│  │  ├─ quickCheckIn.ts             # 高频打卡
│  │  ├─ theme.ts                    # 4 季主题
│  │  └─ platform.ts                 # 平台适配
│  ├─ db/                            # Drizzle ORM
│  │  ├─ schema.ts                   # 表结构
│  │  └─ index.ts                    # 客户端连接
│  ├─ ipc/                           # Tauri IPC 封装
│  │  ├─ records.ts                  # save_record / list_records
│  │  └─ events.ts                   # 事件监听
│  ├─ styles/                        # Vanilla CSS（Liquid Glass）
│  │  ├─ glass.css                   # 4 档材质
│  │  ├─ theme.css                   # 4 季主题色
│  │  └─ animations.css              # H 品牌层动画
│  ├─ hooks/                         # 自定义 Hooks
│  │  ├─ useHotkey.ts                # 全局快捷键
│  │  └─ useTheme.ts                 # 主题切换
│  ├─ lib/                           # 工具库
│  ├─ App.tsx
│  └─ main.tsx
├─ src-tauri/                        # Rust 主进程
│  ├─ src/
│  │  ├─ main.rs                     # Tauri 入口
│  │  ├─ commands.rs                 # IPC 命令
│  │  ├─ db.rs                       # rusqlite 集成
│  │  ├─ macos_bridge.rs             # AppKit 桥接（第 2 档）
│  │  └─ swiftui_spike.rs            # SwiftUI 嵌入 spike（第 3 档，可选）
│  ├─ Cargo.toml
│  └─ tauri.conf.json
├─ tests/                            # 测试
│  ├─ unit/                          # Vitest 单测
│  ├─ e2e/                           # Playwright e2e
│  └─ visual/                        # 视觉回归（截图对比）
├─ docs/                             # 设计文档
└─ prototype/                        # 探索阶段 8 视角 prototype（保留）
```

---

## 5. 完整技术栈

### 5.1 已锁栈（PRD V1.2 §3.2）

| 层级 | 技术 | 版本 | 理由 |
|---|---|---|---|
| 应用壳 | Tauri | 2.x | 5-15MB · 冷启动 < 500ms · Mac/Win 1 等公民 |
| 前端框架 | React | 18 | 生态最成熟 · 类型推断最佳 |
| 语言 | TypeScript | 5.x | strict mode + 零 `any` |
| 构建 | Vite | 5.x | 启动 < 1s · HMR < 100ms |
| 状态 | Zustand | 4.x | 0.3KB · 0 boilerplate |
| 路由 | React Router | v6 | 仅 2 tab + 3 子页，路由简单 |
| 持久层 | SQLite + Drizzle | latest | 跨平台一致 · 单表 + JSON payload |
| Rust 端 DB | rusqlite | latest | 同步 API · Tauri IPC 友好 |

### 5.2 D31 新增栈（混合栈）

| 层级 | 技术 | 版本 | 理由 |
|---|---|---|---|
| CSS 框架 | Tailwind CSS | 4.x | layout/utility 速度 |
| CSS 组件 | Vanilla CSS（手写）| — | Liquid Glass 4 档 + 8 视角 14,683 行复用 |
| 基础组件 | shadcn/ui | latest | Radix + Tailwind · AI 编程友好 |
| 自研玻璃化 | src/components/glass/ | — | 100% 匹配 Liquid Glass |
| 表单 | React Hook Form | 7.x | 受控/非受控混合 · 性能优 |
| 校验 | Zod | 3.x | TS 优先 · 与 Drizzle 集成 |
| 动画 | Framer Motion | 11.x | H 品牌层 · 8 视角动画复用 |
| 图标 | Lucide React | latest | 与 shadcn/ui 配套 · SVG 干净 |
| 测试 | Vitest + Playwright | latest | 单测 + e2e |
| 规范 | Biome | latest | 一体化（lint + format）|

### 5.3 第 2 档新增（Sprint 5 · W9-10）

| 层级 | 技术 | 用途 |
|---|---|---|
| Mac 原生 | AppKit（NSVisualEffectView）| 4 个核心区玻璃化 |
| 桥接 | Tauri AppKit Bridge | Web ↔ AppKit IPC |

### 5.4 第 3 档新增（Sprint 6 · W11-12 spike，可选）

| 层级 | 技术 | 用途 |
|---|---|---|
| Mac 原生 | SwiftUI（NSHostingView）| glassEffect API · 95% 还原 |
| 桥接 | Tauri SwiftUI Bridge | Web ↔ SwiftUI IPC |
| spike | R1 风险验证 | 失败则停在第 2 档（90%）|

---

## 6. 设计语言（Liquid Glass + 4 季主题 + 7 原则）

### 6.1 Liquid Glass 4 档材质（来自 HIG 03-hig-materials.md）

```css
/* Vanilla CSS · 8 视角复用 · 100% 匹配 Apple 官方规范 */
.glass-ultrathin { backdrop-filter: blur(10px) saturate(150%); }
.glass-thin       { backdrop-filter: blur(14px) saturate(160%); }
.glass-regular    { backdrop-filter: blur(20px) saturate(180%); }
.glass-thick      { backdrop-filter: blur(40px) saturate(220%); }
```

**平台适配**（D32 渐进三档）：
- **Mobile (blur 20px)** — glass-regular
- **Windows (blur 26px)** — glass-regular+ (10% 增强)
- **macOS (blur 36px)** — glass-thick

### 6.2 4 季主题（双轨制：品牌色 + 季节色）

```css
/* 季节色（心境）— 4 季切换 */
:root[data-theme="spring"] { --accent: #FBCFE8; }  /* 春粉 */
:root[data-theme="summer"] { --accent: #FED7AA; }  /* 夏橙 */
:root[data-theme="autumn"] { --accent: #E7D2B7; }  /* 秋米 */
:root[data-theme="winter"] { --accent: #C7D2FE; }  /* 冬蓝 */

/* 品牌色（身份）— 固定 4 色，用于 logo / 渐变 */
:root {
  --brand-pink:   #FBCFE8;
  --brand-orange: #FED7AA;
  --brand-mint:   #E7D2B7;
  --brand-blue:   #C7D2FE;
}
```

```ts
// Tailwind config
theme: {
  colors: {
    accent: 'var(--accent)',
    brand: {
      pink: '#FBCFE8',
      orange: '#FED7AA',
      mint: '#E7D2B7',
      blue: '#C7D2FE',
    },
  },
}
```

### 6.3 7 原则 × 8 视角矩阵（探索阶段成果）

| 原则 | G 基线（生产）| H 品牌层 |
|---|---|---|
| 1. Content First | ✅ 内容层零玻璃（G 跨平台一致性）| ✅ 4 季主题不抢内容 |
| 2. Nav Above Content | ✅✅ Sidebar 漂浮 + Inspector 三栏 | ✅ 顶部品牌条不抢眼 |
| 3. Clear Hierarchy | ✅ 3 档动态玻璃强度（mobile/win/mac）| ✅ 8 @keyframes 强化层级 |
| 4. Adaptive Material | ✅✅ 同 DOM 跨 3 平台（最强）| ✅✅ 4 季主题跨平台 |
| 5. Consistency | ✅✅ 29 addEventListener + 4 季主题统一 | ✅ 8 动画 reduce-motion 兜底 |
| 6. Readability | ✅ backdrop-filter + text-shadow | ✅ data-语义色独立于主题 |
| 7. Functional Design | ✅✅ 4 域 MVP 完全可交互 | ✅ 4 季 hero mesh + daily quote |

**注**：G 是生产基线（V1.0 实际开发遵循），H 是品牌层（叠加在 G 之上增加 ENFP 温度）。

---

## 7. 6 Sprint × 2 周 敏捷排期（D30 + 敏捷宣言）

> **本节替代原"12 周排期"。基于敏捷宣言 4 大价值观 + 12 原则 + Scrum Sprint 框架，把 12 周拆为 6 个 Sprint × 2 周**。
>
> **核心转变**：从"一次性 12 周规划" → "6 次 Sprint 迭代 + 持续反思 + 持续调整"
>
> **敏捷原则对齐**（来自 agilemanifesto.org）：
> - 原则 #1：通过尽早和持续交付有高价值软件使客户满意
> - 原则 #3：经常地交付可工作的软件（数周间隔，越短越好）
> - 原则 #7：可工作的软件是进度的首要度量标准
> - 原则 #8：敏捷过程倡导可持续开发速度
> - 原则 #10：简单——使未完成的工作最大化的艺术
> - 原则 #12：团队定期地反思如何能提高成效

### 7.1 6 Sprint 总览

| Sprint | Sprint Goal | 周 | US 数 | 任务数 | Demo 产物 | 阶段 |
|---|---|---|---|---|---|---|
| **S1 脚手架** | Tauri + 4 域路由 + IPC 可用 | W1-2 | 4 | 16 | V0.1 项目可启动 | P3 |
| **S2 UI 骨架** | 4 域空 UI + 4 季主题跨平台 | W3-4 | 6 | 24 | **V0.5 80% 还原可演示** | P4 |
| **S3 核心** | 4 类打卡 UI + 全局入口可交互 | W5-6 | 8 | 32 | V0.7 全部 4 域可交互 | P5 |
| **S4 完善** | 概览 + 复盘 + 持久化 + 测试 | W7-8 | 8 | 32 | **V0.95 完整 90% 还原** | P5-P7 |
| **S5 品牌** | H 品牌层 + 第 2 档 AppKit 桥 | W9-10 | 6 | 24 | V0.98 90% + 4 季主题 | P6 |
| **S6 打磨** | 第 3 档 spike + A11y + RC | W11-12 | 5 | 20 | **V1.0 RC** | P8 |
| | | **合计** | **37** | **148** | 3 个里程碑 | 6 评审 + 6 回顾 |

### 7.2 单人 AI 编程的 Scrum 角色映射

| Scrum 角色 | 单人映射 | 工具/方法 |
|---|---|---|
| **Product Owner** | 用户 + AI 共同 | User Story 定义 + MoSCoW 优先级 |
| **Scrum Master** | 自我 | 保持节奏 + 仪式 + 反思 |
| **Dev Team** | AI 主写 + 自己审测 | Tauri + React + Rust + Tests |
| **Product Backlog** | 4 域 + 60+ User Story | `task_plan.md` 跟踪 |
| **Sprint Backlog** | 每 Sprint 选 4-8 US | `TodoWrite` 任务级跟踪 |
| **Daily Standup** | "昨日/今日/阻塞" 3 问 | 每日 5 分钟（任意时点）|
| **Sprint Review** | 每周五 demo 1h | 演示 + 收集反馈 |
| **Sprint Retrospective** | demo 后 30 分钟 | "继续做/停止做/开始做" 3 列 |
| **Burndown Chart** | TodoWrite 实时跟踪 | Sprint 剩余任务数 vs 理想线 |
| **Definition of Done** | 7 项检查（见 7.6）| 每个 US 验收前过一遍 |

### 7.3 Product Backlog（按 MoSCoW 优先级，37 US）

| 优先级 | 域 | 用户故事 ID | 描述 | Sprint |
|---|---|---|---|---|
| **Must** | 基础存储 | US-01 | SQLite 持久化（PRD §3.4.2 schema）| S1 |
| **Must** | 基础存储 | US-02 | Drizzle ORM 类型安全 CRUD | S1 |
| **Must** | 基础存储 | US-03 | Tauri IPC 通信（save/list/delete）| S1 |
| **Must** | 基础存储 | US-04 | 离线 100% 验证 | S1 |
| **Must** | 全局入口 | US-05 | FAB 浮动按钮（可拖动 + 位置记忆）| S2 |
| **Must** | 全局入口 | US-06 | 4 类选择模态（情绪/作息/饮水/服药）| S3 |
| **Must** | 全局入口 | US-07 | Cmd/Ctrl+N 全局快捷键 | S3 |
| **Must** | 高频打卡 | US-08 | 情绪/能量滑块（1-10 + 4 大 HIG 实践）| S3 |
| **Must** | 高频打卡 | US-09 | 作息双按钮（入睡/起床）| S3 |
| **Must** | 高频打卡 | US-10 | 饮水计数（±1 杯 200ml）| S3 |
| **Must** | 高频打卡 | US-11 | 服药勾选（2 个常用品类）| S3 |
| **Must** | 查看复盘 | US-12 | 概览列表（按时间倒序 ≤ 1s）| S4 |
| **Must** | 查看复盘 | US-13 | 每日 3 词复盘（输入框 + 字数限制）| S4 |
| **Must** | 查看复盘 | US-14 | 时间分组（上午/下午/晚上）| S4 |
| **Must** | 查看复盘 | US-15 | 当日统计条（4 域计数 + 4 季主题色）| S4 |
| **Must** | 状态管理 | US-16 | Zustand 状态持久化 | S3 |
| **Must** | 错误处理 | US-17 | 10 类失败点响应（见 spec §10）| S4 |
| **Must** | 测试 | US-18 | Vitest 单测（Zustand + Drizzle + Zod）| S4 |
| **Must** | 测试 | US-19 | Playwright e2e（4 域 × 3 平台）| S4 |
| **Must** | 性能 | US-20 | 5 项性能指标达标（见 spec §12）| S4 |
| **Should** | 设计语言 | US-21 | 4 域路由 | S2 |
| **Should** | 设计语言 | US-22 | 4 域空 UI（带 Liquid Glass）| S2 |
| **Should** | 设计语言 | US-23 | 4 季主题色 + 主题切换 | S2 |
| **Should** | 设计语言 | US-24 | G 视角 3 平台布局适配 | S2 |
| **Should** | 设计语言 | US-25 | Liquid Glass 4 档材质 | S2 |
| **Should** | 设计语言 | US-26 | G 视角平台检测（localStorage）| S2 |
| **Should** | 品牌 | US-27 | H 视角 4 季主题 + 8 动画 | S5 |
| **Should** | 品牌 | US-28 | H 视角 logo 旋转 + daily quote | S5 |
| **Should** | 品牌 | US-29 | H 视角 4 色 hero mesh | S5 |
| **Should** | 可访问性 | US-30 | reduce-motion 兜底 | S6 |
| **Should** | 可访问性 | US-31 | reduce-transparency 兜底 | S6 |
| **Should** | 可访问性 | US-32 | WCAG AA 通过（axe-core）| S6 |
| **Could** | Mac 增强 | US-33 | 第 2 档：NSVisualEffectView 桥接（90%）| S5 |
| **Could** | Mac 增强 | US-34 | 第 2 档：4 核心区玻璃化（侧栏/模态/工具栏/卡片）| S5 |
| **Could** | Mac 增强 | US-35 | 第 3 档 spike：SwiftUI 嵌入评估 | S6 |
| **Could** | Mac 增强 | US-36 | 第 3 档：玻璃 spike 实施（验证通过才做）| S6 |
| **Could** | 视觉回归 | US-37 | 48 组合视觉回归（4 档 × 4 季 × 3 平台）| S6 |

**US 总数：37 个**（Must 20 + Should 12 + Could 5）

### 7.4 Sprint 1-6 详细拆解

#### Sprint 1：Tauri + 4 域脚手架（W1-2）

**Sprint Goal**：
> "用户能 `pnpm tauri dev` 启动桌面应用，看到 4 域占位 UI + IPC 通信能保存 1 条 record 到 SQLite"

**Sprint Backlog**（4 US · 16 任务）：

| 用户故事 | 任务（≤ 16h）| 文件 |
|---|---|---|
| **US-01** SQLite 持久化 | T1: schema.ts 设计（PRD §3.4.2）· T2: rusqlite 集成 · T3: data location 平台适配 | `src/db/schema.ts` `src-tauri/src/db.rs` |
| **US-02** Drizzle ORM | T4: client 初始化 · T5: 类型推导配置 · T6: CRUD API 封装 | `src/db/index.ts` |
| **US-03** Tauri IPC | T7: commands.rs 编写（save/list/delete）· T8: 前端 invoke 封装 · T9: 错误处理 | `src-tauri/src/commands.rs` `src/ipc/records.ts` |
| **US-04** 离线验证 | T10: 断网测试 · T11: 离线降级 · T12: 备份策略 | `tests/e2e/offline.spec.ts` |

**Sprint 评审产物**：V0.1 — "桌面应用启动 + SQLite 读写 demo + 离线 100%"

**Sprint 回顾**（3 列）：
- 🟢 继续做：Tauri 2 + 混合栈决策 · 每周五 demo 节奏
- 🔴 停止做：过度设计 schema（保持单表 + JSON payload 即可）
- 🔵 开始做：Sprint 0 项目脚手架预热（缩短 S1 工期）

---

#### Sprint 2：4 域 UI 骨架 + 4 季主题（W3-4）

**Sprint Goal**：
> "用户能在 3 平台 × 4 季主题下看到 4 域空 UI 全部带 Liquid Glass 效果"

**Sprint Backlog**（6 US · 24 任务）：

| 用户故事 | 任务（≤ 16h）| 文件 |
|---|---|---|
| **US-21** 4 域路由 | T1: React Router v6 配置 · T2: 4 域 lazy load · T3: 路由守卫 | `src/routes/` |
| **US-22** 4 域空 UI | T4: 基础存储域骨架 · T5: 全局入口域骨架 · T6: 高频打卡域骨架 · T7: 查看复盘域骨架 | `src/components/domain/` |
| **US-23** 4 季主题 | T8: 4 季 CSS 变量 · T9: 主题切换 store · T10: 主题切换 UI | `src/styles/` `src/stores/theme.ts` |
| **US-24** G 视角布局 | T11: Mobile Tab Bar · T12: Windows Sidebar · T13: macOS Menubar+Sidebar | `src/components/layout/` |
| **US-25** Liquid Glass 4 档 | T14: glass-ultrathin CSS · T15: glass-thin CSS · T16: glass-regular CSS · T17: glass-thick CSS | `src/styles/glass.css` |
| **US-26** G 视角平台适配 | T18: localStorage 平台检测 · T19: 3 档 blur 自动切换 · T20: 平台 UI 重排 | `src/stores/platform.ts` |

**Sprint 评审产物**：V0.5 — "4 域空 UI + 4 季主题可切换 + 3 平台自动适配 + Liquid Glass 4 档"

**Sprint 回顾**（3 列）：
- 🟢 继续做：4 季双轨制（品牌色 + 季节色）· Liquid Glass 4 档材质
- 🔴 停止做：5 类操作拆分（先 4 域足够，5 类可在 V1.1）
- 🔵 开始做：Sprint 3 前预研 shadcn/ui 玻璃化方案

---

#### Sprint 3：核心 UI + 全局入口（W5-6）

**Sprint Goal**：
> "用户能通过 FAB 唤起模态，4 类打卡 UI 全部可交互（无持久化集成）"

**Sprint Backlog**（8 US · 32 任务）：

| 用户故事 | 任务（≤ 16h）| 文件 |
|---|---|---|
| **US-05** FAB 浮动按钮 | T1: 浮动组件 · T2: 拖拽逻辑 · T3: 位置记忆（localStorage）· T4: 4 季主题色应用 | `src/components/glass/FAB.tsx` |
| **US-06** 4 类选择模态 | T5: 模态容器 · T6: 4 域快捷入口 · T7: 打开动画（3 秒铁律）· T8: 关闭逻辑 | `src/components/glass/RecordModal.tsx` |
| **US-07** 全局快捷键 | T9: useHotkey hook · T10: Cmd/Ctrl+N 监听 · T11: 冲突检测 | `src/hooks/useHotkey.ts` |
| **US-08** 情绪滑块 | T12: 滑块组件 · T13: 1-10 分逻辑 · T14: timeline-now thumb · T15: 自动保存触发 | `src/components/domain/MoodSlider.tsx` |
| **US-09** 作息双按钮 | T16: 入睡按钮 · T17: 起床按钮 · T18: 时间戳记录 | `src/components/domain/SleepButtons.tsx` |
| **US-10** 饮水计数 | T19: ±1 杯逻辑 · T20: 200ml 单位 · T21: 累计显示 | `src/components/domain/WaterCounter.tsx` |
| **US-11** 服药勾选 | T22: 2 品类切换 · T23: 已服用/未服用勾选 | `src/components/domain/MedCheckbox.tsx` |
| **US-16** Zustand 状态 | T24: store 设计 · T25: 持久化中间件 · T26: 跨组件订阅 · T27: 性能优化（selector）| `src/stores/quickCheckIn.ts` |

**Sprint 评审产物**：V0.7 — "4 域全部可交互（UI 层），状态管理就绪"

**Sprint 回顾**（3 列）：
- 🟢 继续做：FAB 位置记忆 · Cmd+N 快捷键
- 🔴 停止做：FAB 自定义主题（沿用 4 季即可）
- 🔵 开始做：Sprint 4 前评估 Zustand persist 中间件性能

---

#### Sprint 4：概览 + 复盘 + 持久化 + 测试（W7-8）

**Sprint Goal**：
> "4 域所有数据持久化到 SQLite，概览页 ≤ 1s 加载，Vitest + Playwright 全绿"

**Sprint Backlog**（8 US · 32 任务）：

| 用户故事 | 任务（≤ 16h）| 文件 |
|---|---|---|
| **US-12** 概览列表 | T1: 列表组件 · T2: 时间倒序查询 · T3: SQL 索引优化 · T4: 性能测试 | `src/components/domain/Overview.tsx` |
| **US-13** 每日 3 词 | T5: 输入框组件 · T6: 3 词限制 · T7: 自动保存 | `src/components/domain/DailyReview.tsx` |
| **US-14** 时间分组 | T8: 上午/下午/晚上分组 · T9: 边界条件处理 | `src/components/domain/TimeGroup.tsx` |
| **US-15** 统计条 | T10: 4 域计数 · T11: 4 季主题色应用 | `src/components/domain/StatBar.tsx` |
| **US-17** 错误处理 | T12: 10 类失败点响应实现 · T13: 用户感知错误分级 · T14: 降级策略 | `src/utils/errorHandler.ts` |
| **US-18** Vitest 单测 | T15: Zustand store 单测 · T16: Drizzle query 单测 · T17: Zod schema 单测 · T18: 工具函数单测 | `tests/unit/` |
| **US-19** Playwright e2e | T19: 4 域完整流程 e2e · T20: 3 平台跨平台 e2e · T21: 错误场景 e2e · T22: CI 集成 | `tests/e2e/` |
| **US-20** 性能 | T23: 冷启动 < 500ms · T24: 记录保存 < 300ms · T25: 概览 < 1s · T26: bundle < 15MB | `tests/perf/` |

**Sprint 评审产物**：V0.95 — "完整 V1.0 4 域功能 + 90% 还原 + 测试通过 + 性能达标"

**Sprint 回顾**（3 列）：
- 🟢 继续做：Vitest + Playwright 双测试 · 性能监控
- 🔴 停止做：手动 SQL（保持 Drizzle 类型安全）
- 🔵 开始做：Sprint 5 预研 AppKit 桥接

---

#### Sprint 5：H 品牌层 + 第 2 档 AppKit（W9-10）

**Sprint Goal**：
> "Mac 端 4 核心区通过 AppKit NSVisualEffectView 升级到 90% 还原 + H 视角 4 季主题 + 8 动画"

**Sprint Backlog**（6 US · 24 任务）：

| 用户故事 | 任务（≤ 16h）| 文件 |
|---|---|---|
| **US-27** H 4 季主题 + 8 动画 | T1: theme mesh 集成 · T2: 8 @keyframes 迁移 · T3: Framer Motion 集成 | `src/styles/animations.css` |
| **US-28** logo + daily quote | T4: logo 旋转动画 · T5: daily quote 7 句库 · T6: 切换逻辑 | `src/components/brand/` |
| **US-29** 4 色 hero mesh | T7: 4 季 mesh 背景 · T8: 鼠标 specular 跟手 | `src/components/brand/HeroMesh.tsx` |
| **US-33** AppKit 桥接 | T9: macos_bridge.rs 编写 · T10: Tauri AppKit plugin · T11: 4 核心区识别 | `src-tauri/src/macos_bridge.rs` |
| **US-34** 4 核心区玻璃化 | T12: sidebar 玻璃化 · T13: modal 玻璃化 · T14: toolbar 玻璃化 · T15: card 玻璃化 | `src/components/glass/` |
| **US-26** G 视角升级 | T16: 平台自动检测 NSVisualEffectView 可用性 · T17: 自动降级路径 · T18: 性能测试 | `src/stores/platform.ts` |

**Sprint 评审产物**：V0.98 — "Mac 90% 还原 + 4 季主题完整 + 4 核心区 AppKit 玻璃化"

**Sprint 回顾**（3 列）：
- 🟢 继续做：H 视角 8 动画 + 4 季主题
- 🔴 停止做：自定义 4 季插画（用 CSS mesh 即可）
- 🔵 开始做：Sprint 6 前评估 SwiftUI spike 可行性

---

#### Sprint 6：A11y + 第 3 档 spike + RC（W11-12）

**Sprint Goal**：
> "V1.0 发布候选：95% 还原（如 spike 成功）或 90% 还原（如 spike 失败）+ A11y 100% 通过 + 视觉回归 48 组合绿"

**Sprint Backlog**（5 US · 20 任务）：

| 用户故事 | 任务（≤ 16h）| 文件 |
|---|---|---|
| **US-30** reduce-motion | T1: 媒体查询 · T2: 8 动画禁用 · T3: 测试 | `src/styles/a11y.css` |
| **US-31** reduce-transparency | T4: 玻璃降级 · T5: 不透明背景 fallback · T6: 测试 | `src/styles/a11y.css` |
| **US-32** WCAG AA | T7: axe-core 集成 · T8: 颜色对比度测试 · T9: 键盘导航 · T10: 修复 | `tests/a11y/` |
| **US-35** SwiftUI spike | T11: R1 风险评估 · T12: 2 周 spike 验证 · T13: 决定继续/停止 | `src-tauri/src/swiftui_spike.rs` |
| **US-36** SwiftUI 实施（条件）| T14: NSHostingView 集成（如 spike 成功）· T15: 4 核心区迁移 | `src/components/glass/` |
| **US-37** 视觉回归 48 组合 | T16: Playwright 自动化 · T17: 192 张基准图 · T18: 跨 3 平台测试 | `tests/visual/` |
| **RC 准备** | T19: bundle 构建 · T20: 安装包打包 | `tauri build` |

**Sprint 评审产物**：V1.0 RC — "最终版（95% 或 90% 还原）+ A11y 通过 + 视觉回归绿"

**Sprint 回顾**（3 列）：
- 🟢 继续做：每周五 demo 节奏 · 6 Sprint 迭代
- 🔴 停止做：第 3 档 spike 失败后硬上（停在 90% 也可发布）
- 🔵 开始做：V1.1 规划（灵感捕捉 + 轻量追踪 + 简易设置）

---

#### 7.4.x Sprint Review 流程：自己即客户（P1 应改 · 敏捷原则 V3）

> **来源**：[`docs/material/agile/02-agile-values-12-principles-explained.md`](../material/agile/02-agile-values-12-principles-explained.md) — "把自己当客户"
> **修订理由**：原则 V3 "客户合作"——单人项目 = "自己即客户"。原 spec §7.4 提"演示给用户/团队"——但单人项目没"团队"。

**Sprint Review 必做 4 步**（每周五 16:00，1 小时）：

1. **演示**（30 min）：录 1 分钟录屏（V0.1 / V0.3 / V0.5 / V0.7 / V0.95 / V0.98 / V1.0）
2. **客户自评**（最重要 · 15 min）：
   - [ ] "这个 demo 我自己**每天**用得起来吗？"
   - [ ] "这个 demo 解决了**我的某个具体问题**吗？"
   - [ ] "如果现在发布给我自己用，我会装吗？"
3. **数据验证**（10 min）：性能基准（§14.1）+ bundle 体积 + 4 季主题视觉抽查
4. **写下个 Sprint 候选 US**（5 min）：Product Backlog 增量（按 MoSCoW 重新归类）

**为什么"自己即客户"是单人或小团队的核心**：
- 单人项目没有真实客户 → 必须把"自己"当作最挑剔的用户
- 避免"程序员思维"陷阱：技术完美 ≠ 用户喜欢
- V1.0 验收标准 = "我愿不愿意每天用这个"
- V1.0 失败的最常见原因 = "技术牛但用户不用"

**Sprint Review 失败信号**：
- 3 问中 2 个问号答"否" → 必须下个 Sprint 调整（即使技术 OK）
- 录屏时发现"我都不会用" → 立即加 Sprint Goal 修正

### 7.5 Sprint 仪式节奏（每周固定）

| 仪式 | 时间 | 时长 | 参与者 | 产出 |
|---|---|---|---|---|
| **Sprint Planning** | 周一 09:00 | 2h | 用户 + AI | Sprint Backlog（本 Sprint 选 4-8 US）|
| **Daily Standup** | 每日任意时点 | 5min | 自我 | journal.md 3 行（昨日/今日/障碍）|
| **Sprint Review** | 周五 16:00 | 1h | 用户 + 团队 | Demo + "自己即客户"自评（§7.4.x）|
| **Sprint Retrospective** | 周五 17:00 | 30min | 自我 | 3 列：继续做 / 停止做 / 开始做 |
| **Burndown Check** | 周五 16:30 | 10min | 自我 | GitHub Project Board 燃尽图快照 |

#### 7.5.1 Board 与 WIP 限制（Scrumban 核心 · P0 必修）

> **来源**：[`docs/material/agile/05-scrumban.md`](../material/agile/05-scrumban.md) — "1 个 In Progress = 深度工作 + 不分心"

| 列 | WIP 上限 | 含义 |
|---|---|---|
| **📥 Backlog** | ∞ | 未选入 Sprint 的 US |
| **🎯 Selected** | 3 | 本 Sprint 选定的 US（聚焦 + 1-2 buffer）|
| **🛠 In Progress** | **1** | **单人同时只做 1 个 task**（深度工作，不分心）|
| **👀 In Review** | **1** | AI 反馈 review 中（避免 review 堆积）|
| **✅ Done** | ∞ | Sprint 内完成 |
| **📦 Released** | ∞ | Sprint 末归档（git tag v0.1.0 / v0.5.0 / ...）|

**执行**：
- **工具**：GitHub Project Board（Board 标签 / Status 字段）
- **超出 WIP 限制** → 必须等当前 task 完成才能选下一个（不允许"半成品 5 个"）
- **In Review WIP=1** → 强制 AI 反馈有时间消化（避免 review 形同虚设）
- **WIP 哲学**：Scrumban "1 个 In Progress = 深度工作 + 不分心"——单人或小团队尤其需要

#### 7.5.2 可持续节奏（敏捷原则 #8 + XP P10 · P1 应改）

| 规则 | 数值 | 理由 |
|---|---|---|
| **工作时长** | 40 ± 10 小时/周 | 敏捷原则 #8：可持续开发 |
| **Sprint buffer** | 20% 时间留给学习/重构/读文档 | 原则 #5："被激励的个体不等待批准" |
| **重构时间** | Sprint 末留 10% 给 refactoring | 原则 #9：技术卓越 + XP P7 |
| **思考时间** | 避免连续 > 2 小时编码不切换 | 每 90 分钟休息 10 分钟（Pomodoro 变体）|
| **周末保护** | 不强制 7×24，加班 = 短期冲刺 = 长期减速 | 40 小时周优于 7×24 编码 |

> 引用敏捷原则 #8："出资人、开发人员和用户**能够无限期地维持一种不变的步伐**。"——单人 AI 编程 = 长期工程，**短期冲刺会拖垮质量**。

#### 7.5.3 Sprint 长度决策（Scrumban 单人版 · P0 必修）

> **来源**：[`docs/material/agile/05-scrumban.md`](../material/agile/05-scrumban.md) — "单人 2 周太长，1 周能形成'快节奏'反馈循环"

**3 个方案对比**：

| 方案 | Sprint 长度 | Sprint 数 | 总周 | 适用场景 |
|---|---|---|---|---|
| A. 纯 2 周 | 2 周 | 6 | 12 周 | 单人熟悉敏捷 + 时间充裕 |
| B. 纯 1 周 | 1 周 | 12 | 12 周 | 单人冲刺感 + 周五 demo 更频繁 |
| **C. 前紧后松**（本项目采用）| **S1-4 1 周 + S5-6 2 周** | 4+2 | **8 周** | 脚手架/UI 阶段快迭代，集成/打磨阶段稳 |

**采用 C 方案的理由**（"自己即客户"判断）：
- **Phase 0-2 脚手架/UI 骨架**：任务量大但风险低（机械脚手架 + shadcn 集成），1 周冲刺更聚焦
- **Phase 3-6 持久化/性能/A11y**：涉及架构稳定性 + 视觉细节微调，2 周稳
- **总周缩短到 8 周** = 2 个月，符合 PRD V1.2 §1.2 "3 个月内"的激进排期
- **周五 demo 频率**：S1-4 周五 = 4 个 demo（V0.1 / V0.3 / V0.5 / V0.7）→ 反馈循环更紧
- **S5-6 2 周稳**：Sprint 5/6 涉及"品牌 + AppKit"与"A11y + RC"，1 周时间太紧

**新排期（Sprint 长度 = 1 周 × 4 + 2 周 × 2 = 8 周）**：

| Sprint | 长度 | 周次 | Sprint Goal | 里程碑 | 任务数 |
|---|---|---|---|---|---|
| **Sprint 1** | 1 周 | W1 | Tauri 脚手架 + 基础存储 | V0.1 | 8（Plan Phase 0 + 1 合并）|
| **Sprint 2** | 1 周 | W2 | 4 域 UI 骨架 + 4 季主题 | V0.3 | 7（Plan Phase 2）|
| **Sprint 3** | 1 周 | W3 | 核心 UI + 全局入口 + FAB | V0.5 | 8（Plan Phase 3）|
| **Sprint 4** | 1 周 | W4 | 概览 + 复盘 + 持久化 + 测试 | V0.7 | 8（Plan Phase 4）|
| **Sprint 5** | 2 周 | W5-6 | H 品牌层 + AppKit 桥 | V0.95 | 4（Plan Phase 5）|
| **Sprint 6** | 2 周 | W7-8 | A11y + spike + V1.0 RC | V1.0 RC | 6（Plan Phase 6）|

> **排期更新影响**：plan 47 task 总数不变，但 W1-W8 替代原 W1-W12。原 spec §7.3 US 37 条时间估算可保持不变（按"可工作软件"度量而非"日历周"度量）。

### 7.6 Definition of Done（每个 US 必须过 7 项检查）

1. ✅ 代码已提交（git commit + 描述清晰）
2. ✅ 通过 Lint + Format（Biome）
3. ✅ 通过 TypeScript 类型检查（`tsc --noEmit`）
4. ✅ 单元测试覆盖（新增 / 修改的函数）
5. ✅ 集成测试通过（与其他模块交互）
6. ✅ 视觉验证（4 季主题 × 平台适配截图）
7. ✅ 性能达标（≤ 规定时间 / 体积）

### 7.7 燃尽图机制（GitHub Project Board 自动化 · P1 应改）

> **修订**：原 spec §7.7 "用 TodoWrite 替代"——TodoWrite 不是可视化燃尽图。改为 GitHub Project Board 自动生成燃尽图。

#### 7.7.1 工具与机制

- **工具**：GitHub Project Board（v2 视图）+ Issues 标签
- **字段**：Title / Status（Backlog / Selected / In Progress / In Review / Done）/ Sprint / Story Points
- **自动燃尽图**：GitHub Project 自带 Burndown Chart 视图（按 Sprint 视图过滤）
- **每日更新**：每天结束前关闭已完成 Issue（移 Done）→ GitHub 自动重算 burn-down

#### 7.7.2 燃尽图计算逻辑

```
Sprint 1 任务数 = 16 (初始 Selected)
理想线 = 16 / 10 工作日 = 1.6 任务/日（线性下降）

Day 1:  16 → 15 (完成 1)  实际 -1   理想 -1.6  ⚠️ 落后 0.6
Day 2:  15 → 13 (完成 2)  实际 -3   理想 -3.2  ✅ 正常
Day 3:  13 → 12 (完成 1)  实际 -4   理想 -4.8  ⚠️ 略落后 0.8
...
Day 10: 0 完成              实际 -16  理想 -16   ✅ 全部完成
```

#### 7.7.3 Sprint 失败信号

- 实际线 vs 理想线偏差 > 20%
- 连续 3 天无进展
- US 数量 > 容量（> 8 US 拆分 / Sprint）

#### 7.7.4 Sprint 末对比流程

```bash
# 查看当前 Sprint 燃尽图
gh project view --owner @me --format json | jq '.items[] | {title, status: .status.name, sprint}'

# 导出燃尽图数据到 retro.md
gh project view --owner @me --format json > docs/retro/sprint-1-burndown.json
```

**Sprint 末必须做**：对比"实际线 vs 理想线" → 写入 `docs/retro/sprint-N.md` 顶部 → 在 Retrospective 会议讨论偏差原因

### 7.8 持续交付（CD）vs 持续部署（CD）澄清

| 概念 | 定义 | projects V1.0 适配 | 原因 |
|---|---|---|---|
| **持续集成（CI）**| 每次 commit 触发自动化测试 | ✅ 适用 | Vitest + Playwright + Biome |
| **持续交付（CD）**| 通过评审后一键部署到生产 | ✅ **核心实践** | 每周五 demo = 可交付工件 |
| **持续部署（CD）**| 评审后自动部署到生产 | ❌ 不适用 | 桌面应用无生产环境 |

**projects V1.0 = "持续交付"哲学**（敏捷原则 #7）：
- **可工作的软件是进度的首要度量标准**
- 每周五 demo 不是"截图"而是"可运行工件"
- 3 个里程碑（V0.5 / V0.95 / V1.0）= 3 个外部可发布版本

### 7.9 风险与调整机制

**Sprint 失败响应**：
1. **第 1 次偏差 > 20%**：Sprint Planning 加 1h 拆任务
2. **第 2 次偏差 > 20%**：从 Could 优先级裁剪 US
3. **第 3 次偏差 > 20%**：暂停 1 Sprint 重新对齐范围

**范围变更**：
- Must 优先级 US：原则上不变更（如必须变更 → 砍等价 Should）
- Should 优先级 US：Sprint 评审时调整
- Could 优先级 US：根据进度灵活调整

**V1.0 → V1.1 演进**：
- V1.1 = "Should 中未做完 + 新增 灵感捕捉 + 轻量追踪 + 简易设置"
- 预计 V1.1 = 4-6 周（基于 V1.0 经验）

#### 7.9.x 范围变更三关评估（敏捷原则 #2 欢迎变更 · P1 应改）

> **来源**：[`docs/material/agile/02-agile-values-12-principles-explained.md`](../material/agile/02-agile-values-12-principles-explained.md) — "变更是'新信息'不是'失败'——但需要显式评估避免 scope creep"

新增 / 修改 US 时**必须**经三关评估（在 Sprint Planning 会议用 5 分钟决策）：

| 关 | 评估问题 | 不通过则 |
|---|---|---|
| **价值关** | "这个功能解决**当前**用户需求吗？" | 砍 / 推迟到 V2.0 |
| **风险关** | "会增加 > 1 天的延期风险吗？" | 推迟到 V1.1 |
| **时机关** | "现在加 vs 2 周后加，哪个价值更大？" | 推迟 / 加 buffer |

**3 关设计理由**：
- **价值关** 对齐原则 V3 "客户合作"（= 自己即客户自评）
- **风险关** 对齐原则 V1 "个体和互动"（= 保护自己的深度工作时间）
- **时机关** 对齐原则 V4 "响应变化"（= 接受变更但不当场反应）

**示例**：

| 变更提案 | 价值关 | 风险关 | 时机关 | 决策 |
|---|---|---|---|---|
| 加搜索功能 | ❌ V1.0 不需要 | — | — | 推迟到 V1.1 |
| 加 4 季背景图 | ✅ 提升氛围 | ⚠️ 2 天 | ✅ 现在 | 加到 Sprint 5 |
| 加 iCloud 同步 | ❌ V1.0 明确非范围 | — | — | 砍 |
| 加快捷键 | ✅ 提升效率 | ✅ 0.5 天 | ⚠️ Sprint 6 已满 | 推迟到 V1.1 |

**变更是"新信息"不是"失败"**——但需要显式评估避免 scope creep 失控。

#### 7.9.y 范围变更分类处理（继承原 §7.9 · 修订）

| US 优先级 | 变更处理 | 决策权 |
|---|---|---|
| **Must 优先级** | 原则上不变更（如必须变更 → 砍等价 Should）| 用户（自己）|
| **Should 优先级** | Sprint 评审时调整（过三关）| 用户（自己）|
| **Could 优先级** | 根据进度灵活调整（过三关）| 用户（自己）|
| **新增 US（任何优先级）**| **必须过三关 + 写 §7.9.z 变更日志**| 用户（自己）|

#### 7.9.z 范围变更日志模板

```markdown
## 变更日志 (Sprint X)

### 2026-06-XX · US-15 调整为 Should
- **原状**：Must 优先级 · 4 季主题切换 UI
- **新状**：Should 优先级 · 推迟到 V1.1
- **三关评估**：
  - 价值关：⚠️ 重要但不紧急
  - 风险关：❌ 4 季主题会与 Liquid Glass 4 档冲突，需重构
  - 时机关：✅ V1.0 简化版（2 季）够用
- **决策者**：用户
- **影响**：释放 Sprint 2 任务容量，可加 1 个新 US
```

---

---

> **本章节结构说明（来自用户 2026-06-14 关键反馈）**：
> 原 §8-§22 按瀑布模型分章（4 域 → 数据流 → 错误 → 测试 → 验收），
> 但敏捷原则 #7 要求"可工作的软件是进度的首要度量"。
> 因此重构为按 **Sprint 横切** —— **每个 Sprint = 一个最小可运行版本**，
> 每个 Sprint 章节含 7 元素：**目标 / 任务 / 数据流 / 错误处理 / 测试 / 演示 / 验收**。
> 跨 Sprint 主题（性能基准 / 风险登记 / 视觉规范 / V2.0 演进 / 决策 / 索引 / 启动 / 待办）统一收口到 §14。

---

## 8. Sprint 1 横切 · 脚手架 + 基础存储（W1-2 · V0.1）

> **Sprint Goal**：用户能 `pnpm tauri dev` 启动桌面应用，4 域占位 UI 可导航，IPC 通信能保存 1 条 record 到 SQLite，离线 100% 可用。

### 8.1 任务（Sprint Backlog）

| 用户故事 | 任务（≤ 16h）| 文件 | 验收 |
|---|---|---|---|
| **US-01** SQLite 持久化 | T1: schema.ts 设计 · T2: rusqlite 集成 · T3: data location 平台适配 | `src/db/schema.ts` · `src-tauri/src/db.rs` | `records` 表 + 2 索引（PRD §3.4.2）|
| **US-02** Drizzle ORM | T4: client 初始化 · T5: 类型推导配置 · T6: CRUD API 封装 | `src/db/index.ts` | 类型安全的 CRUD API |
| **US-03** Tauri IPC | T7: commands.rs 编写（save/list/delete）· T8: 前端 invoke 封装 · T9: 错误处理 | `src-tauri/src/commands.rs` · `src/ipc/records.ts` | IPC 通信端到端可跑通 |
| **US-04** 离线验证 | T10: 断网测试 · T11: 离线降级 · T12: 备份策略 | `tests/e2e/offline.spec.ts` | 断网 100% 可用 |

**SQLite Schema**（沿用 PRD V1.2 §3.4.2）：
```sql
CREATE TABLE records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,           -- 'mood' | 'sleep' | 'water' | 'med' | 'review'
  payload JSON NOT NULL,         -- 类型相关字段
  created_at INTEGER NOT NULL,   -- Unix timestamp (ms)
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_records_created_at ON records(created_at);
CREATE INDEX idx_records_type ON records(type);
```

**数据位置**（PRD V1.2 §3.4.3）：
- macOS：`~/Library/Application Support/com.projects.app/projects.db`
- Windows：`%APPDATA%\com.projects.app\projects.db`

### 8.2 数据流（Sprint 1 范围 · 写）

```
用户点击 4 域占位 UI 的 "插入示例数据" 按钮（调试用）
  ↓
React (App.tsx) 构造 Record = { type: 'mood', payload: { score: 5 } }
  ↓
Zod schema 校验（src/db/schema.ts）
  ↓
invoke('save_record', { type, payload })
  ↓ Tauri IPC
Tauri Command (Rust: commands.rs::save_record)
  ↓
rusqlite.execute("INSERT INTO records (type, payload, created_at, updated_at) VALUES (?, ?, ?, ?)")
  ↓
返回 { id: last_insert_id, duration_ms }
  ↓
React console.log(写入耗时) + UI 显示"已保存 #ID"
```

> Sprint 1 数据流只覆盖"写"，"读"和"概览"留到 Sprint 4 集成。读/写分离是 Sprint 4 核心任务。

### 8.3 错误处理（Sprint 1 范围）

| 失败点 | 检测 | 响应 | 兜底 |
|---|---|---|---|
| SQLite 写入失败 | rusqlite 返回 `Err` | 红色 toast"保存失败，请重试" + 保留用户输入 | 1 次重试（间隔 100ms）|
| IPC 通信失败 | Tauri `invoke` reject | console.error + 提示"IPC 异常，请重启" | 5 秒后自动重试 |
| 数据目录无权限 | `dirs::data_dir()` 返回 None | 弹出系统对话框提示选择目录 | fallback 到用户主目录 |
| Schema 迁移失败 | rusqlite schema 校验 | 应用启动失败 + 错误日志 | 备份 + 重建空表 |

### 8.4 测试

| 测试类型 | 内容 | 通过标准 |
|---|---|---|
| 单元 | Drizzle query · Zod schema 校验 | Vitest 100% 通过 |
| 集成 | IPC 端到端 save_record → SQLite | `assert db.query('SELECT count(*) FROM records')` 正确 |
| E2E | 断网后启动 + 写入 + 重启验证数据 | Playwright 离线模式 100% 通过 |

### 8.5 演示

> **Sprint Review 演示脚本**（周五 16:00）：

1. `pnpm tauri dev` 启动应用
2. 点击 4 域占位 UI 的"调试插入"按钮 → Toast 显示"已保存 #1" + 耗时 < 50ms
3. 关闭应用 + 断网 + 重新启动 → 数据库文件 `projects.db` 仍存在 + 数据完整
4. **产物 V0.1**：可运行的 Tauri 桌面应用 + SQLite 持久化 + 离线 100%

### 8.6 验收（Definition of Done · Sprint 1 子集）

- ✅ V0.1 可发布：`pnpm tauri build` 产出 .app / .msi 安装包
- ✅ SQLite 文件正确创建在平台数据目录
- ✅ 单条 record 写入 < 50ms（含 IPC 开销）
- ✅ 离线 100% 可用（断网启动不报错）
- ✅ Vitest + Playwright 全绿
- ✅ 代码已提交 + Lint/Format/TS 检查通过
- ✅ Sprint Review 用户签字

---

## 9. Sprint 2 横切 · 4 域 UI 骨架 + 4 季主题（W3-4 · V0.5）

> **Sprint Goal**：用户能在 3 平台 × 4 季主题下看到 4 域空 UI 全部带 Liquid Glass 效果。**V0.5 = 80% 视觉还原里程碑**。

### 9.1 任务（Sprint Backlog）

| 用户故事 | 任务（≤ 16h）| 文件 | 验收 |
|---|---|---|---|
| **US-21** 4 域路由 | T1: React Router v6 配置 · T2: 4 域 lazy load · T3: 路由守卫 | `src/routes/` | 4 域可独立访问 + 切换无白屏 |
| **US-22** 4 域空 UI | T4: 基础存储域骨架 · T5: 全局入口域骨架 · T6: 高频打卡域骨架 · T7: 查看复盘域骨架 | `src/components/domain/` | 4 域占位 UI + Liquid Glass 材质 |
| **US-23** 4 季主题 | T8: 4 季 CSS 变量 · T9: 主题切换 store · T10: 主题切换 UI | `src/styles/` · `src/stores/theme.ts` | 4 季切换 < 0.2 秒 |
| **US-24** G 视角布局 | T11: Mobile Tab Bar · T12: Windows Sidebar · T13: macOS Menubar+Sidebar | `src/components/layout/` | 3 平台导航自动适配 |
| **US-25** Liquid Glass 4 档 | T14: glass-ultrathin CSS · T15: glass-thin CSS · T16: glass-regular CSS · T17: glass-thick CSS | `src/styles/glass.css` | 4 档材质 class 可用 |
| **US-26** G 视角平台适配 | T18: localStorage 平台检测 · T19: 3 档 blur 自动切换 · T20: 平台 UI 重排 | `src/stores/platform.ts` | 平台切换 < 0.5 秒 |

### 9.2 数据流（Sprint 2 范围 · 主题）

```
用户点击 "主题切换" 按钮（Spring → Summer）
  ↓
Zustand store.theme.set('summer')
  ↓
document.documentElement.setAttribute('data-theme', 'summer')
  ↓
CSS 变量自动重计算：--accent: #FED7AA
  ↓
所有 .glass-* 元素通过 var(--accent) 重绘
  ↓
React 重新渲染（仅 1 帧）· 用户视觉 < 0.2s 看到变化
```

### 9.3 错误处理（Sprint 2 范围）

| 失败点 | 检测 | 响应 | 兜底 |
|---|---|---|---|
| 4 季主题解析失败 | `getComputedStyle` 返回 undefined | 回落到 `spring` 默认主题 | console.warn |
| 平台检测失败 | `navigator.userAgent` 不匹配 | 默认 Windows | localStorage `projects-platform` 覆盖 |
| Liquid Glass 4 档 CSS 缺失 | Vite 构建产物 grep 失败 | 阻塞发布 | Sprint 2 Sprint Backlog 强制包含 |
| 路由 lazy load 失败 | dynamic import reject | 跳转到错误边界 | 重置到 /records |

### 9.4 测试

| 测试类型 | 内容 | 通过标准 |
|---|---|---|
| 单元 | theme store · platform store · 4 季 CSS 变量 | Vitest 100% 通过 |
| 组件 | 4 域空 UI 渲染 · 4 季切换不闪屏 | Vitest + RTL 通过 |
| E2E | 3 平台（Mac/Win/Mobile WebView）4 季切换 | Playwright 12 组合 100% 通过 |
| 视觉 | V0.5 4 季 × 3 平台 = 12 张基准图 | 手工 + Playwright screenshot |

### 9.5 演示

> **Sprint Review 演示脚本**（周五 16:00）：

1. 打开应用 → 看到默认 Spring 主题
2. 切换到 Summer → Autumn → Winter → 视觉< 0.2s 切换
3. 切换平台（Mac/Win/Mobile 模拟）→ 导航自动重排（Tab Bar / Sidebar / Menubar+Sidebar）
4. 4 域空 UI 全部带 Liquid Glass 4 档（ultrathin/thin/regular/thick 可视）
5. **产物 V0.5**：4 域空 UI + 4 季主题 + 3 平台适配 + Liquid Glass 4 档 → **80% 视觉还原**（与 8 视角 G 视角对齐）

### 9.6 验收

- ✅ 4 域全部有 UI 占位（即使只是标题 + 玻璃容器）
- ✅ 4 季主题可切换，视觉 < 0.2s
- ✅ 3 平台（macOS / Windows / Mobile WebView）布局自动适配
- ✅ Liquid Glass 4 档（ultrathin/thin/regular/thick）class 可用
- ✅ Playwright 12 组合（4 季 × 3 平台）截图通过
- ✅ 每周 demo 视频已录制
- ✅ Sprint Review 用户签字（V0.5 视觉基线确认）

---

## 10. Sprint 3 横切 · 核心 UI + 全局入口（W5-6 · V0.7）

> **Sprint Goal**：用户能通过 FAB 唤起模态，4 类打卡 UI 全部可交互（无持久化集成 — 状态走 Zustand 内存 + localStorage）。**V0.7 = UI 完整 + 状态管理就绪**。

### 10.1 任务（Sprint Backlog）

| 用户故事 | 任务（≤ 16h）| 文件 | 验收 |
|---|---|---|---|
| **US-05** FAB 浮动按钮 | T1: 浮动组件 · T2: 拖拽逻辑 · T3: 位置记忆（localStorage）· T4: 4 季主题色应用 | `src/components/glass/FAB.tsx` | 拖动 + 位置记忆 + 4 季色 |
| **US-06** 4 类选择模态 | T5: 模态容器 · T6: 4 域快捷入口 · T7: 打开动画（3 秒铁律）· T8: 关闭逻辑 | `src/components/glass/RecordModal.tsx` | 打开 ≤ 0.3s + 4 域入口 |
| **US-07** 全局快捷键 | T9: useHotkey hook · T10: Cmd/Ctrl+N 监听 · T11: 冲突检测 | `src/hooks/useHotkey.ts` | Cmd/Ctrl+N 全局唤起 |
| **US-08** 情绪滑块 | T12: 滑块组件 · T13: 1-10 分逻辑 · T14: timeline-now thumb · T15: 自动保存触发 | `src/components/domain/MoodSlider.tsx` | 1-10 分滑动 + 圆 thumb |
| **US-09** 作息双按钮 | T16: 入睡按钮 · T17: 起床按钮 · T18: 时间戳记录 | `src/components/domain/SleepButtons.tsx` | 双按钮 + 时间戳 |
| **US-10** 饮水计数 | T19: ±1 杯逻辑 · T20: 200ml 单位 · T21: 累计显示 | `src/components/domain/WaterCounter.tsx` | ±1 杯 + 累计 |
| **US-11** 服药勾选 | T22: 2 品类切换 · T23: 已服用/未服用勾选 | `src/components/domain/MedCheckbox.tsx` | 2 品类勾选 |
| **US-16** Zustand 状态 | T24: store 设计 · T25: 持久化中间件 · T26: 跨组件订阅 · T27: 性能优化（selector）| `src/stores/quickCheckIn.ts` | 状态跨组件 + persist |

**HIG 09-sliders 4 大实践**（来自 `docs/material/apple/hig/09-sliders.md`）：
1. **Use tick marks to increase clarity**（macOS — 适用 mood slider）
2. **Avoid horizontal sliders in tables**
3. **Ensure sliders don't have keyboard focus by default**
4. **Consider using a stepper**（替代品 · 适用饮水计数）

### 10.2 数据流（Sprint 3 范围 · 模态 + 打卡 UI）

```
用户点击 FAB
  ↓
FAB.onClick → useHotkey 监听 Cmd/Ctrl+N 同样触发
  ↓
打开 RecordModal（动画 < 0.3s · scale + fade）
  ↓
用户点击 "情绪" → 切换到 MoodSlider 子视图
  ↓
拖动滑块到 7 分 → MoodSlider 自动保存触发（onChange commit 0.5s 后）
  ↓
Zustand store.quickCheckIn.add({ type: 'mood', payload: { score: 7 } })
  ↓
Zustand persist 中间件自动写 localStorage `projects-quick-checkin`
  ↓
UI 反馈：滑块颜色变 accent + 简短 toast"已记录"
```

> Sprint 3 数据流**不写 SQLite**（持久化推迟到 Sprint 4 集成），只走 localStorage。
> 这样可在 Sprint 3 末看到 V0.7 = 完整 UI 交互 + 状态管理 demo。

### 10.3 错误处理（Sprint 3 范围）

| 失败点 | 检测 | 响应 | 兜底 |
|---|---|---|---|
| FAB 拖动越界 | `mousemove` 越出 viewport | 钳制到视口边缘（保留 16px margin）| localStorage 不更新 |
| 模态打开超时 | 动画 > 0.3s | 跳过动画直接显示 | console.warn |
| 快捷键冲突 | `useHotkey` 多个监听器 | 后注册覆盖先注册 | 用户在设置里改 |
| Zustand persist 失败 | localStorage quota 满 | 降级为内存 store | console.error + 提示 |
| 滑块 keyboard 焦点 | 默认无（符合 HIG）| 无 | — |
| 4 域打卡 UI 渲染失败 | React ErrorBoundary | 显示"4 域 UI 暂不可用" + 重试按钮 | 重启 WebView |

### 10.4 测试

| 测试类型 | 内容 | 通过标准 |
|---|---|---|
| 单元 | useHotkey · Zustand store · 4 域 reducer | Vitest 100% 通过 |
| 组件 | FAB 拖动 · 模态打开/关闭 · 4 域打卡 UI 交互 | Vitest + RTL 通过 |
| E2E | FAB → 模态 → 4 域打卡 → localStorage 验证 | Playwright 通过 |
| 性能 | 模态打开 < 0.3s · FAB 拖动 60fps | React DevTools Profiler |

### 10.5 演示

> **Sprint Review 演示脚本**（周五 16:00）：

1. 打开应用 → 拖动 FAB 到屏幕右下角 → 关闭应用 → 重启 → FAB 位置记忆
2. 点击 FAB → 模态打开（动画 < 0.3s）→ 选择"情绪"→ 拖动滑块到 7 → toast"已记录"
3. 4 域全跑一遍：情绪 7 / 入睡 / +1 杯 / 服药勾选 → localStorage `projects-quick-checkin` 看到 4 条数据
4. 关闭应用 → 重启 → localStorage 数据保留（虽然 V0.7 还没接 SQLite）
5. **产物 V0.7**：4 域全部可交互（UI 层） + 状态管理就绪 → **V0.5 → V0.7 增量 = 4 域 UI 活起来**

### 10.6 验收

- ✅ 4 类打卡 UI 全部可交互（情绪滑块 / 作息按钮 / 饮水计数 / 服药勾选）
- ✅ FAB 可拖动 + 位置记忆
- ✅ Cmd/Ctrl+N 全局唤起模态
- ✅ 模态打开 ≤ 0.3 秒（3 秒铁律）
- ✅ Zustand store 状态跨组件共享
- ✅ localStorage 持久化（即使没接 SQLite，刷新不丢）
- ✅ Sprint Review 用户签字

---

## 11. Sprint 4 横切 · 概览 + 复盘 + 持久化 + 测试（W7-8 · V0.95）

> **Sprint Goal**：4 域所有数据持久化到 SQLite，概览页 ≤ 1s 加载，Vitest + Playwright 全绿。**V0.95 = 90% 视觉还原 + 测试通过 + 性能达标**（V1.0 完整功能版本）。

### 11.1 任务（Sprint Backlog）

| 用户故事 | 任务（≤ 16h）| 文件 | 验收 |
|---|---|---|---|
| **US-12** 概览列表 | T1: 列表组件 · T2: 时间倒序查询 · T3: SQL 索引优化 · T4: 性能测试 | `src/components/domain/Overview.tsx` | 加载 ≤ 1s + 100 条记录 |
| **US-13** 每日 3 词 | T5: 输入框组件 · T6: 3 词限制 · T7: 自动保存 | `src/components/domain/DailyReview.tsx` | 3 词 + 超 3 词禁用 |
| **US-14** 时间分组 | T8: 上午/下午/晚上分组 · T9: 边界条件处理 | `src/components/domain/TimeGroup.tsx` | 3 分组渲染正确 |
| **US-15** 统计条 | T10: 4 域计数 · T11: 4 季主题色应用 | `src/components/domain/StatBar.tsx` | 4 域计数 + 4 季色 |
| **US-17** 错误处理 | T12: 10 类失败点响应实现 · T13: 用户感知错误分级 · T14: 降级策略 | `src/utils/errorHandler.ts` | 10 失败点全部处理 |
| **US-18** Vitest 单测 | T15: Zustand store · T16: Drizzle query · T17: Zod schema · T18: 工具函数 | `tests/unit/` | 覆盖率 ≥ 80% |
| **US-19** Playwright e2e | T19: 4 域完整流程 · T20: 3 平台跨平台 · T21: 错误场景 · T22: CI 集成 | `tests/e2e/` | e2e 全绿 + CI 集成 |
| **US-20** 性能 | T23: 冷启动 < 500ms · T24: 记录保存 < 300ms · T25: 概览 < 1s · T26: bundle < 15MB | `tests/perf/` | 6 项指标全达标 |

### 11.2 数据流（Sprint 4 范围 · 完整读写 + 概览）

**写（Sprint 1 + Sprint 3 集成）**：
```
用户点击 FAB → 模态 → 4 域打卡 UI
  ↓
Zustand store（4 域数据 + 待保存队列）
  ↓ debounce 500ms
invoke('save_record', { type, payload })
  ↓ Tauri IPC
Tauri Command (Rust: commands.rs::save_record)
  ↓
rusqlite.execute("INSERT INTO records (type, payload, created_at, updated_at) VALUES (?, ?, ?, ?)")
  ↓
返回 { id, duration_ms }
  ↓
Zustand store 更新待保存队列 → 清空
  ↓
Tauri Event 'record_saved' 推回 WebView
  ↓
React 重新渲染（概览列表 + 统计条 + 当日计数）
```

**读（Sprint 4 新增）**：
```
用户切换到 "概览" 页（路由 /overview）
  ↓
React useEffect(() => invoke('list_records', { range: 'today' }))
  ↓ Tauri IPC
Tauri Command (Rust: list_records)
  ↓
rusqlite.query("SELECT * FROM records WHERE created_at >= ? ORDER BY created_at DESC")
  ↓
返回 Vec<Record>
  ↓
React useState / Zustand store.records
  ↓
渲染 Overview 列表（按时间分组：上午/下午/晚上）
  ↓
性能目标：≤ 1 秒（SQLite idx_records_created_at 索引保证）
```

### 11.3 错误处理（Sprint 4 范围 · 完整 8 类）

| 失败点 | 检测 | 响应 | 兜底 |
|---|---|---|---|
| SQLite 写入失败 | rusqlite 返回 `Err` | 模态顶部红色 toast"保存失败，请重试"+ 保留用户输入 | 1 次重试（间隔 100ms）|
| SQLite 读取失败 | rusqlite 返回 `Err` | 概览页"加载失败，点击重试" | 5 秒后自动重试 |
| IPC 通信失败 | Tauri `invoke` reject | 离线 fallback：本地 IndexedDB 暂存 | 5 秒后自动重试 |
| WebView 渲染失败 | React ErrorBoundary | 软降级：禁用 Liquid Glass 动画 · 保留功能 | 重启 WebView |
| Zustand persist 失败 | localStorage quota 满 | 降级为内存 store | console.error |
| 4 季主题解析失败 | `getComputedStyle` 返回 undefined | 回落到 `spring` 默认主题 | console.warn |
| 平台检测失败 | `navigator.userAgent` 不匹配 | 默认 Windows | localStorage 覆盖 |
| 快捷键冲突 | `useHotkey` 多个监听器 | 后注册覆盖先注册 | 用户在设置里改 |

**用户感知错误分级**：
| 错误等级 | 表现 | 例子 |
|---|---|---|
| 🔴 致命 | 应用崩溃 / 数据丢失 | SQLite 文件损坏 |
| 🟡 严重 | 功能不可用 | 模态无法打开 |
| 🟢 轻微 | 视觉降级 | 玻璃效果丢失但功能正常 |
| ⚪ 提示 | 用户操作问题 | 表单校验失败 |

### 11.4 测试（Sprint 4 范围 · 完整测试金字塔）

```
        ╱╲
       ╱  ╲         E2E 测试 (Playwright)
      ╱ 4域 ╲       - 4 域完整流程 × 3 平台
     ╱______╲       - Sprint 4 末必跑
    ╱        ╲      组件测试 (Vitest + RTL)
   ╱  4域组件  ╲    - 4 域业务组件交互
  ╱____________╲    - 每次 commit
 ╱              ╲   单元测试 (Vitest)
╱  工具/状态/ORM  ╲ - Zustand / Drizzle / 表单 / IPC
╱__________________╲- 每次 commit
```

| 测试类型 | 工具 | 覆盖范围 | 频率 |
|---|---|---|---|
| 单元测试 | Vitest | Zustand store · Drizzle query · Zod schema · 工具函数 | 每次 commit |
| 组件测试 | Vitest + React Testing Library | 4 域业务组件 · 表单交互 | 每次 commit |
| E2E 测试 | Playwright | 4 域完整流程 × 3 平台 | Sprint 4 末 + Sprint 6 末 |
| 性能测试 | Tauri DevTools | 冷启动 · 记录保存 · 概览加载 | Sprint 4 末 + 每周 demo |

### 11.5 演示

> **Sprint Review 演示脚本**（周五 16:00 · V0.95 关键里程碑）：

1. **V0.95 = V1.0 完整功能 demo**：
   - 打开应用 → 4 域 UI 全部可见 + 4 季主题
   - 4 域全跑一遍：情绪 7 / 入睡 / +1 杯 / 服药勾选 → SQLite 持久化
   - 切换到"概览"页 → 当日记录按时间倒序 + 时间分组 + 统计条
   - 关闭应用 → 重启 → 数据完整
2. **性能数据**（V0.95 性能指标必须全绿）：
   - 冷启动：< 500ms
   - 记录保存：< 300ms
   - 概览加载：< 1s
   - bundle 体积：< 15MB
3. **测试报告**：
   - Vitest 单元测试 100% 通过
   - Playwright e2e 4 域全绿
4. **产物 V0.95**：完整 V1.0 4 域功能 + 90% 视觉还原 + 测试通过 + 性能达标

### 11.6 验收（V0.95 = 内部发布候选）

- ✅ 4 域完整功能：基础存储 / 全局入口 / 高频打卡 / 查看复盘
- ✅ 概览页加载 ≤ 1 秒（100 条记录基准测试）
- ✅ 3 类操作（情绪/作息/饮水/服药）单条 < 3 秒
- ✅ Vitest + Playwright 全绿
- ✅ 性能 6 项指标全部达标
- ✅ 离线 100% 可用
- ✅ Sprint Review 用户签字（**V0.95 = V1.0 内部 RC**）

---

## 12. Sprint 5 横切 · H 品牌层 + 第 2 档 AppKit（W9-10 · V0.98）

> **Sprint Goal**：Mac 端 4 核心区通过 AppKit NSVisualEffectView 升级到 90% 还原 + H 视角 4 季主题 + 8 动画。**V0.98 = Mac 90% + 品牌层就绪**。

### 12.1 任务（Sprint Backlog）

| 用户故事 | 任务（≤ 16h）| 文件 | 验收 |
|---|---|---|---|
| **US-27** H 4 季主题 + 8 动画 | T1: theme mesh 集成 · T2: 8 @keyframes 迁移 · T3: Framer Motion 集成 | `src/styles/animations.css` | 8 动画 + 4 季主题 |
| **US-28** logo + daily quote | T4: logo 旋转动画 · T5: daily quote 7 句库 · T6: 切换逻辑 | `src/components/brand/` | logo 旋转 + 7 句轮播 |
| **US-29** 4 色 hero mesh | T7: 4 季 mesh 背景 · T8: 鼠标 specular 跟手 | `src/components/brand/HeroMesh.tsx` | 4 季 mesh + 跟手光 |
| **US-33** AppKit 桥接 | T9: macos_bridge.rs 编写 · T10: Tauri AppKit plugin · T11: 4 核心区识别 | `src-tauri/src/macos_bridge.rs` | AppKit 桥可调用 |
| **US-34** 4 核心区玻璃化 | T12: sidebar 玻璃化 · T13: modal 玻璃化 · T14: toolbar 玻璃化 · T15: card 玻璃化 | `src/components/glass/` | 4 区 NSVisualEffectView |
| **US-26** G 视角升级 | T16: 平台自动检测 NSVisualEffectView 可用性 · T17: 自动降级路径 · T18: 性能测试 | `src/stores/platform.ts` | Mac 自动升档 + Win 降级 |

**降级路径**：
```
Mac 启动 → 检测 macos_bridge 可用 → 启用 NSVisualEffectView
  ↓ 失败
退回 80% 纯 Web backdrop-filter
  ↓
Windows 自动跳过 AppKit 检测
```

### 12.2 数据流（Sprint 5 范围 · AppKit 桥）

```
React 渲染 sidebar（CSS 80% 玻璃）
  ↓ useEffect
invoke('macos_apply_glass', { region: 'sidebar', intensity: 'regular' })
  ↓ Tauri IPC
Tauri Command (Rust: macos_bridge.rs)
  ↓
Objective-C 桥接（cocoa crate）：NSVisualEffectView
  ↓
macOS 端 sidebar 区域添加 NSVisualEffectView
  ↓
返回 { applied: true, fallback: false }
  ↓
React store.platform 标记 macos_glass = true
  ↓
后续渲染：sidebar 用 NSVisualEffectView（90%）替代 backdrop-filter（80%）
```

### 12.3 错误处理（Sprint 5 范围）

| 失败点 | 检测 | 响应 | 兜底 |
|---|---|---|---|
| AppKit 桥失败 | Rust `try_into()` 返回 None | 退到栈 1（80% 纯 Web）| Sprint 5 末自动验证 |
| NSVisualEffectView 创建失败 | cocoa 返回 nil | console.warn + 继续用 Web 玻璃 | 自动降级 |
| macOS 版本 < 26 | 系统版本检测 | 完全跳过 AppKit 路径 | 80% 纯 Web |
| H 动画 60fps 不达标 | requestAnimationFrame 监控 | 自动降低动画复杂度 | 保留核心动画 |

### 12.4 测试

| 测试类型 | 内容 | 通过标准 |
|---|---|---|
| 单元 | platform store · AppKit 检测逻辑 | Vitest 100% 通过 |
| 集成 | macos_bridge 端到端（仅 macOS runner）| cargo test 通过 |
| E2E | Mac 端 sidebar/modal/toolbar/card 玻璃效果 | Playwright macOS runner |
| 视觉 | 4 核心区 NSVisualEffectView 截图 vs Web fallback | 视觉差异 < 10% |

### 12.5 演示

> **Sprint Review 演示脚本**（周五 16:00）：

1. **Mac 端 90% 还原**（仅 macOS runner）：
   - 启动应用 → 4 核心区用 NSVisualEffectView 玻璃化
   - 视觉对比：80% 纯 Web 截图 vs 90% NSVisualEffectView 截图
2. **H 品牌层**：
   - 4 季主题切换 → hero mesh 背景渐变
   - 8 动画演示（settle / fade-up / sheen / rotate-logo 等）
   - logo 旋转 + daily quote 切换
3. **Windows 端自动降级**：
   - 启动应用 → 80% Web 玻璃（不调 AppKit）
4. **产物 V0.98**：Mac 90% 还原 + 4 季主题完整 + 4 核心区 AppKit 玻璃化

### 12.6 验收

- ✅ Mac 端 4 核心区（sidebar/modal/toolbar/card）NSVisualEffectView 玻璃化
- ✅ 视觉回归：Mac 90% vs Windows 80%（差异 < 10%）
- ✅ H 视角 4 季主题 + 8 动画全部就绪
- ✅ Windows 端自动降级到 80% Web 玻璃
- ✅ macOS 26 API 稳定性验证
- ✅ Sprint Review 用户签字（**V0.98 = Mac 90% 里程碑**）

---

## 13. Sprint 6 横切 · A11y + 第 3 档 spike + RC（W11-12 · V1.0 RC）

> **Sprint Goal**：V1.0 发布候选：95% 还原（如 spike 成功）或 90% 还原（如 spike 失败） + A11y 100% 通过 + 视觉回归 48 组合绿。

### 13.1 任务（Sprint Backlog）

| 用户故事 | 任务（≤ 16h）| 文件 | 验收 |
|---|---|---|---|
| **US-30** reduce-motion | T1: 媒体查询 · T2: 8 动画禁用 · T3: 测试 | `src/styles/a11y.css` | reduce-motion 全应用 |
| **US-31** reduce-transparency | T4: 玻璃降级 · T5: 不透明背景 fallback · T6: 测试 | `src/styles/a11y.css` | reduce-transparency 全应用 |
| **US-32** WCAG AA | T7: axe-core 集成 · T8: 颜色对比度测试 · T9: 键盘导航 · T10: 修复 | `tests/a11y/` | axe-core 0 violations |
| **US-35** SwiftUI spike | T11: R1 风险评估 · T12: 2 周 spike 验证 · T13: 决定继续/停止 | `src-tauri/src/swiftui_spike.rs` | spike 决定文档 |
| **US-36** SwiftUI 实施（条件）| T14: NSHostingView 集成（如 spike 成功）· T15: 4 核心区迁移 | `src/components/glass/` | 95% 还原（条件性）|
| **US-37** 视觉回归 48 组合 | T16: Playwright 自动化 · T17: 192 张基准图 · T18: 跨 3 平台测试 | `tests/visual/` | 48 组合 100% 绿 |
| **RC 准备** | T19: bundle 构建 · T20: 安装包打包 | `tauri build` | V1.0 RC 安装包 |

**视觉回归 48 组合**：

| 平台 | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|
| **Mobile (blur 20px)** | S1 | S2 | S3 | S4 |
| **Windows (blur 26px)** | W1 | W2 | W3 | W4 |
| **macOS (blur 36px)** | M1 | M2 | M3 | M4 |

每组合截 4 张图（首页 / 概览 / 模态 / 4 季切换）= **192 张基准图**。

### 13.2 数据流（Sprint 6 范围 · SwiftUI spike 条件性）

> 仅当 US-35 spike 成功才执行。

```
Mac 启动 → SwiftUI spike 验证（2 周）
  ↓ 通过
  ├─ NSHostingView 集成 WebView 区域
  ├─ 4 核心区迁移到 SwiftUI 渲染
  └─ 视觉还原度 90% → 95%
  ↓ 失败
  └─ 停在 90% NSVisualEffectView · V1.0 仍发布
```

### 13.3 错误处理（Sprint 6 范围 · 完整降级链）

```
V1.0 完整 (95% / 80%)  ← SwiftUI 成功
  ↓ SwiftUI 失败
V1.0 降级 (90% / 80%)  ← AppKit 成功
  ↓ AppKit 失败
V1.0 降级 (80% / 80%)  ← 纯 Web
  ↓ WebView 失败
V1.0 降级 (纯文本 / 80%)  ← 兜底
  ↓ 致命错误
应用退出 + 错误日志
```

### 13.4 测试（Sprint 6 范围 · 视觉回归 48 组合 + A11y）

| 测试类型 | 工具 | 覆盖范围 | 通过标准 |
|---|---|---|---|
| 单元 | Vitest | 全部模块 | 100% 通过 |
| 组件 | Vitest + RTL | 全部组件 | 100% 通过 |
| E2E | Playwright | 4 域 × 3 平台 | 100% 通过 |
| 视觉回归 | Playwright Screenshot | **48 组合 × 4 截图 = 192 张** | 差异 < 1% |
| 性能 | Tauri DevTools | 6 项指标 | 全部达标 |
| 可访问性 | axe-core + Playwright | WCAG AA · reduce-motion / transparency | 0 violations |

### 13.5 演示

> **Sprint Review 演示脚本**（周五 16:00 · V1.0 RC 发布候选）：

1. **V1.0 RC = 最终交付**：
   - 完整 4 域 + 4 季主题 + 3 平台适配
   - 视觉回归 48 组合 100% 绿
   - A11y 100% 通过（axe-core 0 violations + reduce-motion + reduce-transparency）
2. **第 3 档 spike 决策**：
   - 通过 → 95% 还原 + SwiftUI 4 核心区
   - 失败 → 90% 还原 + 仍可发布（V1.0 = V0.98 + A11y）
3. **V1.0 RC 安装包**：
   - `tauri build` → .dmg (Mac) + .msi (Windows)
   - bundle 体积 5-15MB
4. **产物 V1.0 RC**：最终版（95% 或 90% 还原） + A11y 通过 + 视觉回归绿

### 13.6 验收（V1.0 RC = 外部发布候选）

- ✅ 4 域完整功能（来自 Sprint 4 V0.95）
- ✅ 4 季主题 + 3 平台适配（来自 Sprint 2 V0.5）
- ✅ H 品牌层 + 8 动画（来自 Sprint 5 V0.98）
- ✅ 第 3 档 spike 决策明确（95% 成功 / 90% 失败）
- ✅ A11y 100% 通过（reduce-motion + reduce-transparency + WCAG AA）
- ✅ 视觉回归 48 组合 100% 绿
- ✅ 性能 6 项指标全部达标
- ✅ bundle 5-15MB + 离线 100%
- ✅ **V1.0 RC 用户签字**（决定 V1.0 正式发布或回到 S5/S6 调整）

---

## 14. 跨 Sprint 主题

> 本节是横贯 6 个 Sprint 的不变量（不随 Sprint 变化但每个 Sprint 都受其约束）。

### 14.1 性能基准（每个 Sprint 必查）

| 指标 | 目标 | 测量方式 | 失败阈值 |
|---|---|---|---|
| 冷启动 | < 500ms | Tauri DevTools | > 1s |
| 记录保存 | < 300ms | Tauri IPC + SQLite | > 500ms |
| 概览加载 | < 1s | Playwright timing | > 1.5s |
| 模态打开 | < 300ms | React DevTools | > 500ms |
| 4 季主题切换 | < 200ms | CSS 变量切换 | > 500ms |
| 平台切换 | < 500ms | localStorage + CSS 重排 | > 1s |
| bundle 体积 | 5-15MB | `tauri build` | > 20MB |
| 内存占用 | < 150MB | Activity Monitor | > 200MB |

**Sprint 必查点**：每个 Sprint Review 演示时跑一次全量性能测试，发现退化立即修复。

### 14.2 风险登记（更新自 PRD V1.2 §九 · 横贯 6 Sprint）

| # | 风险 | 等级 | 缓解 | 状态 |
|---|---|---|---|---|
| **R1** | SwiftUI 嵌入 spike 失败 | 🟢 **降级**（D32 渐进）| 第 3 档失败则停在第 2 档（90%）| **S6 验证** |
| **R2** | 12 周时间表激进 | 🟡 中 | 优先 P0 4 域 · 每周 demo · 灵活调整 | **每 Sprint 监控** |
| **R3** | AppKit 桥复杂（第 2 档）| 🟡 中 | 限制 4 个核心区 · Sprint 5 实施 | **S5 验证** |
| **R4** | macOS 26 Liquid Glass API 稳定性 | 🟡 中 | Apple Beta API 在 macOS 26 正式版（2025 秋）后稳定 | **S5/S6 验证** |
| **R5** | Windows 端无原生增强 | 🟢 低 | Web 模拟 80% 还原度已够用 | **已纳入 D32** |
| **R6** | Drizzle + rusqlite IPC 数据序列化 | 🟡 中 | Zod 校验 + 类型推导 | **S1 spike** |
| **R7** | 8 视角 CSS 翻译到 Tailwind | 🟡 中 | Vanilla CSS 直接复用（不翻译）· 已有 D31 决策 | **已纳入 D31** |
| **R8** | shadcn/ui 组件玻璃化成本 | 🟡 中 | 1-2 周专门工作 · Sprint 3 | **S3 验证** |
| **R9** | 视觉回归 48 组合维护成本 | 🟡 中 | Playwright 自动化 + 192 张基准图 | **S4 末 + S6 末** |
| **R10** | 4 季主题视觉一致性 | 🟡 中 | 双轨制（品牌色 + 季节色）· G/H 8 视角已验证 | **D29 已选** |
| **R11** | 单人 AI 编程速度 | 🔴 高 | 持续交付 · 每周 demo · 风险早暴露 | **D30 已选** |

### 14.3 视觉与品牌规范（横贯 6 Sprint · 不变量）

**4 季主题**（同色相家族 + 统一饱和度）：

| 季节 | accent | RGB | 含义 |
|---|---|---|---|
| **Spring 春** | `#FBCFE8` | 251, 207, 232 | 温暖、希望 |
| **Summer 夏** | `#FED7AA` | 254, 215, 170 | 活力、阳光 |
| **Autumn 秋** | `#E7D2B7` | 231, 210, 183 | 沉淀、内省 |
| **Winter 冬** | `#C7D2FE` | 199, 210, 254 | 沉静、深邃 |

**双轨制原则**（来自 8 视角 G/H 探索成果）：
- **品牌色 = 身份**（粉/橙/紫/蓝 4 色 · logo + 渐变 · 固定不变）
- **季节色 = 心境**（Spring/Summer/Autumn/Winter · 只覆盖 `--accent` · 用户可切换）

**字体**：
```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text',
             'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
```

**圆角 + 间距**：

| 元素 | 圆角 |
|---|---|
| 玻璃容器 | 16px (sidebar) / 12px (modal) / 8px (button) |
| 卡片 | 12px |
| 输入框 | 8px |
| FAB | 50% (圆形) |

| 间距单位 | 像素 |
|---|---|
| 1x | 4px |
| 2x | 8px |
| 3x | 12px |
| 4x | 16px |
| 6x | 24px |
| 8x | 32px |

**动画（H 品牌层 · 8 视角 8 @keyframes）**：

| 动画 | 时长 | 缓动 |
|---|---|---|
| settle（弹起 → 落下）| 600ms | cubic-bezier(0.34, 1.56, 0.64, 1) |
| fade-up（淡入上移）| 300ms | ease-out |
| sheen（扫光）| 1500ms | linear · infinite |
| rotate-logo（logo 旋转）| 8s | linear · infinite |
| theme-change（主题切换）| 400ms | ease-in-out |
| modal-open（模态打开）| 250ms | cubic-bezier(0.16, 1, 0.3, 1) |
| hover-lift（悬停上浮）| 200ms | ease-out |
| stat-tick（统计递增）| 800ms | ease-out |

**reduce-motion 兜底**（来自 HIG 08-accessibility P0）：
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 14.4 验收标准（横贯 6 Sprint · V1.0 整体验收）

| # | 标准 | 测量 | 何时验证 |
|---|---|---|---|
| 1 | 5 类核心记录操作随机抽测 < 3 秒 | 手动 + Playwright 计时 | V0.95 (S4) + V1.0 RC (S6) |
| 2 | 概览页 1 秒内完整展示当日记录 | Playwright timing | V0.95 (S4) + V1.0 RC (S6) |
| 3 | 全程无需用户思考操作路径 | 用户测试（5 人内测）| V1.0 RC 后 |
| 4 | macOS 80→90→95% 渐进 | 视觉回归测试 | V0.5 / V0.98 / V1.0 RC |
| 5 | Windows 80% 还原 | 视觉回归测试 | V0.5 + V1.0 RC |
| 6 | 12 周内交付 4 域 MVP | 排期执行 | S6 末 |
| 7 | 离线 100% 可用 | 断网测试 | V0.1 (S1) + V1.0 RC (S6) |
| 8 | WCAG AA 通过 | axe-core | V1.0 RC (S6) |
| 9 | reduce-motion / reduce-transparency 兜底 | Playwright media query | V1.0 RC (S6) |
| 10 | bundle 5-15MB | `tauri build` | V0.5 / V0.95 / V1.0 RC |

### 14.5 V2.0 演进路径（PRD V1.2 §十）

```
V1.0 (本次, 12 周内)
├─ Mac 80→90→95% 渐进 · Windows 80%
├─ Tauri 2 + 混合栈（Tailwind + Vanilla CSS + 自研 + Drizzle）
├─ 核心 4 域 MVP
├─ 全本地 SQLite
├─ 持续交付 + 每周 demo
└─ 4 季主题 + Liquid Glass 设计语言

V1.1 (后续 4-6 周)
├─ 灵感捕捉（创意/梦境/金句 + 核心 Todo）
├─ 轻量追踪（习惯打卡 + 消费速记）
├─ 简易设置（标签重命名 + 定时提醒）
└─ 4 季主题 → 用户可上传自定义主题

V2.0 (后续, 暂不规划)
├─ iOS 端: SwiftUI (复用 V1.0 SwiftUI 视图)
├─ Android 端: Tauri 移动端 or Kotlin (D33 待定)
├─ 语音转文字: iOS Speech + Android SpeechRecognizer
└─ 数据互通: 暂不要求（V1.0 数据全本地）
```

**V1.0 → V2.0 复用度**：
- React + TS 代码：100% 复用（Tauri 2 iOS/Android 直接支持）
- Rust 主进程：80% 复用（IPC 命令可重用）
- 自研 Liquid Glass 组件：100% 复用
- SwiftUI 视图（如有）：100% 复用（Apple 平台统一）

### 14.6 探索轨迹索引

| 阶段 | 时间 | 产出 |
|---|---|---|
| B 系列 (B1-B5) | 2026-06-14 上午 | brainstorming 阶段（4 变体构思）|
| 4 变体 (Q1-Q4) | 2026-06-14 中午 | 4 视角 prototype · 已废止 |
| 8 视角 (A-H) | 2026-06-14 下午 | 9 HTML prototype · 14,683 行 |
| 8 视角验证 | 2026-06-14 下午 | 7 原则 × 8 视角矩阵 · 89 AEL / 30 KF / 182 BDF |
| 最终总览 | 2026-06-14 晚上 | 12 组合 · 4 维度验收 |
| 决策整合 | 2026-06-14 晚上 | 5 项决策（D28-D33）|
| V1.0 roadmap（本文档）| 2026-06-14 晚上 | 实施 spec · 12 周排期 |

### 14.7 决策清单（汇总）

| # | 决策 | 来源 |
|---|---|---|
| D1-D20 | 探索阶段决策 | final-overview.md / 8 视角 spec |
| D21-D27 | PRD V1.2 决策（产品 / 平台 / 范围）| prd-v1.2.md §八 |
| D28 | MVP 范围 = 核心 4 域 | 用户 2026-06-14 |
| D29 | 设计基线 = G + H | 用户 2026-06-14 |
| D30 | 排期 = 持续交付 | 用户 2026-06-14 |
| D31 | Tauri 内部栈 = 混合栈 | 用户 2026-06-14 |
| D32 | Mac 还原度 = 渐进三档 | 用户 2026-06-14 |
| D33 | 移动端 = 暂不决定 V2.0 | 用户 2026-06-14 |

### 14.8 文档交叉引用

**上游（输入）**：
- `docs/INDEX.md` — Apple 资料索引
- `docs/projects/v1.0/prd-v1.2.md` — V1.2 PRD（产品需求基线）
- `docs/superpowers/specs/2026-06-14-liquid-glass-final-overview.md` — 8 视角最终总览
- `docs/superpowers/specs/2026-06-14-liquid-glass-8-perspective-validation.md` — 8 视角 7 原则矩阵
- `docs/superpowers/specs/2026-06-14-glass-2x2-matrix.md` — 2x2 矩阵起源
- `docs/material/apple/liquid-glass/01-overview.md` — Liquid Glass 总览
- `docs/material/apple/liquid-glass/03-hig-materials.md` — 4 档材质规范
- `docs/material/apple/hig/01-09` — 9 大 HIG 章节
- `docs/material/apple/swiftui/01-key-apis.md` — 40+ SwiftUI API
- `docs/material/apple/swiftui/landmarks/01-05` — Landmarks 5 个子教程

**下游（输出）**：
- 未来 `docs/superpowers/specs/2026-XX-XX-v1-implementation-plan.md` — 实施 plan（writing-plans skill 输出）
- 未来 `projects/CLAUDE.md` — 项目开发指南（如适用）
- 未来 `projects/README.md` — 用户使用手册（如适用）

### 14.9 关键教训（从探索阶段提炼 · 横贯 6 Sprint）

1. **CSS 解析层 bug 必须看真实渲染**（Q3 data URL 换行截断）— 静态审计 grep 不能发现
2. **Subtle Glass 隐藏前提是"有色彩可折射"**（D6 修复）— 背景 mesh 2→5、blur 12→20、白叠加 0.72→0.45
3. **同色相家族 + 统一饱和度**比 4 季分别用高饱和度更协调（D8 4 主题淡雅化）
4. **数据语义色独立于主题色板**（H 视角 stat__delta）— 用 #047857 绿 / #B91C1C 红
5. **双轨制色彩**避免品牌色与季节色冲突（G 4 主题主色只覆盖 `--accent`）
6. **AI 编程时代首选 Tauri 2**（Rust 类型系统 LLM 错误率最低 + Web 生态 npm 2.5M）— 体积 5-10x 优于 Electron
7. **持续交付优于一次性 12 周大爆炸** — 风险早暴露 + 灵活调整
8. **混合栈优于单一栈**（Tailwind 速度 + Vanilla CSS 保真）— 8 视角 14,683 行 90% 复用
9. **渐进三档优于一步到位 95%**（D32）— 80% 出可演示，90% 升级，95% spike 可选
10. **每周 demo 倒逼架构选型** — 渐进哲学与持续交付天然契合
11. **每个 Sprint 必须端到端可运行**（本文档重构核心）— 不再做"先全部设计再全部实现"的瀑布分工

#### 14.9.x 简单设计 4 规则（XP P5 · P2 可选）

> **来源**：[`docs/material/agile/03-xp-12-practices.md`](../material/agile/03-xp-12-practices.md) — "通过所有测试 / 不重复 / 表达清晰 / 最少代码"
> **执行**：每 Sprint 末做 1 次"简单设计审计"——标记违反规则的代码，下 Sprint 重构

| 规则 | 定义 | 反例 |
|---|---|---|
| 1. **通过所有测试** | 没有红测试 | `it.skip()` 跳过失败测试 |
| 2. **不重复** | DRY（Don't Repeat Yourself）| 3 处复制粘贴相同逻辑 |
| 3. **表达清晰** | 代码读起来像英文 | `if (x && y && z) {...}` 不抽命名 |
| 4. **最少代码** | YAGNI 严格落地 | "也许未来需要" 加的配置/参数 |

**审计清单**（每 Sprint Retrospective 必做）：

```markdown
## Sprint N 简单设计审计

- [ ] 1. 通过所有测试：✅ 0 跳过 / 0 失败
- [ ] 2. 不重复：✅ 无 3+ 处复制（grep "复制"）
- [ ] 3. 表达清晰：✅ 关键函数有 doc comment
- [ ] 4. 最少代码：✅ 无 "未来用得上" 注释

**违反项**（如有过）：
- [文件:行号] 违反规则 X → 下 Sprint 重构
```

### 14.10 启动方式

**P3 启动命令（第 1 周 · Sprint 1 开始前）**：
```bash
# 1. 初始化 Tauri 2 项目
cd /home/jason/workspace/projects
pnpm create tauri-app@latest projects-v1 \
  --template react-ts \
  --manager pnpm

# 2. 安装核心依赖
cd projects-v1
pnpm add zustand react-router-dom react-hook-form zod \
         @hookform/resolvers drizzle-orm better-sqlite3 \
         tailwindcss @tailwindcss/forms \
         lucide-react framer-motion

# 3. 安装 Tauri 插件
pnpm tauri add sql
pnpm tauri add dialog
pnpm tauri add notification
pnpm tauri add fs

# 4. 安装 Rust 端依赖
cd src-tauri
cargo add rusqlite --features bundled
cargo add serde --features derive
cargo add serde_json

# 5. 启动开发
cd .. && pnpm tauri dev
```

**每周 Demo 节奏**（横贯 6 Sprint）：
```
每周五 16:00 · 固定 demo
├─ 演示本周 Sprint 完成的功能
├─ 视觉对比（48 组合中本周涉及的部分）
├─ 性能数据（冷启动 / 记录保存 / 概览加载）
├─ 下周 Sprint 计划 + 风险点
└─ 用户/团队反馈 → 调整下周任务
```

**验证清单**（用于查看 8 视角 prototype + 后续 demo）：
```bash
cd /home/jason/workspace/projects
python3 -m http.server 8765
# 浏览器访问
http://localhost:8765/prototype/compare.html  # 8 视角总览
http://localhost:8765/prototype/D7-adaptive.html  # G 视角（生产基线）
http://localhost:8765/prototype/D8-expressive.html  # H 视角（品牌层）
```

### 14.11 后续待办（V1.0 实施阶段）

| # | 待办 | 触发 | 输出 |
|---|---|---|---|
| T1 | writing-plans skill 输出实施 plan | 用户启动 P3 | `docs/superpowers/specs/2026-XX-XX-v1-implementation-plan.md` |
| T2 | Sprint 1 脚手架（W1-2）| T1 完成后 | V0.1 可发布 + SQLite 持久化 |
| T3 | Sprint 2 4 域 UI 骨架（W3-4）| T2 完成后 | V0.5（80% 还原）演示 |
| T4 | Sprint 3 核心 UI + 全局入口（W5-6）| T3 完成后 | V0.7（4 域活起来）|
| T5 | Sprint 4 概览 + 复盘 + 测试（W7-8）| T4 完成后 | V0.95（90% 还原 + 测试）|
| T6 | Sprint 5 品牌 + 第 2 档 AppKit（W9-10）| T5 完成后 | V0.98（Mac 90% + 品牌层）|
| T7 | Sprint 6 A11y + spike + RC（W11-12）| T6 完成后 | V1.0 RC（95% 或 90%）|
| T8 | 内测 + 反馈 | T7 完成后 | 5 人内测 + 反馈汇总 |
| T9 | V1.0 正式发布 | T8 反馈处理完后 | V1.0 正式发布 |

---

## 附录 A · Sprint 横切结构对照表（重构前 vs 重构后）

| 重构前（瀑布） | 重构后（敏捷横切） | 变化说明 |
|---|---|---|
| §8 MVP 4 域详细切分（按域 1/2/3/4 纵向分章）| §8-§13 Sprint 1-6 横切（每个 Sprint 含 7 元素）| 按 Sprint 切分，每个 Sprint 端到端可运行 |
| §9 数据流（统一写一次）| 分散到 §8.2 / §9.2 / §10.2 / §11.2 / §12.2 / §13.2 | 每个 Sprint 单独写该 Sprint 范围的数据流 |
| §10 错误处理（统一写 8 类失败）| 分散到 §8.3 / §9.3 / §10.3 / §11.3 / §12.3 / §13.3 + §14.2 风险登记 | 错误处理跟随 Sprint 演进，最初简单、逐步完善 |
| §11 测试策略（金字塔 + 48 组合）| 分散到 §8.4 / §9.4 / §10.4 / §11.4 / §12.4 / §13.4 + §14.1 性能基准 | 测试随 Sprint 增量：S1 离线、S2 主题、S3 模态、S4 全量、S5 视觉、S6 48 组合 |
| §12 关键指标 | §14.1 性能基准 + §14.4 验收标准 | 移到跨 Sprint 主题，不重复 |
| §13 风险登记 | §14.2 风险登记 + 各 Sprint 错误处理 | 风险横贯 6 Sprint + 每 Sprint 局部 |
| §14 验收标准 | §14.4 验收标准（横贯）+ 每个 Sprint 末尾"该 Sprint 验收" | 局部 + 全局双层 |
| §15 视觉与品牌规范 | §14.3 视觉与品牌规范 | 移到跨 Sprint 主题（不变量）|
| §16 V2.0 演进 | §14.5 V2.0 演进 | 移到跨 Sprint 主题 |
| §17 探索轨迹 | §14.6 探索轨迹 | 移到跨 Sprint 主题 |
| §18 决策清单 | §14.7 决策清单 | 移到跨 Sprint 主题 |
| §19 文档交叉引用 | §14.8 文档交叉引用 | 移到跨 Sprint 主题 |
| §20 关键教训 | §14.9 关键教训 | 移到跨 Sprint 主题 |
| §21 启动方式 | §14.10 启动方式 | 移到跨 Sprint 主题 |
| §22 后续待办 | §14.11 后续待办 | 移到跨 Sprint 主题 |

**重构带来的好处**：
1. **每个 Sprint 都是端到端可运行版本**（敏捷原则 #7：可工作的软件是进度度量）
2. **错误处理、测试、验收与任务同步演进**（避免最后一周集中补测试的"死亡冲刺"）
3. **数据流分 Sprint 写**（Sprint 1 只写、Sprint 4 才集成读写 — 与实际 Sprint 计划对齐）
4. **跨 Sprint 主题独立**（不变量与增量清晰分离，便于团队对照执行）

---

*本文档是 Mindtap V1.0 实施的唯一真理之源。*
*任何功能/设计/工程变更必须先修订本文件，再进入实现。*
*Generated by Claude (MiniMax-M3) · 2026-06-14 · V1.0 实施阶段起点*
