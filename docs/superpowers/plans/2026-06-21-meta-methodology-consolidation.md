# Meta-Methodology 沉淀计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal**: 把"三层决策法 + 闭环复盘"工作流,沉淀到 Claude Code 4 层机制(Rule / Skill / Doc / Memory),并用 V0.1.1 / V0.1.2 / V0.1.3 三份 retro 验证模板,同时落地 V0.1.4 三个真问题修复(A+D 全局可拖副作用 / B Button hover / C Tab active)。

**Architecture**:
- **Rule** (always-apply 触发器): `.claude/rules/decision-method.mdc` — 三层穷举 + 闭环复盘的红线提醒
- **Skill** (user-invoked 流程): `~/.claude/skills/retrospective/SKILL.md` — 复盘 4 段模板 + checklist
- **Doc** (具体实例): `docs/reports/v0.1.{1,2,3}-retrospective.md` + V0.1.4 release notes — 验证模板可重复使用
- **Memory** (recall 事实): `three-layer-decision-method.md` + `mechanism-layering.md` + `v0.1.4-plan-locked.md`(已写好)
- **V0.1.4 实施**:3 个 fix 走 superpowers:writing-plans 子流程(每个 TDD)

**Tech Stack**: Claude Code Rules / Skills / Memory + Markdown + Superpowers 流程

## Global Constraints

- 遵循 `superpowers:writing-skills` 铁律:**NO SKILL WITHOUT A FAILING TEST FIRST**(RED→GREEN→REFACTOR)
- Skill `SKILL.md` 必须 < 500 words,frontmatter description 必须以 "Use when..." 开头且不总结流程
- Rule `.mdc` 走 always-apply 模式,内容精简到 < 100 行
- Doc / Memory / CLAUDE.md 的更新全部走 commit-style rule 业务粒度提交
- 所有 memory cross-ref 用 `[[name]]` 双链语法

---

## File Structure(本次计划改动的全部文件)

### 新建(6)

| 路径 | 类型 | 字节预算 |
|---|---|---|
| `.claude/rules/decision-method.mdc` | Rule | < 100 行 |
| `~/.claude/skills/retrospective/SKILL.md` | Skill | < 500 words |
| `docs/reports/v0.1.1-retrospective.md` | Doc | 4 段,无上限 |
| `docs/reports/v0.1.2-retrospective.md` | Doc | 4 段 |
| `docs/reports/v0.1.3-retrospective.md` | Doc | 4 段 |
| `docs/reports/2026-06-21-v0.1.4-fixes.md` | Release notes | — |
| `~/.claude/projects/.../memory/macos-system-api-audit.md` | Memory | ~ 30 行(Task 4 提炼)|

### 修改(6+)

| 路径 | 改动 |
|---|---|
| `CLAUDE.md` | 加 rule 引用 + /retro skill 提示 |
| `MEMORY.md` | 已加 3 条索引,无需再改 |
| `memory/exhaust-layers-before-fix.md` | 加 cross-ref |
| `src-tauri/src/lib.rs:35` | 删 setMovableByWindowBackground(Tauri drag region 修复)|
| `src/components/layout/Sidebar.tsx` | 加 `data-tauri-drag-region` |
| `src/components/layout/StyleGuideLayout.tsx` 或 AppShell | 加 `data-tauri-drag-region` |
| `src/components/style-guide/CodeBlock.tsx:24` | 加 `cursor-pointer` |
| `src/components/ui/button.tsx:13,17` | hover 改 `bg-white/45` |
| `src/components/ui/tabs.tsx:26` | selected 加 `text-primary` |

### 不动(本计划范围外)

| 项 | 原因 |
|---|---|
| `docs/plans/` vs `docs/superpowers/plans/` 合并 | 评估为低优先,后续单独处理 |
| `docs/research/` 标准化每版本 | YAGNI |
| `docs/references/` 精简 | YAGNI |
| Badge / CodeBlock 间距(discoverability / 设计意图) | 已评估不动 |

---

## Task 1: RED — pressure scenarios for retrospective skill

**Files**: 无(只产出 baseline 文档,作为后续 skill 的"测试用例")

**Goal**: 在写 skill 之前,先用 subagent 跑 3 个 pressure scenarios,记录 baseline 失败模式。

**Steps**:

- [ ] **Step 1.1**: Dispatch 3 个 fresh-context subagent,每个收到"刚交付了 V0.1.1,需要复盘"的 prompt,**不告诉它们有 skill**,让它们自然写 retro
- [ ] **Step 1.2**: 收集 3 个 subagent 的输出,记录:
  - 它们是否主动提出 4 段结构?
  - 哪些段被遗漏?遗漏时怎么 rationalize("太简单了不需要" / "已经在 commit message 写了")
  - 是否回头对照当初的 Layer 3 列表?
  - 是否把可推广教训沉淀为可被未来 recall 的形式?
- [ ] **Step 1.3**: 把 baseline 失败模式整理成 `rationalization-table`,作为 GREEN 阶段 skill 要堵的洞

**Required Background**: `superpowers:writing-skills` §"RED: Write Failing Test"

**Done when**: 3 个 scenario 都跑完 + 失败模式已记录到本 Task 的 inline note

---

## Task 2: GREEN — 写 ~/.claude/skills/retrospective/SKILL.md

**Files**:
- Create: `~/.claude/skills/retrospective/SKILL.md`

**Goal**: 按 baseline 失败模式写最小可用的 skill。

**SKILL.md 结构约束**(from writing-skills):

```yaml
---
name: retrospective
description: Use when... # 必须以触发条件开头,不能总结流程
---
```

- [ ] **Step 2.1**: 起草 frontmatter — `description` 必须含 "use when closing a task, version, or after a user questions decisions made" 之类的触发语,不写"4 段模板"这种流程总结
- [ ] **Step 2.2**: 写 4 段 recipe — 用结构化骨架(每段 1-3 行说明填什么),**禁止写 fill-in-the-blank**(writing-skills 反模式)
- [ ] **Step 2.3**: 加 Quick Reference 表 — 4 段 vs 应该填的内容
- [ ] **Step 2.4**: 加 Common Mistakes — 从 Task 1 baseline 抄过来的实际 rationalization
- [ ] **Step 2.5**: 跑 `wc -w` 验证 < 500 words
- [ ] **Step 2.6**: 把 Task 2 的 SKILL.md 给 Task 1 同样的 3 个 subagent,跑第二次,验证失败模式被堵住
- [ ] **Step 2.7**: commit(skill 不在本项目仓库,放全局 skills 目录)

**Done when**: 3 subagent 第二次跑都按 4 段输出 + 没有新 rationalization

---

## Task 3: 写 .claude/rules/decision-method.mdc(always-apply 触发器)

**Files**:
- Create: `.claude/rules/decision-method.mdc`

**Goal**: 让"三层穷举 + 闭环复盘"成为 always-on 提醒,不依赖 subagent 调用。

**Steps**:

- [ ] **Step 3.1**: frontmatter 写 `alwaysApply: true`,description 写"任何代码/文档改动前;任何交付完成后"
- [ ] **Step 3.2**: 写 3 段(精简版):
  - **改前**: 三层穷举 — Layer 1 原始权威 / Layer 2 统一设计 / Layer 3 具体问题
  - **改后**: 闭环复盘 — `/retro` 调出模板
  - **铁律**: 一句话指向 [[three-layer-decision-method]] 和 /retro skill
- [ ] **Step 3.3**: wc -l 验证 < 100 行
- [ ] **Step 3.4**: commit(`chore(meta): 三层决策法 + 闭环复盘 always-apply rule`)

**Done when**: rule 文件 < 100 行 + 引用 [[three-layer-decision-method]] + /retro

---

## Task 4: 写 V0.1.1 retro 实例

**Files**:
- Create: `docs/reports/v0.1.1-retrospective.md`
- Create: `~/.claude/projects/.../memory/macos-system-api-audit.md`(从 retro 经验段提炼)

**Goal**: 用 /retro skill 走 V0.1.1,验证 skill 端到端可用,并把可推广教训沉淀到 memory。

**Steps**:

- [ ] **Step 4.1**: 在新会话里 invoke `/retro`,让 skill 引导走完 4 段
- [ ] **Step 4.2**: 把结果写到 `docs/reports/v0.1.1-retrospective.md`(用 skill 推荐的输出路径)
- [ ] **Step 4.3**: 从"经验沉淀"段提炼一句"macOS 系统 API 必须审计 user-facing interaction layer",写成 memory 文件 `macos-system-api-audit.md`
- [ ] **Step 4.4**: 更新 MEMORY.md 索引
- [ ] **Step 4.5**: commit(`docs(reports): v0.1.1 retrospective — Layer 3 遗漏的 3 症状同根因`)

