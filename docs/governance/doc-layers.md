# 文档分层规则(Doc Layers)

> **生效日期**: 2026-07-13
> **触发**: V0.2.7 retro 沉淀 — V0.2 项目混用 README/CONTEXT/specs 三层文档,职责交叉导致 agent 无法依赖任何单一文档作为业务真值
> **状态**: ✅ 已立(rule,非 task)

## 一、为什么分层

文档不分层的症状(全部在 V0.2.7 retro 已沉淀):

- 同一个"timer_session"在 CONTEXT.md 是业务实体,在 specs/ 是数据表,在 plans/ 是 SQL 脚本——三处定义,任何一处更新都会不同步
- agent 接到"修 bug"任务时,不知道该改哪个文件才算"真改了业务"
- PRD(纯业务)和技术方案混在一起,业务评审时被技术细节污染

## 二、6 层文档结构

```
┌─ L0 PRD ────────────  纯业务,不出现任何技术名词
│
├─ L1 Domain ──────────  业务实体/状态/规则,不出现表名/字段/IPC 命令
│
├─ L2 Tech ────────────  技术方案,每个 feature 一份,含接口/数据/DoD/bug 边界
│
├─ L3 Design ──────────  UI/UX 设计(视觉/交互/组件契约)
│
├─ L4 Plan ────────────  实施步骤 + 回归测试
│
└─ L5 Reports ─────────  验收报告 + retro + release notes
```

每一层只引用下一层,**不重复下一层的内容**。

## 三、每层职责 + 严禁出现

| 层 | 文件夹 | 职责 | 严禁出现 |
|---|---|---|---|
| **L0 PRD** | `docs/prd/` | 用户故事 / 用户场景 / 业务规则 / 用户视角验收 / 反需求 / 非功能需求 / 里程碑 / 术语表 | 表名、字段、API、模块名、命令名、SQLite、Rust、React、Tauri、文件路径 |
| **L1 Domain** | `docs/domain/` | 业务实体(概念)/ 状态机 / 用户流程 / 业务不变量(用业务语言)/ 业务级 ADR | `INTEGER`、`partial unique index`、`invoke`、`Mutex`、`src-tauri/`、`tauri-bridge.ts`、SQL 语句 |
| **L2 Tech** | `docs/tech/` | 接口契约(IPC + 参数 + 返回 + 异常)/ 数据模型(表/字段/索引)/ 模块边界 / DoD / **bug 归属边界** | 用户故事、产品愿景、视觉稿、字体大小 |
| **L3 Design** | `docs/design/` | 视觉稿 / 组件契约 / 交互细节 / token 引用 / a11y 注解 | 表、字段、IPC 命令、SQL 语句、模块文件路径 |
| **L4 Plan** | `docs/plans/` | 步骤 / commit 计划 / 回归测试 / DoD 勾选 / 风险登记 | 业务规则、用户故事、产品愿景 |
| **L5 Reports** | `docs/reports/` | L1/L2/L3 三层证据 / release notes / retro / bug 列表 | 设计意图(已归档到 archive) |

## 四、引用规则

- **L0 可以引用任何下层**——PRD 在验收章节引用 Tech 的 DoD 是允许的(用户视角的"功能可用"对应技术层的"测试通过")
- **L1 不能引用 L2**——领域模型不应该知道技术实现
- **L2 不能引用 L3/L4**——技术方案不应该被视觉稿污染
- **L3 不能引用 L2**——设计 spec 不应该绑定到具体 IPC 命令
- **任何层都可以引用 `docs/governance/`**——治理规则是横向贯穿

## 五、新功能 / 新 bug 的文档流程

### 新功能(走全 5 层)

```
1. 写 docs/prd/<version>-<feature>-prd.md       (L0)
2. 写 docs/domain/<version>-domain-model.md 增量段 (L1,可能与已有实体冲突)
3. 写 docs/tech/<version>-<feature>-tech.md      (L2,含 bug 归属边界)
4. 写 docs/design/<version>-<feature>-design.md  (L3,如有 UI)
5. 写 docs/plans/YYYY-MM-DD-<version>-<feature>.md (L4)
6. 开 docs/tasks/<version>-<type>-<topic>/task.md
```

**6 步缺一不开 task** — 见 `.claude/rules/doc-layer-discipline.mdc`

### 新 bug(走 bug 归属判断)

```
发现 bug
  ↓
问:这 bug 的代码/UI/数据在哪一层的 feature 表面?
  ↓
读对应版本的 docs/tech/<version>-<feature>-tech.md §1 范围边界
  ↓
├─ 在范围内 → 开 docs/tasks/<version>.X-fix-<topic>/task.md
└─ 不在范围内 → 不归本版本,另开 version 的 PRD/Tech + task
```

## 六、文件夹路径映射

| 旧路径(混乱期) | 新路径(分层后) | 迁移规则 |
|---|---|---|
| `docs/projects/v0.2/README.md` 整本 | 拆 → `prd/` + `domain/` + `tech/` | 整体删除,内容分散 |
| `docs/projects/v0.2/CONTEXT.md` | → `domain/v0.2-domain-model.md` | 实体/状态迁,技术细节剔除 |
| `docs/projects/v0.2/adr/*.md` | → `domain/adr/*.md` | 整体 mv |
| `docs/specs/*.md` | → `design/*.md` + `tech/*.md` | 按内容性质拆 |
| `docs/architecture/*.md` | → `tech/*.md` §DoD + `governance/l3-gating.md` | 验证清单迁 tech,治理规则迁 governance |
| `docs/plans/*.md` | 保持 `plans/` | 名称 OK,职责收紧 |
| `docs/reports/*.md` | 保持 `reports/` | 名称 OK |
| `docs/tasks/<v>-<type>-<topic>/` | 保持 `tasks/` | 名称 OK |

## 七、CLAUDE.md 速查表(必须出现在 CLAUDE.md 顶部)

```markdown
## 文档分层速查表

任何新文档创建前必读 `docs/governance/doc-layers.md`。

| 层 | 文件夹 | 职责 | 严禁出现 |
|---|---|---|---|
| L0 PRD | `docs/prd/` | 纯业务 | 技术名词/API/文件路径 |
| L1 Domain | `docs/domain/` | 业务实体/状态/规则 | 表名/字段/IPC 命令 |
| L2 Tech | `docs/tech/` | 技术方案 + bug 边界 | 用户故事/视觉稿 |
| L3 Design | `docs/design/` | UI/UX | 表/IPC/模块路径 |
| L4 Plan | `docs/plans/` | 实施步骤 | 业务规则/产品愿景 |
| L5 Reports | `docs/reports/` | 验收 + retro | 设计意图(已归档) |
```

## 八、违规检测

`/claude-md-improver` 跑扫描时,会读所有 `docs/prd/ domain/ tech/ design/ plans/ reports/ tasks/` 下的 `.md`,按本表"严禁出现"列做关键词正则检查,违规 ≥ 1 处必须改完才能 commit。

## 关联

- [versioning-rule.md](./versioning-rule.md) — 版本号语义
- [l3-gating.md](./l3-gating.md) — L3 强制实测