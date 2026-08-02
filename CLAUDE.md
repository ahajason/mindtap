# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 是什么

轻念 · Mindtap — 极简记录桌面应用。本地 SQLite，无云同步。

**产品北极星**（来自唯一产品需求文档 `docs/轻念Mindtap产品需求文档.md`）：**个人工作台账** —— 随时低成本记下任务、多线并行推进、忘记有兜底、随时看得见"我的工作进行到哪了"。四条不可妥协基因：**3 秒记录、1 秒查看、0 思考成本、全量本地存储**。

**当前版本状态**：V0.2.0.x PATCH 是浮窗回归阶段；V0.2.0.14 收回 V0.2.0.13 重测 4 deviation + 反 C-4 自动折叠。**下一步**：等用户开启新的 V0.2.1 MINOR。版本历史详见 `docs/governance/versioning-rule.md` §三 + §四。产品/开发各阶段推进状态看 `docs/tasks/`（在跑 task）与 `docs/reports/`（历史交付）。

## Quick Start

| 动作 | 命令 |
|---|---|
| 装前端依赖 | `npm install`（Node 24 LTS 严格版本，`.nvmrc` = `24`） |
| 起 Vite 开发服务器 | `npm run dev`（固定端口 1420，strictPort） |
| 起 Tauri 桌面应用 | Windows 侧运行 `scripts\dev.bat` |
| 同步 WSL → D:\ | WSL 内 `git push origin develop` + `git -C /mnt/d/workspace/mindtap pull` |
| 验证 Rust / Tauri | `cargo test` 可在 **WSL 直接跑**(假 cc 已修,`~/.cargo/config.toml` 持久化 gcc 链接器);Tauri dev 仍 Windows 侧 `scripts\dev.bat` |
| 验证前端类型 | `npx tsc --noEmit`（`npm run build` 的 `tsc` 即类型检查，是 build 的一部分） |
| 模块边界检查 | `npm run lint:boundaries`（`depcruise src/packages`，build 已含） |
| 跑 vitest | `npm test`（单次）/ `npm run test:watch`（监听） |
| 跑 Rust 测试 | `cd src-tauri && cargo test`（WSL 可直接跑，覆盖 db 状态机 + 不变量；2026-08-02 假 cc 修复后 40 passed，详见 `docs/tasks/v0.2.1-workbench-core/wsl-dash-boundary.md` §七） |
| 回看 git（按场景） | `git show <sha>` 查 commit / `git log -- <path>` 查文件历史 / `git diff` 查未提交改动 |

## 双工作树 (WSL + D:\)

代码在两个 fs 各放一份，共用 `origin/develop`（单源真值），不要两边各自 commit + push 互相覆盖：

| 角色 | 路径 | 用法 |
|---|---|---|
| WSL 端 | `/home/jason/workspace/mindtap` | 代码 / 前端单测与静态检查 / **Rust cargo test 与 clippy（假 cc 修复后，2026-08-02）** / Claude Code / OpenCode；不执行 Tauri dev |
| D:\ 端 | `D:\workspace\mindtap` | Tauri dev / WebView2 调试 / 视觉稿 QA（Windows-only 实机验证） |

**同步流向**：WSL 内 `git commit` → **默认立即** `git push origin develop`（用户约定：每次提交默认推送，不待提醒）→ `git -C /mnt/d/workspace/mindtap pull`。

**Tauri dev 必须在 Windows 侧**：`WebView2` 是 Windows 原生 COM 组件，WSL 启动它得绕 WSLg，debug 信号会断在 syscall 边界。WebView2 透明 / 原生菜单 / Overlay titleBar 这类 Windows-only bug，在 WSL 里复现不到——只能从 D:\ 端验证。

`scripts/dev.bat` / `scripts/dev.ps1` 是 Windows 侧一键启动器：自动定位项目根、拒在 WSL 内误跑、`cargo tauri` 优先、`CARGO_TARGET_DIR` 自动切到 Windows fs。详见 [scripts/README.md](./scripts/README.md)。

## 规则文件

