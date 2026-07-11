# 0005 — 数据迁移：全新数据库，不从 .archive/ 实装导入

**Status**: accepted · 2026-07-11 · V0.2 立项
**引用警告**: 本 ADR 内 `.archive/` 引用按 `archive-reference-only.mdc` 分类

V0.2 启动时使用全新 SQLite db 文件（**Windows 路径待 V0.2 spec 阶段确认**）。**不**做从 `.archive/` 实装的 db 数据导入。

## 候选方案

| 选项 | 含义 |
|---|---|
| **A** ✅ 全新数据库 | V0.2 全新 db，不迁移 |
| B 导入 .archive/ | 从 `.archive/` 实装的 db 导入历史 timer_session / task |

## 为什么选 A

- `.archive/src-tauri/src/db/schema.rs` 是 `.archive/` 文件（整体非事实，不预设其内容是 V0.2 决策依据）。
- V0.2 schema 跟 `.archive/` 4 表 schema 是否同构——**V0.2 spec 阶段独立 grill**，**不预设**同构或异构。
- V0.2 启动时实测 `.archive/` 下是否存在 db 文件（`find .archive -name "*.db"`），如有则单独评估数据迁移策略。**如有真实数据，本 ADR "全新 db" 决策需用户重新确认**。
- **V0.2 schema 设计意图**：1 表 timer_session（详见 `0002`）。V0.2 schema **未落地、未与用户独立确认**——**V0.2 spec 阶段会单独写 schema 设计并 grill 用户**。

## 后果（候选，待 V0.2 spec + 启动时实测确认）

- **+** V0.2 db schema 极简，无需 import 路径测试。
- **+** V0.2 验收无需做"导入后字段映射"测试。
- **？** V0.3+ 想"在主窗时间线里展示 V1.0 时代的历史灵感/打卡"——**待 V0.3 立项时评估，本 ADR 不预设**。

## 9.4 实测结果 (2026-07-11)

`find .archive -name "*.db"` 返回**空**。`.archive/` 下没有任何 db 文件。

**本 ADR 决策得到完全确认**:
- 全新 db 决策无任何迁移场景
- ADR 0005 之前担心的 ".archive/ db 是 demo 还是生产数据" 问题**不存在**
- V0.2 实施时不需要考虑 .archive/ 数据迁移路径