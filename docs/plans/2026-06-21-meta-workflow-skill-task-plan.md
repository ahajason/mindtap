# Bootstrap-Workflow Meta-Skill — 任务规划

> 创建: 2026-06-21
> 目的: 把"jason 的工作流 (三层决策法 + 闭环复盘 + commit-style + comment-style + clean-comments)"封装为可复用的项目启动 skill,**不包含** mindtap 业务域
> 对应命令: `/superpowers:writing-skills` + 走 TDD

## 总结构(先看这个,再下钻)

```
L1 原始权威 = 4 外部参考对象 + 当前 mindtap 现状     (已完成调研,等 subagent 补完)
L2 统一设计 = 新 skill 的 SKILL.md + templates/ + 三层 reference docs   (下一阶段主输出)
L3 具体问题 = mindtap 业务域 / 设计 spec / 项目专属 memory 列表       (用来"什么不进 skill")
```

| 阶段 | 目标 | 状态 |
|---|---|---|
| **Phase 0** | 摸底:读完 4 外部参考对象 + 扫描自身 docs/rules/skills/memory | 进行中 |
| **Phase 1** | L2 设计:SKILL.md 结构 + templates/ 内容 + bootstrap 流程 + 三层 reference docs 骨架 | 待 Phase 0 完成 |
| **Phase 2** | AskUserQuestion 收口:skill 名、bootstrap 机制、template 范围、docs 重组 | 待 Phase 1 完成 |
| **Phase 3** | 写设计文档:三层评估报告落档 `docs/superpowers/specs/2026-06-21-bootstrap-workflow-design.md` | 待 Phase 2 完成 |
| **Phase 4** | TDD RED:派 3 subagent 跑 baseline "无 skill 时如何 bootstrap 新项目",收集失败模式 | 待 Phase 3 完成 |
| **Phase 5** | TDD GREEN:写 SKILL.md + templates/ + bootstrap.sh(基于 baseline 失败模式) | 待 Phase 4 完成 |
| **Phase 6** | TDD REFACTOR:用 baseline 同场景重跑,验证 + 堵漏 | 待 Phase 5 完成 |
| **Phase 7** | 部署:wc -w 验证 + commit + retro 闭环 | 待 Phase 6 完成 |

## 当前进度(2026-06-21)

- [x] Phase 0.1:读 4 外部参考对象完整内容 (superpowers writing-skills / claude-automation-recommender / karpathy-guidelines / code-simplifier)
- [x] Phase 0.2:读 5 个 .claude/rules/*.mdc 完整内容
- [x] Phase 0.3:读 6 个 ~/.claude/skills/*/SKILL.md 完整内容
- [x] Phase 0.4:扫 docs 目录结构 (6 个用户列出的路径 + 子目录)
- [ ] Phase 0.5:派 2 subagent 并行读 (a) superpowers TDD/systematic-debugging (b) mindtap 业务域摸底 — **正在执行**
- [ ] Phase 1:L2 设计

## 决策待收口(Phase 2 用 AskUserQuestion)

| # | 决策 | 当前默认值 |
|---|---|---|
| D1 | Skill 名称 | `bootstrap-workflow`(工作流启动) |
| D2 | Bootstrap 触发机制 | SKILL.md 入口 + scripts/bootstrap.sh + 用户调用 `/bootstrap-workflow` |
| D3 | Template 复制粒度 | 4 层可选:仅 rules / +memory / +skills / 全部 |
| D4 | docs 重组方式 | 保守:统一 README 互链,不挪文件 |
| D5 | Memory 归宿 | 项目本地 `.claude/memory/` |

## 反模式提醒

- ❌ 边读边写 skill — 必 RED-first (writing-skills Iron Law)
- ❌ 把 mindtap 业务域塞进 generic template
- ❌ SKILL.md 内嵌 templates 内容超过 ~500 字 — 用 references/ 子文件
- ❌ 中英文混杂(用户要求中文 + 技术名词英文)

## 关联

- 三层法 memory: `~/.claude/projects/.../memory/three-layer-decision-method.md`
- 沉淀机制: `~/.claude/projects/.../memory/mechanism-layering.md`
- Pre-flight: `~/.claude/projects/.../memory/pre-flight-checklist.md`