# Task Plan: projects — 极简记录 APP

> 本文件是 projects 项目的"工作记忆磁盘化"。所有阶段、决策、问题、错误均在此沉淀。**任何时候接续工作前，先读本文件。**
> 
> **当前基线版本：V1.0（闪念 / FlashMind，2026-06-14 晚）**  
> **上游基线：V1.2（Mindtap · 轻念）**——已合并入 V1.0 范围，保留为决策审计日志

---

## Goal

> 为 ENFP 等创意人群提供"3 秒记录、1 秒查看、0 思考成本"的极简记录工具。
> 
> **V1.0（闪念 V1.0）核心范围**：
> - **3 个核心模块**：灵感速记 / TODO（待办项）/ 每日复盘
> - **平台**：macOS 26+ + Windows 11/12（PC 端优先）
> - **架构**：Tauri 2 + React 18 + TypeScript + SQLite（**纯 Web，V1.0 不嵌入 SwiftUI**）
> - **入口**：最小浮动面板（200×80）+ 主窗口（1280×800+）
> - **数据**：纯本地 SQLite，无导出/无导入/无同步
> - **设计语言**：Liquid Glass（Web CSS 模拟，Mac/Win 一致）
> - **3 个月时间表**

**V1.0 验收标准**（来自 brainstorming §1-§4）：
- 3 个模块操作全程 ≤ 3 秒
- 主窗加载 ≤ 1 秒
- 全程零思考成本（点击 / 快捷键 / Enter 一气呵成）
- 已完成 TODO 默认折叠；长按 = 隐藏（软状态可恢复）
- **学习项目 / 语音 / OCR + 日历 / 备份 / 汇总 / 自定义按钮 → V1.4+**

---

## Current Phase

**Phase P3.0: V1.0（闪念 V1.0）设计 brainstorm + spec 编写** — 已锁定 6 项关键决策（升级 V1.2 / 3 模块 / 最小浮动+主窗 / 无语音 / 纯 Web / 3 模块数据模型 + 3 模块 UX 细节），继续 §5 错误处理 / §6 测试策略 / §7 路线图三节后写入 spec 文档。

---

## Phases

### Phase P1: 需求与发现 ✅ complete
- [x] 接收用户 PRD V1.0（8 章）
- [x] 识别与早期回答的冲突 → 以 PRD 为准
- [x] 澄清关键约束：纯本地存储、桌面端无登录
- [x] 接收"基础产品纲领"：三大业务锚点 + 强制任务拆解规则
- [x] 选定视觉设计：Apple Liquid Glass（8 维度详解）
- [x] **Status:** complete

### Phase P2: 顶层架构总览 ✅ complete
- [x] 输出 11 章节顶层架构文档
- [x] 选定技术栈：Tauri 2.x + React + TS + SQLite
- [x] 选定 Liquid Glass 实施策略
- [x] **Status:** complete

### Phase P2.5: 决策收尾 + PRD 修订 ✅ complete
- [x] 回答 4 个关键技术决策问题（Q3 已默认认可 / Q5 不再阻塞 / D21-D25）
- [x] **范围收缩**：4 端 → 2 端（PC 端优先，iOS/Android 移至 V2.0）
- [x] **架构升级**：纯 Web → Tauri 2 + SwiftUI 嵌入（混合架构）
- [x] **数据策略**：全本地，无导出/无导入/无同步
- [x] 修订 PRD V1.1 → V1.2（`docs/projects/v1.0/prd-v1.2.md`，290 行）
- [x] 锁定 D21-D27 到本文件
- [x] **Status:** complete

### Phase P2.6: V1.2 模块级设计 ⏳ pending（**V1.0 后废弃**）
- **依赖**: P2.5 完成 ✅
- **交付物**: 7 大功能域的模块级详细设计
  - 每个模块: 组件树 + 状态流 + 数据 schema + 关键交互序列
  - SwiftUI 嵌入区的接口设计（IPC 协议）
- **新增**: 混合架构设计（哪些 UI 走 SwiftUI，哪些走 Web）
- **⚠️ V1.0 决策 D29-D31 推翻**：7 功能域 → 3 模块；SwiftUI 嵌入延后到 V1.4

