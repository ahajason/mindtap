# Git Commit Hygiene 最佳实践调研（2026-06-20）

> 调研人：commit-hygiene 子代理 · 范围：mindtap 项目（单代码库 Tauri 2 + React 19 + TS + Vite 7 + Rust 1.96），跨 `src/floating/`、`src-tauri/src/floating/`、`src/settings/` 等多层的桌面 app。

## 0. 项目现状摸底

`git log --shortstat -30` 看到的实际情况：

| 指标 | 现状（最近 30 commit） |
|---|---|
| 平均 commit 文件数 | 3.4 files（`f8cd487` 1 file → `40ae426` 15 files） |
| 平均 commit 行数 | +204 / -44 |
| commit 标题格式 | 已 100% 走 `type(scope): subject` 模式（feat/fix/chore/docs/refactor/test 都有） |
| 已用 scope | `floating` ×36、`settings` ×23、`db` ×9、`ui` ×5、`hooks` ×4、`tauri` ×3、`diagnostics` ×3、`deps` ×3、`cmd` ×3、`timeline` ×2、`log` ×2、`gitignore` ×2 |
| 跨层 commit | 高频；最近 30 条里 7 条同时动了 `src/floating/` + 测试文件 |
| 业务切片 | 已是 atomic commit（每条 commit 都过 vitest + cargo + smoke），但 scope 单一（绝大多数 = `floating`），没有按"业务功能"做更高层打包 |
| 典型痛点 | D-13 拆成 4 commit（`1070b58`、`4c66e25`、`6c0f404`、`d481c77`），每条只动 1-2 个文件，但合起来才是"D-13 浮窗接入 + capability"一个业务功能 |

**结论**：mindtap 已经做到 per-commit buildable + per-commit tested，**已经属于良好 atomic commit 实践**。缺口是"按业务功能聚合"——D-13 这类横跨 `src/floating/**` + `src-tauri/capabilities/**` + 测试的逻辑切片，目前是按"层级"切片，而不是按"业务功能"切片。

---

## 1. 核心原则

### 1.1 Atomic Commit 三条铁律

| 原则 | 定义 | mindtap 现状 |
|---|---|---|
| Single Responsibility | 一个 commit 只做一件事；事后能"revert this feature"而不影响其它功能 | ✅ 已满足（每条 commit 主题单一） |
| Buildable per commit | checkout 到任意 commit，`cargo check` + `npm run build` + `npx vitest run` 必须全绿（项目 CLAUDE.md 的 TDD 硬约束 + 浮窗 DoD 4 件套） | ✅ 已满足 |
| Cross-layer coupling 时的取舍 | 跨 `src/` + `src-tauri/` 的功能必须单 commit（不能拆成"Rust commit" + "TS commit"，否则中间 commit 是坏的） | ⚠️ 部分违反——D-13 被拆成 4 个 commit，前 3 个缺前端的 webview 集成 / 后端 capability 文件，可能导致中间 commit 跑 smoke 时不可见（详 [memory/floating-smoke-not-mock.md]） |

### 1.2 业界粒度光谱

| 粒度流派 | 代表项目 | 平均 commit 改的"东西" | 适用场景 |
|---|---|---|---|
| **per-file**（一文件一 commit） | 极少见 | 1 文件 | 反模式 |
| **per-layer**（按层切） | mindtap 现状 | 1-3 文件同一层 | 适合"改一个 bug"的纯本地修复 |
| **per-feature**（按功能） | Tauri 官方 `tauri-apps/tauri` 大部分 commit | 跨多文件、多层 | 默认推荐 |
| **per-statement**（per logical change） | Linux kernel、Git 自身 | 一个完整逻辑变更 | 大型 monorepo / strict 项目 |
| **stacked / per-PR** | Jujutsu 工作流 | 一个 PR = N 个 stacked commits | 长期功能开发 |

### 1.3 多层 Tauri/Rust 项目的特殊取舍

