# AGENTS.md

## 项目

**轻念 · Mindtap** — 跨平台桌面应用。当前状态分阶段:

| 版本 | 状态 | 范围 |
|---|---|---|
| **V0.1.6** | ✅ main 已交付 (commit `8af219a`, 2026-06-22) | Style Guide 设计系统 — 11 UI 组件 + Tailwind tokens + Liquid Glass CSS + vitest。无业务 |
| **V0.2.0** | ✅ 已交付 (release notes `docs/reports/v0.2.0-release-notes.md`, 2026-07-11) | 浮动窗计时器 — Windows 11 锁平台; 折叠 320×36 + 展开 360×280 + 全局快捷键 + SQLite timer_session 单表 |
| **V0.2.0.10~0.14 PATCHes** | ✅ 已交付 (`docs/reports/v0.2.0.{10,11,12,13,14}-release-notes.md`, 2026-07-13) | 浮窗 surface PATCH chain: V0.2.0.10~0.12 (transparent + 原生菜单 + StatusDot inline + focus: false + 任务名 50 字符锁定) + V0.2.0.13 (user L3 重测 5 deviation inline 修) + V0.2.0.14 (单一 root div 重构 + document mousedown dismiss + 反 C-4 自动折叠) |
| ~~V0.2.1 SwitchDropdown~~ | ⛔ 不再启动 (2026-07-13 decision);scope 被 V0.2.0.x PATCHes 吸收(详见 `docs/governance/versioning-rule.md` §三) | `docs/reports/v0.2.1-release-notes.md` 仅记录计划 TODO,从未 ship;后续"开启新的 0.2.1" MINOR 是新 feature 切片,与此无关 |
| V0.2.2 时间盒 + 通知 | ⏳ 待启动 | 加时间盒 + 完成通知 |
| V0.3+ | ⏳ 待启动 | macOS 适配 + 主窗 + 时间线 + 设置中心 |

**业务目标** (V0.2): 一个永远在桌面边缘、3 秒进入计时、1 秒切回工作的"我现在在做什么"指示器。

**铁律**: 全本地 SQLite，无导出/无导入/无同步（沿用 V1.0 PRD D23，V0.2 立项时用户已确认 — 详见 `docs/prd/v0.2.0-floating-window-prd.md (基线 spec, 内容散拆自 projects/v0.2/README.md)`）。

**设计语言**: Apple Liquid Glass（仅作视觉灵感参考；具体落地用项目自有 spec `docs/design/glassic-ui-spec.md` + Tailwind tokens）。

## ⚠️ 关键规则：.archive/ 仅作参考，不作事实依据

**核心警示**: `.archive/` 目录（含 `.archive/src/`、`.archive/docs/`、`.archive/docs/projects/v1.0/`、`feat/floating-auto-collapse` worktree）是 V1.0 时代的**归档快照**，**整体不是事实**——既不是当前项目代码，也不是当前文档。文件存在 / 内容 / 设计意图 / 实装代码 / bugfix 报告，**全部属于非事实**。

**铁律**:
- **当前项目代码事实** = 当前 `src/`、`src-tauri/src/`、`docs/`、`CONTEXT.md`、ADR、spec、plan 里**已落地**的内容；当前 git 事实；通用技术事实
- `.archive/` **任何内容** = **非事实**，**必须经用户独立确认**才能作为 V0.x 决策依据
- AGENTS.md 自身可能失同步（§"项目"段当前描述的是 V1.0 状态，与 develop 不同步），冲突时以**用户当前口径**为准
- 引用前**先分类**（当前项目事实 / `.archive/` 非事实）→ `.archive/` 内容**先问用户** → 用户确认后落到 CONTEXT.md / ADR → 才能作为依据
- 详见 `.claude/rules/archive-reference-only.md`（完整规则 + 8 个反模式 + 事实/非事实边界细化表）

## 技术栈
- Tauri 2 (Rust 1.96+) + React 19 + TypeScript 5.8 + Vite 7
- 两个 Web 入口：`index.html`（主窗口）+ `floating.html`（浮动面板 320×36）
- 两个 Tauri 窗口在 `src-tauri/tauri.conf.json` 中声明（`main` + `floating`）
- Rust 依赖：rusqlite（bundled）、tokio、tauri-plugin-{opener,dialog,autostart,global-shortcut}
- 仅 macOS：`objc`、`cocoa`

