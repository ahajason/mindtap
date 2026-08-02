# L4 Plan — 实施计划(模板)

> **本文件夹**: `docs/plans/`
> **职责**: 步骤化执行 + commit 计划 + 回归测试 + DoD 勾选 + 风险登记
> **严禁出现**: 业务规则、用户故事、产品愿景

## 一、命名

```
docs/plans/YYYY-MM-DD-v<X.Y>-<feature>.md
```

例:
- `docs/plans/2026-07-28-v0.3.0-native-dynamic-material.md`

## 二、模板

```markdown
# V<X.Y> <feature> — 实施计划

> 创建: YYYY-MM-DD
> 对应需求: `docs/<编号>-<需求>/`（index.md 入口）

## 1. 阶段切分

### 阶段 1: <阶段名>(<估时>)
**目标**: ...

**任务列表**:
- [ ] 任务 1
- [ ] 任务 2
- [ ] ...

**commit 计划**:
1. `<commit msg>` — 改了什么
2. `<commit msg>` — 改了什么

**回归测试**: ...

### 阶段 2: <阶段名>(<估时>)
(同上结构)

## 2. DoD 勾选(对应 task.md Done when)

### L1
- [ ] <N> tests PASS
- [ ] ...

### L2
- [ ] cargo test / clippy / fmt / tsc --noEmit PASS

### L3
- [ ] 7 层 visibility checklist
- [ ] 需求场景实测

## 3. 风险登记

| 风险 | 影响 | 缓解 |
|---|---|---|
| | | |

## 4. 关联
- 需求目录: `docs/<编号>-<需求>/index.md`
- 进行中任务: `docs/<需求>/tasks/<name>/task.md`（含范围边界段）
```

## 三、写作纪律

1. **可以出现**:文件路径、commit message、命令(`cargo test` 等)、DoD 勾选
2. **严禁出现**:用户故事("Alice 早晨...")、业务规则(那在 PRD)、产品愿景(那在 PRD)
3. **每阶段必带 commit 计划**:写完代码之前先写好 commit message 模板,避免"写完发现没法合"
4. **风险登记不是抱怨**:每条风险必须有"缓解"——可执行的,不写"看情况"
5. **Plan 是可消费的**:agent 接到 task 应该能照着 Plan 一步步做,不应该还要去猜

## 四、关联

- [doc-layers.md](../governance/doc-layers.md)
- Tech §5 DoD — Plan 的勾选直接照抄 Tech