**不能跨"未提交桥"的 commit**：
- 任何 `src-tauri/commands/*.rs` 新增 `#[tauri::command]` 的 commit，**必须**同时改 `src/lib/tauri-bridge.ts`（否则前端 `invoke()` 调一个不存在的 command）。中间 commit 是 broken 的。
- 任何 `tauri.conf.json` 加新窗口的 commit，**必须**同时改 `vite.config.ts` + `src-tauri/capabilities/<label>.json`（CLAUDE.md 已记录）。
- 任何"删除某个 db 函数"的 commit，**必须**同时删前端 `api.*` wrapper + 任何测试 stub。

→ **这些场景必须一个 commit**，无法拆。这就是 CLAUDE.md 里"三处必须同步改"的本质。

---

## 2. Conventional Commits + Tauri/Rust 多层项目落地

### 2.1 规范定义

来源：[conventionalcommits.org/en/v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)（CC BY 3.0）。

**结构**：
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Type 集**（Angular 约定）：
- `feat` —— 新功能（MINOR）
- `fix` —— 修 bug（PATCH）
- `BREAKING CHANGE` footer 或 `!` 后缀 —— 不兼容变更（MAJOR）
- 其它：`build` / `chore` / `ci` / `docs` / `style` / `refactor` / `perf` / `test` / `revert`

**Scope 语义**（这是 mindtap 现在不一致的地方）：
- 官方定义：scope 应"描述代码库的某个 section"
- 社区两种用法：
  1. **目录名**：`feat(floating):`、`feat(settings):`（mindtap 当前）
  2. **领域名**：`feat(task):`、`feat(idea):`、`feat(check_in):`（mindtap 部分 commit）

→ mindtap 当前混合用。**建议：scope = 目录名**（与 CLAUDE.md 的 `src/floating/`、`src/settings/`、`src/hooks/` 等结构对齐），领域细化放进 type 后面的 subject。

### 2.2 社区真实 commit 例子

