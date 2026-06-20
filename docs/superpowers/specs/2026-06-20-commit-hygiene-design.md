# Commit 卫生 + 任务管理机制 · 设计 spec

> **状态**: v1 定稿（已通过 brainstorming 6 段设计 + 2 次修正）
> **创建**: 2026-06-20
> **覆盖**: 业务架构 + 任务目录 + 提交规范 + 规范沉淀 + 历史 commit 整理
> **关联调研**:
> - `.planning/2026-06-20-commit-hygiene/audit-current-state.md`（现状审计）
> - `.planning/2026-06-20-commit-hygiene/research-best-practices.md`（最佳实践）
> - `docs/competitors/research-cross-runtime-symmetry.md`（跨 runtime 索引案例）
> - `docs/competitors/research-vertical-slice.md`（vertical slice 案例）
> - `docs/competitors/research-monolith-with-index.md`（单体 + 索引案例）

---

## §0 文档立场

**目标**: 把"业务代码按业务域聚合 + 任务目录 + clean-comments 风格 commit"沉淀为 mindtap 的工程规约，落地到 `.claude/rules/` 4 个 `.mdc` 文件 + `docs/tasks/` 任务目录 + 业务架构改造 + 历史 commit 整理。

**关键立场**:
- 业务架构层: **业务对称 + 跨 runtime 索引**（后端 commands 拆业务域 + 前端 ESLint 边界 + 业务域 README）
- 任务管理层: **极简 task.md 模板**（4 段 ~10 行），不写 Files / 不写 commit hash / 不写状态
- 提交规范层: **clean-comments 风格 commit message**（只写 why 不重复 what），**不引入 Refs: 等非标准 footer**
- 规范沉淀层: 在 `.claude/rules/` 写 4 个 `.mdc`（沿用 `codegraph.mdc` 现有 frontmatter 格式）
- 历史 commit 整理: 只整理当前 working tree 的 16+ 散改 → 6-8 个业务 commit；**不动 main 分支历史**

---

## §1 业务架构（模块 1）

### §1.1 后端 `commands/` 拆到各业务域

**目标**: 业务对称 —— 前端 `src/floating/` 已经一业务一目录，后端不该有"全局 commands 目录"破坏对称。

**改造**:

```
# 现状
src-tauri/src/
  commands/                   # 所有 IPC 在这
    floating.rs
    settings.rs
  floating/
    mod.rs
  settings/
    mod.rs

# 改造后
src-tauri/src/
  commands/                   # 改成重导出总线
    mod.rs                    #   pub use crate::floating::commands::*;
                              #   pub use crate::settings::commands::*;
  floating/
    mod.rs                    # 不变
    commands.rs               # ★ 从 src-tauri/src/commands/floating.rs 移到这
  settings/
    mod.rs
    commands.rs               # ★ 同样移
```

**`commands/mod.rs` 内容**:

```rust
// Re-export 业务域 commands，保持 lib.rs 现有调用零修改
pub use crate::floating::commands::*;
pub use crate::settings::commands::*;
```

**优势**:
- lib.rs 不用改（仍从 `crate::commands::*` 引用）
- 改 floating 业务的 IPC 直接看 `src-tauri/src/floating/commands.rs`，不用翻 8 个文件
- 与前端 `src/floating/` 对称

**操作**: 用 `git mv src-tauri/src/commands/floating.rs src-tauri/src/floating/commands.rs` 保留 blame。

### §1.2 前端 ESLint feature 边界

**目标**: 业务域内部禁止 import 其它业务域内部，强制走 barrel + shared 层。

**新增 `.eslintrc.cjs` overrides**:

```js
overrides: [
  {
    files: ['src/floating/**', 'src/settings/**', 'src/timeline/**'],
    rules: {
      'import/no-restricted-paths': ['error', {
        zones: [
          { target: './src/floating', from: './src/settings', except: ['./src/settings/index.ts'] },
          { target: './src/settings', from: './src/floating', except: ['./src/floating/index.ts'] },
          { target: './src/timeline', from: './src/floating', except: ['./src/floating/index.ts'] },
          { target: './src/timeline', from: './src/settings', except: ['./src/settings/index.ts'] },
        ],
      }],
    },
  },
],
```

