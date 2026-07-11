---
title: 轻念 · Mindtap — V0.2 产品规划
date: 2026-07-11
status: ⏳ pending user scope confirmation
supersedes: V0.1.x (Style Guide only, no business)
upstream: V1.0 PRD-V1.2 (.archive/docs/projects/v1.0/prd-v1.2.md)
---

# 轻念 · Mindtap — V0.2 产品规划

> 一句话: **V0.2 = 一个永远在桌面边缘、3 秒进入计时、1 秒切回工作的"我现在在做什么"指示器。**

## 〇 上游与上下文

| 项 | 内容 |
|---|---|
| 上游产品文档 | V1.0 PRD-V1.2 (`.archive/docs/projects/v1.0/prd-v1.2.md`) — **已归档，仅作历史参考；V0.2 是否沿用待 V0.2 spec 独立 grill** |
| 前置版本 | V0.1.6 Style Guide (main: `8af219a`, 2026-06-22) — 设计系统完工，无业务 |
| 平台工具链 | Windows 11 跑通 (2026-07-11 build log) — 可作为 V0.2 验证环境 |
| 已归档代码 | `.archive/src/` + `feat/floating-auto-collapse` 分支 — **整体非事实，是否复用待 V0.2 spec 独立评估** |
| 已归档报告 | V1.3 浮动窗 iter1 修复报告 — **整体非事实，是否参考待 V0.2 spec 独立评估** |

V0.1.6 自己 retro 留了一笔债: drag region "fix 6" 未实测 (V0.1.6 retro 沉淀的"反向症状消失 ≠ 修复生效"教训)。V0.2 第一个 Windows build 须顺手 closure，否则会闷到 V0.3。

---

## 一 业务目标

### 1.1 V0.2 要解决的根本问题

V1.0 PRD 把目标用户定为 "ENFP 等创意人群——灵感爆发、易遗忘、难坚持记录"。V0.1.x 用 4 个迭代 (V0.1.0~V0.1.6) 把"工具"先做出来 (Style Guide + 设计语言)，尚未触业务。

V0.2 把范围收窄到**最痛的一个钉子**:

> **"我今天到底在做什么？花了多久？"**

具体场景:
- 工作日 10:00 同时打开 IDE + 邮件 + 飞书，10:30 已经忘了 IDE 里那个任务到底叫什么
- 下午复盘，回忆"这周做了什么"全凭主观感觉
- 番茄钟/Pomodoro 太重——开 25min 计时 → 弹窗打断 → 关掉又忘了打开
- 想要一个**永远在屏幕边缘、偶尔看一眼就能确认"我在干正事"**的东东

### 1.2 三层决策法对账

| 层 | V0.2 取值 | 来源 |
|---|---|---|
| L1 (原始权威) | 工作记忆衰减曲线 + 时间盒理论 | 通用认知科学 |
| L2 (项目设计) | "3 秒记录 / 1 秒查看 / 0 思考成本" 铁律 | V1.0 PRD §1.4 |
| L3 (具体问题) | 多任务频繁切换、事后无法重建时间分配 | 当前真实工作场景 |

V0.2 = L1 × L2 × L3 的**最窄交集**，只解决"我在做什么 + 多久了"。其他 V1.0 业务域 (灵感/打卡/复盘/习惯/消费) 推迟。

### 1.3 可衡量出口

| 指标 | 目标 | 验收方式 |
|---|---|---|
| 浮动窗触发到开始计时 | ≤ 3 秒 | 用户实测 + 录屏 |
| 工作流被打断 | 0 次 (不抢焦) | 双屏实测 IDE 输入时窗口不弹 |
| 一周后能回忆每天做了什么 | 80% 任务 + 时长 | 自报 + session 日志对照 |
| Windows ↔ macOS 行为一致 | 后续 macOS 接入时实测 | V0.3 验收 |

---

## 二 业务功能

### 2.1 V0.2 功能矩阵 (V1.0 PRD §4 的最小子集)

