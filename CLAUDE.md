## 是什么

轻念 · Mindtap — 极简记录桌面应用。Tauri 2 (Rust) + React 19 + TypeScript + Vite 7。本地 SQLite，无云同步。

> **当前交付**: V0.2.6 浮窗(floating window)收口(WebView2 透明 / native context menu / Overlay titleBar 已 iterate);下一阶段看 `docs/projects/v0.2/` 的任务档。

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
| 看 git 状态 | `git status` / `git log --oneline` |

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
| `.claude/rules/dev-sync-before-windows-verify.mdc` | 改 Windows-side runtime（Tauri / WebView2 / 原生菜单 / Rust 后端）后，D:\ 端 dev.bat 验证前必走（push origin + D:\ pull）;WSL-only 验证不触发 |
| `.claude/rules/dev-verify-before-commit.mdc` | 改 system API / OS 集成 / 框架 runtime 后,commit 前必须 dev 实测新机制本身在工作 |

## 工作流铁律(贯穿所有任务)

- **三层决策法**: 改前 L1 原始权威 / L2 统一设计 / L3 具体问题(主动枚举副作用);改后走 `/retro` 闭环
- **避免决策疲劳**: 2-4 离散选项才用 AskUserQuestion;有 spec / convention / rule → 优先查
- **穷举再下手**: 多个 root cause 不分散修(见 `memory/exhaust-layers-before-fix`)

## 本地配置

个人本地偏好 / 临时实验存 `.claude/settings.local.json`（已在 `.gitignore` 内, 不入仓）.