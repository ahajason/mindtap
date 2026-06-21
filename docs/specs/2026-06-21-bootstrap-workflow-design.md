# Bootstrap-Workflow Meta-Skill — 设计文档

> 创建: 2026-06-21
> 状态: **v7** — 2026-06-21 用 karpathy 4 原则重审并简化(单文件 ~150 字哲学)
> 配套: `docs/superpowers/plans/2026-06-21-meta-workflow-skill-task-plan.md` + `findings.md`

## 0. 是什么 / 不是什么

**是什么**: 把"jason 的工作流方法论"封装成可复用的 project bootstrap skill,让用户启动新项目时一键复制 generic 的 CLAUDE.md + 1 rule + 1 skill 到目标项目。

**不是什么**:
- ❌ 不是 mindtap 的项目脚手架(mindtap 业务域全部不进)
- ❌ 不是 Claude Code 通用 skill(bind 用户的具体方法论)
- ❌ 不是开发用的工具(skills 都是元方法论,不是 CRUD 工具)
- ❌ 不是"完整工作流框架"(完整框架放仓库根 `docs/contributing/`,skill 只装最小可复用单元)

## 0.05 v7 简化说明(用 karpathy 4 原则重审 v6)

| karpathy 原则 | v6 表现 | v7 简化 |
|---|---|---|
| **Simplicity First** | SKILL.md ~350 字,assets/ 10 templates,references/ 4 文件,流程 6+1 步 | SKILL.md ~150 字,assets/ 4 templates,流程 3 步 |
| **Surgical Changes** | 加了 v6 大量"memory 升格 rules / completion protocol / memory optimization"内容 | 这些放仓库根 `docs/contributing/`,**不**进 skill 本身 |
| **Goal-Driven Execution** | "TDD baseline 跑通"模糊 | "用户跑 `/bootstrap-workflow` 后 CLAUDE.md + decision-method.mdc 存在 + 无占位符"具体可验 |
| **Think Before Coding** | 假设"用户想用 generic 模板"是合理 | 加 "Skip for trivial projects" 显式 — 强 convention 项目不该硬塞 |

**v6 → v7 删除清单**:
- ❌ 9 个 mdc → 1 个(其他放仓库 `docs/contributing/rules/`)
- ❌ 6 个 memory → 0(放仓库 `docs/contributing/memory/`)
- ❌ 4 个 references → 0(放仓库 `docs/contributing/`)
- ❌ 2 个 scripts → 1 个(detect 合并进 bootstrap.sh)
- ❌ 5 项 L3 红线保留高频,其他放仓库 `docs/contributing/L3-specific.md`

**v7 保留核心**:
- ✅ Step 1 detect(防覆盖)+ typed `proceed` + `.bak.<timestamp>` 备份(superskills 缺口,本 skill 兜底)
- ✅ `assets/CLAUDE.md.template`(jason 工作流骨架)
- ✅ `assets/rules/decision-method.mdc`(三层法)
- ✅ `assets/skills/retrospective/SKILL.md`(闭环复盘)

## 0.1 根本目标(2026-06-21 第 N 轮补 — 沉淀到 memory)

| 维度 | 内容 |
|---|---|
| **根本目标** | jason 工作流方法论(三层决策法 + 闭环复盘)封装为可复用 skill,新项目一键复制 generic 模板 |
| **根本问题** | 当前方法论散落在 mindtap 5 rules + 19 memory + 6 skills,新项目无法直接复用 |
| **关键约束** | 中文 skill + 技术名词英文;独立 GH repo `ahajason/bootstrap-workflow`;MIT license |
| **目标可调整性** | ✅ 根目标会调整 → 需 plan 调整 protocol + 偏差提醒机制 |
| **反格式** | Self-review 升级到根本问题视角,不纠结字数 / frontmatter / 语法 |
| **完成内容必做** | 4 件事:Update / Reorganize / Adjust plan / Adjust memory(用户明说) |

> 沉淀: `~/.claude/projects/.../memory/root-goal-three-layer.md` + `_meta/completion-protocol.md` + `_meta/memory-optimization-protocol.md`