CLAUDE.md 是 session 入口上下文；子规则放在 `.claude/rules/*.mdc`（Claude 自动加载 — `alwaysApply` 全局，带 `globs:` 的按文件路径触发）；跨 session 沉淀放在 `~/.claude/projects/.../memory/MEMORY.md` 索引的 memory 文件。

**不互相引用**：不在 CLAUDE.md / rules / memory 里交叉列出文件名 — Claude 自动发现，列名反而成冗余。需要在 CLAUDE.md 表达"请遵守规则 X"时，直接讲**原则**（像下面"工作流铁律"段），不写"见 `.claude/rules/X.mdc`"。

新增 / 修改 rule 或 memory 前用 `/claude-md-management:claude-md-improver`，改完跑 `self-apply-after-write.mdc` 7 项。

## 工作流铁律（贯穿所有任务 — 强约束，自动加载后不再需要"看 X 规则"提示）

- **三层决策法**：改前 L1 原始权威 / L2 统一设计 / L3 具体问题（主动枚举副作用）；改后走 `/retro` 闭环
- **避免决策疲劳**：2-4 离散选项才用 AskUserQuestion；有 spec / convention / rule → 优先查
- **穷举再下手**：多个 root cause 不分散修（见反模式 14）
- **Worktree 基线校验**：调查当前修复链前先用 `git log -1 --oneline` + `git merge-base --is-ancestor develop HEAD` 确认 worktree 包含本地 `develop` HEAD；不满足先对齐，禁止基于旧快照下结论
- **样式 bug 反馈环**：修复前先建立能在旧实现判红的测试契约，直接读取生产 config/CSS/DOM 公共行为；`css: false` 的 jsdom 测试和测试内手写源码字符串不得作为视觉修复证据
- **跨窗口视觉修复**：不为颜色、色调或"风格一致"新增 E2E、截图断言或源码色值测试；视觉改动优先收敛到一个既有材质 owner。若需同时改 token、多个组件或业务逻辑，先停止并回到实机视觉反馈，不以多文件同步伪造修复
- **纯 git + ssh (本仓库约束)**：默认 `git push origin develop` + D:\ `git pull`；**禁用 gh CLI**（无 auth）和 **GitHub MCP `issue_write`/`create_pull_request`**（classifier 拦）；要 PR 走 web（https://github.com/ahajason/mindtap/compare/develop...<branch>）
- **多 issue 并行修**：派 N 个 subagent，每个 subagent 自己用 `Skill superpowers:using-git-worktrees` 起 worktree（isolation）；主 agent 留 develop，fetch + merge 集成；不要主 agent 串行跑多个 fix
- **CSS 静态扫描 regex**：写 `.floating-root[...]` 这类 selector 匹配时**先剥 `@media` / `@supports` / `@keyframes` 嵌套块**，否则后加的 @media 内嵌同名选择器会让测试误通过或 FAIL（见反模式 18 / 实际归属 V0.2.0.7~0.9 PATCH，见 versioning-rule §三）
- **Tailwind 扫描边界**：遇到来源不明的生成 utility 或 esbuild CSS warning，先检查 Tailwind 是否扫描了 `docs/archive` 中的字面量；通过 source exclusion 收紧生产扫描范围，不修改历史归档或无关组件

### Worktree 治理（三种场景分开）

- **Background session**：harness `bgIsolation` 拦直接改 develop checkout；改 develop 路径前先 `EnterWorktree` 或用 `Workflow` 的 `isolation: "worktree"`
- **交互 session**：默认直接在主 checkout 工作；用户明确指示（`EnterWorktree` / 写新 feature 分支）或子 agent `isolation: "worktree"` 才进；只读 / 问答 / 文档任务一律不开
- **项目内 git worktree 不要放项目根 `.worktrees/`** —— 跟 harness worktree 目录（`.claude/worktrees/`）命名混淆；临时 worktree 用 `git worktree add /tmp/<name>-wt` 或 `.claude/worktrees/<name>`（前提是不跟 harness 撞）
- **feature branch 用完即清**：push + merge 回 develop 后**立刻**清理三件套 —— `git worktree remove .claude/worktrees/<name>` + `git branch -d <branch>` + `git push origin --delete <branch>`，别留孤儿污染 `.claude/worktrees/` 和远端分支列表

