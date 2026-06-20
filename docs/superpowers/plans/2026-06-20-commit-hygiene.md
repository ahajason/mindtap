# Commit 卫生 + 任务管理机制 实施 plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 mindtap 工程规约从"散 commit + 无任务机制"改造为"业务代码按业务域物理聚合 + `docs/tasks/<slug>/` 任务机制 + clean-comments 风格 commit + `.claude/rules/` 规范沉淀"，2.5 天内完成历史 working tree 整理 + 业务架构改造。

**Architecture:** 三层并行——(1) 业务架构层：后端 `commands/` 拆业务域 + 前端 ESLint 边界 + 业务域 README；(2) 任务管理层：`docs/tasks/<slug>/` 极简 4 段模板，跟业务代码同 commit；(3) 规范沉淀层：`.claude/rules/` 4 个 `.mdc` 沿用现有 `codegraph.mdc` frontmatter 格式。历史 commit 整理只动 working tree，不动 main 分支 30 commit。

**Tech Stack:** Tauri 2 (Rust 1.96) + React 19 + TypeScript 5 + Vite 7 + ESLint (`eslint` + `import/no-restricted-paths` from `eslint-plugin-import`).

## Global Constraints

- **Node**: `.nvmrc` 钉 `24`
- **Rust**: 工具链 ≥ 1.96
- **浮窗 DoD 4 件套**: 涉及浮窗改动的 commit 前必须跑 `npx vitest run` + `npm run build` + `npm run smoke:floating` + `cargo check --manifest-path src-tauri/Cargo.toml`, 4 件套全绿
- **commit 格式**: `<type>(<scope>): <subject>` + clean-comments body 段(只写 why 不重复 what). 不引 Refs: / Closes: / See also: 等 footer
- **scope 短别名映射**: `floating=F` / `settings=S` / `timeline=T` / `db=DB` / `tray=Tr` / `bridge=-` / `diagnostics=Diag` / `log=Log` / `meta=-`
- **任务档路径**: `docs/tasks/<type>-<scope>-<short-desc>/task.md`(~10 行 4 段)
- **修改 main 分支历史 commit**: ❌ 禁止(改写已推送成本高)
- **`.claude/rules/` 格式**: YAML frontmatter (`description` + `alwaysApply` / `globs`) + Markdown body,沿用 `codegraph.mdc` 现有格式
- **本 plan 的 TDD 适用范围**: 业务逻辑 task(浮窗修复)写 failing test → 最小实现 → 全绿. 规范 / 文档 / barrel / 重导出 task 不强求 TDD(无逻辑可测)

---

## Task 1: 写 `.claude/rules/commit-style.mdc`

**Files:**
- Create: `.claude/rules/commit-style.mdc`

**Interfaces:**
- Consumes: 沿用现有 `.claude/rules/codegraph.mdc` 的 frontmatter 格式(`description` + `alwaysApply: true` + Markdown body)
- Produces: 后续 commit 必须遵循此规范

- [ ] **Step 1: 创建文件**

```bash
touch /private/var/www/mindtap/.claude/rules/commit-style.mdc
```

- [ ] **Step 2: 写入 frontmatter + 规范正文**

```yaml
---
description: Git commit message and granularity conventions
alwaysApply: true
---

# Commit Style

## Format

```
<type>(<scope>): <subject>

<why 段 — clean-comments 风格, 只写"为什么"不重复"做了什么">
- 业务痛点
- 边界条件
- 不这样改会怎样
```

## Type set

| type    | 用法                          | 例子                              |
| ------- | ----------------------------- | --------------------------------- |
| feat    | 新功能 / 新行为                | `feat(floating): V3 玻璃态浮窗重构` |
| fix     | 修 bug                        | `fix(floating): 首启位置被菜单栏遮` |
| refactor| 重构(不改行为)                 | `refactor(commands): 拆到各业务域` |
| docs    | 纯文档                        | `docs(architecture): 浮窗跨 runtime 索引` |
| test    | 纯测试                        | `test(floating): useWindowPosition 边界用例` |
| chore   | 工具 / 依赖 / 配置            | `chore(deps): 升 commitlint v19`   |
| build   | 构建 / CI                     | `build(ci): 加 commit-msg hook`    |
| revert  | 撤销                          | `revert: feat(floating): V3 玻璃态浮窗重构` |

## Scope

`floating` / `settings` / `timeline` / `db` / `tray` / `bridge` / `diagnostics` / `log` / `meta`

scope 选择规则: commit 改的代码 80% 以上在哪个业务域, 就用哪个 scope; 跨多个用最核心的那个.

## Granularity

**1 个任务(`docs/tasks/<slug>/`) = 1-3 个 commit**.

| 任务规模 | commit 数 | 例                                                 |
| -------- | --------- | -------------------------------------------------- |
| 小       | 1         | `fix(floating): 单点 bug`                          |
| 中       | 2         | `feat(floating): V3 重构` = 1 产品代码 + 1 测试   |
| 大       | 3         | `feat(floating): V3 重构` = 1 后端 + 1 前端 + 1 测试 |

**反模式**:
- ❌ 1 个任务 10+ commit(拆太散)
- ❌ 1 个 commit 跨 3 个不相关任务(聚合过度)

## Body 段写法 (clean-comments 风格)

**写"为什么"**, 不写"做了什么"(diff 会显示"做了什么"):

**正面例子**:

```
fix(floating): F3' 位置兜底 P1 clamp 屏外 + Rust (100, 60) 兜底

- macOS 菜单栏遮 ~25px, 首启 (0,0) 被遮
- P1 clamp 防多屏拖出屏外
- Rust 侧 mod.rs 兜底应对 Tauri 启动 race
```

**反例**(重复"做了什么"):

```
❌ 改了 useWindowPosition.ts 加了 P1 clamp
❌ 改了 useWindowPosition.test.ts 加测试
❌ 改了 mod.rs 加 .position(100.0, 60.0)
```

## 不引 footer

❌ `Refs:` / `Closes:` / `See also:` / `BREAKING CHANGE:` — 不是任何标准 footer, git 不识别, 冗余.

反向追溯靠 `git log -- <path>`:

```bash
# 查某任务的 commit
git log --all --oneline -- docs/tasks/fix-F-floating-position-clamp/

# 查某业务的 commit
git log --all --oneline -- src/floating/ src-tauri/src/floating/ \
  src-tauri/capabilities/floating.json
```

## Subject 长度

- ≤ 72 字符
- 中文可读
- 不加句号
```

- [ ] **Step 3: 验证文件落地**

Run: `ls -la /private/var/www/mindtap/.claude/rules/commit-style.mdc`
Expected: 文件存在, 大小 > 1KB

- [ ] **Step 4: Commit**

⚠️ **本 task 不单独 commit**, 等 Task 5 一次性提交 4 个 .mdc (避免 4 个零散 commit, 这是新规范的自我示范)

---

## Task 2: 写 `.claude/rules/task-directory.mdc`

**Files:**
- Create: `.claude/rules/task-directory.mdc`

- [ ] **Step 1: 创建文件**

```bash
touch /private/var/www/mindtap/.claude/rules/task-directory.mdc
```