## 工具链要求
- Node 24 LTS 严格版本（`engines.node: ">=24 <25"`，`.nvmrc` = `24`）
- Rust 1.96+
- Windows：MSVC Build Tools 2022 + Windows SDK 10.0.26100+
- Linux：libwebkit2gtk-4.1-dev + libssl-dev + libayatana-appindicator3-dev

## 命令

### 开发（WSL / Linux / macOS）
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

### 默认 bundle 为空
`tauri.conf.json` 中 `bundle.targets = []` —— 只生成裸 `.exe`，**不**生成安装包。改成 `["nsis"]` 才会生成安装包（约 20 MB）。NSIS 由 Tauri 的 reqwest 自动下载 —— 如在内网代理后设 `$env:HTTPS_PROXY`（E19）。

### 仅前端（不经过 Tauri）
- `npm run dev` — Vite 跑在 :1420
- `npm run build` — `tsc && vite build`（严格 TS，类型检查是 build 的一部分）
- `npm run preview`

### Rust 测试
```
cd src-tauri && cargo test    # 18 个测试，覆盖 db 状态机 + 不变量 L1-L5
```
未配置 JS 测试框架。唯一测试入口是 `cargo test`（`#[cfg(test)]` 模块位于 `src-tauri/src/db/` 各文件内）。

## 架构要点（Agent 容易遗漏）

### 两个窗口，一个 App
- `main` 窗口加载 `index.html` → `src/main.tsx` → `App.tsx` → `RecordTimeline`
- `floating` 窗口加载 `floating.html` → `src/floating/main.tsx` → `src/floating/App.tsx`（折叠/展开 UI）
- 两个窗口都在 `tauri.conf.json` `app.windows[]` 注册。Vite 多入口在 `vite.config.ts` 配置。
- 全局快捷键 `Cmd/Ctrl+Shift+Space` 切换浮动窗口（`lib.rs:12-19`，macOS 用 SUPER，其他平台用 CONTROL）。

### IPC 桥接
所有前端→后端调用走 `src/lib/tauri-bridge.ts`（类型化的 `api.*` + 事件监听）。后端 handler 在 `src-tauri/src/lib.rs` 的 `invoke_handler` 中注册（共 17 个命令）。新增命令 = 三处都要改：`tauri-bridge.ts` + `invoke_handler!` 宏 + `commands/<name>_cmd.rs`。

### 数据库布局
`src-tauri/src/db/` — `schema.rs` 在 `db::init` 时创建 4 张表（task/idea/check_in/record）。连接存于 Tauri 受管状态 `DbState(Mutex<Connection>)`。每个命令都会锁互斥锁 —— handler 保持简短，**不要**跨 `.await` 持有锁。

### 跨平台条件编译
`src-tauri/src/floating/platform.rs` + `Cargo.toml` 依赖里的 `#[cfg(target_os = "macos")]`。macOS 用 `objc`/`cocoa` 调 NSVisualEffectView；其他平台用 CSS `backdrop-filter`。**没有**按平台拆分的源码目录 —— 单一代码库 + 条件编译（D10/D43）。

### Liquid Glass 铁律
玻璃表面（`topbar`、`sidebar`、`fab`、`floating/*`）**只**承载控件/导航。**内容必须落在非玻璃背景上**（在 `RecordTimeline` 内部）。这是硬性设计规则（参见 `src/App.tsx` 注释 + `docs/material/apple/liquid-glass/`），不是建议。

## 跨环境开发（D43）—— 修改路径前必读
WSL 没有 MSVC 工具链 → 无法 `cargo build`。仓库在**两个独立副本**中存在：WSL 端用于编辑/开发，Windows 端用于原生构建。**禁止软链** —— 9P + Windows 软链会破坏 npm（`EISDIR`）和 UNC 路径（E13/E14）。每次会话选一个环境。

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

