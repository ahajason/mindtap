# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

轻念 · Mindtap — 极简记录桌面应用。Tauri 2 (Rust) + React 19 + TypeScript + Vite 7。本地 SQLite，无后端，无云同步。设计语言：Liquid Glass（Apple HIG Materials）。单代码库跨 Windows / macOS / Linux，靠 `#[cfg(target_os = ...)]` 做平台分支，**不**按平台拆目录。

用户完整需求与版本范围见 `docs/projects/v1.0/prd-v1.2.md` 与 `README.md`。本文件只补 README 没讲、靠读多份代码才能拼出来的事。

## Commands

| 用途 | 命令 |
|---|---|
| 安装依赖 | `npm install` |
| 开发（Vite + Tauri 一起跑） | `npm run tauri dev` |
| 仅前端（port 1420） | `npm run dev` |
| 仅前端 TS 类型检查 | `npx tsc --noEmit` |
| 前端构建（产物在 `dist/`） | `npm run build` |
| Release 打包 | `npm run tauri build` |
| Rust 编译检查 | `cargo check --manifest-path src-tauri/Cargo.toml` |
| Rust 全部单元测试 | `cargo test --manifest-path src-tauri/Cargo.toml` |
| Rust 单个测试 | `cargo test --manifest-path src-tauri/Cargo.toml <test_path>`（如 `cargo test --manifest-path src-tauri/Cargo.toml db::task::tests::start_timer_pending_to_active`） |
| Rust 编译（不跑测试） | `cargo test --manifest-path src-tauri/Cargo.toml --no-run` |
| 前端 vitest 一次跑完 | `npx vitest run` |
| 前端 vitest 监听模式 | `npx vitest` |

**TDD 硬约束**：新增/修改 `src/**/*.{ts,tsx}` 或 `src-tauri/**/*.rs` 必须先写失败测试 → 最小实现 → 全层套件绿。基线计数不在此复述（会漂移）。

Node 版本钉在 `.nvmrc` = `24`。Rust 工具链 ≥ 1.96（受 `tauri 2.x` 约束）。

构建环境前置（README 已写，重复强调）：Windows 要 MSVC Build Tools 2022 + Windows SDK 10.0.26100+（用 `vcvars64.bat`），macOS 要 Xcode CLT，Linux 要 `libwebkit2gtk-4.1-dev` 等。

## 交互规约

通用规则（4 通道决策 / preview 触发准则 / 写法细则 / 反模式）见 `~/.claude/CLAUDE.md` 的 `## 交互通道`。本节只补项目级落地示例。

### Glassic UI 实例（按钮 active 态 hover 反馈，token 取自 glassmorphism-impl-spec）

```
┌─ variant A · fill+blur ─┐  ┌─ variant B · outline+glow ┐
│  ┌───────────────────┐  │  │  ┌───────────────────┐   │
│  │  开始 30 分钟     │  │  │  │  开始 30 分钟     │   │
│  │   blur(24) α=0.6  │  │  │  │  ring glow α=0.4  │   │
│  └───────────────────┘  │  │  └───────────────────┘   │
└─────────────────────────┘  └──────────────────────────┘
```

## Architecture

### 两个窗口，对应两份 React 入口

`tauri.conf.json` 的 `app.windows[]` 声明两个 webview 窗口：

- **`main`** (`label: main`, `index.html` → `src/main.tsx` → `App.tsx`)：主窗，`SettingsPage` 单列滚动，是「配置」的主入口。
- **`floating`** (`label: floating`, `floating.html` → `src/floating/main.tsx` → `src/floating/App.tsx`)：浮窗。尺寸常量在 `floating/App.tsx` 顶部，**必须**与 `tauri.conf.json` 的 `min/maxWidth/Height` 同步（不同步 → 实际尺寸被裁或拖出白边）。

`vite.config.ts` 通过 `rollupOptions.input` 把两个 html 都作为入口产物打包。

### Rust 后端布局（`src-tauri/src/`）

- `lib.rs` — Tauri Builder 装配点。所有 plugins（opener / dialog / autostart / global-shortcut）、setup（DB init、浮窗 ensure、快捷键注册、两窗口菜单事件绑定）、`invoke_handler!` 宏（注册全部 `#[tauri::command]`）都在这里。`main.rs` 仅转调 `mindtap_lib::run()`。
- `commands/` — 一个领域一个文件。分两类：
  - **DB 读写 command**：`state.0.lock() → db 函数 → app.emit(...) → 返回`。task 写完发 `focus-changed`，新增/归档发 `record-updated`。
  - **settings command**：`settings_set` / `settings_reset` 走 `settings::cmd`，写后必发 `settings-changed`（**不**经 DbState）。