- [ ] **Step 2: 写入 frontmatter + 规范正文**

```yaml
---
description: docs/tasks/ task directory conventions
alwaysApply: true
---

# Task Directory

## Location

`docs/tasks/<type>-<scope>-<short-desc>/`

(与现有 `docs/specs/` / `docs/plans/` / `docs/reports/` / `docs/architecture/` 同级)

## 命名

`<type>-<scope>-<short-desc>` 三段式:

| 段        | 取值                                                | 例                        |
| --------- | --------------------------------------------------- | ------------------------- |
| type      | `feat` / `fix` / `chore` / `docs` / `refactor`      | `feat` / `fix`            |
| scope     | 业务短别名 (`F` / `S` / `T` / `DB` / `Tr`)          | `F`                       |
| short-desc| kebab-case, 2-4 词                                  | `floating-v3-redesign`    |

**注意**: slug 里的 scope 用**短别名**, 但 task.md 内部 / commit message / README 标题仍用**语义全名** (`floating` / `settings` / `db`).

## task.md 极简模板 (~10 行)

```markdown
# <type>(<scope>): <subject>

> 创建: YYYY-MM-DD

## Why

<!-- 1-3 句。痛点 + 业务场景 + 为什么不修不行 -->

## What

<!-- 1 句业务边界 -->

## Done when

- [ ] 业务行为 X 正确
- [ ] 浮窗 DoD 4 件套全绿(如果涉及浮窗)
- [ ] 不引入新规范违反项
```

**借鉴**:
- K8s `doc.go` 2 行包摘要
- Rust std `//!` 1-3 行极简密度
- Discourse `19-service-objects.md` 结构(去掉 Files 段)

## 绝不写什么 (反向规则)

| 不写                | 为什么                                                    |
| ------------------- | --------------------------------------------------------- |
| `## Files` 段       | git 知道(`git log -- <path>` 反查)                        |
| `## 提交记录` 段    | commit hash 会过期(squash / rebase 后失效); 鸡生蛋问题   |
| `## 状态` 字段      | git 事实推断(看到 commit 就算"已交付")                   |
| `## 关联` 段        | 路径自解释(`docs/tasks/<slug>/` 跟 `docs/architecture/<x>.md` 同仓同 commit) |
| Refs: / See also:   | 不是任何标准, git 不识别                                 |

## 跟 commit 的关系

**模式**: task.md 跟业务代码**同 commit**.

```bash
# 步骤 1: 先写 task.md(前置)
# 步骤 2: 写业务代码
# 步骤 3: 同 commit
git add docs/tasks/fix-F-floating-position-clamp/task.md \
        src/floating/hooks/useWindowPosition.ts \
        src/floating/hooks/useWindowPosition.test.ts \
        src-tauri/src/floating/mod.rs

git commit -m "fix(floating): F3' 位置兜底 P1 clamp 屏外 + Rust (100, 60) 兜底

- macOS 菜单栏遮 ~25px, 首启 (0,0) 被遮
- P1 clamp 防多屏拖出屏外
- Rust 侧 mod.rs 兜底应对 Tauri 启动 race"
```

**反向追溯**(不要 commit 写 footer, 靠 `git log`):

```bash
# 查某任务的所有 commit
git log --all --oneline -- docs/tasks/fix-F-floating-position-clamp/

# 查某业务的所有 commit
git log --all --oneline -- src/floating/ src-tauri/src/floating/ \
  src-tauri/capabilities/floating.json
```

## 跟 `.planning/` 的关系

- **保留 `.planning/`**: 作为"过程产物"(findings / progress / synthesis), git 跟踪
- **`docs/tasks/<slug>/`**: 任务正式档, git 跟踪
- V1.0 发版后, 现有 `.planning/2026-06-20-floating-redesign/` 归档到 `docs/archive/v1.0/.planning/`, 正式档迁到 `docs/tasks/feat-F-floating-v3-redesign/`
```

- [ ] **Step 3: 验证**

Run: `ls -la /private/var/www/mindtap/.claude/rules/task-directory.mdc`
Expected: 文件存在, 大小 > 1KB

- [ ] **Step 4: 不单独 commit** (等 Task 5)

---

## Task 3: 写 `.claude/rules/feature-architecture.mdc`

**Files:**
- Create: `.claude/rules/feature-architecture.mdc`

- [ ] **Step 1: 创建文件**

```bash
touch /private/var/www/mindtap/.claude/rules/feature-architecture.mdc
```

- [ ] **Step 2: 写入 frontmatter + 规范正文**

```yaml
---
description: 业务域对称 + 跨 runtime 索引
alwaysApply: true
---

# Feature Architecture

## 业务对称

后端 `commands/` 拆到各业务域 (`floating/commands.rs` / `settings/commands.rs` 等).
前端 ESLint 强制 feature 边界(见 `eslint-boundary.mdc`).

```
src-tauri/src/
  commands/
    mod.rs               # 改成重导出总线: pub use crate::floating::commands::*; ...
  floating/
    mod.rs
    commands.rs          # ★ 从 commands/ 拆过来
  settings/
    mod.rs
    commands.rs          # ★ 同样拆
```

## 业务域根 README 跨 runtime 索引

每个业务域根有 `README.md`, 列 5+ runtime 物理位置:

| 路径                                                       | 角色       |
| ---------------------------------------------------------- | ---------- |
| `tauri.conf.json` → `app.windows[<feature>]`               | 窗口声明   |
| `vite.config.ts` → `rollupOptions.input.<feature>`         | 前端入口   |
| `src/<feature>/`                                           | 前端根     |
| `src/<feature>/hooks/`                                     | 前端 hook  |
| `src-tauri/src/<feature>/mod.rs`                           | 后端 entry |
| `src-tauri/src/<feature>/commands.rs`                      | 后端 IPC   |
| `src-tauri/capabilities/<feature>.json`                    | capability |

## docs/architecture/<feature>.md 收口

每个业务有 `docs/architecture/<feature>.md` 做跨 runtime 总览(单文件收口).

## 修改 DoD

改任何一处 → 同步检查表里其他位置 → 跑 `npm run smoke:<feature>` 5/5 PASS 才允许 commit.

## 10 个业务域 README 清单

- `src/floating/README.md`
- `src/settings/README.md`
- `src/timeline/README.md`
- `src/hooks/README.md` (共享域)
- `src/components/README.md` (共享域)
- `src/lib/README.md` (共享域)
- `src-tauri/src/floating/README.md`
- `src-tauri/src/settings/README.md`
- `src-tauri/src/db/README.md`
- `src-tauri/src/tray/README.md`
```

- [ ] **Step 3: 验证**

Run: `ls -la /private/var/www/mindtap/.claude/rules/feature-architecture.mdc`
Expected: 文件存在, 大小 > 1KB

- [ ] **Step 4: 不单独 commit** (等 Task 5)

---

## Task 4: 写 `.claude/rules/eslint-boundary.mdc`

**Files:**
- Create: `.claude/rules/eslint-boundary.mdc`

- [ ] **Step 1: 创建文件**

```bash
touch /private/var/www/mindtap/.claude/rules/eslint-boundary.mdc
```

- [ ] **Step 2: 写入 frontmatter + 规范正文**

```yaml
---
description: 前端 ESLint feature 边界规则
alwaysApply: false
globs: ["src/**/*.{ts,tsx}"]
---