## 文档约定
- `docs/projects/v1.0/task_plan.md` 是项目的"工作记忆磁盘" —— 任何非琐碎任务开工前**先读这里**。包含 D1-D45 决策 + E1-E20 错误记录。
- `docs/projects/v1.0/INDEX.md` 是 V1.0 所有文档的索引。
- V1.0 设计参考：`docs/material/apple/liquid-glass/`、`hig/`、`swiftui/`、`wwdc/`。
- V1.0 即"FlashMind"；V1.2 是上游 PRD 基线，保留为决策审计日志。
- Sprint 计划（`agile-sprint-plan.md`）是 D28 —— 上次编辑时仍待用户批准。

## 设计语言铁律
- 所有 UI 改动必须参考 `docs/design/glassic-ui-spec.md`（项目自有 Liquid Glass spec）。
- 接入 UI 前确认 spec 已落到 `docs/design/`；**未 cp spec 之前不要起 `tauri dev` 跑 UI**（缺 Tailwind token 会编译报错）。
- 组件落地策略：shadcn 源码拷 + Tailwind token + Radix primitive。
- **不**自创颜色 / 阴影 / 模糊 token —— 查 spec 拿现有值。

## 文件归位（来自 CLAUDE.md）
| 内容类型 | 去处 |
|---|---|
| 新功能「做什么」 | `docs/specs/YYYY-MM-DD-<topic>-design.md` |
| 新功能「怎么做」 | `docs/plans/YYYY-MM-DD-<topic>.md` |
| 阶段交付报告 | `docs/reports/` |
| 已交付版本完整沙盒 | `docs/archive/v<version>/` |
| 任务正式档 | `docs/tasks/<version>-<type>-<short-desc>/task.md`（命名/模板见 `.claude/rules/task-directory.md`） |

## 详细规则索引（位于 `.claude/rules/`）
opencode 通过项目级 `opencode.jsonc` 的 `instructions` 字段自动加载这些规则（每次会话注入 context，无 frontmatter，纯 markdown）：

| 规则 | 何时查阅 |
|---|---|
| `decision-method.md` | **任何代码/文档改动前必查**（三层穷举 L1/L2/L3 + 闭环复盘） |
| `ask-user-question-threshold.md` | 决定是否用 `question` 工具时（2-4 离散互斥选项才用） |
| `commit-style.md` | 写 `git commit -m "..."` 前（业务层粒度 + 完整性门槛） |
| `comment-style.md` | 给函数/类加注释前（注释只写 why，代码即注释） |
| `task-directory.md` | 写任务正式档 `task.md` 前（slug 命名 + 模板） |
| `codegraph.md` | 跨文件结构查询时（vs grep） |
| `dev-verify-before-commit.md` | 改 system API / OS 集成 / 框架 runtime 后 commit 前 |
| `first-step-research.md` | 接到 bug 反馈 / "X 不工作" / 改 system API 前（双层调研） |
| `self-apply-after-write.md` | 写完 rule / memory / AGENTS.md 后做 7 项 self-apply 检验 |
| `archive-reference-only.md` | 引用 `.archive/` 或 V1.0 PRD 任何非事实内容前（**归档不是规范**，必须用户确认） |

> 原始 .mdc 文件保留在 `.claude/rules/`，作为 Claude Code 兼容源（如果以后回退用 Claude Code 时仍可工作）。

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
- **写完规则 self-apply**：7 项检验（路径 / 触发条件 / 反模式 / 与相邻规则冲突等），规则漏路径 = 规则无效
- **归档不是规范**：引用 `.archive/` 或 V1.0 PRD 任何**非事实**内容（设计意图 / 决策 / 用户画像 / 排期等）前，必须先与用户确认 → 落到 CONTEXT.md / ADR → 才能作为依据。AGENTS.md 自身可能失同步，冲突时以用户当前口径为准

## 项目里**没有**的东西
- 没有 CI / `.github/workflows/` — 未配置。
- `package.json` 中没有 linter / formatter 脚本 — 仅 TS strict。
- 没有 pre-commit 钩子。
- 有项目级 `opencode.jsonc`（仅声明 `instructions: .claude/rules/*.md`，其他配置继承 `~/.config/opencode/opencode.jsonc`）。
- `Cargo.lock` 已 gitignore（Tauri app 默认）。
- 除 README 自称 MIT 外没有 license 文件。

## 用户偏好
- **永远使用中文回复**。