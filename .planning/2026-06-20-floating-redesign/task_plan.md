# Task Plan · 浮窗重构 v3 视觉合成
<!-- 工作记忆。决策全在 findings.md;过程全在 progress.md。 -->

## Goal
把 9 个 audit 结果(10 条含整合)+ 15 条决策(4 PRESERVED / 2 AMBIGUOUS / 8 LOST + 1 demo 自洽)整合成单个 floating-final-v3.html,**恢复所有 LOST 决策**,然后再写到 `docs/superpowers/specs/2026-06-20-floating-redesign-design.md` 进入实现环节。

## Current Phase
Phase 4 — 合成 + 写 v3 demo (in_progress)

## Phases

### Phase 1: 决策考古 · 9 audit 完成
- [x] 读 v1.0 浮窗 rounds brainstorm 记录 + 当前 src/floating 实现 + glassic 组件库
- [x] 澄清: 浮窗的目标态(单模式 vs 多模式)、平台差异处理策略、与主窗的边界、最小交互集
- [x] 提出 2-3 个 UI 形态方案
- [x] 分 section 决策(state-table / form-header / form-submit / folded-density / timer-layout-v2 / default-subpanel / button-style / glass-quality-v6 / glass-clear-demo)
- **Status:** complete

### Phase 2: 审计 demo 相对决策的保留/丢失
- [x] 跑 9 个并行 audit agent, 各自从自己的 decision 文件抽出 token + 约束
- [x] 跑 1 个整合 agent, 输出 15 条决策的 PRESERVED/LOST/AMBIGUOUS 清单
- **Status:** complete (journal 在 `wf_5344d25c-253/journal.jsonl`, 集成结果 D-01~D-15)

### Phase 3: 整理 findings.md(决策 + 丢失清单)
- [x] 写入 `.planning/2026-06-20-floating-redesign/findings.md`
- **Status:** complete

### Phase 4: 合成 floating-final-v3.html(恢复 8 LOST + 澄清 2 AMBIGUOUS + v3.1 推透明度)
- [x] 任务 #8 创建并 in_progress
- [x] v3.0 写 demo 单文件
- [x] v3.1 推透明度(D-10/D-01: α=0.32→0.22, blur 28→24, saturate 200→220, brightness 108%→104%, inset 0.95→0.78; 内层 0.35~0.5 → 0.22~0.28; Windows fallback 0.82/0.75 → 0.72/0.78)
- [x] 必须包含(全打勾):
  - 4 个场景背景(含 B-2 Windows fallback 最差情况)✓
  - 折叠态 5 元素(D-05)✓
  - 展开态 segmented(⏱ / ＋)互斥单选(D-02 + D-07)✓
  - 默认 sub-panel = Form(B 方案, D-07)✓
  - Form 头 = A 方案(📄 + 任务名 + 当前 Focus, D-03)✓
  - Form submit = "保存(⌘S)" + 单独 timer 启动动作(D-04)✓
  - Timer hero 56px + 今日累计副标题(D-06 + D-14 说明)✓
  - 3 态对比(active 绿 / paused 橙 / done 灰, D-09)✓
  - 按钮 chrome A/B/C 参考面板(D-08)✓
  - α=0.22/blur 24/saturate 220/brightness 104% 配方 + grid-rows 0fr→1fr(v3.1 D-10/11)✓
  - 不引入 duration chips / 开始 N 分钟 CTA(D-15 删除)✓
  - 拖动 4px 阈值, 折叠态可拖 / 展开态不可拖(D-12)✓
- **Status:** complete

### Phase 5: 把 demo 链接到设计 spec
- [x] 写 `docs/superpowers/specs/2026-06-20-floating-redesign-design.md`(440+ 行,按项目 spec 模板)
- [x] 自检(placeholder / 内部一致 / 范围 / 歧义 — 全过)
- [ ] 用户复核 spec
- **Status:** in_progress(待用户复核)

### Phase 6: 实现规划
- [ ] 调用 writing-plans skill 拆 TDD 计划
- **Status:** pending

## Key Questions

1. v3 demo 用单文件还是多文件? — 单文件(含 inline CSS/JS),保持 visual companion 可直接展示
2. 默认 sub-panel = Form 的语义是否会跟用户"想先看时间"的心智冲突? — header 共用, 任务名始终可见, segmented 切到 ⏱ 即可
3. "保存(⌘S)" 解耦后, 用户怎么启动计时? — Form submit 成功后 segmented 切到 ⏱,按钮变 "开始 30 分钟计时"(已确认时长)
4. duration chips 怎么处理? — 删除, demo 只显示 type chips(task/idea/check-in)
5. Windows fallback 用什么场景? — 单色 #C8C8C8 + 黑色文字, 验证 backdrop-filter 降级时仍可读

## Decisions Made

| 决策 | 来源 | 备注 |
|---|---|---|
| 默认 sub-panel = Form | D-07 B 方案 | 用户先前已确认 |
| Form 头 = A 方案(active task 上下文) | D-03 A | 用户先前已确认 |
| Form submit = 解耦(保存 + 显式启动计时) | D-04 B 方案 | demo 里要明确标注而非隐式 flip |
| 删除 duration chips | D-15 LOST 修复 | demo 不要捏造未决定功能 |
| Timer hero 保持 56px (写 spec 时) | D-14 AMBIGUOUS | demo 里 32px 是为同列对照妥协, spec 写 56px 并注明 demo 缩放 |
| 单文件 vanilla HTML demo | 4 级阶梯:stdlib 够(WAAPI + CSS) | 走 stdlib;若后续需求变可跳到已有 dep(@base-ui/react)或第三方 |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| `style is not defined at workflow.js:89:28` (orchestration crash) | 1 | workflow failed after 10 agents (445s, 167k tokens); 9 audit + 1 integrate 都完成, 结果全在 journal。**改手动合成**:跳过失败的工作流, 直接读 journal 写 demo。 |

## Notes

- journal 路径: `/Users/jason/.claude/projects/-private-var-www-mindtap/a5c9a412-e898-4d1d-9ee9-15b5be33a7dc/subagents/workflows/wf_5344d25c-253/journal.jsonl`
- demo 目标路径: `/private/var/www/mindtap/.superpowers/brainstorm/58461-1781923154/content/floating-final-v3.html`
- spec 目标路径: `/private/var/www/mindtap/docs/superpowers/specs/2026-06-20-floating-redesign-design.md`
- v3 必须读得出来"哪些决策在哪" — 在 demo 内嵌决策索引, 不要让人对照