# ESLint Boundary

## 规则

业务域内部文件不能直接 import 其它业务域内部.
只能:
- import 业务域自身 barrel (`src/<x>/index.ts`)
- import shared 层 (`src/components/` / `src/hooks/` / `src/lib/`)

## 配置位置

`.eslintrc.cjs` 的 `overrides` 段, 使用 `import/no-restricted-paths` rule.

## 三个业务域 barrel 必须存在

- `src/floating/index.ts`
- `src/settings/index.ts`
- `src/timeline/index.ts`

## 业务域内禁止跨引

- `src/floating/components/*` ❌ import `src/settings/components/*` 内部
- `src/floating/hooks/*` ❌ import `src/settings/hooks/*` 内部
- ...(其它组合类推)

## 允许的引用

- ✅ `src/floating/components/Foo.tsx` import `src/floating/hooks/useFoo.ts` (同业务)
- ✅ `src/floating/App.tsx` import `src/floating/index.ts` (自身 barrel)
- ✅ `src/floating/components/Bar.tsx` import `src/components/ui/Button.tsx` (shared)
- ✅ `src/floating/components/Baz.tsx` import `src/hooks/useDebounce.ts` (shared)
- ✅ `src/floating/components/Qux.tsx` import `src/lib/tauri-bridge.ts` (shared)
```

- [ ] **Step 3: 验证**

Run: `ls -la /private/var/www/mindtap/.claude/rules/eslint-boundary.mdc`
Expected: 文件存在, 大小 > 1KB

- [ ] **Step 4: 不单独 commit** (等 Task 5)

---

## Task 5: Commit 4 个 `.claude/rules/` 规范文件

**Files:**
- Stage: `.claude/rules/commit-style.mdc`
- Stage: `.claude/rules/task-directory.mdc`
- Stage: `.claude/rules/feature-architecture.mdc`
- Stage: `.claude/rules/eslint-boundary.mdc`

- [ ] **Step 1: git status 确认 4 个新文件**

Run: `cd /private/var/www/mindtap && git status --short .claude/rules/`
Expected:
```
?? .claude/rules/commit-style.mdc
?? .claude/rules/task-directory.mdc
?? .claude/rules/feature-architecture.mdc
?? .claude/rules/eslint-boundary.mdc
```

- [ ] **Step 2: git add + commit (用新规范自我示范)**

```bash
cd /private/var/www/mindtap
git add .claude/rules/commit-style.mdc \
        .claude/rules/task-directory.mdc \
        .claude/rules/feature-architecture.mdc \
        .claude/rules/eslint-boundary.mdc

git commit -m "docs(meta): commit 卫生 + 任务管理 + 业务架构 4 个 .mdc 规范

- 根因: commit 散度高 + 无任务机制 + 业务代码跨 runtime 无索引
- 解法: 4 层规范沉淀到 .claude/rules/,沿用 codegraph.mdc 现有格式
- commit-style: type/scope/粒度/clean-comments body/不引 footer
- task-directory: docs/tasks/<slug>/ 极简 4 段模板,不写 Files/hash/状态
- feature-architecture: 后端 commands 拆业务域 + 业务域 README 跨 runtime 索引
- eslint-boundary: 前端 import/no-restricted-paths 强制 feature 边界"
```

- [ ] **Step 3: 验证 commit**

Run: `cd /private/var/www/mindtap && git log --oneline -3`
Expected: 顶部 commit 是 4 个 .mdc 的 commit, 标题以 `docs(meta):` 开头

---

## Task 6: 写 `src/floating/index.ts` barrel export

**Files:**
- Create: `src/floating/index.ts`

**前置**:
- 读 `src/floating/App.tsx` 看默认导出
- 读 `src/floating/FloatShell.tsx` 看默认导出
- 读 `src/floating/hooks/useWindowPosition.ts` 看命名导出

- [ ] **Step 1: 读 `src/floating/` 关键文件确认导出**

Run:
```bash
cd /private/var/www/mindtap
grep -E "^export" src/floating/App.tsx | head -5
grep -E "^export" src/floating/FloatShell.tsx | head -5
grep -E "^export" src/floating/hooks/useWindowPosition.ts | head -5
```

Expected: 看到 `export default App` / `export default FloatShell` / `export function useWindowPosition` 等导出

- [ ] **Step 2: 创建 barrel 文件**

```bash
touch /private/var/www/mindtap/src/floating/index.ts
```

- [ ] **Step 3: 写入 barrel 内容 (按 Step 1 实际看到的导出调整)**

```ts
// src/floating/index.ts — barrel export
// 业务域内部文件禁止 import 其它业务域内部; 外部必须走本 barrel.

export { default as App } from './App';
export { default as FloatShell } from './FloatShell';
export { useWindowPosition } from './hooks/useWindowPosition';
```

⚠️ **重要**: 如果 Step 1 看到的导出名跟上述不一致, 按实际改. 例如:
- `export default function App()` → `export { default as App } from './App';`
- `export const useWindowPosition` → `export { useWindowPosition } from './hooks/useWindowPosition';`

- [ ] **Step 4: TypeScript 编译验证**

Run: `cd /private/var/www/mindtap && npx tsc --noEmit src/floating/index.ts 2>&1 | head -20`
Expected: 无错误 (或只有 `Cannot find module` 类警告, 不影响业务)

如果失败: 检查 barrel 里导入的路径是否存在, 文件名大小写是否对

- [ ] **Step 5: 不单独 commit** (等 Task 9 一起)

---

## Task 7: 写 `src/settings/index.ts` + `src/timeline/index.ts` barrel

**Files:**
- Create: `src/settings/index.ts`
- Create: `src/timeline/index.ts`

- [ ] **Step 1: 读 `src/settings/` 关键文件**

Run:
```bash
cd /private/var/www/mindtap
grep -E "^export" src/settings/SettingsPage.tsx | head -5
ls src/settings/components/ src/settings/sections/ 2>/dev/null
```

- [ ] **Step 2: 写 `src/settings/index.ts`**

```ts
// src/settings/index.ts — barrel export

export { default as SettingsPage } from './SettingsPage';
```

⚠️ 按 Step 1 实际看到的导出调整.

- [ ] **Step 3: 读 `src/timeline/` 关键文件**

Run:
```bash
cd /private/var/www/mindtap
grep -rE "^export" src/timeline/ --include="*.ts" --include="*.tsx" | head -10
```

- [ ] **Step 4: 写 `src/timeline/index.ts`**

```ts
// src/timeline/index.ts — barrel export

