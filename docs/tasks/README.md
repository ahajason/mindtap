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
- `docs/tasks/v0.2.1-feat-native-dynamic-material/`
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

## 五、V0.1 历史 task 说明(2026-07-13 补档)

`docs/tasks/v0.1*` 共 14 个目录,是 V0.1 风格指南阶段的交付记录。

**重要**:
- V0.1 task.md **不按本 README 模板写**(历史产物,2026-06-21 ~ 2026-07-11 期间 6 层架构未立)
- 新 agent 接手 V0.1 时,应**从 V0.1 PRD/Tech/Domain 入口**(而非 14 个 task),了解业务全貌后再看具体 task
- V0.1 task.md 仍可读,只是缺模板字段(归属判定 / 反模式防御 / L1/L2/L3 gates)

**V0.1 入口文档**(2026-07-13 新建):
- 业务: [`../prd/v0.1.0-style-guide-prd.md`](../prd/v0.1.0-style-guide-prd.md)
- 领域: [`../domain/v0.1-design-system-domain.md`](../domain/v0.1-design-system-domain.md)
- 技术: [`../tech/v0.1.0-style-guide-tech.md`](../tech/v0.1.0-style-guide-tech.md)

**V0.1 14 个 task**(按 git commit 时间序):

| slug | type | 主题 |
|---|---|---|
| `v0.1-chore-bootstrap` | chore | V1.0 taskisland 归档 + style guide 路由依赖 + 测试栈 |
| `v0.1-chore-tailwind-tokens` | chore | Tailwind 4 主题块 + glass utilities 落地 |
| `v0.1-docs-design-system` | docs | 4 设计文档(玻璃规范 / 组件格式 / 组件契约 / 引用) |
| `v0.1-feat-style-guide` | feat | 侧栏路由 + 三段式演示页 |
| `v0.1-fix-glass-percentage` | fix | 间距阶梯 + 圆角 + 玻璃 fill 收窄 |
| `v0.1-fix-controls-spacing` | fix | Button 字号圆角 + Card 内边距 + Label 间距 |
| `v0.1-fix-glass-passthrough` | fix | 基底色 + 6 子页面去除玻璃最重等级 |
| `v0.1-feat-a11y-reduce-motion` | feat | Reduce Transparency + Reduce Motion 降级 |
| `v0.1-feat-focus-state` | feat | 3 层焦点模型 + 窗口失焦钩子 + SidebarNavLink |
| `v0.1-feat-transparent-drag` | feat | macOS 26 透明窗口 + 整窗可拖 |
| `v0.1-docs-glass-issues-archive` | docs | V0.1.2 视觉问题归档(3 层分离 28/11/25) |
| `v0.1.5-chore-docs-restructure` | chore | docs/ 整体收口(归档 + meta + design 提升) |
| `v0.1-fix-drag-region` | fix | 拖动区域缩到专用 handle(按钮阻断 bug 收口) |
| `v0.1.6-chore-carryover-closure` | chore | V0.1.6 carryover 4 项 closure |