- `db/` — SQLite 层。每个表一个模块（`task.rs`、`idea.rs`、`check_in.rs`、`record.rs`），纯函数签名 `(conn, ...) -> AppResult<T>`。`schema.rs::create_tables` 启动时建表 + 建索引。`mod.rs` 提供共享 `DbState(pub Mutex<Connection>)`，由 `lib.rs::setup` 调 `db::init(app)` 装载进 Tauri State。
- `error.rs` — `AppError`（`thiserror`）+ `AppResult` 别名，手动实现 `Serialize` 把错误渲染成字符串给前端，避免 serde derive 与 trait bound 互殴。
- `floating/mod.rs` — `ensure_window` 幂等创建浮窗。三平台统一：`transparent + decorations(false) + alwaysOnTop` + Web CSS backdrop-filter。**不要**再尝试 `set_as_panel`（NSPanel 会触发 IME mach port 错误，已删）。
- `tray/menu.rs` + `tray/confirm.rs` — 菜单按 autostart 真实状态**每次重建**（不缓存 `CheckMenuItem`，OS 状态变了 UI 立即跟随）。`handle_action(id)` 是**单一分发入口**：浮窗右键 / 主窗右键 / 托盘图标三处复用同一路由。

### 领域模型（关键不变量）

`db/schema.rs` 定义 4 张表：

- **源表**：`task` / `idea` / `check_in`，各自带业务字段与状态机。
- **统一视图表**：`record(kind, source_id, content, status, created_at)`，`UNIQUE(kind, source_id)`。所有「展示给用户的记录」走这里。

**任何写源表的 db 函数必须事务内双写到 `record`**（看 `task.rs` 任意写函数）。UI 列表只读 `record`；要拿 Task 完整字段（`duration_ms` / `focus_started_at` 等）走 `record_get_active_task` command 用 `source_id` 回查源表。

Task 状态机（`db/task.rs`）：

```
pending ──start_timer──▶ active ◀──resume── paused ──pause── active
                              │                                  │
                              └──complete──▶ done ◀──undo────────┘
                              ▼
                          archive（任意态 → archived_at 非空）
```

不变量：
- **L1 全局唯一 active**：任何 `→ active` 转换（含 `start_timer` / `resume` / `switch_focus`）前先 `SELECT ... WHERE status='active' AND id != ?`，已有则 `AppError::ActiveExists`。
- **L2 暂停保留时长**：`pause` 累加 `now - focus_started_at` 到 `duration_ms` 后清 `focus_started_at`。
- **L3 非法转换**：`pause` / `complete` 要求前置 `active`，`resume` / `undo` 要求前置 `paused` / `done`，否则 `AppError::InvalidTransition`。

### 前端 ↔ 后端 IPC

`src/lib/tauri-bridge.ts` 是**唯一**的 IPC 入口（不要散落 `invoke` 调用）。导出：

- `api.*` —— `invoke<T>(name, args)` 的类型化包装，对应后端 `commands/` 注册的每个 command。task 命令的参数名是驼峰（`content` / `dueAt` / `id`），Tauri 2 自动转 snake_case 给 Rust 端。
- `events.*` —— `listen<T>(name, cb)`：常用三个：`focus-changed(Task)` / `record-updated(())` / `tick(number)`。订阅约定返回 `Promise<UnlistenFn>`，hook `useEffect` 清理时调用 `unlisten.then(u => u())`。

新 IPC commands 跟随各 V1.x spec 走，见 `docs/specs/`。`@tauri-apps/api/core` 的 `invoke` 已把后端 `AppError` 序列化抛到 Promise reject 端，前端 `try/catch` 即可。

### 主窗入口

主窗是单列滚动的设置页，入口在 `src/App.tsx`（`<SettingsPage />`）。Section 拆分随版本迭代，要看当前结构直接读 `src/settings/sections/`。

### Settings 持久化

- **路径**：`~/Library/Application Support/com.mindtap.app/settings.json`（macOS），其他平台对应 `app_log_dir()`
- **格式**：单一 JSON，具体字段 schema 见 `src-tauri/src/settings/schema.rs`
- **atomic write**：写 tmp 文件 → `fsync` → `rename`，不丢数据
- **source of truth**：JSON 文件是 truth；Autostart 例外（OS LaunchAgent / Registry 是 truth，settings.json 是 UI 镜像）
- **写后必发 `settings-changed` 事件** → 前端 `useSettings` 订阅 → 自动刷新 UI