// 按 Step 3 实际看到的导出调整 (timeline 业务较薄, 可能只有 1-2 个导出)
```

- [ ] **Step 5: TypeScript 编译验证**

Run: `cd /private/var/www/mindtap && npx tsc --noEmit 2>&1 | head -30`
Expected: 0 错误 (或只有 pre-existing 错误, 不引入新错误)

- [ ] **Step 6: 不单独 commit** (等 Task 9)

---

## Task 8: 加 `.eslintrc.cjs` 的 `import/no-restricted-paths` rule

**Files:**
- Modify: `.eslintrc.cjs` (添加 `overrides` 段)

**前置**:
- 读现有 `.eslintrc.cjs` 看格式 (`.eslintrc.cjs` / `.eslintrc.json` / `eslint.config.js`)

- [ ] **Step 1: 读现有 ESLint 配置**

Run:
```bash
cd /private/var/www/mindtap
ls -la .eslintrc* eslint.config.* 2>/dev/null
cat .eslintrc.cjs 2>/dev/null || cat .eslintrc.json 2>/dev/null || cat eslint.config.js 2>/dev/null
```

Expected: 看到现有 ESLint 配置文件, 确认格式 (CommonJS / JSON / flat config)

- [ ] **Step 2: 检查 `eslint-plugin-import` 是否安装**

Run: `cd /private/var/www/mindtap && cat package.json | grep -A1 -B1 "eslint-plugin-import"`
Expected: 看到 `eslint-plugin-import` (或 `eslint-import-resolver-typescript`) 在 devDependencies

如果没装: 跑 `npm install -D eslint-plugin-import` 后再继续

- [ ] **Step 3: 在 `.eslintrc.cjs` 末尾添加 overrides 段**

(以 `.eslintrc.cjs` 格式为例, JSON / flat config 类推)

```js
// 现有 module.exports = { ... } 末尾 } 之前, 添加:
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

⚠️ 实际格式按 Step 1 看到的现有配置调整:
- 如果是 `.eslintrc.cjs`: 上面代码直接用
- 如果是 `.eslintrc.json`: 转 JSON 格式
- 如果是 `eslint.config.js` flat config: 用 `[{ files: [...], rules: { 'import/no-restricted-paths': [...] } }]`

- [ ] **Step 4: dry-run 验证**

Run: `cd /private/var/www/mindtap && npm run lint 2>&1 | tail -30`
Expected:
- 0 错误, 或
- 只显示 pre-existing 错误(无关本 task)
- **不**显示新引入的 `import/no-restricted-paths` 错误

如果有新错误: 检查 `src/{floating,settings,timeline}/` 内部是否真的有跨域引用, 改成走 barrel

- [ ] **Step 5: 不单独 commit** (等 Task 9)

---

## Task 9: Commit 3 个 barrel + ESLint rule

**Files:**
- Stage: `src/floating/index.ts`
- Stage: `src/settings/index.ts`
- Stage: `src/timeline/index.ts`
- Stage: `.eslintrc.cjs` (modified)

- [ ] **Step 1: git status 确认**

Run: `cd /private/var/www/mindtap && git status --short src/floating/index.ts src/settings/index.ts src/timeline/index.ts .eslintrc.cjs`
Expected:
```
?? src/floating/index.ts
?? src/settings/index.ts
?? src/timeline/index.ts
 M .eslintrc.cjs
```

- [ ] **Step 2: git add + commit**

```bash
cd /private/var/www/mindtap
git add src/floating/index.ts \
        src/settings/index.ts \
        src/timeline/index.ts \
        .eslintrc.cjs

git commit -m "feat(meta): 前端 feature 边界 — 3 个 barrel + ESLint rule

- 业务代码按业务域物理聚合,跨域引用强制走 barrel
- src/{floating,settings,timeline}/index.ts 三个 barrel
- import/no-restricted-paths 阻止业务域内部 import 其它业务域内部
- 不通过 ESLint: 业务域内部到 shared (components/hooks/lib) 不受限"
```

- [ ] **Step 3: 验证**

Run: `cd /private/var/www/mindtap && git log --oneline -3`
Expected: 顶部 commit 是 3 barrel + ESLint rule

---

## Task 10: git mv `src-tauri/src/commands/floating.rs` → `src-tauri/src/floating/commands.rs`

**Files:**
- Move: `src-tauri/src/commands/floating.rs` → `src-tauri/src/floating/commands.rs`

- [ ] **Step 1: 验证源文件存在**

Run: `cd /private/var/www/mindtap && ls -la src-tauri/src/commands/floating.rs`
Expected: 文件存在

- [ ] **Step 2: git mv (保留 blame)**

```bash
cd /private/var/www/mindtap
git mv src-tauri/src/commands/floating.rs src-tauri/src/floating/commands.rs
```

- [ ] **Step 3: 验证 move 成功**

Run: `cd /private/var/www/mindtap && ls src-tauri/src/floating/commands.rs && ls src-tauri/src/commands/floating.rs 2>&1`
Expected:
- `src-tauri/src/floating/commands.rs` 存在
- `src-tauri/src/commands/floating.rs` 不存在 (或 `No such file`)

- [ ] **Step 4: 不单独 commit** (等 Task 13 一起)

---

## Task 11: git mv `src-tauri/src/commands/settings.rs` → `src-tauri/src/settings/commands.rs`

**Files:**
- Move: `src-tauri/src/commands/settings.rs` → `src-tauri/src/settings/commands.rs`

- [ ] **Step 1-3: 同 Task 10, 路径替换**

```bash
cd /private/var/www/mindtap
git mv src-tauri/src/commands/settings.rs src-tauri/src/settings/commands.rs
```

- [ ] **Step 4: 不单独 commit** (等 Task 13)

---

## Task 12: 改 `src-tauri/src/commands/mod.rs` 加 pub use 重导出

**Files:**
- Modify: `src-tauri/src/commands/mod.rs`

- [ ] **Step 1: 读现有 mod.rs**

Run: `cd /private/var/www/mindtap && cat src-tauri/src/commands/mod.rs`
Expected: 看到现有的 `pub mod floating;` / `pub mod settings;` 等(如果有)或空文件

- [ ] **Step 2: 替换为重导出总线**

**情况 A: 现有 mod.rs 用 `pub mod`**

```rust
// 之前:
pub mod floating;
pub mod settings;
// ...

// 改成:
pub use crate::floating::commands::*;
pub use crate::settings::commands::*;
```

**情况 B: 现有 mod.rs 是空的 / 没有 mod 声明**

```rust
// 直接写:
pub use crate::floating::commands::*;
pub use crate::settings::commands::*;
```

**情况 C: lib.rs 直接引用 `commands::floating::*`, 不走 mod.rs**

- 跳过 mod.rs 修改, 改为改 `lib.rs` 里的引用, 把 `commands::floating::*` 改成 `floating::commands::*`
- 风险: 调用方多, 需逐一改

⚠️ 实际写法按 Step 1 看到的情况调整

- [ ] **Step 3: cargo check 验证**

Run: `cd /private/var/www/mindtap && cargo check --manifest-path src-tauri/Cargo.toml 2>&1 | tail -20`
Expected:
- `Finished` (无错误)
- 或只有 pre-existing 警告, 不引入新错误

如果有错误: 检查 lib.rs 引用路径是否对应, 或 mod.rs 的 pub use 路径是否对

- [ ] **Step 4: cargo test 验证 (如果后端有 test)**

Run: `cd /private/var/www/mindtap && cargo test --manifest-path src-tauri/Cargo.toml --lib 2>&1 | tail -10`
Expected: 全部 test PASS