### Phase P2.7: V1.0 范围重定 ⏳ → ✅ complete
- **依赖**: P2.5 完成 ✅
- **触发**: 用户提出"v1.0版本仅保留闪念和点念有交集、最核心、而且最通用的功能"
- **交付物**:
  - 闪念 × 点念 交集矩阵分析（灵感 / TODO / 复盘 3 模块入选）
  - 学习项目 / 语音 / 人脉 / 手账 / 物品 全部 V1.4+
  - **Status:** complete

### Phase P2.8: V1.0 架构简化 ⏳ → ✅ complete
- **依赖**: P2.7 完成 ✅
- **交付物**:
  - 移除 SwiftUI 嵌入混合架构（D31）
  - V1.0 走纯 Web（Tauri + React + TS + SQLite）
  - 2 窗口：浮动小面板（200×80）+ 主窗口（1280×800+）
  - **Status:** complete

### Phase P2.9: V1.0 核心交互 brainstorm ⏳ → ✅ complete
- **依赖**: P2.8 完成 ✅
- **交付物**:
  - §1 架构总览
  - §2 数据模型（3 payload schemas + is_hidden 软状态）
  - §3 核心交互（浮窗 + 主窗 + 跨窗同步）
  - §4 3 模块详细设计（灵感 / TODO / 复盘）
  - **Status:** complete

### Phase P3.0: V1.0 spec 编写 ⏳ in_progress
- **依赖**: P2.9 完成 ✅
- **交付物**:
  - §5 错误处理（待办）
  - §6 测试策略（待办）
  - §7 路线图（V1.4+ 候选清单）
  - 写入 `docs/projects/v1.0/specs/2026-06-14-flashmind-v1-design.md`
  - 自审 + 用户审阅
- **下一步**: writing-plans 技能制定实施计划

### Phase P3: 项目脚手架 ✅ complete (commit f98aa48)
- **依赖**: P2.6 完成（**已被 P2.8 / P2.9 推翻** — D31 改纯 Web，去掉 SwiftUI 嵌入）
- **交付物**: V1.0 最小跑通骨架（已落地）
  - Tauri 2.11.2 + React 19.1.0 + TypeScript 5.8.3 + Vite 7.3.5
  - **纯 Web**（Tauri 2 + React + TS）— D31 决策
  - **不**集成 SQLite（V1.0 P3 仅脚手架，SQLite → Sprint 1 引入）
  - **不**嵌入 SwiftUI（D31 决策；V1.0 Web 模拟 Liquid Glass 80% 还原）
  - 6 个核心 Liquid Glass 演示组件（Surface / Toolbar / Button / Card / Heatmap / FAB）
  - App.tsx 完整设计资产（241 行，11 个 section）
- **验证（WSL 端）**:
  - `npm run tauri dev` 跑通（commit 4b3f847）
  - HMR 正常，窗口弹出，Liquid Glass 渲染
- **验证（Windows 端）**:
  - `npm run tauri build` 跑通（21.39s 增量）
  - `src-tauri\target\release\tauri-app.exe` = 9 MB
  - `.exe` 启动不崩，弹窗 OK
- **跨环境开发**: WSL（主开发）+ Windows PowerShell（native build）— D43
- **执行时间**: 2026-06-14（约 4 小时，含 10 个坑 E11-E20）
- **Status:** complete

### Phase P3.5: Windows NSIS Build（V1.0 P3.5 验证） ✅ complete
- **依赖**: P3 完成
- **触发**: 用户反思"其实是不是只需要打包exe应用程序就好了，不需要打包安装包"
- **交付物**:
  - ✅ `tauri build` 跑通生成裸 `.exe`（9 MB）
  - ✅ `bundle.targets = ["nsis"]` 跑通生成 `tauri-app_0.1.0_x64-setup.exe`（~20 MB）
  - ✅ NSIS 工具链自动下载 + 验证 + 解压（设 `$env:HTTPS_PROXY=127.0.0.1:7890` 后 100% 成功）
  - ✅ V1.0 P3 默认跳过安装包（`bundle.targets = []` — D42）— 用户反思后决定