## 技术栈与工具链

- Tauri 2（Rust 1.96+）+ React 19 + TypeScript 5.8 + Vite 7 + Tailwind CSS 4（`@tailwindcss/vite`）
- Node 24 LTS 严格版本（`engines.node: ">=24 <25"`，`.nvmrc` = `24`）
- 依赖：`@base-ui/react`、`react-router-dom`、`lucide-react`、`sonner`、`shadcn`（源码拷入策略）、`clsx` + `tailwind-merge`
- Rust 插件：`rusqlite`（bundled）、`tokio`、`tauri-plugin-{log,global-shortcut,dialog,autostart}`；仅 macOS 声明 `objc2`（暂未使用，预留）
- Windows：MSVC Build Tools 2022 + Windows SDK；Linux：`libwebkit2gtk-4.1-dev` + `libssl-dev` + `libayatana-appindicator3-dev`

## 架构

### 两个窗口，一个 App

- **主窗（`main`）**：加载 `index.html` → `src/main.tsx` → `src/App.tsx`。当前是设计系统 Style Guide 页面（routes/）：Overview / Surface / Button / Input / Feedback / Overlay / Tokens，共享 `StyleGuideLayout`。**业务上尚未落地**——主窗未来承载收件箱 / 待办 / 复盘（产品需求文档阶段一 S3/S4）。
- **浮窗（`floating`）**：加载 `floating.html` → `src/floating/main.tsx` → `src/floating/App.tsx`。**业务核心，90% 使用发生在这里**。三态折叠（`FloatingPresentation`）：
  - `folded`（360×36，单行条）+ `compose`（360×280，输入面板）+ `controls`（360×96，控制行）
- 两窗口都在 `src-tauri/tauri.conf.json` `app.windows[]` 注册；Vite 多入口在 `vite.config.ts` `rollupOptions.input` 显式声明（否则 Vite 7 不会产出 `dist/floating.html`）。
- 全局快捷键 `Ctrl+Shift+Space` 切换浮窗显示/隐藏（`src-tauri/src/lib.rs` setup，macOS 用 SUPER）。

### 当前业务模型（浮窗计时器）

**正在从「计时器」演进为产品需求文档的「任务族 Item + 状态机」** —— 计时 session 雏形存在，但业务核心需按产品需求文档重构。

- 单表 **`timer_session`**（`src-tauri/src/db/schema.rs`）：`id / task_title / status ('active'|'paused'|'completed') / started_at / paused_at / completed_at / focus_ms / created_at / updated_at`。
- 不变量：同表只允许 1 条 `active`（`CREATE UNIQUE INDEX ... WHERE status='active'`）；`completed` 有独立索引。
- Rust 端状态机在 `src-tauri/src/commands/timer_session.rs`；db 模块在 `src-tauri/src/db.rs` + `src-tauri/src/db/schema.rs` + `src-tauri/src/db/timer_session.rs`。连接存于 Tauri 受管状态 `DbState(Mutex<Connection>)`。每个命令都会锁互斥锁 —— handler 保持简短，**不要**跨 `.await` 持有锁。
- 前端状态：`src/floating/hooks/useActiveTask.ts`（拉取当前 active session）+ `src/floating/hooks/useFocusTicker.ts`（秒级 focus_ms 滚动，不写库）。

### IPC 桥接

所有前端→后端调用走 `src/lib/tauri-bridge.ts`（类型化 `api.*` + 事件监听）。后端 handler 在 `src-tauri/src/lib.rs` 的 `invoke_handler!` 中注册（共 11 个命令：`timer_session_*` 7 个 + `app_*` 2 个 + `floating_cmd::*` 2 个）。**新增命令 = 三处都要改**：`tauri-bridge.ts` + `invoke_handler!` 宏 + `commands/<name>_cmd.rs`。

### 托盘 / 原生菜单