- [ ] **Step 5: 不单独 commit** (等 Task 13)

---

## Task 13: Commit 后端 commands 拆分

**Files:**
- Stage: `src-tauri/src/commands/floating.rs` (deleted via git mv)
- Stage: `src-tauri/src/floating/commands.rs` (created via git mv)
- Stage: `src-tauri/src/commands/settings.rs` (deleted via git mv)
- Stage: `src-tauri/src/settings/commands.rs` (created via git mv)
- Stage: `src-tauri/src/commands/mod.rs` (modified)

- [ ] **Step 1: git status 确认**

Run: `cd /private/var/www/mindtap && git status --short src-tauri/src/`
Expected: 看到 4 个状态变化 (move 进 + move 出) + mod.rs 修改

- [ ] **Step 2: git add + commit**

```bash
cd /private/var/www/mindtap
git add -A src-tauri/src/

git commit -m "refactor(commands): 拆到各业务域 — floating/commands.rs + settings/commands.rs

- 业务对称: 前端 src/floating/ 一业务一目录,后端 commands/ 不该破坏
- 改 floating 业务的 IPC 直接看 src-tauri/src/floating/commands.rs,不用翻 8 文件
- commands/mod.rs 改重导出总线,lib.rs 调用方零修改
- git mv 保留 blame"
```

- [ ] **Step 3: cargo check 验证 (commit 后)**

Run: `cd /private/var/www/mindtap && cargo check --manifest-path src-tauri/Cargo.toml 2>&1 | tail -5`
Expected: `Finished` (无错误)

- [ ] **Step 4: 验证**

Run: `cd /private/var/www/mindtap && git log --oneline -3`
Expected: 顶部 commit 是后端拆分, 标题以 `refactor(commands):` 开头

---

## Task 14: 写 10 个业务域 README

**Files:**
- Create: `src/floating/README.md`
- Create: `src/settings/README.md`
- Create: `src/timeline/README.md`
- Create: `src/hooks/README.md`
- Create: `src/components/README.md`
- Create: `src/lib/README.md`
- Create: `src-tauri/src/floating/README.md`
- Create: `src-tauri/src/settings/README.md`
- Create: `src-tauri/src/db/README.md`
- Create: `src-tauri/src/tray/README.md`

- [ ] **Step 1: 业务域根 README 模板 (用于 floating / settings / timeline / src-tauri/src/floating / src-tauri/src/settings / src-tauri/src/db / src-tauri/src/tray)**

```markdown
# <feature> 业务域

## 跨 runtime 物理位置

| 层 | 路径 | 角色 |
| --- | ----- | ---- |
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
- 涉及浮窗 → 浮窗 DoD 4 件套全绿 (vitest / build / smoke / cargo check)
```

- [ ] **Step 2: 共享域根 README 模板 (用于 src/hooks / src/components / src/lib)**

```markdown
# <domain> 共享域

## 范围

跨业务共享的 <X>。业务域内部使用应通过业务域 barrel import.

## 新增 DoD

新加共享代码前先确认:
- 真的跨业务(不是 floating 内部要用)?
- 命名足够通用(不要 `useFloatingFoo`, 要 `useFoo`)?
- 加了测试?
```

- [ ] **Step 3: 用 Task 14 Step 1 模板, 创建 7 个业务域 README**

```bash
cd /private/var/www/mindtap
# 业务域 (6 个)
touch src/floating/README.md src/settings/README.md src/timeline/README.md
touch src-tauri/src/floating/README.md src-tauri/src/settings/README.md
touch src-tauri/src/db/README.md src-tauri/src/tray/README.md

# 各文件内容按 Step 1 模板, <feature> 替换为对应业务名
```

- [ ] **Step 4: 用 Task 14 Step 2 模板, 创建 3 个共享域 README**

```bash
cd /private/var/www/mindtap
touch src/hooks/README.md src/components/README.md src/lib/README.md

# 各文件内容按 Step 2 模板, <domain> 替换为对应域, <X> 替换为对应类型
```

- [ ] **Step 5: 验证 10 个文件落地**

Run: `cd /private/var/www/mindtap && find src src-tauri/src -name "README.md" -not -path "*/node_modules/*" | sort`
Expected: 10 个 README (业务域 7 + 共享域 3)

- [ ] **Step 6: 不单独 commit** (等 Task 16 一起)

---

## Task 15: 写 `docs/architecture/floating.md` 跨 runtime 收口

**Files:**
- Create: `docs/architecture/floating.md`

- [ ] **Step 1: 创建文件**

```bash
touch /private/var/www/mindtap/docs/architecture/floating.md
```

- [ ] **Step 2: 写入内容**

```markdown
# Floating 业务域架构

## 跨 runtime 物理位置

| 层 | 路径 | 角色 |
| --- | ----- | ---- |
| 窗口声明 | tauri.conf.json → app.windows[floating] | size / label / url |
| 前端入口 | vite.config.ts → rollupOptions.input.floating | build pipeline |
| 前端壳 | src/floating/App.tsx + FloatShell.tsx | React root |
| 前端 hook | src/floating/hooks/useWindowPosition.ts | drag/resize 状态机 |
| 前端样式 | src/floating/styles/ | 玻璃态 CSS |
| 后端 entry | src-tauri/src/floating/mod.rs | ensure_window 幂等创建 |
| 后端 commands | src-tauri/src/floating/commands.rs | IPC |
| capability | src-tauri/capabilities/floating.json | Tauri 权限 |

## 关键不变量

- 尺寸常量 (`src/floating/App.tsx` 顶部) 必须与 `tauri.conf.json` min/maxWidth/Height 同步
- 任何 floating 改动 → 跑 `npm run smoke:floating` 5/5 PASS
- F3' 位置兜底: macOS 菜单栏遮 ~25px, 首启 (0,0) 被遮 → useWindowPosition + Rust 兜底 (100, 60)
- F4' 尺寸自适应: 改用 V1.5 webview API `win.setSize(LogicalSize)`
- L5 挂载契约: FloatShell 必须挂 `.floating-root` 类, 否则折叠态不可见

## 业务子任务

- F3' 位置兜底 → docs/tasks/fix-F-floating-position-clamp/
- F4' 尺寸自适应 + L5 挂载 → docs/tasks/fix-F-floating-v3-visibility/
- 浮窗 DoD 工具 → docs/tasks/chore-meta-floating-dod-tools/

## 关联

- spec: docs/superpowers/specs/2026-06-20-floating-redesign-design.md
- plan: docs/superpowers/plans/2026-06-20-floating-redesign.md
- task index: docs/tasks/feat-F-floating-v3-redesign/
```

- [ ] **Step 3: 验证文件落地**

Run: `ls -la /private/var/www/mindtap/docs/architecture/floating.md`
Expected: 文件存在, 大小 > 1KB

- [ ] **Step 4: 不单独 commit** (等 Task 16)

---

## Task 16: Commit 10 个 README + `docs/architecture/floating.md`

**Files:**
- Stage: 10 个 `**/README.md` (新建)
- Stage: `docs/architecture/floating.md` (新建)

