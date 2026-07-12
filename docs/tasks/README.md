# Task — 任务正式档(模板)

> **本文件夹**: `docs/tasks/`
> **职责**: 每个 fix/feat/chore 一个 task.md,含 Why/What/Done when
> **走 `task-directory.mdc` 的 slug 命名规则**

## 一、命名

```
docs/tasks/v<X.Y>[.<Z>]-<type>-<topic>/
└── task.md
```

| type | 含义 | 命名 |
|---|---|---|
| `fix` | bug fix(PATCH) | `v<X.Y>.<Z>-fix-<topic>` |
| `feat` | feature 增量 | `v<X.Y>-feat-<topic>` |
| `chore` | 非功能改动 | `v<X.Y>-chore-<topic>` |

例:
- `docs/tasks/v0.2.0.6-fix-contextmenu-right-click/`
- `docs/tasks/v0.2.1-feat-switch-dropdown/`
- `docs/tasks/v0.2-chore-ponytail-shrink/`

## 二、task.md 模板

```markdown
# <type>(<scope>): <一句话描述>

> 创建: YYYY-MM-DD
> 版本: V<X.Y>[.<Z>]
> 优先级: P0 / P1 / P2
> 归属判定: 见 `docs/tech/v<X.Y>-<feature>-tech.md` §1 范围边界
> 关联 retro: `docs/reports/v<X.Y>-retrospective.md`

## Why

<这个 task 解决什么根因,不写修复方案,只写"为什么存在这个问题">
引用 L3 findings / 反模式沉淀 / 业务规则(贴 link)

## What

<具体改什么,贴代码位置 + 文件路径>
如果是 fix,关联 bug 编号 / commit hash

## Done when

- [ ] <验收项 1>
- [ ] <验收项 2>
- [ ] L1 vitest 全 PASS
- [ ] L2 grep 反模式 15 防御: commit claim "修了 X" → grep 代码命中
- [ ] L3 D:\ 用户实测: <具体场景>
- [ ] 沉淀: task.md 跟业务代码同 commit;写一行到对应 retro

## 关联
- PRD: `docs/prd/v<X.Y>-<feature>-prd.md`
- Tech: `docs/tech/v<X.Y>-<feature>-tech.md` §1.3 §6
- 验收证据: `<evidence path>`(实测截图 / 录屏)
```

## 三、写作纪律

1. **Why 写根因,What 写改动**:`Why` 让 agent 知道为什么这事重要,`What` 让 agent 知道要做什么
2. **Done when 至少 5 项**:每项必须可验证(✓ 或 ✗),不接受"差不多就行"
3. **L3 实测场景要具体**:不能写"测一下",要写"D:\ 端 npm run tauri dev,右键浮窗,看到 ContextMenu 弹出"
4. **task.md 跟代码同 commit**:`feat/fix: ...` commit 必须同时包含 task.md + 代码(防止 commit 撒谎的反模式 15)
5. **task.md 沉淀到 retro**:每个 P0/P1 修完写一行到对应 retro(为什么这次会出 bug,如何防御)

## 四、关联

- [doc-layers.md](../governance/doc-layers.md)
- [versioning-rule.md](../governance/versioning-rule.md) — PATCH 命名 + 流程
- [l3-gating.md](../governance/l3-gating.md) — L3 实测硬约束
- `.claude/rules/task-directory.mdc` — slug 命名细节