| # | 功能 | V0.2.0 | V0.2.1 | 出处 |
|---|---|---|---|---|
| F1 | 浮动窗折叠态 (320×36，显示当前任务 + 计时) | ✅ | ✅ | V1.0 PRD §4.2 全局入口的窗口化变体 |
| F2 | 浮动窗展开态 (输入新任务 / 选择已有任务 / 开始计时) | ❌ | ✅ | V0.2.1 新增 |
| F3 | 全局快捷键 (Ctrl+Shift+Space 唤起/隐藏) | ✅ | ✅ | 平台原生 (Windows 上 `tauri-plugin-global-shortcut`) |
| F4 | 本地 SQLite + timer_session 单表（参见 [ADR 0002](adr/0002-focus-ms-plus-session-log.md)）| ✅ | ✅ | `.archive/` 整体非事实（参见 [archive-reference-only.mdc](../../.claude/rules/archive-reference-only.mdc)），schema 待 V0.2 spec 阶段独立 grill |
| F5 | 任务状态机 (pending → active ↔ paused → done) | 仅 active | 全 5 态 | V0.2.1 完整化 |
| F6 | 切换状态查看进行中待办 | ❌ | ✅ | V0.2.1 新增 |
| F7 | 主窗 / 概览页 / 设置页 | ❌ | ❌ | 推迟到 V0.3+ |
| F8 | 灵感 / 打卡 / 复盘 / 习惯 / 消费 | ❌ | ❌ | 推迟到 V1.0 |

**V0.2.0 MVP = F1 + F3 + F4 + F5(只 active)**
**V0.2.1 = V0.2.0 + F2 + F5(全 5 态) + F6**

### 2.2 明确不做 (沿用 V1.0 PRD §7)

- ❌ 主窗 / 概览页 / 设置页 (V0.3+)
- ❌ 灵感 / 打卡 / 复盘 / 习惯 / 消费 (V1.0)
- ❌ 导出 / 导入 / 同步 (V1.0 PRD D23，永远不做)
- ❌ 多设备 (V1.0 PRD D21/D22)
- ❌ macOS 端 (V0.2 锁 Windows；V0.3 才做)
- ❌ 语音输入 (V1.0 PRD V2.0)

### 2.3 术语表 (待用户在 §6.2 拍板后定稿)

| 术语 | 当前候选定义 | 备注 |
|---|---|---|
| **task** | 一件要做的事，有 5 态状态机 | 复用 V1.0 schema |
| **active task** | 此刻正在做的那一个 task (全局唯一 1 个) | V1.0 L1 不变量 |
| **focus_ms** | task 累计已花时长 (毫秒) | V1.0 `task.focus_ms` 字段 |
| **session** | 一次"开始计时 → 暂停/完成"的时间区间 | 待 §6.2.Q2 决定要不要存 |
| **折叠态 / 展开态** | 320×36 单行 / 360×280 输入面板 | 沿用 V1.0 实装尺寸 |
| **折叠-不抢焦** | 窗口常驻但不抢当前焦点 (Windows: `WS_EX_NOACTIVATE` 等) | 平台差异待实测 |

---

## 三 真实需求

> 这段不是"用户想要 X 功能"——是 **用户痛点的本质**。少写"用户想要"，多写"用户在 Y 场景下被困在 Z"。

### 3.1 痛点 1: 主动记录 vs 被动记录的认知不对称

番茄钟类工具的失败模式: **"主动启动 → 主动停止 → 主动分类"**。每一步都打断心流。

用户真正想要的: **"我在 IDE 里写代码" 这件事应该自动被观察到**——而不是我**主动告诉**应用我在做什么。

V0.2 的解决方案: **降低主动性的颗粒度**。从"启动番茄钟"降到"敲几个字 + 按回车"。**只降低主动性成本，不做"零主动性"**——那不切实际 (AI 观察活跃窗口太重)。

### 3.2 痛点 2: 时间流逝的不可见性