**前置**: 每个业务域根加 `index.ts` barrel export（`src/floating/index.ts` / `src/settings/index.ts` / `src/timeline/index.ts`）。

**`src/floating/index.ts` 例**:

```ts
export { default as App } from './App';
export { default as FloatShell } from './FloatShell';
export { useWindowPosition } from './hooks/useWindowPosition';
```

### §1.3 业务域根 README 跨 runtime 索引

**10 个 README**（每个业务 / 共享域根 1 个）:

| 路径 | 角色 |
|---|---|
| `src/floating/README.md` | 浮窗业务域 |
| `src/settings/README.md` | 设置业务域 |
| `src/timeline/README.md` | 时间线业务域 |
| `src/hooks/README.md` | 共享 hooks 域 |
| `src/components/README.md` | 共享 UI 域 |
| `src/lib/README.md` | 工具域 |
| `src-tauri/src/floating/README.md` | 浮窗后端 |
| `src-tauri/src/settings/README.md` | 设置后端 |
| `src-tauri/src/db/README.md` | 数据后端 |
| `src-tauri/src/tray/README.md` | 托盘后端 |

**模板**（业务域根用）:

```markdown
# <feature> 业务域

## 跨 runtime 物理位置

| 层 | 路径 | 角色 |
|---|---|---|
| 窗口声明 | tauri.conf.json → app.windows[<feature>] | size / label / url |
| 前端入口 | vite.config.ts → rollupOptions.input.<feature> | build pipeline |
| 前端根 | src/<feature>/ | React 组件 |
| 前端 hook | src/<feature>/hooks/ | 状态机 |
| 后端 entry | src-tauri/src/<feature>/mod.rs | ensure_* 幂等 |
| 后端 commands | src-tauri/src/<feature>/commands.rs | IPC |
| capability | src-tauri/capabilities/<feature>.json | 权限 |

## 修改 DoD

- 改任何一处 → 同步检查表里其他位置
- 跑 `npm run smoke:<feature>` 5/5 PASS 才允许 commit
```

**共享域根用**（hooks / components / lib）:

```markdown
# <domain> 共享域

## 范围

跨业务共享的 <X>。业务域内部使用应通过业务域 barrel import。

## 新增 DoD

新加共享代码前先确认:
- 真的跨业务（不是 floating 内部要用）？
- 命名足够通用（不要 `useFloatingFoo`，要 `useFoo`）？
```

### §1.4 `docs/architecture/` 跨 runtime 索引文档

**新增**（先做 floating 试点，模板推广）:

```
docs/architecture/
  floating.md                 # ★ 试点：最详细
  settings.md                 # 后续推广
  timeline.md                 # 后续推广
  ...
```

**`docs/architecture/floating.md` 模板**:

```markdown
# Floating 业务域架构

## 跨 runtime 物理位置

| 层 | 路径 | 角色 |
|---|---|---|
| 窗口声明 | tauri.conf.json → app.windows[floating] | size / label / url |
| 前端入口 | vite.config.ts → rollupOptions.input.floating | build pipeline |
| 前端壳 | src/floating/App.tsx + FloatShell.tsx | React root |
| 前端 hook | src/floating/hooks/useWindowPosition.ts | drag/resize 状态机 |
| 前端样式 | src/floating/styles/ | 玻璃态 CSS |
| 后端 entry | src-tauri/src/floating/mod.rs | ensure_window 幂等创建 |
| 后端 commands | src-tauri/src/floating/commands.rs | IPC |
| capability | src-tauri/capabilities/floating.json | Tauri 权限 |

## 关键不变量

- 尺寸常量 (src/floating/App.tsx 顶部) 必须与 tauri.conf.json min/maxWidth/Height 同步
- 任何 floating 改动 → 跑 `npm run smoke:floating` 5/5 PASS
- F3' 位置兜底: macOS 菜单栏遮 ~25px，首启 (0,0) 被遮 → useWindowPosition + Rust 兜底 (100, 60)
- F4' 尺寸自适应: 改用 V1.5 webview API `win.setSize(LogicalSize)`

## 业务子任务

- F3' 位置兜底 → docs/tasks/fix-F-floating-position-clamp/
- F4' 尺寸自适应 → docs/tasks/fix-F-floating-v3-visibility/
- L5 挂载契约 → docs/tasks/fix-F-floating-floatshell-mount/
```

