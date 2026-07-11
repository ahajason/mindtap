# V0.2 Context — 业务术语表

> V0.2 项目专属术语。**只**收录 V0.2 项目内的特有概念（不含通用编程概念）。
> 收录标准: 在 V0.2 立项 (2026-07-11) 后被用户确认或首次落地的术语。
>
> **每条术语标 [事实] / [推断] 属性**:
> - [事实] = 用户在 V0.2 立项 grill 中明确拍板 / 文件已落地 / git log 可证
> - [推断] = V0.2 spec 阶段需用户独立确认 / 是设计意图但未实测

## 实体 (Entity)

**timer_session** [推断]:
V0.2 唯一的业务实体，记录"我此刻在做什么 + 花了多久"。一张表（`timer_session`），同时承担实时显示（当前 active 行的 `focus_ms`）和事后回看（`status='completed'` 的多行）两个职责。**schema 字段待 V0.2 spec 阶段用户独立确认**（详见 `adr/0002`）。
_Avoid_: "current focus", "timer log", "session log"（语义混淆——timer_session 单表已含 log 视图）

**focus_ms** [推断]:
`timer_session` 表的整数字段，表示**累计聚焦毫秒数**。**待 V0.2 spec 阶段用户确认是否在 paused 时冻结**（详见 `adr/0002` 候选行为段）。**O(1) 读路径** 是推断，未实测。
_Avoid_: "duration", "elapsed"（语义模糊——是绝对值还是当前 session 增量？focus_ms 始终是累计）

## 状态 (Status)

**active** [事实]:
`timer_session` 的状态之一，表示"正在计时中"。**全局唯一 1 个 active 会话** 由 db partial unique index `idx_timer_session_active` 强制约束（spec v1.1 §四）。`focus_ms` 每秒由前端 update 到 db（spec v1.1 grill 9.1 = A）。

**paused** [事实]:
`timer_session` 的状态之一，表示"暂停计时"。`focus_ms` **冻结**不变（spec v1.1 锁定）；`paused_at` 记录暂停时刻。

**completed** [事实 — 手动触发]:
`timer_session` 的状态之一，表示"已完成"。**V0.2 完成方式 = 手动按钮触发**（用户决策 Q9）。`completed_at` 记录完成时刻。completed 行进入 V0.3 主窗时间线（V0.2 UI 不暴露，参见 [ADR 0006](adr/0006-history-visibility-v0.3-main-window.md)）。
_Avoid_: "done"（V1.0 task 状态机用的是 done，V0.2 timer_session 用 completed 以区分——timer 跟 task 不是一个状态空间）

## 状态机 (State Machine)

**3 态状态机** [事实 = spec v1.1]: V0.2.0 `timer_session` **3 态状态机**（active / paused / completed），**不**包含 `pending` 暂存态。V0.2.1 spec v1.1 grill 9.7-A 锁定 **不引入 pending** — SwitchDropdown 选中仅前端 state,按 Enter 才落库 `status='active'`。

```
              [active] ──[pause]──► [paused]
                  ▲  │                  │
                  │  └────[resume]─────┘
                  │
                [complete]
                  │
                  ▼
              [completed]
```

## 行为 (Behavior)

**手动完成** [事实]:
V0.2 用户通过点击浮窗展开态的"完成"按钮触发 `status='completed'`，**不**做自动判定（基于无活动 / 到时间）——用户决策 Q9。

**永久保留** [事实]:
V0.2 timer_session 数据**不**自动清理 / **不**自动归档，db 文件只增不减——用户决策 Q10。**未实测的长期影响**：V0.2 长期使用后 db 文件可能持续增长（推断，待 V0.3 立项评估是否需要 `archived_at` 字段 + 手动归档 UI）。

**空状态** [事实]:
首次启动时浮窗显示空状态 + "新建"按钮。点击"新建"展开输入框——用户决策 Q12。**具体空状态文案 / 按钮位置 / 是否带引导图待 V0.2 spec 阶段 grill**。

**错误处理 message** [事实]:
V0.2 错误流 = 用户可见的提示 message（如 db 写失败、快捷键冲突）——用户决策 Q14。**具体形式（toast / 模态 / 浮窗内红字）待 V0.2 spec 阶段 grill**。

**都显示启动** [事实]:
V0.2 启动时同时显示主窗 + 浮窗——用户决策 Q13，参见 [ADR 0007](adr/0007-launch-entry-both-windows.md)。**V0.2 主窗内容（空壳 / 关于 / 设置）待 V0.2 spec 阶段 grill**。

## 单人本地 (Single-User Local)

**单人本地** [事实]:
V0.2 是**单人**本地工具，不考虑多用户 / 团队 / 多设备——用户决策 Q11。db schema 不需要 `user_id` 字段。

## V0.2.2 范围 (V0.2.2 Scope)

**时间盒 (Pomodoro)** [事实 — V0.2.2]:
25min 焦点 + 休息的番茄工作法——用户决策，参见 [ADR 0008](adr/0008-v0.2.2-scope-pomodoro-and-notification.md)。**默认时长 / 长休息 / 可配置性待 V0.2.2 spec 阶段 grill**。

**Windows toast** [事实 — V0.2.2]:
完成通知用 Windows 系统 toast——用户决策，参见 [ADR 0008](adr/0008-v0.2.2-scope-pomodoro-and-notification.md)。**toast 内容 / 交互按钮 / macOS 替代方案待 V0.2.2 spec 阶段 grill**。

## V0.2.1 范围 (V0.2.1 Scope)