人在 flow state 里完全感知不到时间。番茄钟的 25min 振动是**已经晚了**的提醒。

真正有用的指标: **实时可见 + 不抢焦**。浮动窗口 320×36 永远在屏幕一角，无论在哪个 App 切回来都能瞥一眼"我已经在 X 上花了 23:14"。

这个窗口的**物理形态**本身是解决方案的一部分——不是它"展示什么"，而是**它"永远在那儿"**。

### 3.3 痛点 3: 事后重建的颗粒度太粗

> "今天做了什么？"
> "写了一些代码、调了点东西..."

这种回答丢失了所有**过程信息**: 哪段写代码、哪段调东西、两者时间比、各自多长。V0.2 提供 task + session 双层粒度: task = "做什么" (语义级)，session = "哪段时间做的" (时间级)。事后能精确到分钟重建"上午 9:30-11:00 写代码，11:00-11:25 调 bug"。

### 3.4 反需求 (用户**不**想要的)

- 不要按钮太多的复杂 UI — 极简是 V0.2 自身定位（**V1.0 PRD 也有"极简记录"铁律，但 V1.0 PRD 已归档，不能作为 V0.2 决策依据**）
- 不要打卡 / 连续天数 / 积分——那是游戏化，不是工具
- 不要把"我在做什么"汇报到任何远程——全本地是 V0.2 自身定位（**V1.0 PRD D23 是已归档决策，不作为 V0.2 依据；但 V0.2 立项时用户已表态全本地，参见 [ADR 0005](adr/0005-fresh-database-no-migration.md) + 永久保留决策 Q10**）
- 不要常驻任务栏 (最小化就看不见)
- 不要 "今日已完成 X 个任务" 这种 productivity porn

---

## 四 总体计划

### 4.1 复用策略 (V0.2 不重新发明)

> ⚠️ 按 `archive-reference-only.mdc`，`.archive/` 任何内容**全部非事实**。"复用"意味着用户须独立确认后落到 ADR / CONTEXT.md。

| 层 | 资产 | 位置 | 状态 |
|---|---|---|---|
| 设计 | V0.1.6 Style Guide (11 UI 组件 + Tailwind tokens + glass CSS) | 当前 develop (事实) | ✅ done |
| 设计 spec | Liquid Glass spec / tokens / 组件格式 | `docs/design/` (事实) | ✅ done |
| 业务代码 | `.archive/src/` V1.0 实装 (db / IPC / 浮动窗) | **整体非事实**，是否复用待 V0.2 spec grill | ⏳ |
| 调试报告 | V1.3 浮动窗 iter1 修复报告 | **整体非事实**，是否参考待 V0.2 spec grill | ⏳ |
| 工具链 | Windows build log (nvm + MSVC + rsproxy + NSIS bundle) | `docs/install-windows-v1.0-build-log-2026-07-11.md` (事实) | ✅ 2026-07-11 |

**V0.2 = "重新实施"**（**不**预设沿用 `.archive/` 实装）。V0.2 spec 阶段会单独评估 `.archive/` 实装的尺寸 / 组件 / 数据模型是否沿用。

### 4.2 阶段路径 (4 阶段)

```
阶段 0: V0.1.6 carryover closure (≤ 0.5 天)
   - V0.1.6 retro 留的 drag "fix 6" 未实测 → V0.2 第一个 Windows build 顺手实测
   - 项目规则 `dev-verify-before-commit`: system API commit 必须有 dev 实测段

阶段 1: V0.2.0 浮动窗最小可用 (1-2 周)
   - 折叠态 320×36 [候选 - V0.2 spec 确认尺寸] + 当前 task + 计时器
   - 全局快捷键 Ctrl+Shift+Space [候选 - V0.2 spec 确认是否沿用]
   - SQLite + timer_session 单表 schema (字段精确化待 V0.2 spec grill，参见 spec §四)
   - Windows 双屏不抢焦实测 (dev 实测 = commit hard gate)

阶段 2: V0.2.1 任务切换 (1-2 周)
   - 展开态: 输入新 task / 选择已有 task / 开始计时
   - 完整 5 态状态机 (start/pause/resume/complete/undo) + 切换不变量
   - timer/task 边界处理 [候选 - 独立评估，不预设沿用 `.archive/` 报告方案]

阶段 3: V0.3+ 候选 (不进 V0.2 范围)
   - macOS 适配 / 主窗 / 设置 / 灵感 + 打卡 + 复盘
```