- **踩坑（E11-E20）**: 详见 Errors Encountered 表格
- **后续**: 跑 `tauri-app_0.1.0_x64-setup.exe` 安装验证（Task #23）
- **Status:** complete

### Phase P4: 锚点 1 — 高频打卡 ⏳ pending
- **交付物**: 情绪/能量、作息、饮水、服药 4 项打卡功能
- **验证**: 4 项操作均 < 3 秒

### Phase P5: 锚点 2 — 灵感捕捉 ⏳ pending
- **交付物**: 灵感文字记录、核心 Todo（事项+截止+完成状态）
- **验证**: 退出自动保存、待办一键完成

### Phase P6: 锚点 3 + 概览 ⏳ pending
- **交付物**: 习惯打卡（最多 3）、消费速记、每日 3 词复盘 + 概览页
- **验证**: 概览加载 < 1 秒

### Phase P7: Liquid Glass 视觉打磨 ⏳ pending
- **依赖**: P4-P6 功能完成
- **交付物**: macOS 95% 还原度 / Windows 80% 还原度
- **新增**:
  - SwiftUI 嵌入区上线（sidebar/modal/toolbar/card）
  - 4 个核心效果：Background Extension、Scroll Edge、Glass Morphing、Concentric Corners
- **验证**: 用户在 macOS 26 / Windows 11 上跑通完整流程

### Phase P8: 跨平台构建 ⏳ pending
- **交付物**: macOS + Windows 2 端构建配置与平台适配
- **新增**:
  - macOS 26: NSVisualEffectView + SwiftUI 嵌入
  - Windows 11/12: backdrop-filter + CSS 渐变
  - 代码签名 + 公证（macOS）/ 签名（Windows）
- **验证**: 两个平台都能正常 build + run

### Phase P9: 打磨与验收 ⏳ pending
- **交付物**: 动效、Liquid Glass 细节、性能调优
- **验证**: PRD V1.2 §6 全部验收项

---

## 🚨 Phase 1 技术 Spike（**V1.2 关键阻塞**）

> **注意**：在 P3 启动前，**必须**先完成 Phase 1 spike 验证混合架构可行性。

| # | 任务 | 验证目标 | 时间 |
|---|---|---|---|
| 1.1 | 初始化最小 Tauri 2 项目 | `cargo tauri init` 跑通 | 0.5 天 |
| 1.2 | WKWebView 叠加 NSHostingView | SwiftUI 视图能渲染 + 接受事件 | 1 天 |
| 1.3 | SwiftUI → Rust → React IPC | Tauri command/event 双向走通 | 1 天 |
| 1.4 | Liquid Glass 4 个核心 modifier | `glassEffect`, `GlassEffectContainer`, `glassEffectID`, `backgroundExtensionEffect` | 1 天 |
| 1.5 | 写**混合架构可行性报告** | go/no-go 决策点 | 0.5 天 |

**Spike 失败 → Fallback**:
- 改用 B 升级版（Rust + NSVisualEffectView 调原生 API，90% 还原度）
- SwiftUI 嵌入区延后到 V2.0 iOS 端再做
- V1.0 仍能在 3 个月内上线

---

## Key Questions（**V1.2 全部关闭**）

| # | 问题 | 状态 | 解决方式 |
|---|---|---|---|
| Q1 | V1.0 范围：纳入扩展 vs 严格 PRD | ✅ **已解决** | V1.1 精简 PRD = 严格 PRD + 语音 |
| Q2 | 桌面端首页布局 + 跨端设计语言 | ✅ **已解决** | B-glass：Mac 原生 + 其他平台 CSS |
| Q3 | 技术栈：Tauri 2.x + React + TS + SQLite | ✅ **已解决** | 沿用 + V1.2 增加 SwiftUI 嵌入层 |
| Q4 | 项目名/产品显示名 | ✅ **已解决** | Mindtap · 轻念 |
| Q5 | iOS/Mac 构建在用户无 Mac 机器的情况下如何处理 | ✅ **已解决** | 用户有 Mac 机器；V1.0 优先 Mac 端 |
| Q6 | V1.0 平台范围是否要砍（4 端 → 2 端）| ✅ **已解决** | 砍到 Mac + Windows（PC 端优先）；iOS/Android → V2.0 |
| Q7 | Mac 端 Liquid Glass 实现层级（A/B/C）| ✅ **已解决** | C. SwiftUI 嵌入（混合架构）|
| Q8 | 数据策略（A 导出/导入 / B .db 文件 / C 云同步）| ✅ **已解决** | A. 不做（数据全本地，无导出）|
| Q9 | V1.0 上线时间 | ✅ **已解决** | 3 个月内（激进）|

