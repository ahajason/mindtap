# docs/ — 目录索引与结构

> 子目录 CLAUDE.md：Claude 读 docs/ 下任何文件时自动加载。**权威细则一律查 `docs/governance/doc-layers.md`，本文件只做速查与索引**。

---

## 一、目录结构（按大需求划分）

**核心原则**：每个大需求一个目录，目录内 `index.md` 是唯一入口；文档内部不互相引用（减少散弹式更新）。技术实现细节由单元测试 + 代码承载，不写文档。

```
docs/
├── 轻念Mindtap产品需求文档.md    # 产品唯一真值（需求 + 场景 + 路线图）
├── CLAUDE.md                    # 本索引
├── L-1-workbench/               # 大需求 1：工作台账核心（阶段一）
│   ├── index.md                 # 唯一入口
│   ├── domain.md                # 业务实体 / 状态机 / 不变量
│   ├── design.md                # 浮窗视觉 / 交互契约
│   └── adr/                     # 业务决策（0011/0012/0013）
├── L-2-review/                  # 大需求 2：可信台账与复盘（阶段二）
│   ├── index.md
│   └── adr.md                   # 阶段二范围决策（0014）
├── M-1-material/                # 大需求 3：平台原生动态材质（V0.3.0）
│   ├── index.md
│   ├── prd.md                   # 需求
│   ├── domain.md                # 决策（ADR-0010）
│   └── design.md                # 设计契约
├── design-system/               # 玻璃设计系统（跨需求共享规范）
│   ├── index.md
│   ├── glassic-ui-spec.md       # 玻璃规范（唯一）
│   ├── glass-tokens.md          # Token 索引
│   └── component-format.md      # 组件契约
├── governance/                  # 跨版本规则（doc-layers / versioning-rule / l3-gating）
├── plans/                       # 实施计划（当前需求 plan）
└── reports/                     # 发版记录（release notes / retro）
```

> **需求目录命名**：`<编号>-<单词>`（如 `L-1-workbench`）。编号前缀（`L-1` / `L-2` / `M-1`）用于与通用目录（design-system / governance / plans / reports 等）区分；单词表达业务语义。文档内不逐个编号，靠目录名隔离。

## 二、写入规则

| 内容 | 去处 |
|---|---|
| 产品需求 / 验收 | `docs/轻念Mindtap产品需求文档.md`（唯一真值） |
| 业务实体 / 状态机 / ADR | 对应需求目录 `domain.md` / `adr/` |
| 视觉 / 交互 / 组件契约 | 对应需求目录 `design.md` |
| 范围边界 / bug 归属 | task.md「范围边界」段 |
| 技术实现细节 | **单元测试 + 代码**（`src/lib/tauri-bridge.ts` / `schema.rs` / vitest / cargo test），不写文档 |
| 进行中任务 | `docs/<需求>/tasks/<name>/task.md` |
| 跨版本规则 | `docs/governance/` |
| 发版记录 | `docs/reports/`（release notes / retro） |

**不互相引用**：目录内文档不互相贴路径链接，只引用本目录 `index.md` 与共享规范（`design-system/`）。改动一个需求只碰对应目录，不四处更新链接。

## 四、治理

- 文档结构规则 → `docs/governance/doc-layers.md`
- 版本语义 / bug 归属 → `docs/governance/versioning-rule.md`
- L3 实测硬约束 → `docs/governance/l3-gating.md`
