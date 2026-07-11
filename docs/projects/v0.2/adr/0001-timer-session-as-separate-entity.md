# 0001 — 当前任务实体：新建独立表 `timer_session`，与 task 并列

**Status**: accepted · 2026-07-11 · V0.2 立项
**引用警告**: 本 ADR 内 `.archive/` 引用按 `archive-reference-only.mdc` 分类如下

V0.2 把"记录当前正在进行的任务"建模为**独立实体** `timer_session`，与 `.archive/` 里 V1.0 的 `task` 表并列存在，**不**复用 `task.active` 状态。

> ⚠️ **本 ADR 决策依据的诚实声明**:
> - "timer 语义 vs task 语义不同"是**推断（待 V0.2 spec 阶段用户确认）**，不是 `.archive/` 事实。
> - V0.2 spec 阶段需补 grill: "timer_session 是否真的不与 task 关联（V0.3 接入时是建外键 / 还是完全解耦 / 还是共用一个状态空间）"。
> - 本 ADR **不**引用 `.archive/` 里的"task 5 态不变量"作为决策依据——那是 V1.0 设计意图，非事实。

## 候选方案

| 选项 | 取舍 |
|---|---|
| A 复用 `task.active` | `.archive/src-tauri/src/db/task.rs` 文件存在（`.archive/` 内容，整体非事实，不预设）；复用是否省代码（推断，待 V0.2 spec 阶段评估工作量）|
| **B** ✅ 新建 `timer_session` 表 | 与 task 解耦；多一份 db 代码（待 V0.2 spec 评估精确行数）|
| C 临时内存 / JSON | 0 schema 工作量（事实）；V0.3 必须重写（推断）|

## 后果（候选，待 V0.2 spec 确认）

- **+** `timer_session` 表独立：状态机 `pending → active ↔ paused → completed`，全局唯一 1 个 active（**待 V0.2 spec 阶段确认状态机是否需要 `pending` 态或直接 `active` 起步**）。
- **−** V0.2 起步多一份 db 代码（行数待 V0.2 spec 评估）。
- **？** V0.3 接入 task 表时的关联语义（外键 / 完全解耦 / 共用状态空间）—— **V0.3 立项时重新 grill，本 ADR 不预设**。

## V0.2 spec v1.1 补充 (2026-07-11)

- **V0.2.0 状态机锁定**: **3 态**（`active` / `paused` / `completed`），**不需要 `pending`**（V0.2.0 流程：展开 → 输入 → 点"开始" → 直接 active）
- **V0.3 接入 task 表关联方式** (spec v1.1 grill 9.2 = **B 冗余 `task_title`**): V0.2.0 schema 不动；V0.3 加 `task_id INTEGER NULL` 外键 + 同时维护 `task_title` 冗余字段；改 task_title 时事务同步更新（崩溃风险已记录）
- **任务标题字符上限** (spec v1.1 grill 9.6 = **B: 50 字符**): UI 层校验，db TEXT 类型不限