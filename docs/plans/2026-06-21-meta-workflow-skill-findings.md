# Bootstrap-Workflow Meta-Skill — 发现日志

> 创建: 2026-06-21
> 配合 task_plan.md:本文件记录**所有调研发现**,供后续阶段 / 未来 agent 直接召回,不需重读原文

---

## L1 外部参考对象评估

### superpowers/writing-skills(完整读完)

| 维度 | 内容 |
|---|---|
| 核心方法 | TDD-for-skills: RED baseline → GREEN write → REFACTOR plug |
| 字数阈值 | getting-started <150 / frequent <200 / other <500 |
| micro-test | 5+ reps per variant + no-guidance control |
| Iron Law | "NO SKILL WITHOUT A FAILING TEST FIRST" — 写完测试再写 skill 是违规 |
| 三类 skill | discipline-enforcing / technique / pattern / reference |
| Bulletproofing | rationalization table + red flags + close loophole |
| 形态匹配 | failure 类型 → form 类型(规则违反用 prohibition,格式错误用 recipe) |
| **可借鉴** | TDD 流程 / 字数阈值 / baseline 跑法 / rationalization 收集 |
| **不可照抄** | 太长 (5000+ 行 main skill) / Iron Law 太严格(我自己有 baseline 缺失例外) |

### claude-automation-recommender(完整读完 + 5 references)

| 维度 | 内容 |
|---|---|
| 核心方法 | 读 codebase 信号 → 推荐 1-2 / category(hooks/skills/subagents/MCP/plugins) |
| read-only | 不创建文件,只输出推荐报告 |
| SKILL frontmatter 字段 | name / description / disable-model-invocation / user-invocable / allowed-tools / context / agent |
| 模板结构 | SKILL.md + scripts/ + examples/ + templates/ |
| 动态注入 | `$ARGUMENTS` 全参数 / `!command` 注入命令输出 |
| invocation control | (default) 双向 / `disable-model-invocation:true` user-only / `user-invocable:false` claude-only |
| 8 个 custom skill 模板 | api-doc / create-migration / gen-test / new-component / pr-check / release-notes / project-conventions / setup-dev |
| **可借鉴** | 模板结构(SKILL.md + assets/) / frontmatter 字段集 / invocation control / $ARGUMENTS 用法 |
| **不可照抄** | "推荐能力"是 read-only,我的 bootstrap 是 write/destructive,要走 user-only |

### karpathy-guidelines(SKILL.md + .mdc 双形式)

| 维度 | 内容 |
|---|---|
| 核心方法 | 4 条极简行为约束: think first / simplicity / surgical / goal-driven |
| 字数 | SKILL.md 68 行 / .mdc 71 行 (极简) |
| tradeoff 显式 | "These guidelines bias toward caution over speed. For trivial tasks, use judgment." |
| alwaysApply | .mdc 形式总是加载;SKILL.md 由 Claude 视场景加载 |
| **可借鉴** | "4 条约束"是 generic 工作流的最小化形态 / tradeoff 显式说明 |
| **不可照抄** | 内容太简,对 bootstrap 任务不够 — 我的 skill 需要更多触发条件 |

### code-simplifier(agent 形式,不是 skill)

| 维度 | 内容 |
|---|---|
| 形态 | agent (Claude-opus) + 唯一 system prompt |
| 核心方法 | 只改最近 touched 代码 / 保留功能 / clarity over brevity / 不嵌套三元 |
| **可借鉴** | "focus scope" 概念(只动最新代码) / 4 不原则 |
| **不可照抄** | 是 agent 不是 skill,我的需求是 skill 形式 |

### clean-comments(我自己,完整读完)

| 维度 | 内容 |
|---|---|
| 字数 | 243 行 — **偏长** |
| 核心结构 | 核心原则 / 写注释拦截 / 何时使用 / 不主动写 / 删除对象 / 保留对象 / 文档注释 / 元数据 / 简化 / 临时标记 / 不自动生成 / 实践案例 / 优先级 |
| 触发 | description 含大量"用户说 X 关键词"列表 |
| **可借鉴** | 中文 skill 风格 / 反模式 + 正面模式 / 触发关键词列表 |
| **不可照抄** | 太长(目标 generic skill 应 < 500 行)/ 触发过于宽泛 |

---

## L1 自身现状评估(已完成)

### docs 混乱路径(用户列的 6 个)