### 4.3 不在 V0.2 计划但需要登记 (防漏)

| 项 | 推迟到 | 风险 |
|---|---|---|
| LICENSE 文件 | V1.0 上线前 | README 自称 MIT 但仓库无 LICENSE 文件 (E25 候选) |
| CI (GitHub Actions windows-latest) | V0.3+ | D51 候选 — 手工 Windows build 不能持续 |
| 一键 Windows 安装脚本 | V0.3+ | D50 候选 — 当前 45 分钟装机流程 |
| LICENSE 选型 (MIT 确认?) | V1.0 上线前 | AGENTS.md 提及但未做 |
| AGENTS.md 数字/路径校对 | V0.2 启动前 | 当前描述的是 `.archive/` 的 V1.0，与 develop 不同步 (会误导 Agent) |

---

## 五 近大远小的目标

### 5.1 近 (V0.2 内, 1-2 个月)

| # | 目标 | 验收 | 状态 |
|---|---|---|---|
| V0.2.0 | 浮动窗最小可用 (折叠 + 展开输 + 手动完成 + 都显示) | 用户实测 3 秒进入计时、双屏不抢焦、关闭按钮可见 | ⏳ |
| V0.2.1 | 展开态任务选择 + 5 态状态机 | 用户能完成 "输文字 → 开始 → 暂停 → 完成" 全流程 + 选已有 session 继续 | ⏳ |
| V0.2.2 | 时间盒（25min 振动 + 休息）+ 完成通知（Windows toast）| 用户能开关时间盒、完成时弹 toast | ⏳ |
| V0.2.Q | 关闭 V0.1.6 drag region carryover (顺手验) | V0.1.6 retro checklist 第 1 项打勾 | ⏳ |

### 5.2 中 (V0.3, 3-4 个月)

| # | 目标 | 验收 | 备注 |
|---|---|---|---|
| V0.3.0 | macOS 适配 | Mac + Windows 视觉/行为一致 | `.archive/` macOS 代码**整体非事实**，是否复用待 V0.3 立项独立评估（按 archive-reference-only.mdc）|
| V0.3.1 | 主窗 + RecordTimeline (时间线 4 tab) | 用户能"事后回看" | `.archive/` RecordTimeline **整体非事实**，是否复用待 V0.3 立项独立评估 |
| V0.3.2 | 设置中心 (9 节: 外观 / 浮窗 / 数据 / 快捷键 / 启动 / 窗口 / 日志 / 诊断 / 关于) | 用户能改快捷键、自启动、主题 | `.archive/` settings **整体非事实**，是否复用待 V0.3 立项独立评估 |
| V0.3.3 | 全局快捷键 / autostart 可配置 | 用户能关掉 Ctrl+Shift+Space | 同上 |

### 5.3 远 (V1.0, 6-12 个月) — V1.0 PRD 的子集

| # | 目标 | 备注 |
|---|---|---|
| V1.0.0 | 灵感 + 核心待办 + 打卡 + 复盘 4 模块全上线 | `.archive/` 4 表 + 状态机**整体非事实**，是否复用待 V1.0 立项独立评估（按 archive-reference-only.mdc）|
| V1.0.0 | 7 大功能域全部命中 (V1.0 PRD §4) | 不再"v1.2 增量" |
| V1.0.0 | Liquid Glass Mac 95% / Win 80% 还原 | V1.0 PRD §5.2（但 V1.0 PRD 整体非事实，比例待 V1.0 立项独立评估）|
| V1.0.0 | LICENSE 选型 + LICENSE 文件 | V1.0 上线前 hard gate |
| V1.0.0 | 内部 MVP = Sprint 3 (V1.0 PRD INDEX §4 Sprint 3) | 概览页 ⭐ |