---

## §2 任务目录机制（模块 2）

### §2.1 位置

**`docs/tasks/<type>-<scope>-<short-desc>/`**（与现有 `docs/specs/` / `docs/plans/` / `docs/reports/` / `docs/architecture/` 同级）

### §2.2 命名规范

**格式**: `<type>-<scope>-<short-desc>`

| 段 | 取值 | 例 |
|---|---|---|
| type | `feat` / `fix` / `chore` / `docs` / `refactor` | `feat` / `fix` |
| scope | 业务短别名（`F` / `S` / `T` / `DB` / `Tr`） | `F` |
| short-desc | kebab-case，2-4 词 | `floating-v3-redesign` |

**例**:
- `docs/tasks/feat-F-floating-v3-redesign/`
- `docs/tasks/fix-F-floating-position-clamp/`
- `docs/tasks/fix-F-floating-v3-visibility/`
- `docs/tasks/fix-F-floating-floatshell-mount/`
- `docs/tasks/feat-S-settings-smoke/`
- `docs/tasks/feat-DB-task-lifecycle/`

**注意**: slug 里的 scope 用**短别名**，task.md 内部 / commit message / README 标题仍用**语义全名**（`floating` / `settings` / `db`）。

### §2.3 task.md 极简模板（~10 行）

```markdown
# <type>(<scope>): <subject>

> 创建: YYYY-MM-DD

## Why

<!-- 1-3 句。痛点 + 业务场景 + 为什么不修不行 -->

## What

<!-- 1 句业务边界 -->

## Done when

- [ ] 业务行为 X 正确
- [ ] 浮窗 DoD 4 件套全绿（如果涉及浮窗）
- [ ] 不引入新规范违反项
```

**借鉴**:
- K8s `doc.go` 2 行包摘要
- Rust std `//!` 1-3 行极简密度
- Discourse `19-service-objects.md` 结构（但去掉 Files 段）

### §2.4 绝不写什么（反向规则）

| 不写 | 为什么 |
|---|---|
| `## Files` 段 | git 知道（`git log -- <path>` 反查） |
| `## 提交记录` 段 | commit hash 会过期（squash / rebase 后失效）；鸡生蛋问题 |
| `## 状态` 字段 | git 事实推断（看到 commit 就算"已交付"） |
| `## 关联` 段 | 路径自解释（`docs/tasks/<slug>/` 跟 `docs/architecture/<x>.md` 同仓同 commit） |
| Refs: / See also: 等 footer | 不是任何标准，git 不识别 |

### §2.5 跟 commit 的关系

**模式**: task.md 跟业务代码**同 commit**

```bash
# 步骤 1: 先写 task.md（前置）
vim docs/tasks/fix-F-floating-position-clamp/task.md

# 步骤 2: 写业务代码
edit src/floating/hooks/useWindowPosition.ts
edit src/floating/hooks/useWindowPosition.test.ts
edit src-tauri/src/floating/mod.rs

# 步骤 3: 同 commit
git add docs/tasks/fix-F-floating-position-clamp/task.md \
        src/floating/hooks/useWindowPosition.ts \
        src/floating/hooks/useWindowPosition.test.ts \
        src-tauri/src/floating/mod.rs

git commit -m "fix(floating): F3' 位置兜底 P1 clamp 屏外 + Rust (100, 60) 兜底

- macOS 菜单栏遮 ~25px，首启 (0,0) 被遮
- P1 clamp 防多屏拖出屏外
- Rust 侧 mod.rs 兜底应对 Tauri 启动 race"
```

**反向追溯**（不要 commit 写 footer，靠 `git log`）:

```bash
# 查某任务的所有 commit
git log --all --oneline -- docs/tasks/fix-F-floating-position-clamp/

# 查某业务的所有 commit
git log --all --oneline -- src/floating/ src-tauri/src/floating/ \
  src-tauri/capabilities/floating.json
```

### §2.6 跟 `.planning/` 的关系

**保留 `.planning/`** 作为"过程产物"（findings / progress / synthesis / task_plan）。

**新增 `docs/tasks/<slug>/`** 作为"任务正式档"，git 跟踪。

**迁移建议**: V1.0 发版后，现有 `.planning/2026-06-20-floating-redesign/` 归档到 `docs/archive/v1.0/.planning/`，对应正式档迁到 `docs/tasks/feat-F-floating-v3-redesign/`，task.md 加一行:

```markdown
## 历史

- 调研过程产物: .planning/2026-06-20-floating-redesign/ (V1.0 后归档)
```

---

## §3 提交规范（模块 3）

### §3.1 commit message 格式

```
<type>(<scope>): <subject>

<why 段 — clean-comments 风格，只写"为什么"不重复"做了什么">
- 业务痛点
- 边界条件
- 不这样改会怎样
```

**规则**:
- subject ≤ 72 字符
- 中文可读（不必强行英文）
- **不**加句号
- **不**写 footer（无 Refs: / Closes: / See also: 等）

### §3.2 type 集

| type | 用法 | 例子 |
|---|---|---|
| `feat` | 新功能 / 新行为 | `feat(floating): V3 玻璃态浮窗重构` |
| `fix` | 修 bug | `fix(floating): 首启位置被菜单栏遮` |
| `refactor` | 重构（不改行为） | `refactor(commands): 拆到各业务域` |
| `docs` | 纯文档 | `docs(architecture): 浮窗跨 runtime 索引` |
| `test` | 纯测试 | `test(floating): useWindowPosition 边界用例` |
| `chore` | 工具 / 依赖 / 配置 | `chore(deps): 升 commitlint v19` |
| `build` | 构建 / CI | `build(ci): 加 commit-msg hook` |
| `revert` | 撤销 | `revert: feat(floating): V3 玻璃态浮窗重构` |

### §3.3 scope 集

| scope | 业务短别名 | 涉及路径 |
|---|---|---|
| `floating` | `F` | `src/floating/` + `src-tauri/src/floating/` + `src-tauri/capabilities/floating.json` |
| `settings` | `S` | `src/settings/` + `src-tauri/src/settings/` |
| `timeline` | `T` | `src/timeline/` |
| `db` | `DB` | `src-tauri/src/db/` |
| `tray` | `Tr` | `src-tauri/src/tray/` |
| `bridge` | — | `src/lib/tauri-bridge.ts` |
| `diagnostics` | `Diag` | `src/diagnostics/` + `src-tauri/src/diagnostics/` |
| `log` | `Log` | `src/log/` + `src/lib/log.ts` |
| `meta` | — | `docs/` / `CLAUDE.md` / `.claude/rules/` / `package.json` |

**scope 选择规则**: commit 改的代码 80% 以上在哪个业务域，就用哪个 scope；跨多个用最核心的那个。

### §3.4 粒度

**1 个任务 = 1-3 个 commit**

| 任务规模 | commit 数 | 例 |
|---|---|---|
| 小 | 1 | `fix(floating): 单点 bug` |
| 中 | 2 | `feat(floating): V3 重构` = 1 个产品代码 + 1 个测试 |
| 大 | 3 | `feat(floating): V3 重构` = 1 个后端 + 1 个前端 + 1 个测试 |

**反模式**:
- ❌ 1 个任务 10+ commit（拆太散，根因诊断报告里的 D-XX 编号模式）
- ❌ 1 个 commit 跨 3 个不相关任务（聚合过度）

### §3.5 body 段写法（clean-comments 风格）

**写"为什么"**，不写"做了什么"（diff 会显示"做了什么"）:

**正面例子**:

```
fix(floating): F3' 位置兜底 P1 clamp 屏外 + Rust (100, 60) 兜底

- macOS 菜单栏遮 ~25px，首启 (0,0) 被遮
- P1 clamp 防多屏拖出屏外
- Rust 侧 mod.rs 兜底应对 Tauri 启动 race
```

**反例**（重复"做了什么"）:

```
❌ 改了 useWindowPosition.ts 加了 P1 clamp
❌ 改了 useWindowPosition.test.ts 加测试
❌ 改了 mod.rs 加 .position(100.0, 60.0)
```

**判断口诀**: 把 body 段翻译成代码——翻译完跟现有 diff 一样，删；翻译不出，留。

---

## §4 `.claude/rules/` 规范沉淀（模块 4）

### §4.1 现有 `.claude/rules/`

```
.claude/rules/
  codegraph.mdc              # 已有：CodeGraph MCP 使用规范
```

**格式**: YAML frontmatter + Markdown body（参考 `codegraph.mdc`）