| 路径 | 内容 | 建议 |
|---|---|---|
| `docs/references/taskisland.md` (70K) | V1.0 视角分析 | **保留**,加瘦身提示 |
| `docs/references/source/taskisland/` | 上游快照 | **保留**(已 gitignore) |
| `docs/research/2026-06-21-v0.1.2-glass-issues/0-originals/` | 6 个上游参考 | **合并/迁移** 到 `.archive/docs/material/` 或加 README 说明"参考素材" |
| `docs/design/_references/` | 1 README | **空目录** — 要么填要么删 |
| `.archive/docs/material/apple/` | Apple HIG/Liquid Glass/SwiftUI/WWDC | **保留**,真参考库 |
| `.archive/docs/design/glassic-ui-spec.md` | 真设计 spec | **提升** 到 active(已部分做) |
| `.archive/docs/competitors/` | 竞品分析 | **保留**,跟 docs/references 部分重叠 |

### 重复根因

**3 处 reference-only 素材分散**:
- `docs/research/.../0-originals/`(研究阶段临时拉)
- `.archive/docs/material/`(长期参考库)
- `docs/references/source/`(taskisland 上游)

**统一思路**(供决策):
- A: 全部归 `.archive/docs/material/<source>/`,其它加 README 互链
- B: 保留分布,加 `docs/references/README.md` 集中索引
- C: 全部 gitignore,只本地存在

### 5 个 rules generic/specific 分类

| rule | generic? | 备注 |
|---|---|---|
| `decision-method.mdc` | ✅ | 直接复用 |
| `commit-style.mdc` | ⚠️ | 业务域列表(floating/settings/timeline/db/tray/bridge/diagnostics/log/meta)要泛化,留 {{BUSINESS_DOMAINS}} |
| `comment-style.mdc` | ✅ | 直接复用 |
| `codegraph.mdc` | ❌ | CodeGraph MCP 仅 mindtap,不进 generic |
| `task-directory.mdc` | ⚠️ | 三段式 slug generic,但 task 目录路径要参数化 |

### 6 个 skills generic/specific 分类

| skill | generic? | 备注 |
|---|---|---|
| `clean-comments` | ✅ | 复制到 generic,但描述要精简(目前触发过宽) |
| `retrospective` | ✅ | 复制,但 description "Targets macOS / Tauri" 删掉 |
| `planning-with-files` | ✅ | 已含完整模板,可引用源 |
| `solid` | ✅ | 但偏长(270 行),建议拆 references/ |
| `mmx-cli` | ❌ | MiniMax API 专属 |
| `terminal-title` | ⚠️ | 是 Codex 时代产物,Claude Code 不一定适用 |

### memory generic/specific 分类(全量)

**generic(可直接入 templates/memory/)**:
- `three-layer-decision-method`
- `mechanism-layering`
- `pre-flight-checklist`
- `minimize-reinventing-wheel`
- `four-step-dep-ladder`
- `five-axis-eval-rubric`
- `claude-md-architect-skill`
- `brainstorming-verify-not-guess`
- `css-contract-not-mount`
- `exhaust-layers-before-fix`
- `strict-literal-execute`
- `ask-user-question-threshold`
- `stage-working-tree-resync`
- `version-semantic-reset`

**项目专属(不入 templates)**:
- `glassic-ui-stack` ❌
- `visual-spec-source` ❌
- `main-window-settings-design` ❌
- `macos-system-api-audit` ⚠️ (含 macOS / Tauri 案例)
- `github-claude-md-tooling-landscape` ⚠️ (2026-06-19 快照)
- `floating-smoke-not-mock` ❌
- `v0.1.4-plan-locked` ❌

---

## 待补调研(Phase 0.5 subagent)

- [ ] superpowers/systematic-debugging — 与三层法对比
- [ ] superpowers/test-driven-development — 与 clean-comments 互补
- [ ] superpowers/subagent-driven-development — bootstrap 流程可能要用 subagent 派发
- [ ] mindtap 业务域摸底(读 3 个 .archive/docs/specs/ + docs/design/glassic-ui-spec.md) — 确认"什么不进 skill"

---

## L2 设计草案(待 Phase 1 完善)

**目标 skill**: `bootstrap-workflow`

**结构**:
```
~/.claude/skills/bootstrap-workflow/
├── SKILL.md                    # 入口,触发条件 + 流程(~200 字)
├── assets/
│   ├── CLAUDE.md.template      # 极简 CLAUDE.md 模板
│   ├── rules/
│   │   ├── decision-method.mdc
│   │   ├── commit-style.mdc    # 业务域留 {{BUSINESS_DOMAINS}}
│   │   ├── comment-style.mdc
│   │   └── task-directory.mdc  # 路径参数化
│   ├── memory/
│   │   ├── three-layer-decision-method.md
│   │   ├── mechanism-layering.md
│   │   └── pre-flight-checklist.md
│   └── skills/
│       ├── retrospective/SKILL.md
│       └── clean-comments/SKILL.md
├── references/
│   ├── L1-evaluation.md        # 4 外部参考对象评估
│   ├── L2-design.md            # 本 skill 结构设计
│   └── L3-specific.md          # mindtap 业务域清单(不进 skill)
└── scripts/
    └── bootstrap.sh            # 一键复制
```