### 5.4 更远 (V2.0, 暂不规划) — V1.0 PRD §十 演进路径

- iOS / iPadOS (SwiftUI 复用 V1.0 视图)
- Android (技术栈 D27 待定)
- 语音转文字 (移动端自然延伸)
- 数据互通 (V1.0 数据全本地，V2.0 仍可能不做)

---

## 六 已知 vs 待确认

### 6.1 已知 (从现有材料可直接得出)

- ✅ V0.1.6 Style Guide 已交付，但 drag "fix 6" 未实测 (carryover)
- ✅ Windows 工具链今日 (2026-07-11) 跑通，可作为 V0.2 验证环境
- ✅ V1.0 PRD-V1.2 是上游"宪法"，7 大功能域 / 3-1-0 铁律 / 无导出边界 不变
- ✅ `.archive/src/` + `feat/floating-auto-collapse` 分支有完整 V1.0 浮动窗代码（**整体非事实**，是否复用待 V0.3 立项独立评估）
- ✅ V1.3 iter1 fix report 已处理 timer / record / task 边界冲突

### 6.2 已确认 (2026-07-11, 10 个决策)

**已写 ADR** (达 `domain-modeling` 三标准):

| # | 决策 | 选项 | ADR |
|---|---|---|---|
| Q1 | 当前任务实体 | **B**: 新建独立实体 `timer_session`（与 task 并列）| [0001](adr/0001-timer-session-as-separate-entity.md) |
| Q2 | 计时语义 | **C**: focus_ms 实时显示 + session 日志事后回看（单表双视图）| [0002](adr/0002-focus-ms-plus-session-log.md) |
| Q3 | V0.2.0 范围 | **B**: 折叠 + 展开输（无任务选择）| [0003](adr/0003-v0.2.0-minimum-fold-plus-unfold-input.md) |
| Q4 | 平台范围 | **A**: V0.2 锁 Windows，V0.3 才做 macOS | [0004](adr/0004-v0.2-windows-only.md) |
| Q5 | 数据迁移 | **A**: 全新数据库，不迁移 | [0005](adr/0005-fresh-database-no-migration.md) |
| Q6 | 历史可见性 | V0.2 不暴露回看 UI，V0.3 主窗时间线承担 | [0006](adr/0006-history-visibility-v0.3-main-window.md) |
| Q7 | 启动入口 | 都显示（主窗 + 浮窗同时）| [0007](adr/0007-launch-entry-both-windows.md) |
| Q8 | V0.2.2 范围 | 时间盒（25min 振动 + 休息）+ 完成通知（Windows toast）| [0008](adr/0008-v0.2.2-scope-pomodoro-and-notification.md) |

**已确认但未入 ADR** (trade-off 弱，入 V0.2 spec 落地):