### 日志基建

- **三档输出**：stderr（env_logger 默认）+ 文件（`app_log_dir()/mindtap.log`，>5MB 启动时 rename）+ 内存 ring 200（`Arc<Mutex<VecDeque>>`）
- **`log::shared_ring()`** 提供给 diagnostics 读取
- **前端** `src/lib/log.ts`：dev 期 `console` 双写 + `invoke('frontend_log')` 转发到 ring + 文件

### 诊断面板

`useDiagnostics` hook mount + focus 刷新；`LogViewer` 组件 3s 轮询 ring。聚合字段以 `Diagnostics` struct 定义为准，见 `src-tauri/src/diagnostics/`。

### 全局约束与踩坑点

- **路径别名**：`@/* → src/*`，vite 与 tsconfig 必须同步。改别名就两个文件一起改。
- **DB 全局锁**：`DbState(Mutex<Connection>)`，全 app 一个连接。所有 db 函数走 `state.0.lock().unwrap()`。要并发先想清楚是不是真要并发，不要无脑加 `Arc<RwLock>`。
- **写后必发事件**：task 状态变更发 `focus-changed`，新增/归档发 `record-updated`。前端 hook 靠这个驱动刷新。漏发 = UI 与 DB 不一致。
- **Settings 写后必发 `settings-changed`**：任何 settings 写操作（`settings_set` / `settings_reset`）必须通过 `emit("settings-changed", ())` 通知前端 `useSettings` hook 刷新。漏发 = UI 停留在 stale 值。
- **`Cargo.lock` 已 gitignore**（见 `.gitignore`），单二进制项目惯例；不要提交它。
- **`bundle.targets: []`** —— V1.0 默认只产裸 `.exe` / `.app`，不做 MSI / NSIS / DMG / deb。要改就在 `tauri.conf.json` `bundle.targets` 加，需要对应平台工具链。
- **`src-tauri/capabilities/default.json` 只覆盖 `main` 窗口**。如果新增独立 webview 窗口，要给它单独建 capability 并把 `windows: [...]` 列出。

## 项目规约

### 设计语言

所有 UI 改动必须参考 `docs/design/glassic-ui-spec.md`（项目自有 Liquid Glass 视觉 spec）。组件落地策略：shadcn 源码拷 + Tailwind token + Radix primitive。**不要**自创颜色 / 阴影 / 模糊 token——查 spec 拿现有值。

### 文件归位

| 内容类型 | 去处 |
|---|---|
| React 前端 | `src/` |
| Rust 后端 | `src-tauri/src/` |
| 新功能「做什么」 | `docs/specs/YYYY-MM-DD-<topic>-design.md` |
| 新功能「怎么做」 | `docs/plans/YYYY-MM-DD-<topic>.md` |
| 阶段交付报告 | `docs/reports/` |
| 一次性过程产物（task_plan / progress / findings） | `.planning/YYYY-MM-DD-<topic>/` |
| 已交付版本的完整沙盒 | `docs/archive/v<version>/` |

### 新功能流程

`docs/specs/` 定 What → `docs/plans/` 拆 How → TDD 写 Code（先失败测试，后实现）。**不要**直接动手写代码、事后补 spec。

### 添加新 webview 窗口

三处必须同步改，否则启动 / 权限 / 构建会出岔子：

1. `tauri.conf.json` → `app.windows[]` 加新条目（label / url / size / decorations）
2. `vite.config.ts` → `rollupOptions.input` 加新 html 入口
3. `src-tauri/capabilities/` 新建 `<label>.json`，`windows: [...]` 列出该窗口（**不要**复用 `default.json` —— 它只覆盖 `main`）

## 文档与规划文件

按**类型**组织(active 内容),版本进 `archive/`。详见 [`docs/README.md`](docs/README.md)。

- `docs/design/` — 项目自有设计(design system 等)。
- `docs/material/apple/` — Apple HIG Materials 参考。
- `docs/plans/` — 实施 plans。
- `docs/specs/` — 实施 specs。
- `docs/reports/` — 阶段性报告。
- `docs/archive/v1.0/` — V1.0 完整沙盒(已交付)。
- `.planning/YYYY-MM-DD-<topic>/` — 单次规划会话产物(task_plan / progress / findings),属于过程文档。