**SKILL.md 触发**: "Use when starting a new project or bootstrapping an existing one with the user's standard workflow — three-layer decision method, commit style, comment style, retrospective, clean-comments. Skip for trivial scripts or projects with strong existing conventions."

---

## 风险点

- ❌ **漏 L3 业务域**:TDD GREEN 时漏把 mindtap 业务域写进 generic template → 用户新项目用了错的 scope
- ❌ **漏 pre-flight**:这次计划也要 pre-flight(依赖检查 / 字数估算 / subagent prompt 模板)
- ❌ **依赖未装**:superpowers plugins 是否已 enable (settings.json 显示已 enable)

## 沉淀目标(可推广的 Lesson)

> **写作 skill 时,把"参考对象评估"独立成 L1 文档,可避免每次重新读大原文**

---

## Subagent 调研补充(2026-06-21 第 N 轮元反馈触发)

### 调研 1:Claude Code Memory 官方机制(由 subagent A 启发式提取)

| 关键事实 | 对 bootstrap-workflow 的启示 | 复用度 |
|---|---|---|
| `CLAUDE.md` **全量加载** system prompt(不看大小) | bootstrap 写进 CLAUDE.md 的内容每次都吃 token → 价值密度必须够 | 高 |
| `.claude/rules/<topic>.md` + `paths` frontmatter → **匹配路径才加载**(真按需) | bootstrap 的阶段产物(plan / retro)若带 paths,只在相关任务时加载,省 token | 高 |
| Auto memory `MEMORY.md` 索引(限 200 行/25KB) + topic 文件 → on-demand Read | 我们当前 22 个 memory 全量装载是**设计错位**;应改为索引 + 详情拆分 | 高 |
| Auto memory 默认开启,Claude 自己写 | 我们手写的 22 个文件**理论上可被 Auto memory 取代或补充** | 中 |
| `@path/to/import` 引入语法 | 可在 CLAUDE.md 集中引用多个 topic 文件,实现"启动时拼装" | 中 |
| `claudeMdExcludes` 排除机制 | monorepo / 跨项目时按 glob 隔离 | 低 |

**硬约束(必须修正)**:
- 我们 22 个 memory 全量装入 system prompt,不是按需召回
- 真正按需加载只有 `.claude/rules/` 的 `paths` frontmatter
- **架构修正方向**: 大部分手写 memory 应转为 `.claude/rules/<topic>.md`(行为规则)带 `paths` frontmatter;少量事实性 memory 走 `MEMORY.md` 索引 + topic 文件

### 调研 2:superpowers 已有配置处理(由 subagent B 启发式提取)

| 对象 | 启示 | 复用度 |
|---|---|---|
| `writing-skills` | 没"已有 skill 怎么办"机制;信任文件系统,后写覆盖前写 | 中 |
| `using-git-worktrees` | **教科书级 pre-flight**: `GIT_DIR/GIT_COMMON` 三命令 + "Already in isolated workspace" 判定 | 高 |
| `brainstorming` | "Explore the current project state first" 3 条 working-in-existing-codebases 纪律;**没配置文件覆盖流程** | 中 |
| `claude-automation-recommender` | 用 `ls -la .claude/ CLAUDE.md 2>/dev/null` 探测;**推荐完 read-only,让用户决定**;dry-run 天然 = "do nothing" | 高 |
| `finishing-a-development-branch` | 固定 4 编号选项 + typed "discard" for destructive;**没"先备份再覆盖"机制**,靠 typed confirmation 兜底 | 高 |

**硬约束(必须修正)**:
- superpowers 自己**没"先备份再覆盖"硬性安全机制** — **bootstrap-workflow 应是第一个引入显式 backup**
- 不用"merge/replace/skip"术语(不在 superpowers 词表) → 用"detect → 编号 4 选项"
- 4 选项: `merge into existing / replace with backup / skip / abort`
- 覆盖前写 `.bak.<timestamp>` 到 `.claude/`
- destructive 操作要求 typed `proceed` 而不是 `y/n`

### 总结:对 bootstrap-workflow 设计的影响