### §4.2 新增 4 个规范文件

```
.claude/rules/
  codegraph.mdc              # 已有（不动）
  commit-style.mdc           # ★ 新：commit 规范（§3 落地）
  task-directory.mdc         # ★ 新：任务目录规范（§2 落地）
  feature-architecture.mdc   # ★ 新：业务架构规范（§1 落地）
  eslint-boundary.mdc        # ★ 新：ESLint feature 边界（§1.2 落地）
```

### §4.3 `commit-style.mdc` 大纲

```markdown
---
description: Git commit message and granularity conventions
alwaysApply: true
---

# Commit Style

## Format
<type>(<scope>): <subject>

<why 段 — 不重复 what>

## Type set
feat / fix / refactor / docs / test / chore / build / revert

## Scope
floating / settings / timeline / db / tray / bridge / diagnostics / log / meta

## Granularity
1 task = 1-3 commit. Single business unit.

## Body 段
clean-comments 风格: 写"为什么"不写"做了什么"。
```

### §4.4 `task-directory.mdc` 大纲

```markdown
---
description: docs/tasks/ task directory conventions
alwaysApply: true
---

# Task Directory

## Location
docs/tasks/<type>-<scope>-<short-desc>/

## Required file
task.md (~10 lines, 4 sections):
- Title
- Why (1-3 句)
- What (1 句)
- Done when (checklist)

## Never write in task.md
- Files (git 知道)
- Commit hashes (会过期)
- Status (git 推断)
- 提交记录 (鸡生蛋)

## Commit relationship
docs/tasks/<slug>/ + 业务代码 同一个 commit。
反向追溯靠 `git log -- <task.md 路径>`，不在 commit 写 footer。
```

### §4.5 `feature-architecture.mdc` 大纲

```markdown
---
description: 业务域对称 + 跨 runtime 索引
alwaysApply: true
---

# Feature Architecture

## 对称
后端 commands/ 拆到各业务域（floating/commands.rs 等）。
前端 ESLint 强制 feature 边界（见 eslint-boundary.mdc）。

## 跨 runtime 索引
每个业务域根有 README.md，列 5 个 runtime 物理位置。
docs/architecture/<feature>.md 做跨 runtime 收口。

## 修改 DoD
改任何一处 → 同步检查表里其他位置 → 跑 smoke。
```

### §4.6 `eslint-boundary.mdc` 大纲

```markdown
---
description: 前端 ESLint feature 边界规则
alwaysApply: false
globs: ["src/**/*.{ts,tsx}"]
---

# ESLint Boundary

## 规则
业务域内部文件不能直接 import 其它业务域内部。
只能:
- import 业务域自身 barrel (src/<x>/index.ts)
- import shared 层 (src/components/ / src/hooks/ / src/lib/)

## 配置位置
.eslintrc.cjs 的 overrides 段，使用 `import/no-restricted-paths` rule。
```

---

## §5 历史 commit 整理（模块 5）

### §5.1 范围

**只整理当前 working tree 的 16+ 个未提交改动**（`git status` 显示的 9 modified + 7 untracked）。

**不动 main 分支的 30 个历史 commit**——改写历史成本高，且已推送时不可逆。

### §5.2 现状散改的业务归类

参考 `.planning/2026-06-20-commit-hygiene/audit-current-state.md` §3:

| 业务组 | 涉及文件 | 建议 commit |
|---|---|---|
| F3' 位置兜底 | useWindowPosition.{ts,test.ts} + App.{tsx,test.tsx} + liveDurationMs.test.tsx + src-tauri/src/floating/mod.rs | 1 个 `fix(floating): F3' 位置兜底` |
| F4' 尺寸自适应 + L5 挂载 | FloatShell.{tsx,test.tsx} + App.{tsx,test.tsx} | 1 个 `fix(floating): F4' 尺寸自适应 + L5 挂载` |
| 浮窗 DoD 工具 | CLAUDE.md (浮窗 DoD 段) + package.json (smoke:floating) + scripts/floating-smoke.sh + docs/architecture/floating-visibility-checklist.md | 1 个 `chore(meta): 浮窗 DoD 工具 + smoke 脚本` |
| 文档基础设施 | docs/competitors/ + docs/superpowers/specs/2026-06-20-checkin-subtypes-design.md | 1-2 个 `docs(meta): 调研素材 + spec 沉淀` |

