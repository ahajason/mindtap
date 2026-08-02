## Why

V0.1.4 完成后 docs/ 顶层结构散落:已闭环 V0.1.x plan/spec 跟 active meta-workflow 混在 `docs/superpowers/`(命名误导);64 份调研素材(其中 10 份是 V0.1.2 玻璃设计子 spec)埋没在 `docs/research/.../1-design/`;无统一 archive 框架。整体 docs/ 需要按 active / archive / meta 三层重组,提升 active 设计 spec 可见性。

**用户约束**(本次反复确认,已写入 memory `_project/mindtap-docs-protect`):
- `docs/research/.../0-originals/` **永远不删**(active 调研素材)
- `.archive/docs/material/` 是过渡归档,后续会移除,不依赖它规划
- `docs/references/source/taskisland/`(86M)是用户参考项目,三层决策法产物,不能 gitignore
- `.archive/docs/` 全部不动
- meta-workflow 3 个文件保持未跟踪,不进 commit

## What

**commit 1** `4ae9b87`(已入仓):
- 新建 `docs/archive/v0.1/{plans,specs,issues}/` 框架 + README 索引
- 归档 4 V0.1.x plan + 1 spec:`docs/superpowers/{plans,specs}/` → `docs/archive/v0.1/`
- 重命名 `docs/superpowers/` → `docs/meta/`(3 meta-workflow 文件保持未跟踪)
- 提升 10 V0.1.2 玻璃设计 spec:`docs/research/.../1-design/` → `docs/design/v0.1.2-glass/`
- 不动:0-originals/ / .archive/ / source/taskisland/

**commit 2**(本次):
- 补写任务正式档

## Done when

- [x] docs/archive/v0.1/ 新建 + 5 文件归档
- [x] docs/superpowers/ 重命名为 docs/meta/(3 文件未跟踪保留)
- [x] docs/research/.../1-design/ 目录已删(10 文件迁出)
- [x] docs/design/v0.1.2-glass/ 10 文件到位 + README
- [x] docs/research/.../0-originals/ + 2-issues/ 保留完整
- [x] 任务正式档 commit 2 入仓
- [ ] 分支合并回 feat/v0.1-style-guide-init(待用户决定时机)

## 关联

- 决策源头:`docs/superpowers/plans/2026-06-21-meta-workflow-skill-findings.md` § L1 自身现状评估 § docs 混乱路径(mindtap docs 整理任务从 meta-workflow-skill 中剥离)
- memory:`_project/mindtap-docs-protect`(用户纠错事实)
- 关联任务:#2 memory drift 校正 / #3 清 `_archive/v0.1.4-plan-locked.md` / #4 CLAUDE.md 路径修正(后续单独执行)
- retro:待跑 `/retro` skill 沉淀本任务经验