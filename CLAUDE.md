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
- **`floating`** (`label: floating`, `floating.html` → `src/floating/main.tsx` → `src/floating/App.tsx`)：浮窗，折叠态 320×36，展开态 360×280（最大 480×460）。尺寸常量在 `floating/App.tsx` 顶部，**必须**与 `tauri.conf.json` 的 `min/maxWidth/Height` 同步。

`vite.config.ts` 通过 `rollupOptions.input` 把两个 html 都作为入口产物打包。

### Rust 后端布局（`src-tauri/src/`）

- `lib.rs` — Tauri Builder 装配点。所有 plugins（opener / dialog / autostart / global-shortcut）、setup（DB init、浮窗 ensure、快捷键注册、两窗口菜单事件绑定）、`invoke_handler!` 宏（注册全部 `#[tauri::command]`）都在这里。`main.rs` 仅转调 `mindtap_lib::run()`。
- `commands/` — 一个领域一个文件（`task_cmd`、`idea_cmd`、`check_in_cmd`、`record_cmd`、`floating_cmd`）。每个 command：`state.0.lock() → 调 db 函数 → app.emit(...) → 返回`。**task** 相关 command 在写完都会发 `focus-changed`，create / archive 发 `record-updated`。
- `db/` — SQLite 层。每个表一个模块（`task.rs`、`idea.rs`、`check_in.rs`、`record.rs`），纯函数签名 `(conn, ...) -> AppResult<T>`。`schema.rs::create_tables` 启动时建表 + 建索引。`mod.rs` 提供共享 `DbState(pub Mutex<Connection>)`，由 `lib.rs::setup` 调 `db::init(app)` 装载进 Tauri State。
- `error.rs` — `AppError`（`thiserror`）+ `AppResult` 别名，手动实现 `Serialize` 把错误渲染成字符串给前端，避免 serde derive 与 trait bound 互殴。
- `floating/mod.rs` + `floating/platform.rs` — `ensure_window` 幂等创建浮窗；macOS 走 `set_as_panel`（NSVisualEffectView，GitHub issue 公开 workaround）。其他平台靠 `transparent + decorations: false + alwaysOnTop` + Web 端 Liquid Glass。
- `tray/menu.rs` + `tray/confirm.rs` — 4 项主菜单（显示/隐藏浮窗、显示/隐藏主窗、开机自启、退出），`build_main_menu` 每次按 autostart 真实状态重建（不缓存 `CheckMenuItem`）。`handle_action` 按 id 路由动作。**V1.4 spec §5.1 / §5.2** 落地：浮窗右键、主窗右键、未来托盘图标三处复用同一 `handle_action` 分发。

### 领域模型（关键不变量）

`db/schema.rs` 定义 4 张表：

- **源表**：`task` / `idea` / `check_in`，各自带业务字段与状态机。
- **统一视图表**：`record(kind, source_id, content, status, created_at)`，`UNIQUE(kind, source_id)`。所有「展示给用户的记录」走这里。

**任何写源表的 db 函数必须事务内双写到 `record`**（看 `task.rs::create_task` / `start_timer` / `pause` 等）。前端时间线、浮窗列表都只读 `record`；前端要拿到 Task 完整字段（如 `duration_ms`、`focus_started_at`）时，由 `record_get_active_task` command 用 `record.source_id` 再去 `task` 表取宽行 —— 这就是 `record.rs::tests::active_task_view_links_to_full_task_with_timing_data` 锁住的不变量。

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

**新增 IPC commands（V1.4）：**

| command | 用途 |
|---|---|
| `settings_get / settings_set / settings_reset` | Settings 读写 |
| `accessibility_status / accessibility_request_prompt / open_ax_settings` | 辅助功能 |
| `diagnostics_get / diagnostics_recent_logs / frontend_log` | 诊断面板 |
| `floating_is_visible` | PR8 fix：判断浮窗是否显示 |

`@tauri-apps/api/core` 的 `invoke` 已经帮你把后端 `AppError` 的字符串序列化抛到 Promise reject 端，前端 `try/catch` 即可。

### 浮窗交互主路径

```
用户按 Cmd/Ctrl+Shift+Space
  → global-shortcut plugin 触发
  → commands::floating_cmd::floating_toggle
  → get_webview_window("floating").show() / .hide()

用户在浮窗右键
  → api.showFloatingContextMenu()
  → commands::floating_cmd::show_floating_context_menu
  → tray::menu::build_main_menu
  → window.on_menu_event(...)
  → tray::menu::handle_action
```

折叠 ↔ 展开的状态机、200ms hover-out 延迟折叠、ResizeObserver 内容自适应、长按拖拽 (`useDragLongPress`) 都封装在 `src/floating/App.tsx`。**该文件顶部 `DEBUG = true` 是临时 debug 开关**（TODO 注明 click-to-expand bug 修好后删除）。

### 主窗设置页（V1.4 新）

主窗从「左侧栏 + RecordTimeline 时间线」改造为单列滚动的 `SettingsPage`：

```
Hero（标题 + 浮动条 toggle 按钮 + 状态条）
  → 11 个 section（7 basic + 5 高级整段折叠 + 2 个 advanced 展开）
```

9 个 section 组件在 `src/settings/sections/`：
`About / Accessibility / Appearance / Data / Diagnostics / Floating / Hotkey / Logging / Startup / WindowState`