## 1. 决策收口(2026-06-21 v6)

| # | 决策 | 结果 |
|---|---|---|
| D1 | Skill 名 | `bootstrap-workflow` |
| D2 | Bootstrap 触发 | SKILL.md 流程 + `scripts/bootstrap.sh`,user invokes `/bootstrap-workflow` |
| D3 | docs 重组 | 中度合并 → `docs/material/` 新建 active 路径 |
| D4 | docs 重组归属 | 纳入本次 meta-plan (T13) |
| D5 | Template 复制粒度 | 全套(CLAUDE + 4 rules + 3 memory + retrospective + clean-comments) |
| D6 | GitHub 仓库 | 新建独立 repo `github.com/ahajason/bootstrap-workflow` |
| D7 | 本地路径 | `/var/www/bootstrap-workflow/` |
| D8 | License | MIT |
| **D9** | **Memory 架构修正(v6 新)** | bootstrap 输出 `MEMORY.md` 索引(限 200 行/25KB) + topic 文件 on-demand Read + 部分转 `.claude/rules/<topic>.md` 带 `paths` frontmatter |
| **D10** | **Edge case handling(v6 新)** | SKILL.md 6 步流程前加 step 0 detect(`ls -d` 探测已有 `.claude/` CLAUDE.md rules memory skills scripts) + 固定 4 编号选项 + typed "proceed" |
| **D11** | **Backup 机制(v6 新 — superpowers 缺口)** | 覆盖前 `.bak.<timestamp>` 写到 `.claude/`,SKILL.md 不可绕过。superpowers 自己没这机制,bootstrap-workflow 是第一个引入的 |
| **D12** | **当前 mindtap 22 memory 修正(v6 新)** | 14 generic 分两类(行为 → rules / 事实 → MEMORY.md 索引),3 cleanup candidate(v0.1.4-plan-locked / version-semantic-reset / github-claude-md-tooling-landscape),5 项目专属保持当前(不进 bootstrap) |

## 2. L1 原始权威(参考对象评估)

### 4 个直接借鉴

| 对象 | 核心做法 | 借鉴度 | 用在哪 |
|---|---|---|---|
| **superpowers/writing-skills** | TDD-for-skills / RED-GREEN-REFACTOR / Iron Law / micro-test wording | 高 | TDD 流程 / 字数阈值(≤500) / frontmatter 字段集 |
| **claude-automation-recommender** | 读 codebase 信号 → 推荐 / SKILL frontmatter 字段集 / template 结构 | 高 | SKILL.md + assets/ 结构 / `$ARGUMENTS` / `disable-model-invocation` |
| **karpathy-guidelines** | 4 条极简行为约束 / tradeoff 显式 | 中 | SKILL.md 触发 description 极简风格 / "Skip for trivial tasks" 显式 |
| **clean-comments(自)** | 中文 skill / 反模式 + 正面模式表 | 中 | templates/skills/clean-comments/SKILL.md 直接复用 |

### 3 个反例(不可照抄)

| 对象 | 反例 | 教训 |
|---|---|---|
| code-simplifier | agent 不是 skill | bootstrap 是 destructive,要走 skill 形态(user-invoke) |
| superpowers/writing-skills | 5000+ 行太长 | 我的 SKILL.md 目标 ≤ 200 字 |
| claude-automation-recommender | 推荐 read-only | bootstrap 是 write,必须 `disable-model-invocation: true` |

### mindtap 41 项 L3 红线(必须排除)

| 类别 | 数量 | 处理 |
|---|---|---|
| 业务域(浮动窗口 / 托盘 / 设置页 / log / db) | 18 | 全不进 |
| 设计 spec(glassic / floating / tray / settings) | 7 | 全不进 |
| 伪通用假设(shadcn / Tauri / 全局快捷键 / 关闭 = 隐藏) | 16 | 全不进 |

详见 `findings.md` § L1 业务域清单(由 subagent B 启发式产出)。

## 3. L2 统一设计(Skill 结构 — v7 极简版)

### 目录结构(v7 — 4 templates + 1 script)

