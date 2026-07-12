# docs/ — 文档分层 + 归位 + 目录索引

> 子目录 CLAUDE.md: Claude 读 docs/ 下任何文件时自动加载。**权威细则一律查 `docs/governance/doc-layers.md`,本文件只做速查与索引**。

---

## 一、L0-L5 文档分层速查

任何新文档创建前必读 `docs/governance/doc-layers.md`。

| 层 | 文件夹 | 职责 | 严禁出现 |
|---|---|---|---|
| **L0 PRD** | `docs/prd/` | 纯业务(用户故事 / 场景 / 规则 / 验收 / 反需求 / NFR / 里程碑 / 术语) | 表名 / 字段 / API / 模块名 / 命令名 / SQLite / Rust / React / Tauri / 文件路径 |
| **L1 Domain** | `docs/domain/` | 业务实体 / 状态机 / 用户流程 / 业务不变量 / 业务级 ADR | `INTEGER` / `partial unique index` / `invoke` / `Mutex` / `src-tauri/` / `tauri-bridge.ts` / SQL 语句 |
| **L2 Tech** | `docs/tech/` | 接口契约(IPC + 参数 + 返回 + 异常)/ 数据模型(表 / 字段 / 索引)/ 模块边界 / DoD / **bug 归属边界** | 用户故事 / 产品愿景 / 视觉稿 / 字体 |
| **L3 Design** | `docs/design/` | 视觉稿 / 组件契约 / 交互细节 / token 引用 / a11y 注解 | 表 / 字段 / IPC 命令 / SQL 语句 / 模块文件路径 |
| **L4 Plan** | `docs/plans/` | 步骤 / commit 计划 / 回归测试 / DoD 勾选 / 风险登记 | 业务规则 / 用户故事 / 产品愿景 |
| **L5 Reports** | `docs/reports/` | L1/L2/L3 三层证据 / release notes / retro / bug 列表 | 设计意图(已归档) |
| **治理** | `docs/governance/` | 跨版本规则(doc-layers / versioning-rule / l3-gating) | 项目细节 |

**完整规则**: 引用规则 + 新功能/bug 流程 + 旧路径迁移表 → `docs/governance/doc-layers.md`。

---

## 二、文件归位(写任何 docs/ 内文件前必查)

| 内容类型 | 去处 | 关键约束 |
|---|---|---|
| 用户故事 / 业务规则 / 验收 | `docs/prd/<version>-<feature>-prd.md` | 纯业务,无技术名词 |
| 业务实体 / 状态 / 业务 ADR | `docs/domain/<version>-domain-model.md` | 无表名 / 字段 / IPC 命令 |
| 技术方案 / IPC / 数据 / bug 边界 | `docs/tech/<version>-<feature>-tech.md` | 必须含 §1 范围边界 + §6 bug 归属 |
| 视觉 / 交互 / 组件契约 / a11y | `docs/design/<version>-<feature>-design.md` | 无表 / IPC / 模块路径 |
| 实施步骤 / commit 计划 / DoD 勾选 | `docs/plans/YYYY-MM-DD-<version>-<feature>.md` | 不写业务规则 |
| 阶段交付报告 / retro / release notes | `docs/reports/` | 含 L1/L2/L3 证据 |
| 已交付版本的完整沙盒 | `docs/archive/v<version>/` | 源码 + 文档,自包含 |
| 进行中 task | `docs/tasks/<version>-<type>-<short-desc>/task.md` | 入口固定 task.md |
| 跨版本规则 | `docs/governance/` | 横向贯穿 |

**已弃用旧路径**(内容已迁到对应 L 层,见 `doc-layers.md §六`):

- ❌ `docs/specs/` → design/ + tech/
- ❌ `docs/architecture/` → tech/ §DoD + governance/l3-gating.md
- ❌ `docs/projects/<v>/CONTEXT.md` → domain/<v>-domain-model.md
- ❌ `docs/projects/<v>/README.md` → prd/ + domain/ + tech/

---

## 三、docs/ 目录结构(按 L0-L5 治理分类)

### 治理与按层组织

```
docs/
├── governance/   # 跨版本规则:doc-layers / versioning-rule / l3-gating
├── prd/          # L0 纯业务(用户故事 / 验收)
├── domain/       # L1 业务实体 / 状态 / ADR
├── tech/         # L2 技术方案 / IPC / 数据 / bug 边界
├── design/       # L3 视觉 / 交互 / 组件契约
├── plans/        # L4 实施步骤 / commit 计划
├── reports/      # L5 交付报告 / retro / release notes
├── tasks/        # 进行中 task(每个 task 一个目录,task.md 是入口)
└── archive/      # 已交付版本的完整沙盒(源码 + 文档)
```

### 杂项

```
docs/
├── references/   # 跨 session 引用的 reference(性能 baseline / 外部 spec)
├── research/     # 调研材料(临时,不归 L0-L5)
├── superpowers/  # superpowers 插件本地副本 / 配置
└── *.md          # 根级零散 md(如 install-windows-v1.0-build-log-*.md)
```

> 杂项内容不属于 L0-L5 治理范围;需要归档的走 L5 reports/;需要写正式规则的走 governance/。

---

## 四、引用与依赖

- **L0 可引用任何下层**(PRD 验收章节引用 Tech DoD 允许)
- **L1 不可引用 L2**(领域模型不应知道技术实现)
- **L2 不可引用 L3/L4**(技术方案不应被视觉稿污染)
- **L3 不可引用 L2**(设计 spec 不应绑定到具体 IPC)
- **任何层都可引用 `docs/governance/`**(治理横向贯穿)

完整规则 + 违规检测 → `docs/governance/doc-layers.md §四 / §八`。