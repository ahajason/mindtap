## 是什么

轻念 · Mindtap — 极简记录桌面应用。Tauri 2 (Rust) + React 19 + TypeScript + Vite 7。本地 SQLite，无云同步。

> **当前活跃版本** = 看 `docs/tasks/` 列表中在跑 task,和 `docs/reports/` 历史交付(V0.2.0.x PATCH 是浮窗回归阶段)。硬规范入口在 `docs/governance/` + `docs/tech/` + `.claude/rules/`(后两者每次 session 加载);本文件是入口上下文**不会被发版带过期**。

## 文档分层速查表

**任何新文档创建前必读** `docs/governance/doc-layers.md`。

| 层 | 文件夹 | 职责 | 严禁出现 |
|---|---|---|---|
| L0 PRD | `docs/prd/` | 纯业务(用户故事/场景/规则/验收) | 技术名词/API/文件路径 |
| L1 Domain | `docs/domain/` | 业务实体/状态/规则/ADR | 表名/字段/IPC 命令 |
| L2 Tech | `docs/tech/` | 技术方案 + 接口 + 数据 + **bug 归属边界** | 用户故事/视觉稿 |
| L3 Design | `docs/design/` | UI/UX(视觉/交互/组件契约/a11y) | 表/IPC/模块路径 |
| L4 Plan | `docs/plans/` | 实施步骤 + commit 计划 + DoD 勾选 | 业务规则/产品愿景 |
| L5 Reports | `docs/reports/` | 验收 + retro + release notes | 设计意图(已归档) |
| **治理** | `docs/governance/` | 跨版本规则(doc-layers / versioning-rule / l3-gating) | 项目细节 |

## Quick Start

| 动作 | 命令 |
|---|---|
| 装前端依赖 | `npm install` |
| 起 Vite 开发服务器 | `npm run dev` |
| 起 Tauri 桌面应用 | `npm run tauri dev`(WSL)/ `scripts\dev.bat`(Win 推荐) |
| 同步 WSL → D:\ | WSL 内 `git push origin develop` + `git -C /mnt/d/workspace/mindtap pull` |
| 验证 Rust 端 | `cd src-tauri && cargo check` |
| 验证前端类型 | `npx tsc --noEmit` |
| 跑 vitest | `npm test`(单次)/ `npm run test:watch`(监听) |
| 回看 git(按场景) | 见下方"Git 回看(按场景)"小节,默认起点 `git show <sha>` 查 commit / `git log -- <path>` 查文件历史 / `git diff` 查未提交改动 |

## Git 回看(按场景)

| 场景 | 命令 |
|---|---|
| 当前工作树是否脏 / 哪些 staged | `git status` |
| 最近 N 个 commit list | `git log --oneline -20` |
| 某文件 / 目录的所有 commit(任务 / 业务路径追溯) | `git log --oneline -- <path>` |
| 单个 commit 全貌(作者 / 时间 / 全 diff / message body) | `git show <sha>` |
| 单个 commit 的精确改动(parent vs 当前,无历史噪音) | `git diff <sha>~1 <sha>` |
| 工作树 vs HEAD(还没 commit 的本地改动) | `git diff` |
| staged vs HEAD(已 add 但未 commit) | `git diff --cached` |

**默认起点**: 想知道 commit 说了什么 → `git show <sha>`;想知道某段代码历史上谁改过 → `git log -- <path>`;想精读一段改动 → `git diff <sha>~1 <sha>`。

## 双工作树 (WSL + D:\)

代码在两个 fs 各放一份,共用 `origin/develop`(单源真值),不要两边各自 commit + push 互相覆盖:

| 角色 | 路径 | 用法 |
|---|---|---|
| WSL 端 | `/home/jason/workspace/mindtap` | 代码 / 单测 / cargo check / Claude Code / OpenCode |
| D:\ 端 | `D:\workspace\mindtap` | Tauri dev / WebView2 调试 / 视觉稿 QA |

**同步流向**:WSL 内 `git commit` → `git push origin develop` → `git -C /mnt/d/workspace/mindtap pull`。

**Tauri dev 必须在 Windows 侧**:`WebView2` 是 Windows 原生 COM 组件,WSL 启动它得绕 WSLg,debug 信号会断在 syscall 边界。WebView2 透明 / 原生菜单 / Overlay titleBar 这类 Windows-only bug,在 WSL 里复现不到——只能从 D:\ 端验证。

