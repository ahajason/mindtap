# 0006 — 历史可见性：V0.2 不暴露回看 UI，V0.3 主窗时间线承担

**Status**: accepted · 2026-07-11 · V0.2 立项
**引用警告**: 本 ADR 锁定 V0.2 范围边界，**不**预设 V0.3 主窗实现细节

V0.2 浮窗**不**提供"事后回看历史 timer_session"的 UI 入口。`timer_session` 表仍记录所有 session（含 `completed_at` 等字段），但 V0.2 UI 只暴露**当前 active session**（折叠态）和**手动完成**（展开态按钮）。历史回看 UI 推迟到 V0.3 主窗（参见 `README.md` §5.2 V0.3.1 计划：主窗 + RecordTimeline）。

## 候选方案

| 选项 | V0.2 UI 范围 | V0.3 范围 |
|---|---|---|
| A V0.2 加回看 tab | 浮窗多一个"历史"tab | — |
| B V0.2.1 加回看 | — | 加回看 tab |
| **C** ✅ V0.3 主窗时间线 | 仅折叠 + 展开输 + 手动完成 | 主窗 RecordTimeline 4 tab（含全部/任务/灵感/打卡）|

## 为什么选 C

- V0.2 UI 范围收窄，**dev 实测聚焦**（折叠态显示 + 展开输 + 手动完成三件事，按 `dev-verify-before-commit.mdc` 各自独立验收）。
- `.archive/` 内容（无论文件存在还是设计意图）**全部属于非事实**——按 `archive-reference-only.mdc`，V0.3 是否复用 RecordTimeline / 4 tab 还是其他形态，**待 V0.3 立项时独立评估**，本 ADR 不预设。
- V0.2 用户至少能通过 db 文件用 `sqlite3` 查历史——**通用技术事实**：任何 SQLite 文件可被 sqlite3 客户端打开。**db 路径 `%APPDATA%\com.projects.app\projects.db` 待 V0.2 spec 阶段用户独立确认**（不能从 `.archive/` 沿用）。

## 后果（候选，待 V0.2 spec 确认）

- **+** V0.2 UI 单一交互路径，验收简单。
- **−** V0.2 用户无法在 UI 内看历史——**待 V0.2 spec 阶段评估是否在折叠态加"上次 session 摘要"**（如"上次：写文档 23min"），减少用户对"数据丢了"的疑虑。
- **？** V0.3 主窗 UI 实现方式（独立窗口 / tab / 设置中心入口）—— **V0.3 立项时重新 grill**。