---

## Decisions Made

> **V1.0-V1.1 决策（D1-D20）90% 保留**。仅 D6（技术栈）扩展为 D6+D24（增加 SwiftUI 嵌入）。

| # | 决策 | 理由 | 决策时间 |
|---|---|---|---|
| D1 | 以 PRD 为准（移动 App），不是 Web 应用 | PRD 明确 | 2026-06-14 |
| D2 | 平台扩展为 iOS + Android + Mac + Windows | V1.1 时 4 端 | 2026-06-14 |
| D3 | 纯本地存储，无后端 | 用户明确 | 2026-06-14 |
| D4 | 暂不实现语音输入 | V1.2 进一步移除（移至 V2.0 移动端） | 2026-06-14 |
| D5 | 桌面端无登录 | V1.1 演变为全平台无登录 | 2026-06-14 |
| D6 | 技术栈：Tauri 2.x + React 18 + TypeScript + Vite + Zustand + SQLite | 单代码库覆盖 4 端 | 2026-06-14 |
| D7 | 视觉设计：Apple Liquid Glass | 用户详述 8 维度 | 2026-06-14 |
| D8 | Liquid Glass 实现：Mac NSVisualEffectView + 其他平台 CSS | V1.1 决策 | 2026-06-14 |
| D9 | 数据存储：SQLite 单表 + JSON payload | 跨平台一致 | 2026-06-14 |
| D10 | 项目目录：src-tauri/ + src/ | Tauri 标准 | 2026-06-14 |
| D11 | 文件式规划：task_plan.md / findings.md / progress.md | 持久化 | 2026-06-14 |
| D12 | 强制任务拆解规则保存为 memory | 永久生效 | 2026-06-14 |
| D13 | V1.1 精简 PRD 取代 V1.0 | 用户主动演进 | 2026-06-14 |
| D14 | 项目名：Mindtap · 轻念 | 双名方案 | 2026-06-14 |
| D15 | 语音转文字：10秒极速，平台原生 | V1.1 引入 | 2026-06-14 |
| D16 | 全平台无登录 | V1.1 决策 | 2026-06-14 |
| D17 | 无云端备份 | V1.1 决策 | 2026-06-14 |
| D18 | 快速记录按钮 = 浮动 + 可拖动 | 用户口头补充 | 2026-06-14 |
| D19 | 目标平台 UX = Mac 原生感 | 用户口头补充 | 2026-06-14 |
| D20 | Q2 锁定 B-glass | 用户确认 | 2026-06-14 |
| **D21** | **V1.0 平台范围：Mac + Windows（PC 端优先）** | **V1.2 范围收缩；降低 V1.0 复杂度** | **2026-06-14** |
| **D22** | **V2.0 平台范围：iOS + Android（移动端补齐）** | **V1.0 完成后启动** | **2026-06-14** |
| **D23** | **数据策略：全本地 SQLite，无导出/无导入/无同步** | **用户决策 A. 不做** | **2026-06-14** |
| **D24** | **Mac 端 Liquid Glass：SwiftUI 嵌入（混合架构）** | **用户决策 C；Mac 95% 还原** | **2026-06-14** |
| **D25** | **V1.0 上线时间：3 个月内（激进）** | **用户决策 PC 端优先后允许激进** | **2026-06-14** |
| **D26** | **iOS 端技术：SwiftUI（V2.0 复用 V1.0 SwiftUI 视图）** | **glassEffect API 跨端一致** | **2026-06-14** |
| **D27** | **Android 端技术：V2.0 决策（候选：Tauri 移动端 / Kotlin）** | **暂不决定** | **2026-06-14** |
| **D28** | **采用敏捷 Sprint 排期：P3-P9 改造为 6 个 2 周 Sprint + Week 0 Spike** | **D25 的 3 个月（≈ 12 周）刚好对齐 6 Sprint；用敏捷原则 #1/#2/#3 提升交付确定性** | **2026-06-14（提议，待批准）** |
| **D29** | **闪念 × 点念 交集过滤：V1.0 = 灵感 + TODO + 复盘 3 模块** | **用户决策"v1.0版本仅保留闪念和点念有交集、最核心、而且最通用的功能"** | **2026-06-14** |
| **D30** | **V1.0 入口模式：最小浮动面板（200×80）+ 主窗口（1280×800+）** | **保留"随时记录"（浮动）+ "完整查看"（主窗）两个核心场景** | **2026-06-14** |
| **D31** | **V1.0 架构简化：移除 SwiftUI 嵌入，V1.0 走纯 Web（Tauri + React + TS + SQLite）** | **5 模块 + 3 个月 → 改回纯 Web；SwiftUI 嵌入延后到 V1.4** | **2026-06-14** |
| **D32** | **V1.0 语音转文字：仍不做，V1.4 再加** | **保留 V1.2 "暂不做语音" 决策** | **2026-06-14** |
| **D33** | **V1.0 TODO 字段：name + done + done_at（无截止日期）** | **3 秒铁律过滤：截止日期会增加思考成本** | **2026-06-14** |
| **D34** | **V1.0 已完成 TODO：列表中默认折叠，显示"已完成 N 条 ▼"** | **折叠而非删除，减少视觉噪音** | **2026-06-14** |
| **D35** | **V1.0 长按条目 = 隐藏（is_hidden 软状态），非删除** | **用户决策"长按隐藏"；V1.4+ 设置面板可恢复** | **2026-06-14** |
| **D36** | **V1.0 数据模型：单表 records + JSON payload + is_hidden 软隐藏字段** | **复用 V1.2 D6 决策（单表 + JSON payload）+ 软状态取代硬删除** | **2026-06-14** |
| **D37** | **V1.0 学习项目：延后到 V1.4+** | **用户决策"学习项目后续再考虑"** | **2026-06-14** |
| **D38** | **V1.0 浮窗 tab 切换：支持点击 tab + 快捷键 Cmd+1/2/3 (Mac) / Ctrl+1/2/3 (Win)** | **用户决策"点击切换 + 快捷键切换"冗余设计** | **2026-06-14** |
| **D39** | **V1.0 浮窗显示"未完成 TODO 数量"角标** | **用户决策；嵌入"被动查看"到"主动记录"场景** | **2026-06-14** |
| **D40** | **V1.0 复盘：允许一天多次（3 关键词输入框 / 1-3 词均可）** | **不强制每日 1 条；支持多角度总结** | **2026-06-14** |
| **D41** | **V1.0 隐藏条目恢复入口：仅"设置面板"（无快速入口）** | **用户决策"不需要更快的显示已隐藏入口"** | **2026-06-14** |
| **D42** | **V1.0 P3 bundle.targets = `[]`（**不**生成安装包，只 `.exe`）** | **用户反思"其实是不是只需要打包exe应用程序就好了"；P3.5 验证后改回** | **2026-06-14** |
| **D43** | **跨环境开发 = WSL 主开发 + Windows PowerShell native build** | **WSL 端没 MSVC 工具链，无法 build；走双端独立项目目录** | **2026-06-14** |
| **D44** | **NSIS 工具链走 Tauri 2 自动下载（**不**手动解压 v0.5.3）** | **v0.5.3 仓库根目录结构与 Tauri 2 预期不符；让 Tauri 自己下载 + 验证 + 解压** | **2026-06-14** |
| **D45** | **中国大陆 + Rust → 镜像走 rsproxy.cn（**不**是 USTC）** | **crates.io 官方源慢（3.86 KiB/s，5h ETA）；rsproxy.cn 加速** | **2026-06-14** |