**Done when**: retro 实例 + memory 都到位 + 未来 "引入 macOS API" 场景能自动 recall

---

## Task 5: CLAUDE.md + memory cross-ref 整合

**Files**:
- Modify: `CLAUDE.md`
- Modify: `~/.claude/projects/.../memory/exhaust-layers-before-fix.md`

**Goal**: 让新 rule / skill / memory 在现有文档里可达,避免重复内容。

**Steps**:

- [ ] **Step 5.1**: CLAUDE.md 顶部加一行:`> 任何改动前:见 .claude/rules/decision-method.mdc(三层穷举 + 闭环复盘)`
- [ ] **Step 5.2**: CLAUDE.md 的 "规则文件" 表加一行 `.claude/rules/decision-method.mdc | 任何代码/文档改动前;任何交付完成后`
- [ ] **Step 5.3**: `exhaust-layers-before-fix.md` 加 `**How to apply**: 完整方法见 [[three-layer-decision-method]]` 一行
- [ ] **Step 5.4**: commit(`chore(meta): CLAUDE.md + memory 整合 cross-ref`)

**Done when**: 新 rule 在 CLAUDE.md 表格里 + cross-ref 完整

---

## Self-Review(写完 plan 后自查)

- [ ] **Spec coverage**: 6 个文件创建 + 8+ 个文件更新,全部对应到 task
- [ ] **Placeholder scan**: 无 TBD/TODO/`类似 Task N` 字样
- [ ] **Type consistency**: 路径一致,无歧义
- [ ] **writing-skills 铁律**: Task 2 明确要求 RED→GREEN→REFACTOR 跑 subagent 测试
- [ ] **No placeholders**: 每个 step 有具体动作

## 执行顺序

```
Task 1 (RED)
  ↓
Task 2 (GREEN)
  ↓
Task 3 + Task 4 (rule + V0.1.1 retro,可并行)
  ↓
Task 5 (CLAUDE.md cross-ref)
  ↓
Task 6 (V0.1.2 retro)
  ↓
Task 7 (V0.1.3 retro)
  ↓
Task 8 (V0.1.4 Task A+D — 全局可拖修复)
  ↓
Task 9 (V0.1.4 Task B — Button hover)
  ↓
Task 10 (V0.1.4 Task C — Tab active)
  ↓
Task 11 (Final 验证 + finishing-a-development-branch)
```

---

## Task 6: 写 V0.1.2 retro 实例

**Files**:
- Create: `docs/reports/v0.1.2-retrospective.md`

**Goal**: 用 `/retro` skill 第二次走流程,验证模板可重复使用;捕获 V0.1.2 修复流程中的可推广教训。

**Steps**:

- [ ] **Step 6.1**: invoke `/retro`,针对 V0.1.2(P0/P1 玻璃修复)
- [ ] **Step 6.2**: 填 4 段 — V0.1.2 已用了三层决策法,retro 重点:"用了三层 + 是否有更深的副作用未识别"
- [ ] **Step 6.3**: 输出到 `docs/reports/v0.1.2-retrospective.md`
- [ ] **Step 6.4**: commit(`docs(reports): v0.1.2 retrospective`)

**Done when**: 文件存在 + 4 段都填 + skill 第二次使用无 friction

---

## Task 7: 写 V0.1.3 retro 实例

**Files**:
- Create: `docs/reports/v0.1.3-retrospective.md`

**Goal**: 验证 `/retro` skill 第三次使用 + 提取 V0.1.3 的可推广教训(input/textarea cursor audit pattern)。

**Steps**:

- [ ] **Step 7.1**: invoke `/retro`,针对 V0.1.3(视觉细节 + cursor audit)
- [ ] **Step 7.2**: 填 4 段 — V0.1.3 教训:对所有交互元素跑 cursor 审计,发现 explicit cursor class 缺失
- [ ] **Step 7.3**: 输出到 `docs/reports/v0.1.3-retrospective.md`
- [ ] **Step 7.4**: 如果有可推广教训,提炼为 memory 文件
- [ ] **Step 7.5**: commit(`docs(reports): v0.1.3 retrospective`)

