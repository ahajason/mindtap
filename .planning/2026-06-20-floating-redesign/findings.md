# Findings · 9 个 audit + 整合 = 15 条决策
<!-- 决策知识库。从 journal.jsonl 抽出来的"事实 + 约束",写 demo 与 spec 时直接引。 -->

## Requirements

- **核心需求(用户原话)**:
  1. "展开态的 focus 块复用迭代块的, 避免重复内容出现" — 组件复用, 不要重复 title/time
  2. "演示分镜的高度, 和内容出现都不够顺滑" — 折叠↔展开过渡要平滑
  3. "visual companion 反应效果, 注意需要可拖动, 并且最好能把效果实现" — demo 必须是真实可交互的, 不是静态截图
  4. "尽量依次优先考虑标准代码库、已有依赖库和合适的 github 和 npmjs 第三方库" — stdlib > 已有 dep > 第三方, 不重复造轮
  5. "液态玻璃的 Light Glassmorphism 不如人意, 不够清透" — α 减半, 透出背景
  6. "动画不够流畅" — 用 cubic-bezier + grid-rows 平滑过渡
  7. "重新审视前几次的设计对比和呈现, 之前决定的一些抉择都被丢了" — 写 demo 前必须审决策保留情况

- **本阶段产物**:
  - 决策索引(本文件)
  - v3 demo: `floating-final-v3.html`(单文件可拖动)
  - 决策 spec: `docs/superpowers/specs/2026-06-20-floating-redesign-design.md`(后续)

## 15 条决策(D-01 ~ D-15)

### 已确认 PRESERVED(4 条 · 维持现状)

#### D-05 · 折叠态 5 元素(B 方案)
- **文件**: `folded-density.html`
- **决定**: 选 B(5 元素含内联暂停按钮)而非 A(4 元素, 展开后才出暂停)
- **约束**: bar 必须 320×36 r14, gap 8px, padding 10px; 点 8px; iconbtn 24×24 r7
- **顺序**: 呼吸点 → 标题 → 时间 → ⏸ → ＋
- **状态**: PRESERVED in glass-clear-demo.html ✓

#### D-06 · Timer sub-panel A 骨架 + 今日累计副标题
- **文件**: `timer-layout-v2.html`
- **决定**: A 骨架 + 副标题改为"今日累计·段数"
- **约束**: 360px 窗 r20, hero 56px/700/tabular-nums/letter-spacing -0.02em
- **动作**: 暂停 ↔ 完成(mutex, paused 时 swap)
- **依赖**: "今日累计" 需新 backend command `api.taskAggregateToday()`
- **状态**: PRESERVED in glass-clear-demo.html(副标题文本存在 ✓)

#### D-09 · Glass quality v6 自然档呼吸
- **文件**: `glass-quality-v6.html`
- **决定**: v6(2 层光晕 + 4→16px 扩散 + brightness 1→1.15 + 2.8s)取代 v5(4 层 + 40px + 1.35, 像霓虹灯)
- **约束**: 无 inset shadow; 三态 active=绿 #5BCBA0 / paused=橙 #F5A623 / done=灰 #98A2B3(灰态禁动画)
- **状态**: PRESERVED in glass-clear-demo.html ✓

#### D-10 · 清透玻璃配方 + 增强型 expand(v3.1 推透明度)
- **文件**: `glass-clear-demo.html` 自洽
- **v3.0 决定**: α=0.32, blur 28px, saturate 200%, brightness 108%; expanded 升 α=0.42 + border 0.55 + 50px halo
- **v3.1 调整**: 用户反映仍偏奶白,推一档 → α=0.22 / blur 24 / saturate 220 / brightness 104%; expanded α=0.30 + border 0.42 + 36px halo
- **理由**: Apple HIG Liquid Glass 实测 α≈0.18~0.25,饱和度补偿色彩损失
- **约束**: transition 320ms cubic-bezier(0.25, 0.46, 0.45, 0.94)
- **状态**: PRESERVED + v3.1 推透明度 ✓

#### D-11 · Grid-template-rows 0fr → 1fr 平滑高度
- **文件**: `glass-clear-demo.html` 自洽
- **决定**: 用 grid-template-rows 0fr→1fr + inner overflow:hidden + min-height:0 替代 keyframes
- **约束**: 必须三个一起写, 不然不平滑
- **状态**: PRESERVED ✓