```
~/.claude/skills/bootstrap-workflow/
├── SKILL.md                              # 入口,~150 字 (v7 极简)
├── assets/                               # 复制即用的最小模板集
│   ├── CLAUDE.md.template                # jason 工作流骨架(填项目信息)
│   ├── rules/
│   │   └── decision-method.mdc           # 三层决策法(最核心,只留这 1 个)
│   └── skills/
│       └── retrospective/SKILL.md        # 闭环复盘(只留这 1 个)
└── scripts/
    └── bootstrap.sh                      # Step 0 detect + typed proceed + .bak
```

> **v6 删了什么**(v6 → v7):
> - ❌ 9 个 mdc → 1 个(其他放仓库根 `docs/contributing/rules/`)
> - ❌ 6 个 memory → 0(放仓库根 `docs/contributing/memory/`)
> - ❌ 4 个 references → 0(放仓库根 `docs/contributing/`)
> - ❌ 2 个 scripts → 1 个(detect-existing.sh 合并进 bootstrap.sh)
> - ❌ 5 项 L3 红线保留,其他放仓库 `docs/contributing/L3-specific.md`
> 
> **为什么**:skill 是"jason 工作流最小可复用单元",完整工作流框架放仓库根 `docs/` + 用户的 `CLAUDE.md` 自己填,不要把整个框架塞进 skill。

### SKILL.md frontmatter

```yaml
---
name: bootstrap-workflow
description: Use when starting a new project (or bootstrapping an existing one) with the user's standard workflow — three-layer decision method and retrospective. Skip for trivial scripts or projects with strong existing conventions.
disable-model-invocation: true
user-invocable: true
allowed-tools: Read, Write, Bash
---
```

### SKILL.md 正文(v7 — ~150 字,karpathy 单文件哲学)

```markdown
# Bootstrap Workflow

> **Tradeoff**: 谨慎而非速度。琐碎项目用 judgment,不强塞。

## 流程(3 步)

**Step 1: Detect**(edge case 必走)
- 跑 `ls -d .claude CLAUDE.md 2>/dev/null`
- 报告"目标项目已有 X"
- AskUserQuestion 4 选项:
  1. **merge** — 智能合并(规则追加 / 业务域占位补 / 已有文件跳过)
  2. **replace with backup** — 覆盖前 `.bak.<timestamp>` 写到 `.claude/_backups/`
  3. **skip** — 跳过此文件
  4. **abort** — 终止整个 bootstrap

**Step 2: Confirm + Execute**
- Dry-run 列出将创建/覆盖的所有文件 + 每个文件的备份状态
- 用户 typed `proceed`(不是 y/n)才继续
- 自动 `.bak.<timestamp>` 备份 + 写 `.claude/_backups/MANIFEST.md`

**Step 3: Verify**
- 1. CLAUDE.md + decision-method.mdc 存在
- 2. 无 `{{...}}` 占位符残留
- 3. 项目自带的 `build` / `type-check` / `test` 跑通

## What Gets Copied
4 个核心文件:`assets/CLAUDE.md.template` + `decision-method.mdc` + `retrospective/SKILL.md` + `bootstrap.sh`。全部 generic,不含项目业务域。

## What Stays Out
5 项 L3 高频红线 + 完整 41 项清单放仓库 `docs/contributing/L3-specific.md`。Bootstrap 后**显式告知**用户"这些不会复制"。

## Common Mistakes
- ❌ 跳过 Step 1 detect → 静默覆盖用户已有 `.claude/`
- ❌ 漏 `.bak` 备份 → superpowers 缺口,本 skill 兜底
- ❌ 漏 typed `proceed` → `y/n` 不够强
- ❌ 在已有强 convention 项目强行 bootstrap → 应 skip
```

### bootstrap.sh 行为(v7 极简 — 合并 detect)