- [ ] **Step 1: git status 确认 11 个新文件**

Run: `cd /private/var/www/mindtap && git status --short "**/README.md" docs/architecture/floating.md`
Expected: 11 个 `??` 状态

- [ ] **Step 2: git add + commit**

```bash
cd /private/var/www/mindtap
git add src/floating/README.md \
        src/settings/README.md \
        src/timeline/README.md \
        src/hooks/README.md \
        src/components/README.md \
        src/lib/README.md \
        src-tauri/src/floating/README.md \
        src-tauri/src/settings/README.md \
        src-tauri/src/db/README.md \
        src-tauri/src/tray/README.md \
        docs/architecture/floating.md

git commit -m "docs(meta): 10 个业务域 README + floating 跨 runtime 收口

- 业务代码跨 runtime 物理位置, 没有索引, 改 floating 业务要翻 5+ 文件
- 7 个业务域 README 列 5-7 个 runtime 位置, 3 个共享域 README 列范围
- docs/architecture/floating.md 收口跨 runtime 总览 + 关键不变量
- 修改 DoD: 改任何一处 → 同步检查表里其他位置 + 跑 smoke"
```

- [ ] **Step 3: 验证**

Run: `cd /private/var/www/mindtap && git log --oneline -3`
Expected: 顶部 commit 是 README + architecture 落地

---

## Task 17: 写 4 个 `docs/tasks/<slug>/task.md` (前置)

