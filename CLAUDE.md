## 是什么

轻念 · Mindtap — 极简记录桌面应用。Tauri 2 (Rust) + React 19 + TypeScript + Vite 7。本地 SQLite，无云同步。

> **当前阶段**: v0.1.0 起步——工作树是骨架, 业务代码待接入.

## Quick Start

| 动作 | 命令 |
|---|---|
| 装前端依赖 | `npm install` |
| 起 Vite 开发服务器 | `npm run dev` |
| 起 Tauri 桌面应用 | `npm run tauri dev` |
| 验证 Rust 端 | `cd src-tauri && cargo check` |
| 验证前端类型 | `npx tsc --noEmit` |
| 看 git 状态 | `git status` / `git log --oneline` |

## 设计语言

所有 UI 改动必须参考 glassic-ui-spec.md（项目自有 Liquid Glass 视觉 spec）。

**当前路径**: `.archive/docs/design/glassic-ui-spec.md`（v0.1.0 起步阶段尚未恢复到 active `docs/design/`）——接入 UI 前先 `cp` 到 `docs/design/`。

**组件落地策略**: shadcn 源码拷 + Tailwind token + Radix primitive。

**未 cp spec 之前不要起 `tauri dev` 跑 UI**——没有 Tailwind token 会编译报错. **不要**自创颜色 / 阴影 / 模糊 token——查 spec 拿现有值.

## 文件归位

| 内容类型 | 去处 |
|---|---|
| 新功能「做什么」 | `docs/specs/YYYY-MM-DD-<topic>-design.md` |
| 新功能「怎么做」 | `docs/plans/YYYY-MM-DD-<topic>.md` |
| 阶段交付报告 | `docs/reports/` |
| 已交付版本的完整沙盒 | `docs/archive/v<version>/` |
| 任务正式档 | `docs/tasks/<version>-<type>-<short-desc>/task.md`（见 `.claude/rules/task-directory.mdc`） |

## 规则文件

`CLAUDE.md` 是 Claude Code session 的入口上下文; `.claude/rules/*.mdc` 是子规则专题.

修改 rules 前用 `/claude-md-management:claude-md-improver` 做评估.

| 规则 | 何时参考 |
|---|---|
| `.claude/rules/decision-method.mdc` | **任何代码/文档改动前必查**(三层穷举 + 闭环复盘);**任何交付完成后必查**(走 `/retro`) |
| `.claude/rules/commit-style.mdc` | 写 commit message 前 / 决定何时 commit（业务层粒度 + 完整性门槛） |
| `.claude/rules/comment-style.mdc` | 写代码时（注释只写 why, 代码即注释） |
| `.claude/rules/codegraph.mdc` | 跨文件结构查询时（vs grep） |
| `.claude/rules/task-directory.mdc` | 写任务正式档时（slug 命名 + 模板 + 跟 commit 关系） |

## 工作流铁律(贯穿所有任务)

- **三层决策法**: 改前 L1 原始权威 / L2 统一设计 / L3 具体问题(主动枚举副作用);改后走 `/retro` 闭环
- **避免决策疲劳**: 2-4 离散选项才用 AskUserQuestion;有 spec / convention / rule → 优先查
- **穷举再下手**: 多个 root cause 不分散修(见 `memory/exhaust-layers-before-fix`)

## 本地配置

个人本地偏好 / 临时实验存 `.claude/settings.local.json`（已在 `.gitignore` 内, 不入仓）.