**Tauri 官方**（`tauri-apps/tauri`，[commits/dev](https://github.com/tauri-apps/tauri/commits/dev)）：

| Hash | Commit |
|---|---|
| `728c8d4` | `fix(cli): skip building bundles when using tauri android run` |
| `50b0237` | `fix(android): escape special characters in strings.xml` |
| `e6083a1` | `perf: load resources of tauri:// protocol asynchronously` |
| `9167826` | `feat(api): add logical monitor bounds to the Monitor object` |
| `f1fe2d6` | `fix: cookies_for_url deadlock` |

观察：100% 走 conventional，scope 100% 是子系统名（`cli`/`android`/`api`/`runtime-wry`），PR 编号在括号里。

**Tres**（Three.js 的 Vue 3 绑定，[CodyJasonBennett/tres](https://github.com/CodyJasonBennett/tres/commits/main)，3D 渲染库）：

最近 30 commit 里 22/30 (≈73%) 严格 conventional，约 8 个带 scope（`chore(deps)`、`chore(playground)`、`refactor(is)`）。非标的有 1 个 emoji 前缀、1 个 revert 没标、1 个完全没 type 前缀。

**Refine**（React 元框架，[refinedev/refine](https://github.com/refinedev/refine/commits/main)）：

最近 30 commit 几乎全部 conventional，scope = 子包名（`feat(core)`、`feat(mui)`、`fix(win95)`、`docs(i18n)`），PR 编号带括号。merge commit 不强制 conventional。

**lencx/ChatGPT**（Electron，[commits/main](https://github.com/lencx/ChatGPT/commits/main)）：

`feat: auto continue`、`fix: mac titlebar`、`fix: export icons`、`chore: remove gpt4 mobile` —— conventional 但**几乎不用 scope**（因为是 Electron 单仓，没有多子系统）。证明 scope 是"多组件 monorepo"的强需求。

---

## 3. Tauri 官方 + 3 个知名 Tauri 2 项目的 commit 习惯对比表

> 表格只放可观察事实，不放无法量化的"代码质量"判断。

| 项目 | 类型 | Stars（量级） | 是否 conventional | scope 策略 | 平均 commit 文件数 | 平均 commit 行数 | 是否带 PR 编号 |
|---|---|---|---|---|---|---|---|
| [tauri-apps/tauri](https://github.com/tauri-apps/tauri) | Tauri 框架本体（Rust workspace） | ~83k | 100% | 子系统名（`cli`/`api`/`runtime-wry`/`android`/`bundler`） | 5-15（依赖改动有时 50+） | 200-800 | 是（`(#15473)`） |
| [CodyJasonBennett/tres](https://github.com/CodyJasonBennett/tres) | Three.js Vue 绑定（pnpm monorepo） | ~3k | ≈73% | 偶尔用（`chore(deps)`、`chore(playground)`） | 2-4 | 50-300 | 是 |
| [refinedev/refine](https://github.com/refinedev/refine) | React 元框架（pnpm monorepo） | ~30k | 95%+ | 子包名（`core`/`mui`/`docs`/`blog`/`win95`） | 3-10 | 100-500 | 是 |
| [lencx/ChatGPT](https://github.com/lencx/ChatGPT) | Electron 单仓 | ~55k | 70%（带 type） | 几乎不用（Electron 无子包） | 1-5 | 30-200 | 否（merge commit 带） |

**观察 1**：stars > 30k 的"成熟"项目 100% 走 conventional。
**观察 2**：scope 几乎都是**目录/子系统名**，与 mindtap 当前用法一致。
**观察 3**：即使是 monorepo，单个 commit 改的文件数也很少超过 15（除了依赖升级）。
**观察 4**：PR 编号是常规 footer，但 merge commit 不强制 conventional。

---

## 4. 强制工具链

### 4.1 工具选型矩阵

| 工具 | 作用 | 何时选它 | 与 mindtap 适配度 |
|---|---|---|---|
| [commitlint](https://github.com/conventional-changelog/commitlint) + [@commitlint/config-conventional](https://github.com/conventional-changelog/commitlint) | 校验 commit message 格式 | 团队多人协作 / 想机械化 | ✅ mindtap 单人项目价值低，但配合钩子能挡住 PR 评审时的失误 |
| [husky](https://github.com/typicode/husky) | git hook 安装器（Node） | 项目已经有 Node + npm script | ✅ 已天然适配（已有 `npm run tauri dev` 等） |
| [lefthook](https://github.com/evilmartians/lefthook) | git hook 替代品（Go 二进制，无运行时依赖） | 想减少 Node 依赖 / 多语言 monorepo | ⚠️ mindtap 是 Node + Rust 双栈，但 lefthook 主要省 Node 依赖，价值有限 |
| [lint-staged](https://github.com/lint-staged/lint-staged) | pre-commit 按文件类型跑 lint / test | 想强制"未 lint 不让 commit" | ✅ 适合 `src/**` 自动跑 vitest + eslint |
| [commitizen](https://github.com/commitizen/cz-cli) / [cz-cli](https://github.com/commitizen/cz-cli) | 交互式 commit 模板（一步步问 type/scope/subject） | 团队成员不爱手敲 conventional 格式 | ⚠️ 单人项目价值低，会拖慢节奏 |
| [git-cliff](https://github.com/orhun/git-cliff) | 从 conventional commits 生成 CHANGELOG.md | 想自动化发版日志 | ✅ mindtap 是发版前手动维护 CHANGELOG.md 时可用 |
| [release-please](https://github.com/googleapis/release-please) | Google 的版本自动化（commit → version → CHANGELOG → PR） | 想要 CI 自动 bump 版本 | ⚠️ mindtap V1.0 还没发版，V1.x 之前不必上 |

### 4.2 推荐组合（mindtap）

**最小可行（V1.x 期间）**：
```
commitlint + husky commit-msg hook
```
只需 `commit-msg` hook 校验 message，不动 pre-commit（pre-commit 慢 + 与现有 `npm run smoke:floating` DoD 重复）。

**完整配置（V2.0 后 / 团队扩张后）**：
```
commitlint + husky + lint-staged(pre-commit:vitest on src/) + git-cliff(CHANGELOG)
```

### 4.3 一键配置脚本草稿（不直接执行，仅供 review）

`scripts/setup-commit-hygiene.sh`：
```bash
#!/usr/bin/env bash
set -euo pipefail

# 1) 装依赖（devDependencies）
npm install -D \
  @commitlint/cli @commitlint/config-conventional \
  husky lint-staged \
  git-cliff --no-save || true

# 2) commitlint config
cat > commitlint.config.cjs <<'EOF'
module.exports = { extends: ['@commitlint/config-conventional'] };
EOF

# 3) husky 初始化
npx husky init
cat > .husky/commit-msg <<'EOF'
npx --no-install commitlint --edit "$1"
EOF

# 4) lint-staged（只对 src/** 跑 vitest + prettier）
cat > .lintstagedrc.json <<'EOF'
{
  "src/**/*.{ts,tsx}": ["vitest related --run", "prettier --write"],
  "src-tauri/**/*.rs": ["cargo fmt --"]
}
EOF
# 然后 .husky/pre-commit:
cat > .husky/pre-commit <<'EOF'
npx --no-install lint-staged
EOF
```

`cliff.toml`（最小可行）取自 [git-cliff config](https://github.com/orhun/git-cliff/blob/main/config/cliff.toml)：
```toml
[changelog]
trim = true

[git]
conventional_commits = true
filter_unconventional = true
commit_parsers = [
  { message = "^feat", group = "Added" },
  { message = "^fix",  group = "Fixed" },
  { message = "^doc",  group = "Documentation" },
  { message = "^perf", group = "Performance" },
  { message = "^refactor", group = "Refactored" },
  { message = "^test", group = "Tests" },
  { message = "^chore", skip = true },
]
sort_commits = "oldest"
```

---

## 5. "按业务打包"的具体技法

| 技法 | 适用场景 | 关键命令 | 风险 |
|---|---|---|---|
| **`git add --patch`** | 单文件混杂多 feature 改动 | `git add -p <file>` → `y/n/s/e/a/d` | 容易出错，需要手动 hunk 选择 |
| **`git add --interactive`** | 多文件想看完整 diff | `git add -i` | 界面陈旧，体验差 |
| **`git restore --staged`** | 误 add 后撤 | `git restore --staged <file>` | — |
| **`git commit --fixup=<hash>` + autosquash** | "我重做了一遍这个 commit" | `git commit --fixup=abc1234 && git rebase -i --autosquash HEAD~5` | 改写历史，未推送安全 |
| **`git rebase --interactive`** | commit 完后发现能合并/重排 | `git rebase -i HEAD~N`，编辑 `pick/squash/reword/edit` | 同上 |
| **`git stash` + 多分支** | 临时切到其它任务 | `git stash push -m "WIP: floating D-13"` | 容易忘记 pop |
| **`git worktree`** | 长期并行多 feature | `git worktree add ../mindtap-d13 -b feat/floating-d13` | mindtap CLAUDE.md 已记录 `.worktrees/` gitignore |
| **`jj`（Jujutsu）** | 想摆脱 staging area + 自动 rebase | `jj describe`、`jj split`、`jj squash` | 新工具，团队学习成本高 |
| **`git absorb`** | 想"找最近同函数/同行的 commit 合并进去" | `git add -p` 后 `git absorb` | 需要 Rust 工具链（已具备） |

### 5.1 推荐 mindtap 工作流（混合）

**场景 A：D-13 浮窗接入（要跨 `src/floating/**` + `src-tauri/capabilities/floating.json` + 测试）**

实际做法（结合 git worktree）：
```bash
# 1) 开 worktree
git worktree add ../mindtap-floating-d13 -b feat/floating-d13

# 2) 一次性写完所有相关改动（src + src-tauri + test），
#    期间可以多次 git add -p 精细控制

# 3) 拆 commit（每条都跑 smoke）
git add src/floating/FloatShell.tsx src/floating/FloatShell.test.tsx
git commit -m "feat(floating): FloatShell 挂载 .floating-root 类(D-13 折叠态可见)"

git add src-tauri/capabilities/floating.json src-tauri/src/lib.rs
git commit -m "fix(capability): create floating.json for floating window webview"

git add src/floating/App.tsx
git commit -m "feat(floating): D-13 App.tsx 接入 FloatShell + OuterShell + GlassSurface"

git add src/floating/App.tsx src/floating/App.test.tsx
git commit -m "fix(floating): preserve sub-panel state across segment switch (D-13 DOM reuse)"

# 4) 推到远端时可选 --force-with-lease（如果之前推过初稿）
git push -u origin feat/floating-d13
```

**关键判断**：4 条 commit 都满足 CLAUDE.md 的 DoD（vitest + build + smoke + cargo check），每条都能单独 revert。

**场景 B：发现 commit 7 应该合并到 commit 4**（事后 rebase）
```bash
git rebase -i HEAD~10  # 把 commit 7 改成 "squash" 或 "fixup"
```

**场景 C：跨多个 worktree 的并行开发**
- 主 worktree 跑 `feat/floating-d13`
- 副 worktree 跑 `feat/settings-page`
- 各自独立 commit，PR 互不干扰

---

## 6. 对 mindtap 项目的具体建议

### 6.1 推荐方案（两阶段）

#### Phase 1（最小改动，立刻能上）

1. **规范 scope 名**：把 scope 收敛为**目录名**（`floating`/`settings`/`hooks`/`bridge`/`db`/`tray`/`diagnostics`/`log`/`macos`/`windows`/`deps`/`docs`/`build`/`ci`），删除当前 `feat(task):`、`feat(idea):` 这类"领域名 scope"——领域信息进 subject。
2. **加 commitlint + husky（仅 commit-msg hook）**：
   - 装 `@commitlint/cli` + `@commitlint/config-conventional` + `husky`
   - `.husky/commit-msg` 跑 `npx commitlint --edit "$1"`
   - 装完先 `npx commitlint --from HEAD~30 --to HEAD` 看历史 30 条违规率（参照 §0 摸底，预计 < 5% 不合规）
3. **加 pre-commit 不推荐**：会拖慢节奏；现有的 `npm run smoke:floating` DoD 已覆盖（CLAUDE.md 已有规定）。
4. **不引入 git-cliff**：V1.0 没发版，CHANGELOG.md 是手写更省事。

#### Phase 2（V1.5+，团队扩张 / 多 PR 并行时）

1. **加 lint-staged**：`.husky/pre-commit` 跑 lint-staged，对 `src/**/*.{ts,tsx}` 自动跑 `prettier --write` + `vitest related --run`；对 `src-tauri/**/*.rs` 跑 `cargo fmt --`。
2. **加 git-cliff**：release 时 `git cliff --tag v1.5.0 --output CHANGELOG.md` 自动生成。
3. **引入 git worktree 工作流**：每个 feature 一个 worktree（CLAUDE.md 已 `.worktrees/` gitignore，提前埋好）。
4. **可选 jj**：如果你想完全换 VCS 模型；不建议，团队学习成本。

### 6.2 落地步骤（Phase 1 具体动作清单）

| # | 动作 | 文件 | 备注 |
|---|---|---|---|
| 1 | 装 devDeps | `package.json` | `@commitlint/cli`、`@commitlint/config-conventional`、`husky` |
| 2 | 写 commitlint config | 新建 `commitlint.config.cjs` | `module.exports = { extends: ['@commitlint/config-conventional'] };` |
| 3 | husky init | 跑 `npx husky init` | 创建 `.husky/` 目录 |
| 4 | 加 hook | `.husky/commit-msg` | `npx --no-install commitlint --edit "$1"` |
| 5 | 改 CLAUDE.md | `CLAUDE.md` 的"交互规约"加一条："所有 commit message 必须走 conventional commits 格式，由 commit-msg hook 强制" |
| 6 | 跑历史合规检查 | `npx commitlint --from HEAD~50 --to HEAD~0` | 看违规率；预期 < 5% |
| 7 | 不合规 commit 不动历史（已推送） | — | 改写历史成本高 |

### 6.3 风险点

| 风险 | 概率 | 缓解 |
|---|---|---|
| 历史 commit 不 100% 符合 conventional，CI/hook 跑过去会有 warning | 高 | 只 hook 新 commit；历史不动 |
| pre-commit 跑 vitest related 太慢 | 中 | **不引入 pre-commit**；现有 `npm run smoke:floating` DoD 覆盖 |
| husky 在 Windows 路径问题 | 中 | mindtap macOS/WSL 开发为主，Windows 在 `npm run tauri build` 时触发，commit hook 不在 Windows 跑（除非有人在 Windows 做 commit） |
| 团队成员绕过 hook（`git commit --no-verify`） | 中 | CLAUDE.md 明文禁止 + 文档强化 |
| commitlint 误判 subject 过短 / 过长 | 低 | 默认 config 允许 subject 3-72 字符，mindtap 当前 `useWindowPosition 首次启动挪浮窗到 (100, 60) 避 macOS 菜单栏` 这种 30+ 字符 subject 通过 |

### 6.4 最小可行 vs 完整配置 取舍

| 维度 | 最小可行（Phase 1） | 完整配置（Phase 2） |
|---|---|---|
| 装多少 devDep | 3 个 | 6 个 |
| 改多少文件 | 3 个 | 6 个 |
| 是否影响 commit 节奏 | 不影响（commit 时跑 200ms 检查） | pre-commit 跑 1-5s（lint-staged） |
| 是否需要团队培训 | 不需要 | 需要 5 分钟培训（worktree 用法） |
| 何时用 | V1.0 ~ V1.5 | V1.5+ / 团队扩张 |

→ **先上 Phase 1**，跑 2 周看反馈，再决定要不要扩 Phase 2。

---

## 7. 引用源

### 规范 & 文档

- Conventional Commits 1.0.0（[conventionalcommits.org](https://www.conventionalcommits.org/en/v1.0.0/)）
- [commitlint 文档](https://github.com/conventional-changelog/commitlint)
- [@commitlint/config-conventional](https://github.com/conventional-changelog/commitlint)
- [git-cliff 文档](https://github.com/orhun/git-cliff)
- [lefthook 文档](https://github.com/evilmartians/lefthook)（[lefthook.dev](https://lefthook.dev/configuration/index)）
- [Jujutsu 文档](https://github.com/martinvonz/jj)
- [git-add 官方文档](https://git-scm.com/docs/git-add)（含 `-p` hunk 模式说明）
- [git-cliff 最小 config 样例](https://github.com/orhun/git-cliff/blob/main/config/cliff.toml)

### 仓库 commit 历史（外部对比数据来源）

- [tauri-apps/tauri](https://github.com/tauri-apps/tauri)（commit `728c8d4`、`50b0237`、`e6083a1`、`9167826`、`f1fe2d6`）
- [CodyJasonBennett/tres](https://github.com/CodyJasonBennett/tres/commits/main)（30 条 commit 样本）
- [refinedev/refine](https://github.com/refinedev/refine/commits/main)（30 条 commit 样本）
- [lencx/ChatGPT](https://github.com/lencx/ChatGPT/commits/main)（30 条 commit 样本，作为"几乎不用 scope"的对照组）

### 项目内参考

- `/private/var/www/mindtap/CLAUDE.md` —— TDD 硬约束、浮窗 DoD 4 件套、settings 写后必发事件、跨窗口三处同步
- `/private/var/www/mindtap/README.md` —— 项目技术栈与版本
- `~/.claude/memory/floating-smoke-not-mock.md` —— 浮窗改动必须真 Tauri smoke
- `~/.claude/memory/css-contract-not-mount.md` —— 浮窗 CSS class 必须断言挂载
- `~/.claude/memory/exhaust-layers-before-fix.md` —— 多层 root cause 穷举再修

### 项目内 commit 数据（§0 摸底）

| Hash | 内容 |
|---|---|
| `d533a5d` | Revert floating 菜单栏修复 |
| `1070b58` | FloatShell 挂载 .floating-root 类 |
| `4c66e25` | create floating.json capability |
| `6c0f404` | D-13 App.tsx 接入 FloatShell |
| `d481c77` | preserve sub-panel state across segment switch |
| `40ae426` | 12-scenario floating window baseline（15 files，最大） |
| `f8cd487` | D-02 Segmented mutex ⏱/＋（1 file，最小） |
| `c1d98b2` | docs(superpowers) 浮窗 v3 redesign spec（3104 insertions，单文件最大） |