#### D-12 · 拖动 vs 点击 互斥(4px 阈值)
- **文件**: `glass-clear-demo.html` 自洽
- **决定**: DRAG_THRESHOLD = 4px; 短按未拖 → 折叠态 toggle; 已拖 → 静默
- **约束**: 折叠态可拖, 展开态不可拖(只 close 按钮 + 内部控件交互); btn-ghost 短路 drag
- **状态**: PRESERVED ✓

#### D-13 · DOM 复用(同一组节点用 CSS 切 variant)
- **文件**: `glass-clear-demo.html` 自洽
- **决定**: 同一 .focus-block 节点用 `.float.expanded` 切布局
- **状态**: PRESERVED ✓

### AMBIGUOUS(2 条 · 需在 spec 澄清)

#### D-08 · 折叠态按钮 chrome
- **文件**: `button-style.html`
- **决定**: 未捕获(A=永久 3D / B=ghost+hover 3D / C=纯 icon 三选)
- **当前 demo 隐含**: B(ghost+hover 3D, α=0.15 → hover 0.55)
- **修复**: v3 demo 内嵌 A/B/C 三方块对比面板, 让用户可重确认
- **理由**: B/C 静态图无法判断 hover 反馈质量, 必须有活 demo

#### D-14 · Timer hero 字号 56px vs 32px
- **文件**: `timer-layout-v2.html` spec 是 56px, demo 实装 32px
- **冲突**: demo 容器宽 260px 装不下 56px(同一容器还要放 Form 对照)
- **修复**: spec 写 56px, demo 加 caption "56→32 是 demo 内并排对照妥协, 实际展开是 56px"

### LOST · 必须恢复(8 条)