`src-tauri/src/tray/`：`menu.rs`（构建原生菜单 + `handle_action` 派发）+ `confirm.rs`（退出确认对话框）。右键弹原生菜单走 `floating_cmd::show_floating_context_menu`。

### 浮窗关键机制

- **折叠/展开 resize**：物理窗口尺寸切换走自定义 rust 命令 `set_floating_size`（绕过 Tauri JS `setSize` IPC 中转竞争，直接 `tao set_inner_size`），**不要改回** JS `setSize`。
- **位置记忆**：`localStorage['floating-position']` + `onMoved` 监听；默认右上角 16px（`POS_MARGIN`）。展开态也允许拖动。
- **拖动手势**：mousedown 捕获 → 4px 阈值后 `win.startDragging()`；右键不走 drag/toggle 路径（原生 contextmenu capture）。
- **面板 dismiss**：`panelRef` 在 root div 上，`document mousedown` 在 panel 外才折叠（`handleDismiss`）；"取消"按钮 + Esc 走 `handleClearAndDismiss`（清 title + 折叠）。**不要**退回 input blur 方案（有 race）。
- 输入 `taskTitle` ≤50 字符（`TASK_TITLE_MAX`）。

### 跨平台

Rust 依赖的 macOS 分支在 `Cargo.toml` `[target.'cfg(target_os = "macos")'.dependencies]`（当前仅 `objc2`，未使用）。前端平台差异靠 CSS `backdrop-filter` 与原生条件判断处理。**没有**按平台拆分的源码目录 —— 单一代码库 + 条件声明。

### 模块边界（packages）

`src/packages/` 是深模块：入口只用根文件（`index.ts` / `client.ts`），子文件夹（`lib/`、`tests/`）私有，只能包内自由引用。依赖不能成环 —— `npm run lint:boundaries` 检查。新增 package 复制 `src/packages/example/`。

## 测试

- **vitest**：jsdom 环境，`css: false`（不加载真实 CSS），`src/test/setup.ts`。单测覆盖浮窗 UI 组件 / hooks / packages。**`css: false` 意味着测试看不到真实样式** —— 视觉修复证据必须来自实机或直接读生产 CSS，不能用测试断言颜色。
- **Rust**：`cd src-tauri && cargo test`（WSL 可直接跑，2026-08-02 假 cc 修复后 40 passed；覆盖 db 状态机 + 不变量）。

### 用例 ↔ 测试映射（行为细节归测试，文档只留意图）

**约定**：产品**行为用例**由测试承载（测试名即用例描述），文档不再重复写行为细节，只保留**意图与决策**（为什么这么做、取舍依据）。

- **产品用例 → 行为测试**：`it("待办点开始 → 进入进行中并行计时")` 这类测试名就是需求描述。改行为就改测试断言，文档不跟着翻新。
- **设计阶段先写占位测试**：未实现的新 feature 先写 `it.todo("…")`（vitest）/ `#[ignore]`（Rust）占位，锁定"有哪些用例"——即 TDD 的"红"阶段前移到设计期，设计决策直接固化进代码，防漂移。
- **文档分工**：PRD 留北极星/用户价值/验收意图；domain 留状态机决策（为什么三态）与不变量理由；design 留视觉/交互契约。**行为流转、边界、异常**一律以测试为准，文档不重复。
- **对测试的要求**：测试名必须是用户可读的用例描述（不是实现细节）；断言行为、不锁实现（见测试段"不锁内部结构"）。

> 依据：用户 2026-08-02 反馈——"具体用例交由测试用例描述，文档就不需频繁更新；设计阶段可写完整或占位单元测试"。

### 代码组织（文件不臃肿，按真实意图定模块/组件）

**约定**：任何一个文件（代码或测试）随业务增长**过份庞大臃肿时，及时拆分**；拆分归属**按真实意图**决定，不机械套用。

