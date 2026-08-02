# 文档结构规则(Doc Structure)

> **生效日期**: 2026-08-02
> **状态**: ✅ 已立(rule,非 task)

## 一、为什么按大需求分目录

**每个大需求一个目录**,让改动一个需求只碰一个目录、不四处同步文件——这是文档结构的核心原则:

- **每个大需求一个目录**,目录内 `index.md` 是唯一入口;
- 需求 + 领域 + 设计**同目录内**承载,改一个需求只碰一个目录;
- **技术实现细节不写文档**,由单元测试 + 代码承载;
- 文档内部**不互相引用**(除 index.md),消灭链接维护负担。

## 二、目录结构

```
docs/
├── 轻念Mindtap产品需求文档.md    # 产品唯一真值(需求 + 场景 + 路线图)
├── CLAUDE.md                    # docs 索引
├── <编号>-<需求>/               # 每个大需求一个目录(编号区分通用目录)
│   ├── index.md                 # 唯一入口(唯一允许引用的文件)
│   ├── prd.md                   # 需求(如有独立需求)
│   ├── domain.md                # 领域模型 / 状态机 / ADR
│   ├── design.md                # 视觉 / 交互 / 组件契约
│   └── tasks/                   # 该需求的进行中任务(task.md 含「范围边界」段)
├── design-system/               # 跨需求共享视觉规范(glassic-ui-spec 等)
├── governance/                  # 跨版本规则(doc-structure / versioning-rule / l3-gating)
├── plans/                       # 实施计划
└── reports/                     # 发版记录(release notes / retro)
```

**需求目录命名**: `<编号>-<单词>`(如 `L-1-workbench`)。编号前缀(`L-1` / `L-2` / `M-1`)用于与通用目录区分;单词表达业务语义。文档内不逐个编号,靠目录名隔离。

## 三、各目录职责

| 目录 | 职责 | 严禁出现 |
|---|---|---|
| 产品真值文档 | 用户故事 / 业务规则 / 验收 / 路线图 | 表名 / API / 模块路径 |
| 需求目录 `domain.md` | 业务实体 / 状态机 / 不变量 / ADR | `INTEGER` / `Mutex` / SQL |
| 需求目录 `design.md` | 视觉 / 交互 / 组件契约 / token 引用 | 表 / IPC / 模块路径 |
| `design-system/` | 共享玻璃规范(token / 组件契约) | 业务规则 |
| task.md | 范围边界 / bug 归属 / Done when | 技术实现细节(入测试) |
| `governance/` | 跨版本规则 | 项目细节 |

## 四、引用规则

- **index.md 是唯一允许引用本目录文件的入口**;其余文档内部不互相引用;
- 各需求文档引用共享规范(design-system)以**语义描述**表达,不贴路径;
- 任何目录可引用 `docs/governance/`(治理横向贯穿);
- 改一个需求:只碰对应需求目录 + 主文档,不四处更新链接。

## 五、新功能 / 新 bug 流程

### 新功能

```
1. 主文档补需求(如有新的产品场景)
2. 开 docs/<编号>-<需求>/ 目录(或复用已有)
3. 写 domain.md(如新实体/状态) + design.md(如有 UI)
4. 写 index.md(唯一入口,列出目录内文档)
5. 开 docs/<编号>-<需求>/tasks/<name>/task.md(含「范围边界」段)
```

### 新 bug

```
发现 bug
  ↓
读对应任务的 task.md 「范围边界」段
  ↓
├─ 在范围内 → 开 docs/<需求>/tasks/<name>-fix-<topic>/task.md
└─ 不在范围内 → 不归本任务,另开 task
```

## 六、违规检测

`/claude-md-improver` 扫描时检查:

- 需求目录是否缺 `index.md`;
- 除 index.md 外,文档是否有跨文件路径引用(应改为语义描述)。

## 关联

- [versioning-rule.md](./versioning-rule.md) — 版本号语义 + bug 归属
- [l3-gating.md](./l3-gating.md) — L3 强制实测