共享组件在 `src/settings/components/`：`GlassCard / Section / Segmented / KeyRecorder / LogViewer`

`App.tsx` 现在就是 1 行：`<SettingsPage />`

### Settings 持久化

- **路径**：`~/Library/Application Support/com.mindtap.app/settings.json`（macOS），其他平台对应 `app_log_dir()`
- **格式**：单一 JSON，字段：`meta / startup / hotkey / floating / windowState / appearance / logging`
- **atomic write**：写 tmp 文件 → `fsync` → `rename`，不丢数据
- **source of truth**：JSON 文件是 truth；Autostart 例外（OS LaunchAgent / Registry 是 truth，settings.json 是 UI 镜像）
- **写后必发 `settings-changed` 事件** → 前端 `useSettings` 订阅 → 自动刷新 UI

### 日志基建

- **三档输出**：stderr（env_logger 默认）+ 文件（`app_log_dir()/mindtap.log`，>5MB 启动时 rename）+ 内存 ring 200（`Arc<Mutex<VecDeque>>`）
- **`log::shared_ring()`** 提供给 diagnostics 读取
- **前端** `src/lib/log.ts`：dev 期 `console` 双写 + `invoke('frontend_log')` 转发到 ring + 文件

### 诊断面板

聚合信息（`Diagnostics` struct 字段）：`accessibility / hotkey_registered / active_task / floating_visible / db {path,size,count} / recent_logs / app {version,totalLaunches}`

3 个 commands：`diagnostics_get / diagnostics_recent_logs / frontend_log`

前端 `useDiagnostics` hook：mount + focus 刷新；`LogViewer` 组件 3s 轮询 ring。

### 全局约束与踩坑点

- **路径别名**：`@/* → src/*`，vite 与 tsconfig 必须同步。改别名就两个文件一起改。
- **窗口尺寸双源**：浮窗尺寸上限写死在两处 —— `tauri.conf.json` 与 `floating/App.tsx` 的 `MIN_W/MAX_W/...`。改一个必须改另一个。
- **DB 全局锁**：`DbState(Mutex<Connection>)`，全 app 一个连接。所有 db 函数走 `state.0.lock().unwrap()`。要并发先想清楚是不是真要并发，不要无脑加 `Arc<RwLock>`。
- **写后必发事件**：task 状态变更发 `focus-changed`，新增/归档发 `record-updated`。前端 hook 靠这个驱动刷新。漏发 = UI 与 DB 不一致。
- **Settings 写后必发 `settings-changed`**：任何 settings 写操作（`settings_set` / `settings_reset`）必须通过 `emit("settings-changed", ())` 通知前端 `useSettings` hook 刷新。漏发 = UI 停留在 stale 值。
- **`Cargo.lock` 已 gitignore**（见 `.gitignore`），单二进制项目惯例；不要提交它。
- **`bundle.targets: []`** —— V1.0 默认只产裸 `.exe` / `.app`，不做 MSI / NSIS / DMG / deb。要改就在 `tauri.conf.json` `bundle.targets` 加，需要对应平台工具链。
- **`src-tauri/capabilities/default.json` 只覆盖 `main` 窗口**。如果新增独立 webview 窗口，要给它单独建 capability 并把 `windows: [...]` 列出。

## 文档与规划文件

- `docs/projects/v1.0/` — V1.0 PRD、specs、task_plan、progress、findings、prototype。
- `docs/superpowers/plans/`、`docs/superpowers/specs/` — 实施用 plans 与 spec。
- `docs/material/apple/` — Apple HIG Materials 参考。
- `docs/v1.3-e2e-result.md` — V1.3 浮动窗口实施完成报告，含 18 个单元测试覆盖清单。
- `.planning/YYYY-MM-DD-<topic>/` — 单次规划会话产物（task_plan / progress / findings），属于过程文档。

## 测试现状

| 层 | 数量 | 覆盖 |
|---|---|---|
| Rust unit | 35 | schema / task 全状态机（L1/L2/L3 不变量）/ record 关键查询 / settings validate / load 迁移 / ring buffer |
| Frontend vitest | 16 | useSettings debounce+error revert (3) / useAccessibility polling (1) / useDiagnostics mount (1) / useKeyRecorder FSM 5 相位 (5) / KeyRecorder 组件 (2) / smoke (2×2) |
| **合计** | **51** | |

跑全测前先 `npm install`（虽然不直接用，但 workspace 一致性），然后 `cargo test --manifest-path src-tauri/Cargo.toml`。

## V1.4 主窗改造 4 wave 拆分

立项 spec：`docs/superpowers/specs/2026-06-19-主窗改造为设置页-design.md`

| Wave | PRs | 内容 | 锚点 |
|---|---|---|---|
| Wave 1 基建 | PR1-7 | Tailwind + Glassic UI + log + settings schema + appliers + accessibility + diagnostics + hooks | — |
| Wave 2 主线 UI | PR8-10 | SettingsPage + 7 基础 + KeyRecorder + 5 高级 + LogViewer + 接入 | `ac74d7d` PR8 fix |
| Wave 3 清理 | PR11 | recordList 合并 + SwitchDropdown 迁移 + 删 Surface | `64b2244` PR11 fix |
| Wave 4 文档 | PR12 | CLAUDE.md + README + 完成报告 | HEAD |

覆盖：12 commits（PR1-11）+ 3 fix commits = 15 commits from spec start，51 tests。