---

## Errors Encountered

| # | 时间 | 错误/问题 | 尝试次数 | 解决方式 |
|---|---|---|---|---|
| E1 | 2026-06-14 | 用户多次拒绝多选题 | 3 次 | 改为开放式讨论 |
| E2 | 2026-06-14 | PRD 描述移动 App 与早期"Web 应用"冲突 | 1 次 | 以 PRD 为准，扩展为 4 端 |
| E3 | 2026-06-14 | "基础产品纲领"提语音与"暂不实现"冲突 | 1 次 | 以决策回答为准 |
| E4 | 2026-06-14 | Q5（无 Mac 机器）阻塞 P7 跨平台构建 | 1 次 | 用户回答"已有 Mac 机器"；Q5 自动解决 |
| E5 | 2026-06-14 | V1.1 PRD 4 端范围 + Tauri 移动端不成熟的风险 | 1 次 | V1.2 砍到 2 端（Mac+Windows），Tauri 桌面端成熟 |
| **E6** | **2026-06-14** | **V1.2 混合架构（SwiftUI 嵌入）与"3 模块 + 3 个月"激进排期冲突** | **1 次** | **D31：V1.0 改回纯 Web；SwiftUI 嵌入延后到 V1.4** |
| **E7** | **2026-06-14** | **V1.2 7 功能域范围与"闪念 8 模块"叠加 → 工作量翻倍** | **1 次** | **D29：V1.0 = 闪念×点念 交集 = 3 模块（灵感/TODO/复盘）** |
| **E8** | **2026-06-14** | **新需求"启动直达全屏"与 V1.2 "浮动可拖动按钮"冲突** | **1 次** | **D30：折中方案 = 最小浮动面板 + 主窗口查看** |
| **E9** | **2026-06-14** | **新需求"全模块语音"与 V1.2 "暂不做语音"冲突** | **1 次** | **D32：V1.0 仍不做语音；V1.4 再加** |
| **E10** | **2026-06-14** | **新需求"学习项目 5 档进度" 与"3 秒铁律"潜在冲突** | **1 次** | **D37：学习项目整模块延后到 V1.4+** |
| **E11** | **2026-06-14** | **Rust crates.io 官方源慢（3.86 KiB/s，5h ETA）** | **1 次** | **D45：换 rsproxy.cn 镜像（详见 `~/.cargo/config.toml`）** |
| **E12** | **2026-06-14** | **9P 软链 + npm symlink 三重冲突（`npm error EISDIR`）** | **2 次** | **D43：跨环境开发走 WSL + Windows 双端独立项目目录（不软链）** |
| **E13** | **2026-06-14** | **cmd UNC path 不支持 CWD（`C:\Users\...` UNC 失败）** | **1 次** | **D43：先 `cd C:\` 再 `pushd` 项目目录** |
| **E14** | **2026-06-14** | **SymbolicLink + 9P + Windows 边界（WSL 端建软链失败，权限不足）** | **1 次** | **D43：放弃软链，WSL + Windows 双端独立项目目录** |
| **E15** | **2026-06-14** | **vcvars64.bat 在 Git Bash 中破坏 `ln` 命令（POSIX `ln` vs Windows `link.exe` 冲突）** | **1 次** | **改用 PowerShell 跑 vcvars64.bat + npm run tauri build** |
| **E16** | **2026-06-14** | **PowerShell `cd /d` 不支持（5.x 限制）** | **1 次** | **PowerShell 用 `cd`（不带 /d）** |
| **E17** | **2026-06-14** | **PowerShell `Set-Content` 多参数 error（一行写 2 个命令没用 `;` 分隔）** | **1 次** | **用 `;` 或换行分隔命令** |
| **E18** | **2026-06-14** | **curl 301 重定向只 14 bytes** | **1 次** | **加 `-L` 跟重定向（**但** installer.nsi 已 Tauri 嵌入，不需手动下载）** |
| **E19** | **2026-06-14** | **Tauri 2 NSIS 内部 reqwest 默认不读 env vars（需设 `$env:HTTPS_PROXY`）** | **2 次** | **PowerShell 设 `$env:HTTPS_PROXY="http://127.0.0.1:7890"` 走本地代理（v2ray/clash）** |
| **E20** | **2026-06-14** | **NSIS v0.5.3 仓库根目录结构与 Tauri 2 预期不符（手动 `Copy-Item "$utilsSrc\Plugins\x86-ansi"` 路径不存在）** | **1 次** | **D44：放弃手动复制，让 Tauri 2 自己下载 + 验证 + 解压** |

---

## Notes

- **PRD V1.2 是 V1.0（闪念 V1.0）的上游基线**：V1.0 PRD V1.0 → V1.1 → V1.2 完整保留，作为决策审计日志
- **V1.0 决策幂等性**：D1-D28 90% 沿用；D29-D41 是 V1.0 范围内的"叠加决策"；D31（去 SwiftUI）和 D37（学习项目延后）是"覆盖决策"
- **强制任务拆解规则已落地**：见 memory `mandtap-task-decomposition-rules.md`
- **每次接续工作时**：先 re-read 本文件 → 检查 Current Phase → 检查 Key Questions → 检查 Errors → 检查 Decisions D29-D41
- **关键沉淀物**：
  - `docs/projects/v1.0/prd-v1.2.md` — V1.2 产品基线（290 行，上游）
  - `docs/material/apple/liquid-glass/`, `docs/material/apple/swiftui/`, `docs/material/apple/hig/`, `docs/material/apple/wwdc/` — 设计参考
  - `docs/material/agile/` — 敏捷开发方法论（6 文档，2026-06-14 二次收集）
  - `docs/projects/v1.0/agile-sprint-plan.md` — **D28 提议**：6 个 2 周 Sprint
  - `docs/projects/v1.0/specs/2026-06-14-flashmind-v1-design.md` — **V1.0 设计 spec**（P3.0 待写入）
  - `docs/INDEX.md` — 文档库索引
  - `prototype/index.html` — Liquid Glass Web 模拟原型（V1.0 沿用）

---

## 🚀 D28 提议：敏捷 Sprint 排期（替换 P3-P9）

> **提议时间**：2026-06-14
> **状态**：⏳ pending user approval
> **详细方案**：[`docs/projects/v1.0/agile-sprint-plan.md`](docs/projects/v1.0/agile-sprint-plan.md)

**核心变化**：

| 旧（P3-P9 瀑布） | 新（6 个 2 周 Sprint） |
|---|---|
| 12 周一次规划 | **13 周**（Week 0 spike + 6×2 周）|
| 12 周 1 个 demo | **每 2 周 1 个 demo**（共 6 个）|
| 12 周末才可发布 | **Sprint 3 末内部 MVP**（可记录 + 可看）|
| 无明确反馈循环 | **2 周 1 循环**（Plan → Build → Review → Retro → Adapt）|
| 无工具链 | **GitHub Issues + Project Board + Actions + TestFlight**|

**6 Sprint 速览**：

| Sprint | 周 | 目标 | 关键交付 |
|---|---|---|---|
| Week 0 | 第 0 周 | 技术 Spike | go/no-go 决策（4 天）|
| Sprint 0 | 第 1-2 周 | 脚手架 + 4 核心组件 | Tauri 2 + 4 Glass 组件 + CI |
| Sprint 1 | 第 3-4 周 | 锚点 1（高频打卡）| 情绪/作息/饮水/服药 4 项 |
| Sprint 2 | 第 5-6 周 | 锚点 2（灵感捕捉）| 灵感文字 + 核心 Todo |
| Sprint 3 | 第 7-8 周 | 锚点 3 + 概览 | 习惯/消费/复盘 + 概览页 ⭐ V1.0 内部 MVP |
| Sprint 4 | 第 9-10 周 | Liquid Glass 视觉打磨 | Mac 95% / Win 80% 还原 |
| Sprint 5 | 第 11-12 周 | 跨平台 + 验收 | V1.0 正式发布 |

**待用户确认**：
1. ✅ 采用本 Sprint 排期（推荐）→ 替换 P3-P9
2. ⚠️ 保留 P3-P9 作 phase 命名，新 Sprint 挂在 P 编号下（保守）
3. ❌ 暂不改造（不推荐）
