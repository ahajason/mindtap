# AGENTS.md

## 项目

**轻念 · Mindtap** — 跨平台桌面应用。当前版本 **0.2.2**。

| 版本 | 状态 | 范围 |
|---|---|---|
| **0.2.2** | ✅ 当前 | Item 三态台账 + 浮窗/气泡 + 复盘 + 空闲自动暂停 + NSIS 数据保护 |
| 0.2.1 | ✅ 已并入 0.2.2 | 工作台：Item 统一实体、失真确认、系统通知 |
| 0.2.0 | ✅ 历史 | 浮窗计时器首版（旧 `timer_session` 已废弃） |
| 0.1.6 | ✅ 历史 | Style Guide / 设计系统基线 |

**业务目标**: 个人工作台账 — 3 秒记录、1 秒查看、0 思考成本、全量本地存储。

**铁律**: 全本地 SQLite，无云同步；安装/升级不得删除 `%APPDATA%\com.mindtap.desktop`。

**设计语言**: 项目自有 spec `docs/design-system/glassic-ui-spec.md` + Tailwind tokens。

## 技术栈
- Tauri 2.11 + React 19 + TypeScript 5.8 + Vite 7
- 三个 Web 入口：`index.html`（主窗口）+ `floating.html`（浮窗 + 气泡窗口共享）
- 三个 Tauri 窗口在 `src-tauri/tauri.conf.json` 中声明（`main` + `floating` + `bubble`）
- SQLite 唯一规范表：`item` / `focus_interval` / `app_setting`（`PRAGMA user_version = 1`）
- Rust 依赖：rusqlite（bundled）、tokio、tauri-plugin-{dialog,autostart,global-shortcut,notification,log}
- 仅 Windows：`windows` 0.58（GetLastInputInfo 空闲检测）
- 仅 macOS：`objc2` 0.6

## 工具链要求
- Node 24 LTS 严格版本（`engines.node: ">=24 <25"`，`.nvmrc` = `24`）
- Rust 1.96+
- Windows：MSVC Build Tools 2022 + Windows SDK 10.0.26100+
- Linux：libwebkit2gtk-4.1-dev + libssl-dev + libayatana-appindicator3-dev

## 命令

### 开发（Windows / Linux / macOS）
```
npm install
npm run tauri dev
```
Vite 开发服务器固定端口 1420（`strictPort: true`）；被占用则 `tauri dev` 失败 —— 先释放端口。

### 构建（Windows .exe）
必须在 `cmd` / PowerShell 中执行且加载 MSVC 环境。Git Bash 在 `vcvars64.bat` 后会破坏 `ln` 命令（E15）—— 用 PowerShell。
```
"C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
cd C:\path\to\mindtap          # PowerShell：不要 /d 参数（E16）
npm run tauri build
```
产物：`src-tauri\target\release\mindtap.exe`（约 9 MB）。

### Windows 安装包
`tauri.conf.json` 中 `bundle.targets = ["nsis"]`。自定义模板 `src-tauri/nsis/installer.nsi`（对齐 `@tauri-apps/cli` 同版本官方源）卸载时**永不删除** AppData。生产打包：`npm run build:win` → 产物在 `build/`。

### 仅前端（不经过 Tauri）
- `npm run dev` — Vite 跑在 :1420
- `npm run build` — `tsc && npm run lint:boundaries && vite build`（严格 TS，类型检查是 build 的一部分）
- `npm run preview`
- `npm run lint:boundaries` — `depcruise src/packages`（模块边界检查，禁止循环依赖）

### 前端测试（vitest）
```
npm test         # vitest run（27 个测试文件，jsdom 环境，css: false）
npm run test:watch  # vitest 监听模式
```

### Rust 测试
```
cd src-tauri && cargo test    # 49 个测试，覆盖 db 状态机 + 不变量
```
前端测试覆盖浮窗 UI 组件 / hooks / packages。Rust `#[cfg(test)]` 模块位于 `src-tauri/src/db/` + `src-tauri/src/idle.rs`。

## 架构要点（Agent 容易遗漏）

### 三个窗口，一个 App
- `main` 窗口加载 `index.html` → `src/main.tsx` → `App.tsx`
- `floating` 窗口加载 `floating.html` → `src/floating/main.tsx` → `src/floating/App.tsx`（三态折叠: folded/compose/list）
- `bubble` 窗口加载 `floating.html` → `src/floating/BubbleApp.tsx`（失真确认气泡，280×80）
- 三个窗口都在 `tauri.conf.json` `app.windows[]` 注册。Vite 多入口在 `vite.config.ts` 配置。
- 全局快捷键 `Ctrl+Shift+Space` 切换浮窗显示/隐藏（`lib.rs` setup，macOS 用 SUPER）。

### IPC 桥接
所有前端→后端调用走 `src/lib/tauri-bridge.ts`（类型化的 `api.*` + 事件监听）。后端 handler 在 `src-tauri/src/lib.rs` 的 `invoke_handler` 中注册（共 24 个命令: item_* 18 个 + setting_* 2 个 + app_* 2 个 + floating_cmd 2 个）。新增命令 = 三处都要改：`tauri-bridge.ts` + `invoke_handler!` 宏 + `commands/<name>_cmd.rs`。