**Done when**: 文件存在 + skill 第三次使用稳定

---

## Task 8: V0.1.4 Task A+D — 全局可拖副作用修复

**Files**:
- Modify: `src-tauri/src/lib.rs:35`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/StyleGuideLayout.tsx` 或 AppShell
- Modify: `src/components/style-guide/CodeBlock.tsx:24`

**Goal**: 修复 3 个症状(text select / resize / cursor)同根因

**Steps**:

- [ ] **Step 8.1**: 先写 smoke test(描述三层交互预期):文字可选中 / 窗口可 resize / Copy button hover cursor=pointer
- [ ] **Step 8.2**: 改 `lib.rs:35` — 删 `setMovableByWindowBackground` 调用
- [ ] **Step 8.3**: 改 `Sidebar.tsx` 顶级容器加 `data-tauri-drag-region`
- [ ] **Step 8.4**: 改 main 容器(`StyleGuideLayout.tsx` 或 AppShell)加 `data-tauri-drag-region`
- [ ] **Step 8.5**: 改 `CodeBlock.tsx:24` copy button 加 `cursor-pointer`
- [ ] **Step 8.6**: 跑 smoke test 验证三态
- [ ] **Step 8.7**: commit(`fix(drag): NSWindow setMovableByWindowBackground 副作用 → 改用 data-tauri-drag-region`)

**Done when**: 三态行为正确 + 不破坏其他交互

---

## Task 9: V0.1.4 Task B — Button hover 区分度

**Files**:
- Modify: `src/components/ui/button.tsx:13,17`

**Goal**: 让 hover 填充变化符合 spec §七 "+5-10%"

**Steps**:

- [ ] **Step 9.1**: 写 snapshot / 字符串测试 — `hover:bg-white/45` 出现在 button.tsx className 中
- [ ] **Step 9.2**: `button.tsx:13` secondary variant 改 `hover:bg-white/45`
- [ ] **Step 9.3**: `button.tsx:17` icon variant 改 `hover:bg-white/45`
- [ ] **Step 9.4**: 跑 vitest 全套验证
- [ ] **Step 9.5**: commit(`fix(button): secondary/icon hover 区分度,贴合 spec §七 +5-10%`)

**Done when**: vitest 全绿 + 视觉上 hover 反馈可见但不夸张

---

## Task 10: V0.1.4 Task C — Tab active 文字色

**Files**:
- Modify: `src/components/ui/tabs.tsx:26`

**Goal**: Tab 选中文字色改为 brand,符合 spec §五 1

**Steps**:

- [ ] **Step 10.1**: 写 snapshot / 字符串测试 — `data-[selected]:text-primary` 出现在 tabs.tsx
- [ ] **Step 10.2**: `tabs.tsx:26` 加 `data-[selected]:text-primary`
- [ ] **Step 10.3**: 跑 vitest 全套
- [ ] **Step 10.4**: commit(`fix(tabs): 选中文字色 → primary,实现 spec §五 1`)

**Done when**: vitest 全绿 + Tabs A/B 选中态视觉清晰

---

## Task 11: Final 验证 + finishing-a-development-branch

**Goal**: 把所有改动收口,出 V0.1.4 release notes,合并到 main

**Steps**:

- [ ] **Step 11.1**: 跑 `npx tsc --noEmit` + `npx vitest run` 验证全绿
- [ ] **Step 11.2**: 写 `docs/reports/2026-06-21-v0.1.4-fixes.md`(release notes)
- [ ] **Step 11.3**: commit(`docs: V0.1.4 release notes`)
- [ ] **Step 11.4**: invoke `superpowers:finishing-a-development-branch`
- [ ] **Step 11.5**: 跟 main 同步,merge 决策走 4 选项 menu

**Done when**: 全部 commit + release notes 完整 + merge 完成

## 关联文档

- 三层决策法 + 闭环复盘: `~/.claude/projects/.../memory/three-layer-decision-method.md`
- 4 层机制分层: `~/.claude/projects/.../memory/mechanism-layering.md`
- writing-skills 铁律: `~/.claude/plugins/.../skills/writing-skills/SKILL.md`
- 当前项目规则: `.claude/rules/*.mdc`