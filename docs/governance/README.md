# Governance — 项目治理规则入口

> 本目录收纳**不**随项目版本演进的"宪法性"规则。任何新功能、新 bug、新 doc 都必须先看本目录。

## 文件清单

| 文件 | 何时读 | 何时改 |
|---|---|---|
| [`doc-layers.md`](./doc-layers.md) | 任何新文档创建前 | 文档分层结构变动时 |
| [`versioning-rule.md`](./versioning-rule.md) | 任何发版前 | 版本号语义变动时 |
| [`l3-gating.md`](./l3-gating.md) | 任何 commit / release 前 | L3 验证流程变动时 |

## 治理 vs 项目文档

| 类型 | 位置 | 生命周期 |
|---|---|---|
| **治理规则** | `docs/governance/` | 跨版本不变,改前必须 review |
| **项目文档** | `docs/L-*`(需求目录)+ `docs/<需求>/tasks/`(进行中任务)+ `docs/plans/`(计划) | 随需求演进 |

## 改治理规则前的硬约束

1. 在 PR 描述里写明改这条规则解决了什么具体问题(不许"感觉该改")
2. 必须 `git blame` 出上一版规则的 commit + 为什么这么写
3. 影响范围评估:这条规则变了,现有 `docs/` 哪些文件需要重写?
4. `.archive/` 内的相关历史材料扫一遍,确认新规则不与历史决策冲突

## 关联

- CLAUDE.md 顶部速查表
- `.claude/rules/docs.mdc` — 强制执行入口