| # | 决策 | 选项 | 落点 |
|---|---|---|---|
| Q9 | 完成方式 | 手动按钮（不自动判定无活动）| V0.2 spec UX 段 |
| Q10 | 数据保留期 | 永久（不自动清理 / 不自动归档）| V0.2 spec schema 段 |
| Q11 | 使用人群 | 单人本地 | `CONTEXT.md` |
| Q12 | 空状态 | 显示空状态 + "新建"按钮（点击新建）| V0.2 spec UX 段 |
| Q13 | 启动入口 | 主窗 + 浮窗都显示 | [ADR 0007](adr/0007-launch-entry-both-windows.md) |
| Q14 | 错误处理 | 提示 message | V0.2 spec 错误流段 |
| Q15 | 任务标题上限 | **B: 50 字符**（UI 校验）| [spec §3.5 v1.1](#) |
| Q16 | a11y | **B: 加 `aria-label`** | [spec §3.9 v1.1](#) |

**spec v1.1 grill 锁定决策 (9.1-9.9)** (2026-07-11 spec-stage grill 完成):

| # | 决策 | 锁定选项 | 落点 |
|---|---|---|---|
| 9.1 | `focus_ms` 写频率 | **A: 每秒写 db** | spec §3.5 + ADR 0002 v1.1 补充 |
| 9.2 | V0.3 接入 task 表方式 | **B: 冗余 `task_title`** | spec §四 + ADR 0001 v1.1 补充 |
| 9.3 | 展开→折叠触发 | **B: 失焦 + Esc** | spec §3.2 |
| 9.4 | `.archive/` 下 db 文件实测 | **✅ 已完成: 无 db 文件** | ADR 0005 v1.1 补充 |
| 9.5 不抢焦 | Windows 不抢焦策略 | **A: `WS_EX_NOACTIVATE`** | spec §3.7 |
| 9.5 位置 | 折叠态默认位置 | **B: 右下角 -100px** | spec §3.1 + §3.4 |
| 9.5 频率 | 计时器更新频率 | **A: 1 秒** | spec §3.1 |
| 9.8 | V0.2 主窗内容 | **E: 沿用 V0.1.6 Style Guide**（不改）| spec §3.6 + ADR 0007 v1.1 补充 |
| 9.9 关窗 | 关窗关系 | **关主窗=隐藏；浮窗右键=退出** | spec §3.4 + ADR 0007 v1.1 补充 |
| 9.9 IPC | IPC 同步 | **B: 主窗静态**（不订阅 timer_session）| spec §3.4 + ADR 0007 v1.1 补充 |

术语表见 [`CONTEXT.md`](CONTEXT.md)。决策按 `domain-modeling` skill 标准落地（硬要 reverse / 惊讶无上下文 / 真实 trade-off 三条全满足才写 ADR，三条不满入 spec）。

> ✅ **spec v1.1 已冻结** (2026-07-11)：10 个 grill 项全部锁定，spec-stage grill 完成。下一步进入 plan 阶段。

### 6.3 待验证 (V0.2 实施时实测，不在 plan 阶段推断)

- WebView2 transparent window 在 Windows 11 的 drag / vibrancy / hit-test 行为
- `tauri-plugin-global-short-shortcut` 在 Windows 的注册 + 冲突处理 (Ctrl+Shift+Space 是否被占用)
- WebView2 对 `backdrop-filter` 的支持程度 (V0.1.6 retro 教训: 不能假设 Linux 等同于 WebView2)
- Windows `WS_EX_NOACTIVATE` 类不抢焦方案在 Tauri 2 webview 下的可达性

---

## 七 文档维护

- **创建**: 2026-07-11 (V0.2 立项)
- **spec v1.1 冻结**: 2026-07-11（9 项 grill 全部锁定）
- **上游**: V1.0 PRD-V1.2 (`.archive/docs/projects/v1.0/prd-v1.2.md`) — **已归档，整体非事实，仅作历史参考**
- **下一步**:
  1. ✅ 8 份 ADR 落地 (`docs/projects/v0.2/adr/0001-0008-*.md`)
  2. ✅ V0.2.0 spec v1.1 冻结 (`docs/specs/2026-07-11-v0.2.0-floating-window-design.md`)
  3. ⏳ 把 V0.2.0 spec 拆成可执行 plan (`docs/plans/2026-07-11-v0.2.0-floating-window.md`)
  4. ⏳ V0.1.6 carryover closure（drag "fix 6" 实测）
- **关联文档**:
  - `docs/reports/v0.1.6-retrospective.md` — V0.1.6 retro 沉淀 (drag fix carryover)
  - `docs/install-windows-v1.0-build-log-2026-07-11.md` — Windows 工具链 ready 证据
  - `.archive/docs/projects/v1.0/prd-v1.2.md` — **已归档，整体非事实**
  - `.archive/docs/projects/v1.0/v1.3-floating-bugfix-iter1-f0.1.md` — **已归档，整体非事实**