### 业务模型（Item 统一实体）
`src-tauri/src/db/item.rs` — Item 取代旧 TimerSession（ADR-0011）。三态: `todo` / `active` / `archived`。
- 支持多卡并行 active（不唯一索引）
- `focus_ms` 只增不减（已结算值），实时时长前端按 `now - last_active_at` 推导
- `focus_interval` 表记录每次 start→结算的激活明细
- `app_setting` KV 表存用户偏好（浮窗展开高度等）
- 失真检测（冷却/跨天）在 `db/dormant.rs`，空闲自动暂停在 `idle.rs`

### 数据库布局
`src-tauri/src/db/` — 3 张表: `item`（任务实体）、`focus_interval`（激活明细）、`app_setting`（用户设置）。`schema.rs` 在 `db::init` 时创建。连接存于 Tauri 受管状态 `DbState(Mutex<Connection>)`。每个命令都会锁互斥锁 —— handler 保持简短，**不要**跨 `.await` 持有锁。

### 跨平台条件编译
`Cargo.toml` 条件依赖: `[target.'cfg(windows)'.dependencies]` 用 `windows` 0.58（GetLastInputInfo 空闲检测）; `[target.'cfg(target_os = "macos")'.dependencies]` 用 `objc2` 0.6。前端平台差异靠 CSS `backdrop-filter` 处理。**没有**按平台拆分的源码目录 —— 单一代码库 + 条件编译。

### Liquid Glass 铁律
玻璃表面（`topbar`、`sidebar`、`fab`、`floating/*`）**只**承载控件/导航。**内容必须落在非玻璃背景上**（在 `RecordTimeline` 内部）。这是硬性设计规则（参见 `src/App.tsx` 注释 + `docs/M-1-material/apple/liquid-glass/`），不是建议。

## 中国大陆 Rust 镜像（D45）
`crates.io` 官方源在大陆几乎不可用（3.86 KiB/s）。首次 `cargo build` 前配置 `~/.cargo/config.toml` 用 rsproxy.cn：
```toml
[source.crates-io]
replace-with = 'rsproxy'

[source.rsproxy]
registry = "https://rsproxy.cn/crates.io-index"

[net]
git-fetch-with-cli = true
```

## 设计语言铁律
- 所有 UI 改动必须参考 `docs/design-system/glassic-ui-spec.md`（项目自有 Liquid Glass spec）。
- 组件落地策略：shadcn 源码拷 + Tailwind token + 原生 primitive。
- **不**自创颜色 / 阴影 / 模糊 token —— 查 spec 拿现有值。

## 文件归位（来自 CLAUDE.md）
| 内容类型 | 去处 |
|---|---|
| 新功能「做什么」 | 对应需求目录 `docs/<编号>-<需求>/`（domain / design，index.md 入口） |
| 新功能「怎么做」 | `docs/plans/YYYY-MM-DD-<version>-<feature>.md` |
| 范围边界 / bug 归属 | 对应 task.md「范围边界」段 |
| 进行中任务 | `docs/<需求>/tasks/<name>/task.md` |
| 发版记录 | `docs/governance/versioning-rule.md`（发版硬约束在 §六） |

## 规则（位于 `.claude/rules/`）
| 规则 | 何时查阅 |
|---|---|
| `workflow.mdc` | 任何代码/文档改动前后（三层决策 + 调研 + 根因倒推 + 任务拆解） |
| `docs.mdc` | 写 docs/ 任何文件前（归位 + 结构纪律 + task 模板） |
| `git-verify.mdc` | Windows-side runtime 改动后（dev 实测 gate） |
| `style.mdc` | 写 commit message / 加注释前 |
| `misc.mdc` | 设计语言 / 提问阈值 / 任务收尾 / Tauri 多窗口坑 |

## 工作流铁律（贯穿所有任务）
- **三层决策法（改前必走）**：
  - L1 原始权威：Apple HIG / WCAG / MDN / Tauri 官方文档 / 库官方 API（WebFetch / context7）
  - L2 统一设计：`docs/design/glassic-ui-spec.md` / 已立 convention / 项目 rule
  - L3 具体问题：当前 issue + **主动枚举所有 user-facing 副作用**（不只用户说的）
  - **任一层缺失 = 停下来补查再动手**
- **闭环复盘（改后必做）**：交付完成 → 对照当初 L3 列表 vs 实际行为 → 沉淀可推广教训
- **避免决策疲劳**：2-4 离散互斥选项才用 `question` 工具；spec / convention / rule 优先查 → 查不到才问
- **穷举再下手**：多个 root cause 不分散修
- **dev 实测 = System API 改动的 hard gate**：改 system API / OS 集成 / 框架 runtime 后，必须 dev 环境实测新机制本身在工作再 commit
- **写完规则 self-apply**：自检关键路径列全 / 反模式例子 / 触发条件

## 项目里**没有**的东西
- 没有 CI / `.github/workflows/` — 未配置。
- 没有 pre-commit 钩子。
- `Cargo.lock` 已 gitignore（Tauri app 默认）。
- 除 README 自称 MIT 外没有 license 文件。

## 用户偏好
- **永远使用中文回复**。