- **何时拆**：文件达到"一眼读不完 / 改动涉及多处不相干逻辑 / 测试难以独立描述"时，就该拆。测试文件同理——用例多了按业务切片拆成多个测试文件（`App.behavior.test.tsx` / `App.window-contract.test.tsx` 已是此例）。
- **拆成什么，看真实意图**：
  - **业务逻辑**（状态机 / 结算 / 规则，无 UI）→ **深模块**（`src-tauri/src/db/*.rs` 是深模块范例；前端纯逻辑放 `src/lib/` 或 `src/packages/`）。
  - **UI 可复用单元**（有渲染 / 交互，被多处用）→ **组件**（`src/floating/components/*`）。
  - **数据流 / 状态拉取** → **hooks**（`src/floating/hooks/*`）。
  - **跨文件配置 / 契约**（IPC / 类型）→ 集中到 `src/lib/tauri-bridge.ts`。
- **判断标准（意图优先）**：先问"这个东西的本质是什么"——是可复用 UI 才做组件；是领域规则才做模块；只是单点逻辑就留在原地，**不要为了拆而拆**（YAGNI）。
- **深模块纪律**：模块藏住内部实现，对外只留小接口（见 codebase-design 深模块）；组件只负责渲染与交互，业务规则交给模块/hook。

> 依据：用户 2026-08-02 反馈——"测试用例和代码功能避免单文件臃肿，合适时机拆分独立成业务逻辑模块或组件；模块/组件定义按真实意图决定"。

## 设计语言

所有 UI 改动必须参考 `docs/design/glassic-ui-spec.md`（项目自有 Liquid Glass spec）。**不**自创颜色 / 阴影 / 模糊 token —— 查 spec 拿现有值。组件落地策略：shadcn 源码拷 + Tailwind token + 原生 primitive。

**Liquid Glass 铁律**：玻璃表面（`topbar`、`sidebar`、`fab`、`floating/*`）**只**承载控件/导航。**内容必须落在非玻璃背景上**。这是硬性设计规则，不是建议。

## 文档分层与归位

> 权威细则：`docs/governance/doc-layers.md`。docs/ 下文件按 L0-L5 分层（**L2 tech 层已移除 2026-08-02**），**严禁跨层污染**（L0 纯业务不许出现表名/IPC/模块路径）。技术实现细节入单元测试 + 代码（`src/lib/tauri-bridge.ts` 类型 / `src-tauri/src/db/schema.rs` / vitest / cargo test），范围边界/bug 归属入 task.md「范围边界」段。

| 内容类型 | 去处 |
|---|---|
| 产品需求 / 用户故事 / 验收 | `docs/prd/<version>-<feature>-prd.md`（纯业务，无技术名词） |
| 业务实体 / 状态机 / ADR | `docs/domain/<version>-domain-model.md` |
| 范围边界 / bug 归属 | task.md「范围边界」段（技术实现细节入单元测试，不写文档） |
| 视觉 / 交互 / 组件契约 | `docs/design/<version>-<feature>-design.md` |
| 实施步骤 / commit 计划 | `docs/plans/YYYY-MM-DD-<version>-<feature>.md` |
| 交付报告 / retro / release notes | `docs/reports/` |
| 已交付版本完整沙盒 | `docs/archive/v<version>/` |
| 进行中 task | `docs/tasks/<version>-<type>-<short-desc>/task.md` |
| 跨版本规则 | `docs/governance/` |

**已弃用旧路径**：`docs/specs/`、`docs/architecture/`、`docs/projects/<v>/`、`docs/projects/<v>/CONTEXT.md`、`docs/projects/<v>/README.md` —— 内容已迁到 L 层，**不要**再往旧路径写。

## 项目里**没有**的东西（避免误找）

- 没有 CI / `.github/workflows/` — 未配置
- `package.json` 中没有 linter / formatter 脚本 — 仅 TS strict + dependency-cruiser
- 没有 pre-commit 钩子
- `Cargo.lock` 已 gitignore（Tauri app 默认）
- 除 README 自称 MIT 外没有 license 文件

## 本地配置

个人本地偏好 / 临时实验存 `.claude/settings.local.json`（已在 `.gitignore` 内，不入仓）。

## 用户偏好

- **永远使用中文回复**。