| 设计元素 | 原 v5 | 修正后 v6 |
|---|---|---|
| 6 步流程起点 | step 1 确认参数 | **step 0 detect** — `ls -d` 探测已有 `.claude/` CLAUDE.md 等 |
| 冲突处理 | dry-run 列文件 → user confirm | 固定 4 编号选项(merge/replace-with-backup/skip/abort) + typed `proceed` |
| 备份机制 | 无 | 覆盖前 `.bak.<timestamp>` 写到 `.claude/` |
| Memory 架构 | 22 个 markdown 全量 | `MEMORY.md` 索引(限 200 行/25KB) + topic 文件 on-demand Read + 行为性转 `.claude/rules/<topic>.md` 带 `paths` |

### 对记忆架构本身的修正(bootstrap-workflow 输出的一部分)

| 当前 memory | 推荐归宿 | 理由 |
|---|---|---|
| `three-layer-decision-method` | `.claude/rules/three-layer.md` (always) | 行为规则,常驻 |
| `exhaust-layers-before-fix` | `.claude/rules/exhaust-layers.md` (always) | 行为规则,常驻 |
| `parallel-subagent-research` | `.claude/rules/parallel-subagent.md` (paths: *.md) | 行为规则,只在调研长文档时 |
| `pre-flight-checklist` | `.claude/rules/pre-flight.md` (always) | 行为规则,常驻 |
| `ask-user-question-threshold` | `.claude/rules/ask-question.md` (always) | 行为规则,常驻 |
| `strict-literal-execute` | `.claude/rules/strict-literal.md` (always) | 行为规则,常驻 |
| `minimize-reinventing-wheel` | `.claude/rules/no-reinvent.md` (always) | 行为规则,常驻 |
| `four-step-dep-ladder` | `.claude/rules/dep-ladder.md` (always) | 行为规则,常驻 |
| `comment-style` (现有 .mdc) | 保留,已 correct | — |
| `commit-style` (现有 .mdc) | 保留,已 correct | — |
| `mechanism-layering` | `MEMORY.md` 索引项 + topic 文件 | 事实性,需详情时 Read |
| `root-goal-three-layer` | `MEMORY.md` 索引项 + topic 文件 | 事实性 |
| `brainstorming-verify-not-guess` | `MEMORY.md` 索引项 + topic 文件 | 事实性 |
| `css-contract-not-mount` | `MEMORY.md` 索引项 + topic 文件(项目专属) | 事实性,前端相关 |
| `stage-working-tree-resync` | `MEMORY.md` 索引项 + topic 文件 | 事实性 |
| `five-axis-eval-rubric` | `MEMORY.md` 索引项 + topic 文件 | 事实性 |
| `claude-md-architect-skill` | `MEMORY.md` 索引项 + topic 文件 | 事实性,使用门槛 |
| `github-claude-md-tooling-landscape` | **cleanup candidate**(2026-06-19 快照) | 过程性,过期 |
| `v0.1.4-plan-locked` | **cleanup candidate**(2026-06-21 已完成) | 过程性,过期 |
| `version-semantic-reset` | **cleanup candidate**(项目专属且临时) | 过程性 |
| `glassic-ui-stack` / `visual-spec-source` / `main-window-settings-design` / `floating-smoke-not-mock` / `macos-floating-default-position` / `macos-system-api-audit` | **不进 generic**(项目专属) | bootstrap-workflow 输出要排除 |

### 关键决策(2026-06-21 第 N 轮收口)

| # | 决策 | 结果 |
|---|---|---|
| D9 | Memory 架构修正 | bootstrap-workflow 输出 `MEMORY.md` 索引(限 200 行) + topic 文件 + 部分转 `.claude/rules/<topic>.md` 带 `paths` |
| D10 | Edge case handling | SKILL.md 6 步流程前加 step 0 detect(ls `.claude/` CLAUDE.md rules memory skills scripts) + 固定 4 选项 + typed "proceed" |
| D11 | Backup 机制 | 覆盖前 `.bak.<timestamp>` 写到 `.claude/`,SKILL.md 不可绕过 |
| D12 | 当前 mindtap 22 memory 修正 | 14 generic 分两类(行为 → rules / 事实 → 索引),3 cleanup candidate,5 项目专属保持当前(不进 bootstrap) |

---

## 完成内容 = 4 件事 meta-protocol(2026-06-21 用户明示)

任何"完成一个内容"必须走:

