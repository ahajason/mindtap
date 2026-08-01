# feat(floating): V0.2.1 工作台账核心(捕获 + 并行任务条)

> 创建: 2026-08-01
> 版本: V0.2.1
> 优先级: P1
> 归属判定: 见 `docs/tech/v0.2.1-workbench-core-tech.md` §1 范围边界
> 关联 retro: `docs/reports/v0.2.1-retrospective.md`(待补)

## Why

PRD 阶段一 S1~S4 生死场景要求工作台账核心:全局快捷键捕获(1.1)、常驻浮窗并行任务条(1.2)。现状 `timer_session` 是独立计时记录(3 态、全局唯一 1 active),无法表达「统一 Item + 五态 + 多并行进行中」的台账语义;且「冷却/晾着」被动变暗的展示无法解决「台账与现实脱节」的元痛点,必须以「失真确认闭环」主动询问取代。

## What

- 建新表 `item`(统一实体,五态)+ DROP 旧表 `timer_session`(ADR-0011)
- 五态状态机(inbox/todo/active/done/archived)+ 多并行进行中(去部分唯一索引)
- 全局快捷键捕获改造:快捷键→show→聚焦→回车→create→hide→还原原窗口
- 展开态并行任务卡列表 + 收件箱项最小开始按钮
- 失真确认闭环:冷却 2h / 跨天检测 → 独立确认气泡 → 5 秒超时暂停 → 待确认窗口 → 记入/丢弃(ADR-0012)
- 重复捕获轻提示(不阻止不合并,ADR-0013)
- 不在范围:收件箱完整整理(转待办/仅留档/删除)、待办清单、空闲检测、休眠锁屏暂停 → V0.2.2

## Done when

- [ ] `item` 表 + 五态状态机 + 多并行 active 落地
- [ ] 快捷键捕获全流程:任意应用内唤起→输入→回车 ≤3 秒,焦点归还原窗口,连续捕获 10 条不打断输入流
- [ ] 展开态并行任务卡:5 个并行任务同时计时互不干扰;每卡显示内容/累计时长/冷却深浅/进度备注
- [ ] 失真确认闭环:冷却 2h 触发气泡→5 秒无操作自动暂停→回来一键记入/丢弃
- [ ] 跨天停表:跨天 active 退回 todo,时长不膨胀
- [ ] 切换零成本:点 B 开始,A 自动暂停一步完成
- [ ] L1 vitest 全 PASS(item 状态机 / 多并行 / 结算 / 待确认 / 失真检测 / 重复捕获)
- [ ] L2 `cargo test` / `clippy` / `fmt` / `tsc` 全 PASS
- [ ] L3 D:\ 用户实测:PRD §1.1 §1.2 全部场景 + V0.2.0 既有功能不回归
- [ ] 沉淀:task.md 跟业务代码同 commit;写一行到对应 retro

## 关联

- PRD: `docs/轻念Mindtap产品需求文档.md` 阶段一
- Domain: `docs/domain/v0.2.1-workbench-core-domain.md`
- ADR: `docs/domain/adr/0011` / `0012` / `0013`
- Tech: `docs/tech/v0.2.1-workbench-core-tech.md` §1.3 §6
- 实施 plan: `docs/plans/YYYY-MM-DD-v0.2.1-workbench-core.md`(待创建)
