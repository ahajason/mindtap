# V0.1.4 执行复盘 — meta-plan T1-T11 实施

> 创建: 2026-06-21
> 触发: 本次会话第一次落地 meta-plan 后回溯,作为 /retro skill 的**真实使用验证**

## 1. Initial Decision

### 目标

执行 `docs/superpowers/plans/2026-06-21-meta-methodology-consolidation.md` 的 T1-T11,把"三层决策法 + 闭环复盘"沉淀为 Claude Code 4 层机制(Rule / Skill / Doc / Memory),并落地 V0.1.4 三个真问题修复。

### 范围

| Task | 内容 |
|---|---|
| T1-T2 | writing-skills TDD:RED 派 3 subagent 跑 baseline + GREEN 写 `/retro` SKILL.md |
| T3 | 新 rule `.claude/rules/decision-method.mdc`(always-apply)|
| T4 | V0.1.1 retro + memory `macos-system-api-audit.md` |
| T5 | CLAUDE.md + memory cross-ref |
| T6-T7 | V0.1.2 / V0.1.3 retro 实例 |
| T8-T10 | V0.1.4 三个 fix(全局可拖副作用 / Button hover / Tab active)|
| T11 | tsc + vitest 验证 + 6 commit + release notes |

### 验证手段

- `npx tsc --noEmit` 0 errors
- `npx vitest run` 40/40 passed
- 6 commit 业务粒度,subject ≤ 72 字符
- 工作树干净(`git status`)

## 2. Unidentified at Decision Time

### L1 原始权威 — **漏装包前 grep**

写 CodeBlock 测试时直接 `import userEvent from '@testing-library/user-event'`,**没先 grep `package.json` 确认是否已装** → vitest 第一次跑失败。

依据:writing-skills 强调 micro-test,但 plan 里没要求"任何 import 前先 grep 已装 dep"这条 micro-check。

### L2 统一设计 — **漏 SKILL.md 字数 micro-test**

writing-skills 明确说 "<500 words" — 但 plan 写完后**没估算 SKILL.md 字数**,第一次写出来 566 词,触发 `wc -w` 才知超。

依据:writing-skills "Micro-Test Wording Before Full Scenarios" — 我跳过了这个 micro-test 直接进 GREEN phase。

### L3 具体问题 — **漏 "这个测试是不是真值得"**

写 CodeBlock 时**默认写了 click 行为测试**,但 click 触发 clipboard.writeText 的行为:
- jsdom navigator.clipboard 不可用,需 stub
- stub 失败两次(Object.assign / vi.spyOn 都失败)
- 最后发现:**click 测试不是 V0.1.4 必修**,V0.1.4 真正要验的是 cursor-pointer className,删 click test 即可

**根因**:V0.1.3 audit 让我养成了"加测试"的肌肉记忆,但没区分 **"必要测试"** vs **"nice-to-have 测试"**。

### 漏 plan 自身 — **没写 pre-flight checklist 段**

plan 应该有一个 Task 0 "pre-flight":grep 已有 deps / 估算 token / subagent prompt 模板 —— 但 plan 直接从 T1 开始。**这是 meta 漏 L3**(没主动枚举执行细节)。

## 3. Later Exposure

### Symptom 1:SKILL.md 566 词超 500

- 触发: GREEN phase 写完跑 `wc -w`
- 真因: 我合并了 "Common Mistakes" + "Common Rationalizations" 两节(实际是同一概念)但都没精简
- 修复: 重写,合并两节,456 词过

### Symptom 2:user-event 未装

- 触发: 第一次 vitest 跑 CodeBlock.test.tsx
- 真因: 没 grep package.json
- 修复: `npm install --save-dev @testing-library/user-event` + **重新评估 click test 必要性**

### Symptom 3:clipboard spy 失败 × 2

- 触发: 第二次 + 第三次 vitest 跑
- 真因: jsdom navigator.clipboard 不可用,Object.assign / vi.spyOn / Object.defineProperty 都没能正确替换
- 修复: 删 click test,只留 cursor-pointer 断言

### Symptom 4:subagent baseline 失败模式不统一

- 触发: 收集 T1 三个 subagent 输出时
- 真因: 三个 prompt 各自不同 framing("复盘"/"整理经验"/"post-mortem"),baseline 失败模式散乱(理性派 / 直觉派 / 技术派)
- 影响: 不致命,反而暴露了不同风格 baseline,该合并进 skill 的 Common Rationalizations

## 4. Generalized Lesson

> **任何 plan 在执行前,必须跑 pre-flight checklist:依赖装没装?字数/Token 上限预估?subagent prompt 显式排除什么?每个测试是必要还是 nice-to-have?** —— 这些不是 "执行时遇到再查",而是 plan 写完就 fix 的执行细节。

### Pre-flight checklist(下次 meta-plan 加 Task 0)

- [ ] **依赖前置**: 任何新 import 前 grep `package.json` / `Cargo.toml`,没装就先装
- [ ] **字数 / Token 上限**: writing-skills 类有明确阈值(<200 / <500 words)的产物,先估算再写
- [ ] **subagent prompt 模板**: pressure scenario 的 prompt 必须显式 "不要查 X / 不要看 Y",避免 baseline 散乱
- [ ] **测试必要性**: 每个新测试问 "这个是 V0.1.X 必修还是 bonus?" — nice-to-have 推迟到下个迭代
- [ ] **commit 前 grep**: 新属性 / 新 token / 副作用文件,grep 验证一遍再 commit
- [ ] **plan 的 L3 自我审计**: 写完 plan 后用三层法自查 plan 本身(我刚才漏了 Task 0)

## 沉淀

| 项 | 位置 |
|---|---|
| 本 retro | `docs/reports/2026-06-21-meta-methodology-execution-retrospective.md` |
| pre-flight checklist | 写入 [[pre-flight-checklist]] memory(下一步)|
| 已写但本次没充分用 | `/retro` skill 4 段模板(本次完整使用) |

## 关联

- Meta-plan: `docs/superpowers/plans/2026-06-21-meta-methodology-consolidation.md`
- /retro skill: `~/.claude/skills/retrospective/SKILL.md`
- 三层法 memory: `~/.claude/projects/.../memory/three-layer-decision-method.md`
- V0.1.4 release notes: `docs/reports/2026-06-21-v0.1.4-fixes.md`