1. **Update** — 更新所有相关文件(不只是 primary deliverable)
2. **Reorganize** — 重组归位(spec / plan / report / task-directory 正确路径)
3. **Adjust plan** — 调整 plan(已完成 task 标 done,新增 task 加,作废 task 记原因)
4. **Adjust memory** — 调整 memory(generic vs 项目专属分类,过期/过程性清理,新洞察沉淀)

详见 `~/.claude/projects/.../memory/_meta/completion-protocol.md`(待写)。

---

## TDD RED 失败模式(2026-06-21 Phase 4)

派 3 subagent 跑"无 skill 状态"baseline,3 个场景:空目录 / 部分已有 / 强 convention。

### Subagent A(空目录 `/tmp/baseline-empty/`)

| 失败模式 | 严重 | GREEN 修复方向 |
|---|---|---|
| 把"配工作流"误读成"从零铺",装 package.json / vite.config / src/ 业务代码 | **高** | SKILL.md description 显式"仅工作流,不业务代码" |
| 盲装 ESLint/Prettier 全套 | **高** | "Skip ESLint/Prettier/framework setup" 显式 |
| 写 README | 中 | WHAT STAYS OUT 段加 "README 用户自己写" |
| 不问路由/状态就默认 | 中 | 不是 bootstrap 职责,用户用 Vite/Next 自带脚手架 |

**Subagent A 期望的 skill 行为**:
- 探测空目录 / git 仓库 / package.json / CLAUDE.md
- 备份现有 → `.bootstrap-backup/<ts>/`
- 必 ask before overwrite + 幂等 + 输出"装了什么 + 为什么"
- 避免:静默覆盖 / 强制 git init / 强加框架 / 写 README / 生成 src/

### Subagent B(部分已有 `/tmp/baseline-partial/`)

| 失败模式 | 严重 | GREEN 修复方向 |
|---|---|---|
| 把"已有但简"当"缺"重写,丢内容 | **中** | detect 阶段区分 "已有但简 vs 真缺" |
| 缺文件清单凭印象漏列 | **中** | dry-run 列完整文件清单,不全不能 proceed |
| 静默挑 merge 策略,违反 strict literal | **高** | 每个冲突必 AskUserQuestion |

**Subagent B 期望**:
- 三步: audit 现状(列已有+缺+同名冲突)→ diff 给用户确认 → 按确认执行 + 自动 bak
- 绝不静默覆盖

### Subagent C(强 convention `/tmp/baseline-strongconv/`)

| 失败模式 | 严重 | GREEN 修复方向 |
|---|---|---|
| 跳过读现有 convention 直接 invoke | **高** | SKILL.md 必走 Step 1 detect + 列差异表 |
| 静默合并 | **高** | 三选项(全采用/仅补缺/全部跳过) |
| 没列冲突清单就执行 | **中** | dry-run 列差异表,用户必看 |

**Subagent C 期望**:
- detect-first, override-never
- scan:CLAUDE.md / linter / formatter / CI / husky / commit-lint
- 列"skill 建议 vs 现有"差异表
- 三选项,用户挑完再写盘
- 写盘前必须 dry-run diff

### 失败模式汇总(GREEN 要修)

| # | 失败模式 | 严重 | 修法 |
|---|---|---|---|
| F1 | 装业务代码 / package.json / vite.config | **高** | SKILL.md description + CLAUDE.md 边界段 |
| F2 | 盲装 ESLint/Prettier/husky | **高** | "Skip for linter/formatter" 显式 |
| F3 | 已有但简当缺重写 | 中 | detect 区分 "已有 vs 缺 vs 冲突" |
| F4 | 缺文件清单凭印象 | 中 | dry-run 强制列完整清单,不全不能 proceed |
| F5 | 跳过读 convention 直接 invoke | **高** | Step 1 detect 必走,列出差异表 |
| F6 | 静默合并 | **高** | 每个冲突必 AskUserQuestion |
| F7 | 没列冲突清单就执行 | 中 | dry-run 列差异表,用户必看 |
| F8 | 写 README | 中 | WHAT STAYS OUT 显式 |

### 核心修订(2026-06-21 v8.1)

| 改动 | 文件 |
|---|---|
| description 加"NOT framework / linter / business code" | `SKILL.md` |
| WHAT STAYS OUT 段扩展 | `SKILL.md` |
| Common Mistakes 加 8 项反模式 | `SKILL.md` |
| Bootstrap 边界段 | `assets/CLAUDE.md.template` |
| 业务文件探测(package.json / .eslintrc* / .prettierrc* / vite.config* / next.config* / tsconfig.json) | `scripts/bootstrap.sh` |
| 差异表生成(已装 vs 建议) | `scripts/bootstrap.sh` |