**总目标**: 16+ 散改 → 4-5 个业务 commit

### §5.3 流程

```bash
# 1) 先写 4 个 task.md（前置于代码）
# docs/tasks/fix-F-floating-position-clamp/task.md
# docs/tasks/fix-F-floating-v3-visibility/task.md
# docs/tasks/fix-F-floating-floatshell-mount/task.md
# docs/tasks/chore-meta-floating-dod-tools/task.md

# 2) 按业务域分组 git add + commit（每个 task 1 个 commit）
# 3) 验证: 浮窗 DoD 4 件套（vitest / build / smoke / cargo check）

# 示例
git add docs/tasks/fix-F-floating-position-clamp/task.md \
        src/floating/hooks/useWindowPosition.ts \
        src/floating/hooks/useWindowPosition.test.ts \
        src/floating/App.tsx \
        src/floating/App.test.tsx \
        src/floating/liveDurationMs.test.tsx \
        src-tauri/src/floating/mod.rs

git commit -m "fix(floating): F3' 位置兜底 P1 clamp 屏外 + Rust (100, 60) 兜底

- macOS 菜单栏遮 ~25px，首启 (0,0) 被遮
- P1 clamp 防多屏拖出屏外
- Rust 侧 mod.rs 兜底应对 Tauri 启动 race"
```

### §5.4 main 分支历史 commit

**处理**:
- 现状（散 commit）保留在 main 历史
- V1.0 发版后，下个 feature 开始用新规范
- 旧 commit 在 CHANGELOG 标 "v1.0-rc" 段

**为什么不动历史**:
- 改写已推送的 commit hash 会让 PR review 链断裂
- V1.0 临发版做 `git rebase -i --root` 风险极高
- 收益（"log 干净"）小于成本（"review 链断裂"）

### §5.5 风险

| 风险 | 概率 | 缓解 |
|---|---|---|
| commit 误把 16+ 文件当成 1 个巨型 commit | 高 | **不**用 `git add .`；按 task.md 显式 add |
| task.md 漏写 | 高 | 约定：**先写 task.md，再写业务代码** |
| 改 main 历史 | 0% | 明确禁止；操作只在 working tree |

---

## §6 落地顺序 + 风险（模块 6）

### §6.1 落地顺序

| 阶段 | 工作量 | 内容 | 验证 |
|---|---|---|---|
| **Day 0** | 0.5 天 | 写 `.claude/rules/` 4 个 `.mdc` | 4 个文件落地 |
| **Day 1 上午** | 0.5 天 | 段 1.1：后端 `commands/` 拆分（`git mv` 保留 blame） | `cargo check` + `lib.rs` 注册验证 |
| **Day 1 下午** | 0.5 天 | 段 1.2：前端 ESLint 边界 + 3 个 barrel `index.ts` | `npm run lint` 0 违规 |
| **Day 1 下午** | 0.5 天 | 段 1.3 + 1.4：10 个业务域 README + `docs/architecture/floating.md` 试点 | 文档可读 |
| **Day 2 上午** | 0.5 天 | 段 5.2：写 4 个 `docs/tasks/<slug>/task.md` | task.md 模板套用 |
| **Day 2 下午** | 0.5 天 | 段 5.3：把 16+ 散改按 task 分组成 4-5 个 commit | `git log --oneline -10` 干净 |
| **Day 2 下午** | 0.5 天 | 验证：浮窗 DoD 4 件套 | vitest / build / smoke / cargo check 全绿 |
| **Day 3+** | 持续 | 后续 task 全部走新规范 | 每个新 commit 走 task.md → commit → 验证 |

**总落地**: 2.5 天（不含持续维护）

### §6.2 整体风险

| 风险 | 概率 | 缓解 |
|---|---|---|
| 规范写在 `.claude/rules/` 但不被 agent 读 | 中 | `alwaysApply: true` 让它全局生效 |
| ESLint rule 误伤 | 中 | 先 dry-run 跑一遍，看误伤率 |
| 后端 commands 拆分影响 lib.rs 注册 | 低 | 改 mod.rs 加重导出，零调用方修改 |
| 16+ 散改分组时漏文件 | 高 | 改完用 `git diff --stat HEAD~5 HEAD` 看 commit 范围 |
| task.md 漏写 | 高 | **强制约定：先写 task.md 再写业务代码** |
| `Docs:` 路径在 rebase 后变 | 0% | 任务档路径不变 |