#### D-01 · B-2 单梯度(0.82/0.75)Windows 最差 fallback(v3.1 调降)
- **文件**: `state-table.html`
- **丢失**: demo 只用 B-1(浅蓝渐变 #F5F9FF→#E8F1FF)做舞台背景, 没演示 backdrop-filter 降级到 fallback 实色/渐变的最差场景
- **恢复 v3.0**: v3 加第 4 个场景 = 单色 #C8C8C8 + 黑色文字背景, fallback α=0.82/0.75
- **v3.1 调整**: 跟 D-10 同步推透明度 → α=0.72/0.78,避免 fallback 看起来像"白瓷"

#### D-02 · 8-state 验收表(segmented Timer/Form 互斥)
- **文件**: `state-table.html`
- **丢失**: demo 把 Timer-detail 和 Form 拼一起永远同时显示, 没 segmented 切换
- **恢复**: v3 顶部加 segmented(⏱ 计时 / ＋ 记录)单选; 折叠 4 态 + 展开 4 态 = 8 态(可不全画, 但 segmented 必须有)

#### D-03 · Form 头 A/B 方案(显示 active task 作为工作上下文)
- **文件**: `form-header.html`
- **决定**: A 方案 — 📄 + 任务名 + "当前 Focus" 小字; 没 active task 时退化为 B
- **丢失**: demo form header 永远是中性 "+ 新记录"
- **恢复**: Form 头复用共享 header 的 doc icon + 任务名, 副标题写"当前 Focus"; 无 task 时退化

#### D-04 · Form submit 解耦(保存 + 显式 timer 启动)
- **文件**: `form-submit.html`
- **决定**: B 方案 — 主按钮"保存(⌘S)"只创建记录, 单独动作"开始 N 分钟计时"启动 timer
- **丢失**: demo 直接 "开始 30 分钟专注" / "开始 60 分钟专注" / "开始 90 分钟专注", 语义跟 V1.5 task 提交 flip 一致(被 spec 标记为 confusing)
- **恢复**: v3 主 CTA = "保存(⌘S)" + 提交后 segmented 切到 ⏱ 出现 "开始 30 分钟计时"

#### D-07 · 默认 sub-panel = Form(B 方案)
- **文件**: `default-subpanel.html`
- **决定**: B 方案 — 默认展开 Form 而非 Timer
- **丢失**: demo 两个 sub-panel 同时显示, 没回答"哪个默认"
- **恢复**: v3 默认显示 Form(头部 active task + 表单 + 保存按钮); Timer 通过 segmented 切

#### D-15 · 不引入 duration chips(15/30/60/90)
- **来源**: demo 自行捏造, V1.5 backend 不支持 duration preset
- **丢失**: demo 出现 4 个 duration chip + "开始 N 分钟专注" CTA, 既没决策文件, 也没 backend 支持
- **恢复**: v3 删除 duration chips 和"开始 N 分钟" CTA, Form 只 type chip(task/idea/check-in) + submit

### Demo 自洽(1 条 · 维持现状)

#### D-10/11/12/13 已合并到 "demo 自洽 4 条"

## 失败/已知约束

| 约束 | 触发位置 | 备注 |
|---|---|---|
| Web Animations API 不支持 grid-template-rows 0fr → 1fr 形变 | CSS transition 已能覆盖 | 无需 WAAPI |
| 4 级阶梯评估 → stdlib 够 | 走 4 级阶梯:stdlib(CSS+WAAPI)覆盖 v3 7 项 → 不需 @base-ui/react / tailwindcss-animate / 任何第三方 |
| @tauri-apps/api/dpi 在浮动窗口 resize 限制 | 平台差异 | 32px grid 数字在 Windows 上更紧凑, 接受 |
| macOS backdrop-filter 在透明窗口上需 Tauri 端 transparent: true | 已配 | 颜色/边框/fallback 配方在所有平台生效 |

## 视觉资源

| 文件 | 路径 | 用途 |
|---|---|---|
| state-table.html | `.superpowers/brainstorm/58461-1781923154/content/` | 8 态验收表 |
| form-header.html | 同上 | Form 头 A/B |
| form-submit.html | 同上 | Form submit A/B |
| folded-density.html | 同上 | 折叠态密度 A/B |
| timer-layout-v2.html | 同上 | Timer sub-panel 确认版 |
| default-subpanel.html | 同上 | 默认 sub-panel A/B |
| button-style.html | 同上 | 按钮 chrome A/B/C |
| glass-quality-v6.html | 同上 | 呼吸 v6 终版 |
| glass-clear-demo.html | 同上 | v3 候选 demo(被审计对象) |
| glass-clear-compare.html | 同上 | 玻璃配方对比 |
| animation-flow.html | 同上 | 折叠↔展开 5 帧分镜 |

## 写 v3 demo 的硬清单

按以下顺序实现, 缺一不可:

1. 4 场景背景(深色代码 / Notion / 彩色照片 / 单色 #C8C8C8 Windows fallback)
2. 折叠态 bar 5 元素(呼吸 → 标题 → 时间 → ⏸ → ＋), 32×36 尺寸, ghost+hover 3D 按钮(B 方案)
3. 点击空白/拖动阈值 4px 切折叠↔展开
4. 展开态顶部 segmented(⏱ 计时 / ＋ 记录)单选 mutex
5. 默认 sub-panel = Form: header 显示 active task(📄 + 任务名 + "当前 Focus"), type chips(task/idea/check-in), textarea, 主 CTA "保存(⌘S)"
6. segmented 切到 ⏱: hero 32px(标注 demo 内缩放) + 副标题"今日累计 X:XX:XX · N 段" + 暂停/完成按钮对
7. 3 状态对比面板(active 绿呼吸 / paused 橙呼吸 / done 灰无动画)
8. A/B/C 按钮 chrome 参考小面板(D-08 澄清)
9. α=0.32/blur 28/saturate 200 配方 + grid-template-rows 0fr→1fr 平滑
10. 不放 duration chips
11. 嵌入式"决策索引"footer, 标 D-01 ~ D-15 哪个在哪个位置

## 5-Question Reboot Check

| Q | A |
|---|---|
| 我在哪 | Phase 4, 写 floating-final-v3.html |
| 我去哪 | Phase 5 写 spec → Phase 6 writing-plans |
| 目标 | 单文件 demo 恢复 8 LOST + 澄清 2 AMBIGUOUS |
| 我学了什么 | 9 个 audit + 整合 = 15 决策; v3 demo 缺 B-2 fallback / segmented / Form 头 A / 解耦 submit / Form 默认 / 不引入 chips |
| 我做了什么 | 见 progress.md |