**Files:**
- Create: `docs/tasks/fix-F-floating-position-clamp/task.md`
- Create: `docs/tasks/fix-F-floating-v3-visibility/task.md` (合并 F4' + L5)
- Create: `docs/tasks/chore-meta-floating-dod-tools/task.md`
- Create: `docs/tasks/docs-meta-research-and-specs/task.md` (调研素材 + spec 沉淀)

**注意**: 4 个 task.md 是 Task 18-21 业务 commit 的**前置**(task.md 跟业务代码同 commit). 合并方案下不拆 `fix-F-floating-floatshell-mount`.

- [ ] **Step 1: 创建 4 个 task 目录 + task.md**

```bash
cd /private/var/www/mindtap
mkdir -p docs/tasks/fix-F-floating-position-clamp
mkdir -p docs/tasks/fix-F-floating-v3-visibility
mkdir -p docs/tasks/chore-meta-floating-dod-tools
mkdir -p docs/tasks/docs-meta-research-and-specs

touch docs/tasks/fix-F-floating-position-clamp/task.md
touch docs/tasks/fix-F-floating-v3-visibility/task.md
touch docs/tasks/chore-meta-floating-dod-tools/task.md
touch docs/tasks/docs-meta-research-and-specs/task.md
```

- [ ] **Step 2: 写 `fix-F-floating-position-clamp/task.md`**

```markdown
# fix(floating): F3' 位置兜底 P1 clamp 屏外

> 创建: 2026-06-20

## Why

- macOS 菜单栏遮 ~25px, 首启 (0,0) 被遮
- 多屏拖动可拖出屏外无法点击
- Tauri 启动 race: useEffect 跑前窗口已创建

## What

useWindowPosition 加 P1 clamp + Rust 侧 mod.rs 兜底 (100, 60).

## Done when

- [ ] 首启浮窗位置落在 (100, 60) 区域可见
- [ ] 多屏拖动到屏外能 clamp 回来
- [ ] 浮窗 DoD 4 件套全绿
```

- [ ] **Step 3: 写 `fix-F-floating-v3-visibility/task.md`**

```markdown
# fix(floating): F4' 尺寸自适应 + L5 挂载契约

> 创建: 2026-06-20

## Why

- 之前用 floating_set_height 触发 capability 缺失, revert 过
- FloatShell V1.5 漏挂 .floating-root 类, 折叠态不可见
- 需要 V1.5 webview API 路径 (setSize(LogicalSize))

## What

改用 win.setSize(LogicalSize) + FloatShell 挂 .floating-root 类.

## Done when

- [ ] 展开时 webview 物理尺寸自适应
- [ ] 折叠态可见 (.floating-root 类挂上)
- [ ] 浮窗 DoD 4 件套全绿
```

- [ ] **Step 4: 写 `chore-meta-floating-dod-tools/task.md`**

```markdown
# chore(meta): 浮窗 DoD 4 件套工具沉淀

> 创建: 2026-06-20

## Why

- 浮窗 DoD 4 件套当前散在 CLAUDE.md 文字描述, 没有脚本化
- smoke:floating 在 V1.5 浮窗重构后新增, 需要 packaging
- 7 层 smoke 检查清单是临时 checklist, 应成档

## What

写 scripts/floating-smoke.sh + docs/architecture/floating-visibility-checklist.md + CLAUDE.md / package.json 同步.

## Done when

- [ ] npm run smoke:floating 可跑
- [ ] CLAUDE.md 浮窗 DoD 段引用 scripts/
- [ ] docs/architecture/floating-visibility-checklist.md 7 层检查清单成档
```

- [ ] **Step 5: 写 `docs-meta-research-and-specs/task.md`**

```markdown
# docs(meta): commit 卫生调研 + checkin-subtypes spec 沉淀

> 创建: 2026-06-20

## Why

- 本次 commit 卫生调研的子代理产物 (audit / best-practices / competitor 调研) 散在 .planning/ + docs/competitors/, 没正式归档
- docs/superpowers/specs/2026-06-20-checkin-subtypes-design.md 是子任务产物, 需正式入库
- 业务知识沉淀, 方便后续查询

## What

.gitignore 临时过程产物, 正式调研报告留 git, spec 留 git.

## Done when

- [ ] docs/competitors/ 下调研报告有 task 引用
- [ ] docs/superpowers/specs/2026-06-20-checkin-subtypes-design.md 入库
- [ ] .planning/2026-06-20-commit-hygiene/ 留作 V1.0 后归档
```

- [ ] **Step 6: 验证 4 个 task.md 落地**

Run: `cd /private/var/www/mindtap && find docs/tasks -name "task.md" | sort`
Expected: 4 个 task.md (position-clamp / v3-visibility / floating-dod-tools / research-and-specs)

- [ ] **Step 7: 不单独 commit** (Task 18-21 业务 commit 时一起进)

---

## Task 18: Commit `fix-F-floating-position-clamp` 业务 (F3')

**Files:**
- Stage: `docs/tasks/fix-F-floating-position-clamp/task.md`
- Stage: `src/floating/hooks/useWindowPosition.ts` (modified)
- Stage: `src/floating/hooks/useWindowPosition.test.ts` (new)
- Stage: `src/floating/App.tsx` (modified)
- Stage: `src/floating/App.test.tsx` (modified)
- Stage: `src/floating/liveDurationMs.test.tsx` (modified)
- Stage: `src-tauri/src/floating/mod.rs` (modified)

**TDD 步骤**:

- [ ] **Step 1: 确认 failing test 存在**

Run: `cd /private/var/www/mindtap && npx vitest run src/floating/hooks/useWindowPosition.test.ts 2>&1 | tail -10`
Expected: 看到 useWindowPosition 的测试, 验证 P1 clamp 行为

⚠️ 实际测试在 `src/floating/hooks/useWindowPosition.test.ts`, 已经是 working tree 里的新文件 (来自 `git status ?? src/floating/hooks/useWindowPosition.test.ts`). 假设它已经按 TDD 写过 failing test 并通过了.

- [ ] **Step 2: 跑前端 vitest 验证**

Run: `cd /private/var/www/mindtap && npx vitest run 2>&1 | tail -10`
Expected: 全部 test PASS (或 pre-existing 失败, 不引入新失败)

- [ ] **Step 3: 跑前端 build**

Run: `cd /private/var/www/mindtap && npm run build 2>&1 | tail -10`
Expected: `built in` (无错误)

- [ ] **Step 4: 跑 cargo check**

Run: `cd /private/var/www/mindtap && cargo check --manifest-path src-tauri/Cargo.toml 2>&1 | tail -5`
Expected: `Finished` (无错误)

- [ ] **Step 5: 跑浮窗 smoke**

Run: `cd /private/var/www/mindtap && npm run smoke:floating 2>&1 | tail -20`
Expected: 5/5 PASS

⚠️ 如果 smoke 脚本还没在 Task 17 的 commit 里写, 跑 `bash scripts/floating-smoke.sh` 手动验证

- [ ] **Step 6: git add + commit (task.md + 业务代码同 commit)**

```bash
cd /private/var/www/mindtap
git add docs/tasks/fix-F-floating-position-clamp/task.md \
        src/floating/hooks/useWindowPosition.ts \
        src/floating/hooks/useWindowPosition.test.ts \
        src/floating/App.tsx \
        src/floating/App.test.tsx \
        src/floating/liveDurationMs.test.tsx \
        src-tauri/src/floating/mod.rs

git commit -m "fix(floating): F3' 位置兜底 P1 clamp 屏外 + Rust (100, 60) 兜底

- macOS 菜单栏遮 ~25px, 首启 (0,0) 被遮
- P1 clamp 防多屏拖出屏外
- Rust 侧 mod.rs 兜底应对 Tauri 启动 race"
```

- [ ] **Step 7: 验证 commit**

Run: `cd /private/var/www/mindtap && git log --oneline -1`
Expected: 顶部 commit 是 F3' 业务, body 段写 why 不重复 what

---

## Task 19: Commit `fix-F-floating-v3-visibility` 业务 (F4' + L5 合并)

**Files:**
- Stage: `docs/tasks/fix-F-floating-v3-visibility/task.md`
- Stage: `src/floating/FloatShell.tsx` (modified)
- Stage: `src/floating/FloatShell.test.tsx` (modified)
- Stage: `src/floating/App.tsx` (modified, F4' 那部分)
- Stage: `src/floating/App.test.tsx` (modified, F4' 那部分)

- [ ] **Step 1-4: 同 Task 18 (vitest / build / cargo check / smoke)**

- [ ] **Step 5: git add + commit**

```bash
cd /private/var/www/mindtap
git add docs/tasks/fix-F-floating-v3-visibility/task.md \
        src/floating/FloatShell.tsx \
        src/floating/FloatShell.test.tsx \
        src/floating/App.tsx \
        src/floating/App.test.tsx

git commit -m "fix(floating): F4' 尺寸自适应走 V1.5 webview API + L5 挂载契约

- 改用 win.setSize(LogicalSize) 而非 floating_set_height
- 之前 floating_set_height 触发 capability 缺失 revert 过
- FloatShell 挂 .floating-root 类修复 V1.5 漏挂, 折叠态可见"
```

- [ ] **Step 6: 验证 commit**

Run: `cd /private/var/www/mindtap && git log --oneline -1`
Expected: 顶部 commit 是 F4' + L5 业务

---

## Task 20: Commit `chore-meta-floating-dod-tools` (浮窗 DoD 工具)

**Files:**
- Stage: `docs/tasks/chore-meta-floating-dod-tools/task.md`
- Stage: `CLAUDE.md` (modified, 浮窗 DoD 段)
- Stage: `package.json` (modified, `smoke:floating` script)
- Stage: `scripts/floating-smoke.sh` (new)
- Stage: `docs/architecture/floating-visibility-checklist.md` (new)

- [ ] **Step 1: 确认 scripts/floating-smoke.sh 内容**

Run: `cd /private/var/www/mindtap && cat scripts/floating-smoke.sh | head -20`
Expected: 看到 7 层 smoke 检查的 shell 脚本

- [ ] **Step 2: 跑 smoke 验证脚本可执行**

Run: `cd /private/var/www/mindtap && bash scripts/floating-smoke.sh 2>&1 | tail -20`
Expected: 5/5 PASS (或 7/7 PASS, 看脚本设计)

- [ ] **Step 3: 跑 npm run smoke:floating (通过 package.json 间接)**

Run: `cd /private/var/www/mindtap && npm run smoke:floating 2>&1 | tail -10`
Expected: 跟 Step 2 类似, PASS

- [ ] **Step 4: git add + commit**

```bash
cd /private/var/www/mindtap
git add docs/tasks/chore-meta-floating-dod-tools/task.md \
        CLAUDE.md \
        package.json \
        scripts/floating-smoke.sh \
        docs/architecture/floating-visibility-checklist.md

git commit -m "chore(meta): 浮窗 DoD 4 件套脚本化 + visibility 7 层 checklist

- scripts/floating-smoke.sh 7 层 smoke 检查
- package.json 'smoke:floating' script 包装
- CLAUDE.md 浮窗 DoD 段引用 scripts/, 不再文字描述
- docs/architecture/floating-visibility-checklist.md 成档
- 浮窗改动 4 件套强制可执行, 不再靠 reviewer 记忆"
```

- [ ] **Step 5: 验证**

Run: `cd /private/var/www/mindtap && git log --oneline -1`
Expected: 顶部 commit 是浮窗 DoD 工具

---

## Task 21: Commit `docs-meta-research-and-specs` (调研 + spec 沉淀)

**Files:**
- Stage: `docs/tasks/docs-meta-research-and-specs/task.md`
- Stage: `docs/competitors/research-cross-runtime-symmetry.md` (new)
- Stage: `docs/competitors/research-vertical-slice.md` (new)
- Stage: `docs/competitors/research-monolith-with-index.md` (new)
- Stage: `docs/superpowers/specs/2026-06-20-checkin-subtypes-design.md` (new)
- Stage: `.planning/2026-06-20-commit-hygiene/` (gitignore 或保留)

- [ ] **Step 1: 检查 `.planning/` git 状态**

Run: `cd /private/var/www/mindtap && git status --short .planning/`
Expected: 看到 `.planning/` 是 `??` (untracked) 或已经在 .gitignore

如果未 gitignore: 决定是否保留 (推荐保留, V1.0 后归档) 或 gitignore

- [ ] **Step 2: 验证 4 个调研/spec 文件存在**

Run: `cd /private/var/www/mindtap && ls -la docs/competitors/ docs/superpowers/specs/2026-06-20-checkin-subtypes-design.md`
Expected:
- `docs/competitors/research-cross-runtime-symmetry.md` 存在
- `docs/competitors/research-vertical-slice.md` 存在
- `docs/competitors/research-monolith-with-index.md` 存在
- `docs/superpowers/specs/2026-06-20-checkin-subtypes-design.md` 存在

- [ ] **Step 3: git add + commit**

```bash
cd /private/var/www/mindtap
git add docs/tasks/docs-meta-research-and-specs/task.md \
        docs/competitors/research-cross-runtime-symmetry.md \
        docs/competitors/research-vertical-slice.md \
        docs/competitors/research-monolith-with-index.md \
        docs/superpowers/specs/2026-06-20-checkin-subtypes-design.md

git commit -m "docs(meta): commit 卫生调研报告 + checkin-subtypes spec 沉淀

- 3 个子代理调研产物正式归档 (跨 runtime 对称 / vertical slice / 单体索引)
- checkin-subtypes spec 入 docs/superpowers/specs/
- 业务知识沉淀, 后续可直接 git log 反查
- .planning/ 留作 V1.0 后归档"
```

- [ ] **Step 4: 验证**

Run: `cd /private/var/www/mindtap && git log --oneline -1`
Expected: 顶部 commit 是调研 + spec 沉淀

---

## Task 22: 浮窗 DoD 4 件套最终验证

- [ ] **Step 1: npx vitest run**

Run: `cd /private/var/www/mindtap && npx vitest run 2>&1 | tail -10`
Expected: 全部 test PASS

- [ ] **Step 2: npm run build**

Run: `cd /private/var/www/mindtap && npm run build 2>&1 | tail -10`
Expected: `built in` (无错误)

- [ ] **Step 3: npm run smoke:floating**

Run: `cd /private/var/www/mindtap && npm run smoke:floating 2>&1 | tail -20`
Expected: 5/5 PASS (或 7/7 PASS, 看 Task 20 smoke 脚本设计)

- [ ] **Step 4: cargo check**

Run: `cd /private/var/www/mindtap && cargo check --manifest-path src-tauri/Cargo.toml 2>&1 | tail -5`
Expected: `Finished` (无错误)

- [ ] **Step 5: 4 件套全绿记录**

如果 4 件套全绿: 在 `docs/tasks/feat-F-floating-v3-redesign/task.md` (新建或已有) 加一行:

```markdown
## 验证

- 2026-06-20: 4 件套全绿 (vitest / build / smoke / cargo check)
```

(此 task.md 是 feat-F-floating-v3-redesign 的总任务档, 可选, 不强求)

---

## Task 23: git log 验证

- [ ] **Step 1: 看最近 10 commit**

Run: `cd /private/var/www/mindtap && git log --oneline -10`
Expected: 看到 ~10 个 commit, 标题干净, 按业务聚合, 无散乱

- [ ] **Step 2: 看 commit type/scope 分布**

Run: `cd /private/var/www/mindtap && git log --oneline -10 | awk -F: '{print $1}' | sort | uniq -c`
Expected: 看到 `docs(meta):` / `feat(meta):` / `refactor(commands):` / `fix(floating):` / `chore(meta):` 各若干次

- [ ] **Step 3: 看 commit body 段风格**

Run: `cd /private/var/www/mindtap && git log -3 --pretty=format:"%B" | head -30`
Expected: body 段写 "为什么" (业务痛点/边界条件/不这样改会怎样), 不重复 "做了什么"

- [ ] **Step 4: 反向追溯验证 (不写 Refs footer, 靠 git log)**

```bash
cd /private/var/www/mindtap
# 查 fix-F-floating-position-clamp 任务的所有 commit
git log --all --oneline -- docs/tasks/fix-F-floating-position-clamp/

# 查 floating 业务的所有 commit
git log --all --oneline -- src/floating/ src-tauri/src/floating/ \
  src-tauri/capabilities/floating.json
```

Expected:
- 第一个命令看到 Task 18 的 F3' commit
- 第二个命令看到 Task 18 + Task 19 + Task 5 之前的 4 .mdc 中涉及 floating 的 commit

---

## Task 24: DoD 终极验证

- [ ] **`.claude/rules/` 4 个 .mdc 落地**

Run: `cd /private/var/www/mindtap && ls .claude/rules/`
Expected:
```
codegraph.mdc
commit-style.mdc
eslint-boundary.mdc
feature-architecture.mdc
task-directory.mdc
```

- [ ] **`src-tauri/src/commands/mod.rs` 加重导出**

Run: `cd /private/var/www/mindtap && grep -E "pub use" src-tauri/src/commands/mod.rs`
Expected: 看到 `pub use crate::floating::commands::*;` / `pub use crate::settings::commands::*;`

- [ ] **10 个业务域 README 落地**

Run: `cd /private/var/www/mindtap && find src src-tauri/src -name "README.md" -not -path "*/node_modules/*" | wc -l`
Expected: `10`

- [ ] **`docs/architecture/floating.md` 落地**

Run: `cd /private/var/www/mindtap && ls docs/architecture/floating.md`
Expected: 文件存在

- [ ] **3 个 barrel + ESLint rule**

Run:
```bash
cd /private/var/www/mindtap
ls src/floating/index.ts src/settings/index.ts src/timeline/index.ts
grep "import/no-restricted-paths" .eslintrc.*
```

Expected: 3 个 barrel 存在, ESLint rule 启用

- [ ] **4 个 `docs/tasks/<slug>/task.md` 落地**

Run: `cd /private/var/www/mindtap && find docs/tasks -name "task.md" | wc -l`
Expected: `4`

- [ ] **浮窗 DoD 4 件套全绿**

Run Task 22 Step 1-4 全部, 全绿.

- [ ] **`git log --oneline -10` 显示 commit 干净**

Run Task 23 Step 1, 看到 ~10 个按业务聚合的 commit.

---

## 风险与缓解 (跨所有 task)

| 风险 | 概率 | 缓解 |
| --- | ---- | ---- |
| Task 5 commit message 写错格式 (e.g. 用 Refs:) | 低 | 本 plan 的 commit 全部直接给完整 message, 复制粘贴即可 |
| Task 8 ESLint rule 误伤 | 中 | Step 4 dry-run, 误伤就改 import 走 barrel |
| Task 12 mod.rs 改错 | 低 | Step 3-4 cargo check + cargo test 验证 |
| Task 18-21 浮窗 DoD 4 件套某件 FAIL | 中 | 在 Step 1-4 之前先跑测试, FAIL 就先修再 commit |
| Task 22 4 件套全绿后才发现漏文件 | 低 | 4 件套包含 vitest (覆盖率) + build (类型) + smoke (运行时) + cargo check (编译) |

---

## 关联文档

- spec: `docs/superpowers/specs/2026-06-20-commit-hygiene-design.md`
- audit: `.planning/2026-06-20-commit-hygiene/audit-current-state.md`
- research: `.planning/2026-06-20-commit-hygiene/research-best-practices.md`
- competitors: `docs/competitors/{research-cross-runtime-symmetry,research-vertical-slice,research-monolith-with-index}.md`

---

**Plan 终态**: 24 个 task, 每个 task 独立可测, 全部完成后业务架构 + 任务管理 + 提交规范 + 规范沉淀 + 历史 commit 整理 五项改造完成.