```bash
#!/bin/bash
# bootstrap.sh — user-only, destructive
# 0. detect: ls -d .claude CLAUDE.md 2>/dev/null
# 1. 逐个冲突文件 AskUserQuestion 4 选项
# 2. dry-run: 列出将创建/覆盖的文件 + 备份状态
# 3. confirm: 必须 stdin "proceed" 才继续
# 4. 对 replace 选: .bak.<timestamp> 写到 .claude/_backups/
# 5. cp 4 个核心文件 + sed 替换占位符
# 6. 写 .claude/_backups/MANIFEST.md(时间戳 + 路径 + sha256)
# 7. 输出"未复制清单"提示 + 提示跑 verify
```

### bootstrap.sh 行为(v6 — 加 backup + MANIFEST)

```bash
#!/bin/bash
# bootstrap.sh — user-only, destructive
# 0. detect: ls -d .claude CLAUDE.md .claude/rules .claude/memory .claude/skills
#    报告冲突,逐个 AskUserQuestion 4 编号选项
# 1. 接收目标路径 + 项目名 + 业务域清单 + 复制范围(环境变量或 stdin)
# 2. dry-run: 列出将创建/覆盖的文件路径 + 每个文件的 .bak 状态
# 3. confirm: 必须 stdin "proceed" 才继续(不是 y/n)
# 4. 对 Step 0 选 2(replace)的文件:.bak.<timestamp> 写到 .claude/_backups/
# 5. cp -r assets/* <target>/,然后 sed 替换占位符
# 6. 写 .claude/_backups/MANIFEST.md(时间戳 + 路径 + sha256)
# 7. 输出"未复制清单"提示 + 提示跑 self-review
```

### CLAUDE.md.template 内容骨架

```markdown
## 是什么
<PROJECT_NAME> — <一句话定位>。<技术栈一句话>。

## Quick Start
| 动作 | 命令 |
|---|---|
| 装依赖 | `npm install` / `cargo build` / ... |
| 起开发 | `<命令>` |
| 验证类型 | `<命令>` |
| 看 git | `git status` / `git log --oneline` |

## 设计语言
(留空待用户填 — generic skill 不假设视觉语言)

## 文件归位
| 内容类型 | 去处 |
|---|---|
| 新功能「做什么」 | `docs/specs/...` |
| 新功能「怎么做」 | `docs/plans/...` |
| 阶段交付报告 | `docs/reports/` |
| 已交付版本沙盒 | `docs/archive/v<version>/` |
| 任务正式档 | `docs/tasks/<slug>/task.md` |

## 规则文件
引用 `.claude/rules/` 的 4 个 mdc(decision / commit / comment / task-directory)。

## 工作流铁律
引用三层决策法 + 闭环复盘 rule。
```

## 4. L3 具体问题(实施时的陷阱)

| # | 陷阱 | 防御 |
|---|---|---|
| 1 | 漏装包前 grep | templates/memory/pre-flight-checklist.md 已含检查项 |
| 2 | SKILL.md 超 500 字 | 严格 wc -w 检查 + 写作时估算 |
| 3 | click test not required | 复用 writing-skills "必要 vs nice-to-have" 区分 |
| 4 | 漏 clone superpowers 等外部依赖 | bootstrap 流程含"先确认 ~/.claude/skills/ 没冲突名" |
| 5 | 业务域占位符未替换 | bootstrap.sh sed 强制替换 + 校验 + self-review step 1 placeholder scan |
| 6 | 用户已 commit 的 working tree 没 stash | bootstrap 前 `git status` 检查 + 提示 |
| 7 | L3 红线清单漏读 → 误把 mindtap 内容塞入 | SKILL.md 流程 step 5 显式列 L3 红线让用户确认 |
| 8 | 误覆盖已有 .claude/rules | dry-run step 2 显式列覆盖文件 + step 3 user confirm |
| 9 | self-review 跳过导致占位符残留 | 流程 step 6 强制走 + 输出"占位符扫描"命令 |
| 10 | GH repo 创建失败 / 权限不足 | T14 task 内含验证步骤;失败时回退到本地-only |

## 5. TDD 计划

### RED 阶段(Phase 4)

**3 个 subagent 压力场景**:

1. **Subagent A**: 给一段 prompt"用 bootstrap-workflow 启动一个新 React 项目",**无 SKILL.md 上下文**。观察:
   - Agent 会不会复制 mindtap 业务域?
   - Agent 会不会创建 .claude/codegraph.mdc?
   - Agent 怎么替换占位符?