`scripts/dev.bat` / `scripts/dev.ps1` 是 Windows 侧一键启动器:自动定位项目根、拒在 WSL 内误跑、`cargo tauri` 优先、`CARGO_TARGET_DIR` 自动切到 Windows fs。详见 [scripts/README.md](./scripts/README.md)。

## 目录结构

```
mindtap/
├── src/                # 主窗口（当前为 StyleGuide 路由）
│   ├── lib/tauri-bridge.ts    # Rust ↔ JS 唯一 seam
│   ├── floating/        # ⭐ 真正产品：浮窗（V0.2.6 收口）
│   └── components/ routes/ hooks/
├── src-tauri/src/      # ⭐ Rust 后端
│   ├── lib.rs           # run() + 全局快捷键 + invoke_handler 注册
│   ├── commands/        # timer_session + app 两组 command
│   └── db/              # rusqlite + DbState(Mutex<Connection>)
├── docs/                # design / specs / plans / reports / tasks
├── scripts/             # Windows 侧 Tauri dev 启动器
└── .claude/rules/       # 强制规则（每次 session 加载）
```

入口:`index.html` → `src/main.tsx`,`floating.html` → `src/floating/main.tsx`,对应 `tauri.conf.json` 的两个窗口。

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
| 任务正式档 | `docs/tasks/<version>-<type>-<short-desc>/task.md` |

## 规则文件

CLAUDE.md 是 session 入口上下文; 子规则放在 `.claude/rules/*.mdc`(Claude 自动加载 — `alwaysApply` 全局,带 `globs:` 的按文件路径触发); 跨 session 沉淀放在 `~/.claude/projects/.../memory/MEMORY.md` 索引的 memory 文件。

**不互相引用**: 不在 CLAUDE.md / rules / memory 里交叉列出文件名 — Claude 自动发现,列名反而成冗余。需要在 CLAUDE.md 表达"请遵守规则 X"时,直接讲**原则**(像下面"工作流铁律"段),不写"见 `.claude/rules/X.mdc`"。

新增 / 修改 rule 或 memory 前用 `/claude-md-management:claude-md-improver`,改完跑 `self-apply-after-write.mdc` 7 项。

## 工作流铁律(贯穿所有任务 — 强约束,自动加载后不再需要"看 X 规则"提示)

- **三层决策法**: 改前 L1 原始权威 / L2 统一设计 / L3 具体问题(主动枚举副作用);改后走 `/retro` 闭环
- **避免决策疲劳**: 2-4 离散选项才用 AskUserQuestion;有 spec / convention / rule → 优先查
- **穷举再下手**: 多个 root cause 不分散修(见反模式 14)
- **纯 git + ssh (本仓库约束)**: 默认 `git push origin develop` + D:\ `git pull`;**禁用 gh CLI**(无 auth)和 **GitHub MCP `issue_write`/`create_pull_request`**(classifier 拦);要 PR 走 web (https://github.com/ahajason/mindtap/compare/develop...<branch>)
- **多 issue 并行修**: 派 N 个 subagent, **每个 subagent 自己用 `Skill superpowers:using-git-worktrees` 起 worktree** (isolation);主 agent 留 develop, fetch + merge 集成;不要主 agent 串行跑多个 fix
- **CSS 静态扫描 regex**: 写 `.floating-root[...]` 这类 selector 匹配时**先剥 `@media` / `@supports` / `@keyframes` 嵌套块**,否则后加的 @media 内嵌同名选择器会让测试误通过或 FAIL(见反模式 18)

### Worktree 治理(三种场景分开)

- **Background session**(本 session): harness `bgIsolation` 拦直接改 develop checkout;改 develop 路径前先 `EnterWorktree` 或用 `Workflow` 的 `isolation: "worktree"`
- **交互 session**: 默认直接在主 checkout 工作;用户明确指示(`EnterWorktree` / 写新 feature 分支)或子 agent `isolation: "worktree"` 才进;只读 / 问答 / 文档任务一律不开
- **项目内 git worktree 不要放项目根 `.worktrees/`** —— 跟 harness worktree 目录(`.claude/worktrees/`)命名混淆;临时 worktree 用 `git worktree add /tmp/<name>-wt` 或 `.claude/worktrees/<name>`(前提是不跟 harness 撞)
- **feature branch 用完即清**: push + merge 回 develop 后**立刻**清理三件套 —— `git worktree remove .claude/worktrees/<name>` + `git branch -d <branch>` + `git push origin --delete <branch>`,别留孤儿污染 `.claude/worktrees/` 和远端分支列表

## 本地配置

个人本地偏好 / 临时实验存 `.claude/settings.local.json`（已在 `.gitignore` 内, 不入仓）.