# 0002 — 计时语义：focus_ms 实时显示 + session 日志事后回看

**Status**: accepted · 2026-07-11 · V0.2 立项
**引用警告**: 本 ADR 内包含 SQL 草稿，**仅作 V0.2 候选 schema**，**未落地、未与用户独立确认**

`timer_session` 单表同时承担两个职责（**设计意图，待 V0.2 spec 阶段用户确认**）：
- 当前 active 那行的 `focus_ms` 给浮动窗实时显示（用户瞥一眼"我已经在 X 上花了 23:14"）
- `status='completed'` 的多行给事后回看（用户下午复盘"上午 9:30-11:00 写代码"）

不引入单独的 `session_log` 表。

## 候选 schema（V0.2 spec 阶段需用户确认字段、索引、约束）

```sql
-- ⚠️ 草稿，V0.2 未落地。V0.2 spec 阶段会单独写一份 "db schema 设计" 并 grill 用户。
CREATE TABLE timer_session (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  task_title    TEXT NOT NULL,
  status        TEXT NOT NULL,             -- pending | active | paused | completed
  started_at    INTEGER,
  paused_at     INTEGER,
  completed_at  INTEGER,
  focus_ms      INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
```

## 候选行为（V0.2 spec 阶段需用户确认）

- **+** `focus_ms` 进入 active 时累加；active→paused 时冻结并记 `paused_at`；paused→active 时清零 `paused_at`。**该时序行为是设计意图，未实测。**
- **+** 事后回看 `WHERE status='completed' ORDER BY completed_at DESC`。
- **−** 字段有冗余（`focus_ms` 可由 SUM(started_at, paused_at, completed_at) 派生），**O(1) 读路径 vs 派生读路径** 的权衡是推断（实际数据量未到讨论性能量级），**待 V0.2 spec 实测后定**。

## 候选方案

| 选项 | 取舍 |
|---|---|
| A 只 `focus_ms` | 最简单；事后只能看总数 |
| B 只 session 日志 | 完整时间线；实时显示需聚合 |
| **C** ✅ 两者都要（单表双视图）| 实时便宜 + 事后完整；字段略冗余 |

## 后果（候选，待 V0.2 spec 确认）

- **？** "focus_ms 实时 O(1)" 是推断。V0.2 实施时实测浮动窗 tick hook 的真实读路径再定。
- **？** "暂停冻结" 是设计意图，V0.2 spec 阶段 grill 用户是否要"暂停时仍继续累计"或"暂停时冻结"——这是产品语义，不该代理决策。

## V0.2 spec v1.1 补充 (2026-07-11)

- **`focus_ms` 写入频率** (spec v1.1 grill 9.1 = **A: 每秒写 db**): active 期间前端每秒 update focus_ms 到 db。崩溃丢 ≤ 1 秒
- **"暂停冻结" 锁定**: 暂停时 `focus_ms` 冻结不变（V0.2.0 spec §3.2 行为锁定）；paused_at 记当前时间；paused → active 时 paused_at 清零、focus_ms 继续累加
- **paused 时不更新 db focus_ms**: focus_ms 只在 active 期间每秒写一次；paused 状态切换时各写一次（status + paused_at）
- **db 写失败处理**: 自动重试 3 次 + 失败后停止（spec §3.8）