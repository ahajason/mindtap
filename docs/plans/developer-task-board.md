# 开发者任务跟踪板

> 本文档是 **@Developer（程序员）** 的任务跟踪板，与 `docs/governance/pm-customer-dialogue-prd.md` 配套使用。
> @Developer 读取 PM 文档 §三 了解需求，在此文档记录实现进度。
> **只有 @Developer 更新本文档**，@PM 和 @Customer 不直接修改。

---

## 关联文档

| 文档 | 说明 |
|---|---|
| `docs/governance/pm-customer-dialogue-prd.md` | PM-客户沟通 PRD：需求来源、设计决策、版本归属 |
| `docs/CLAUDE.md` | Agent 工作流铁律 |
| 各版本设计文档 | 详细设计以对应版本的设计文档为准 |

## 协作规则

1. @Developer 读取 PM 文档 §三「需求沉淀」了解需求条目清单（REQ-xx）；
2. 按条目实现后，**更新下方任务跟踪表**，标记完成情况并写备注；
3. 备注内容：完成的关键改动、关键文件路径、测试结果、遗留问题、需要 @PM 或 @Customer 确认的事项；
4. 如果发现需求模糊或无法实现，在备注中说明原因，等待 @PM 与 @Customer 沟通后再继续；
5. 不得擅自变更需求范围或超需求开发。

## 任务跟踪表

| 编号 | 完成情况 | 程序员备注 |
|---|---|---|
| REQ-01 | ✅ 已完成 | 产出 `docs/L-2-review/dormant-analysis.md`（失真确认闭环业务能力定义 & 现有实现偏差分析）。后端 `emit_dormant()` 统一 emit 事件 + `bubble.show()`，BubbleApp 监听正常，`DormantConfirmDialog` 返回 null 不再监听事件 |
| REQ-02 | ✅ 已完成 | 后端 3 处 `emit_dormant` 调用后均 `bubble.show()`；BubbleApp 轮询路径也 show；dormant 测试跨天边界修复。cargo test 66 passed |
| REQ-03 | ✅ 已完成 | 链路核实完整: `item_trigger_dormant` emit `floating:dormant` + `bubble.show()` 正常。按钮保护已从 `import.meta.env.DEV` 改为受 `developerMode` prop 控制（读取 `developer_mode_enabled` 设置）。后端加运行时检查 `developer_mode_enabled`。Security review MEDIUM 已修复 |
| REQ-04 | ✅ 已完成 | 设置页新增 4 个失真检测参数（冷却阈值/空闲超时/轮询间隔/后台扫描），持久化 `app_setting`，含范围校验 + 恢复默认值。后端 `get_cooling_ms()` / `get_idle_ms()` 从 DB 读取替代硬编码 |
| REQ-05 | ⏸️ 延后 | 评估结论：任务级个性化配置延后到 V0.2.3+，当前版本保持全局参数 |
| REQ-06 | ✅ 已完成 | 气泡标题/提示/按钮文字 3 处文案优化；Review.tsx 文案统一，空态增加引导语 |
| REQ-07 | ✅ 已完成 | Manage.tsx 删除按钮移入三点下拉菜单，`handleHardDelete` 加 `window.confirm` 二次确认 + toast 反馈 |
| REQ-08 | ✅ 已完成 | 评估结论：活动监听降级为可选设置（默认关闭），`activity_monitor_enabled` 控制开关 |
| REQ-09 | ✅ 已完成 | `commands/item.rs` 12 个写命令 + `commands/review.rs` 的 `associate_gap` 均 emit `floating:data_changed`；前端 Manage/Review/useActiveTasks 监听事件自动刷新 + 30s 轮询兜底 |
| REQ-10 | ✅ 已完成 | 全量回溯已完成：跨窗口同步、设计指南返回按钮（已验证正常）、文案统一。Review/security review 均无 blocking |
| REQ-11 | ✅ 已完成 | Settings.tsx 新增「开发者选项」面板（类比 Android）: 总开关 `developer_mode_enabled` 持久化到 `app_setting` + 失真检测参数（冷却阈值/空闲超时/轮询间隔/后台扫描）迁移到面板内。面板内容仅在总开关开启时显示。浮窗「失真」按钮改为受 `developerMode` prop 控制。cargo test 66 passed + vitest 111 passed + E2E 10 passed + tsc 无错误。验收修复1: ① 开关按钮 bg-glass-2 -> bg-inactive 提升玻璃背景可见性; ② 根容器 overflow-y:scroll 防展开收起抖动。验收修复2: ① AppLayout 外层 overflow-y-auto -> overflow-y-scroll 消除滚动条抖动根源; ② 移除 Settings.tsx 内层无用的 overflow-y-scroll。验收修复3: 保持 overflow-y:auto + scrollbar-gutter:stable 预留空间防抖动 + Mac 风格滚动条样式（6px 半透明圆角，参考 floating.css .floating-list）; 移除内层无用 overflow-y:scroll |

## 状态标记说明

| 标记 | 含义 |
|---|---|
| ✅ 已完成 | 已实现并通过验证 |
| 🔄 进行中 | 正在实现中 |
| ❌ 未开始 | 尚未开始 |
| ❌ 需重做 | 已实现但不满足要求，需重新实现 |
| ⏸️ 延后 | 经评审决定延期到后续版本 |

---

*本文档由 @Developer 维护，每次实现后更新。*