### §6.3 DoD

落地完成判定（**全部必须勾选**）:

- [ ] `.claude/rules/{commit-style,task-directory,feature-architecture,eslint-boundary}.mdc` 4 个文件落地
- [ ] `src-tauri/src/commands/mod.rs` 加重导出，`floating/commands.rs` + `settings/commands.rs` 拆出
- [ ] 10 个业务域根 `README.md` 落地（`src/{floating,settings,timeline,hooks,components,lib}/README.md` + `src-tauri/src/{floating,settings,db,tray}/README.md`）
- [ ] `docs/architecture/floating.md` 跨 runtime 索引试点
- [ ] `.eslintrc.cjs` 加 `import/no-restricted-paths`，3 个 barrel `src/{floating,settings,timeline}/index.ts`
- [ ] 4 个 `docs/tasks/<slug>/task.md` 落地
- [ ] 16+ 散改重组成 4-5 个 commit，每个 commit 是单一业务单元
- [ ] 浮窗 DoD 4 件套（vitest / build / smoke / cargo check）全绿
- [ ] `git log --oneline -10` 显示 commit 标题干净、按业务聚合

### §6.4 不在范围内

- ❌ 装 `commitlint` / `husky` / `lint-staged`（用户已质疑 commit discipline 路线）
- ❌ 改 main 分支历史 commit（成本高 / 风险大）
- ❌ 引入 monorepo 工具（NX / Turborepo）
- ❌ 切换到 `jj`（Jujutsu）VCS
- ❌ 切换到 GitHub PR / Redmine（用户已表明不用）

---

## §7 引用

### §7.1 项目内调研报告

| # | 路径 | 内容 |
|---|---|---|
| 1 | `.planning/2026-06-20-commit-hygiene/audit-current-state.md` | 当前 commit 散度审计 |
| 2 | `.planning/2026-06-20-commit-hygiene/research-best-practices.md` | commit 卫生最佳实践 |
| 3 | `docs/competitors/research-cross-runtime-symmetry.md` | 跨 runtime 索引案例 |
| 4 | `docs/competitors/research-vertical-slice.md` | vertical slice 案例 |
| 5 | `docs/competitors/research-monolith-with-index.md` | 单体 + 索引案例 |

### §7.2 真实项目参考

**跨 runtime 对称**:
- Kubernetes `pkg/kubelet/doc.go`: https://github.com/kubernetes/kubernetes/blob/master/pkg/kubelet/doc.go
- Rust std `library/std/src/io/mod.rs` (`//!`): https://github.com/rust-lang/rust/blob/master/library/std/src/io/mod.rs
- GitLab `doc/development/architecture.md`: https://gitlab.com/gitlab-org/gitlab/-/blob/master/doc/development/architecture.md

**Vertical slice**:
- Bulletproof React: https://github.com/alan2207/bulletproof-react
- NX docs: https://nx.dev/docs/structure/applications-and-libraries

**单体 + 索引**:
- Discourse `19-service-objects.md`: https://github.com/discourse/discourse/blob/main/docs/developer-guides/docs/03-code-internals/19-service-objects.md
- GitLab `doc/development/`: https://gitlab.com/gitlab-org/gitlab/-/tree/master/doc/development

**Commit 卫生**:
- Conventional Commits 1.0.0: https://www.conventionalcommits.org/en/v1.0.0/
- Tauri 官方 commits: https://github.com/tauri-apps/tauri/commits/dev

### §7.3 相关 skill

- `superpowers:brainstorming`（本次设计流程）
- `superpowers:writing-plans`（下一步落 plan）
- `clean-comments`（commit message 风格依据）

---

## §8 修订历史

| 版本 | 日期 | 修订 |
|---|---|---|
| v0 草稿 | 2026-06-20 | 子代理 1+2+3 调研产物 |
| v1 | 2026-06-20 | brainstorming 6 段 + 删 Refs 修正 + 删 Files 段 + 删 Refs footer |
| v1 定稿 | 2026-06-20 | 通过用户 review，进 writing-plans |