2. **Subagent B**: 给 prompt"bootstrap 一个 Python CLI 工具"。观察:跨语言时是否需要不同模板?
3. **Subagent C**: 给 prompt"在已有强 convention 项目上 bootstrap"。观察:是否 skip?

**Baseline 失败模式**:
- 把 mindtap 业务域复制到 Python 项目
- 直接覆盖已有 .claude/rules
- 不询问业务域清单,直接假设
- 漏告知"未复制清单"

### GREEN 阶段(Phase 5)

写 SKILL.md + assets/ + references/ + scripts/bootstrap.sh,使上述 3 subagent 场景全部满足:
- ✅ 不复制 mindtap 业务域
- ✅ 不覆盖,先检查
- ✅ 必询问业务域
- ✅ 必列 L3 红线

### REFACTOR 阶段(Phase 6)

重跑 3 subagent 场景,找新失败模式 → 堵漏 → 再跑,直到 bulletproof。

## 6. Task Breakdown

| Task | 内容 | 依赖 |
|---|---|---|
| **T0** | Self-review 设计文档(借鉴 brainstorming) | — |
| **T1-T3** | L1/L2/L3 评估报告(本设计文档) | — |
| **T4** | 写 SKILL.md (~250 字,内嵌 self-review) | T1-T3 |
| **T5** | 写 assets/CLAUDE.md.template | T4 |
| **T6** | 写 assets/rules/ (4 mdc) | T4 |
| **T7** | 写 assets/memory/ (3 md) | T4 |
| **T8** | 写 assets/skills/ (2 SKILL.md) | T4 |
| **T9** | 写 references/ (4 文件) | T1-T3 |
| **T10** | 写 scripts/bootstrap.sh | T4-T9 |
| **T11** | TDD RED: 跑 3 baseline subagent,记录失败模式 | T4-T10 |
| **T12** | TDD GREEN + REFACTOR 循环(基于 baseline 失败模式调整) | T11 |
| **T13** | docs 重组:迁移到 docs/material/ + 删 archive 重复 + README 互链 | T1-T3 (独立 task,平行执行) |
| **T14** | 部署 + wc -w 验证 + commit + retro | T11-T12 |
| **T15** | GH repo 创建: git init + GH repo + 首次 push + 设置 description + topics | T14 |
| **T16** | README.md + LICENSE (MIT) + .gitignore | T15 |

注:T13 的"docs 重组到 docs/material/"由单独 task tracking(`docs/tasks/<slug>/task.md`)承载,与本 plan 同步执行。

## 7. 验证手段

| 检查 | 方法 | 通过标准 |
|---|---|---|
| SKILL.md 字数 | `wc -w SKILL.md` | < 500 |
| L3 红线齐全 | 业务域 / spec / 假设 3 表格 | 41 项无遗漏 |
| TDD baseline | 3 subagent 跑过且失败模式已收集 | 全部失败模式已记 findings.md |
| TDD post-green | 3 subagent 重跑全部满足 | 无新失败模式 |
| bootstrap.sh dry-run | 在临时目录跑一遍 | 输出所有将创建的文件路径 |
| docs 重组 | T12 完成且 .archive/docs/material 删除 | 全部路径可追溯 |

## 8. Open Questions

无 — 所有决策已收口。

## 9. 关联

- 任务 plan: `docs/superpowers/plans/2026-06-21-meta-workflow-skill-task-plan.md`
- 发现日志: `docs/superpowers/plans/2026-06-21-meta-workflow-skill-findings.md`
- 三层法 memory: `~/.claude/projects/.../memory/three-layer-decision-method.md`
- 沉淀机制 memory: `~/.claude/projects/.../memory/mechanism-layering.md`
- Pre-flight memory: `~/.claude/projects/.../memory/pre-flight-checklist.md`
- Subagent 调研法 memory: `~/.claude/projects/.../memory/parallel-subagent-research.md`
- 借鉴 self-review: superpowers/brainstorming 4 步(placeholder/consistency/scope/ambiguity)