> V0.2.1 在 V0.2.0 折叠 + 展开输(无选择)基础上,**叠加** SwitchDropdown — 在展开态加"或选择已有任务"入口,从历史 completed timer_session 中挑 task_title 复用,创建新 session 后立即 active。**不**修改 V0.2.0 折叠态,不修改 V0.2.0 状态机。

**SwitchDropdown** [事实 = spec v1.1 grill 9.1-9.5]:
V0.2.1 在**展开态**新增的子组件。仅在"无 active session"时显示;折叠态不变。数据源 = `timer_session` WHERE status='completed' GROUP BY task_title ORDER BY MAX(completed_at) DESC LIMIT 5 — 最近 5 个**不同 task_title**(末次使用倒序)。详细见 [ADR 0009](adr/0009-v0.2.1-scope-task-switching.md)。

**SwitchDropdown popover overlay** [事实 = spec v1.1 grill 9.9-C]:
V0.2.1 SwitchDropdown 展开时 = **浮层 popover** 形式(InputBar 始终在底)。SwitchDropdown 是 popover,绝对定位浮在 trigger 上方,**覆盖 InputBar 上沿**(可接受,与 V0.2.0 状态机一致 — InputBar 永远可见可切)。详见 [spec §3.1](../specs/2026-07-11-v0.2.1-task-switching-design.md)。

**9.6 引导新建气泡** [事实 = spec v1.1 grill 9.6-C]:
首次启动 / 0 条 completed session → SwitchDropdown 区段**不显示**折叠按钮;改显示引导气泡: `👋 还没有历史任务,先新建一个试试?` (点击 → 焦点跳到 InputBar)。**仅首次**(空状态)显示,有 1 条 completed 后即换为 SwitchDropdown 入口。

**9.7 不引入 pending 态** [事实 = spec v1.1 grill 9.7-A]:
V0.2.1 **沿用 V0.2.0 3 态**(active / paused / completed),**不**新增 pending 暂存态。SwitchDropdown 选中 task_title 后 → 仅前端 React state 更新 + InputBar 显示完整 task_title → 按 Enter 才落库(`status='active'`)。db 永远不出现"半提交"行。

**9.8 列表滚动完整** [事实 = spec v1.1 grill 9.8-B]:
SwitchDropdown 列表项 task_title **不截断**;列表内 `overflow-y: auto` 滚动。task_title 上限仍为 50 字符(同 V0.2.0)。

**9.3 选后 = 创建新 session 复用 task_title** [事实 = spec v1.1 grill 9.3-A]:
SwitchDropdown 选中 → InputBar 显示完整 task_title(可二次编辑)→ 用户按 Enter / 开始 → 创建新 `timer_session`(`task_title=该值`, `status='active'`, `started_at=now`, `focus_ms=0`)。**不**复用旧 session(避免历史被覆盖)。

## UI 状态 (UI State)

**折叠态** [事实 = spec v1.1 grill]:
浮动窗的默认态，**尺寸 320×36**。**位置**: 主屏右下角 + 上 100px（避 Windows 11 任务栏）。**单行显示"task_title + focus_ms 计时器"**。**不抢焦**（spec v1.1 锁定 `WS_EX_NOACTIVATE` 策略）。
_Avoid_: "minimized", "collapsed"（minimized 暗示 OS 级窗口最小化；collapsed 是 CSS 术语——折叠态是产品概念）

**展开态** [事实 = spec v1.1 grill]:
浮动窗的展开态，**尺寸 360×280**。**默认向上展开**（避免覆盖任务栏）。**包含输入框 + 启动/暂停/恢复/完成按钮（V0.2.0 范围）**（用户决策 Q3=B）。**"启动后自动折叠"是 spec v1.1 锁定行为**（Enter/Esc/失焦/点开始/完成 都折叠）。

## 不抢焦 (Not Stealing Focus)

**WS_EX_NOACTIVATE** [事实 = spec v1.1 grill 9.5]:
V0.2 浮窗永远不抢当前焦点（即使显示/被点击）。Windows OS 级窗口样式 `WS_EX_NOACTIVATE` 实现，通过 `RawWindowHandle` 拿底层 HWND 后用 `SetWindowLongPtr(hwnd, GWL_EXSTYLE, ...)` 设置。

## 主窗内容 (Main Window)

**V0.2 主窗 = V0.1.6 Style Guide** [事实 = spec v1.1 grill 9.8]:
V0.2.0 主窗 webview **沿用** V0.1.6 react-router-dom 7 路由（Overview / Surface / Button / Input / Feedback / Overlay / Tokens）。V0.2 实施时**不修改** `src/App.tsx` / `src/routes/` 任何组件。

## 关窗关系 (Window Closing)

**关主窗 = 隐藏（不退出）；浮窗右键 = 退出** [事实 = spec v1.1 grill 9.9]:
- 关闭主窗窗口 → 主窗隐藏，浮窗继续计时，应用继续运行（"后台驻留"模式）
- 浮窗右键菜单 → 退出应用（唯一正退出入口，V0.2 浮窗须加右键菜单）

## 平台 (Platform)

**V0.2-Windows** [事实]:
V0.2 唯一支持的平台，即 Windows 11 24H2 x64。macOS 推迟到 V0.3（见 `adr/0004-v0.2-windows-only.md`，用户决策 Q4=A）。

## 产品概念 (Product Concept)

**"现在在做什么"指示器** [推断]:
V0.2 产品的核心隐喻——浮动窗的物理形态本身就是解决方案的一部分，不是"展示什么"而是**"永远在那儿"**。详见 `README.md` §3.2。**该隐喻的"永远不抢焦 + 永远可见"是产品意图，V0.2 实施时实测是否真的达成**。