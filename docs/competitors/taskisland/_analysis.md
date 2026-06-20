# TaskIsland vs Mindtap 对比分析

> **TL;DR** — TaskIsland 是**全功能 Todoist 级别**的 macOS 任务管理器(快速新增 / 多视图 / 重复 / 子任务 / 导入导出 / Apple Reminders 桥接),Mindtap 是**极简单机 + 焦点优先**的桌面工具(浮动窗 + 4 态计时 + 玻璃视觉)。两者**完全不是同赛道**——这份文档不是分胜负,是搞清楚"哪些是 TaskIsland 长处、哪些是 Mindtap 主动放弃、哪些我们可以选择性借鉴"。

| 维度 | Mindtap (Tauri + React + Rust) | TaskIsland (Swift + SwiftUI + SwiftData) |
|---|---|---|
| 平台 | macOS 26+ / Windows 11+ (Tauri 2) | **macOS 26+ 单平台** (`Package.swift:8`) |
| 代码量 | ~数千行 (TS + Rust) | **8398 行 Swift** (`wc -l` 实测) |
| 存储 | SQLite (`rusqlite` + `Mutex<Connection>`) | SwiftData (`@Model` + `ModelContext`,autosave) |
| 任务数据模型字段 | 9 个 (id/content/status/duration_ms/focus_started_at/...) | **21 个 stored + 5 个 computed** (见 [§1](#1-数据模型) ) |
| 状态机 | **显式 4 态 + L1/L2/L3 不变量** | 隐式 2-3 态 + `normalizeCurrentTask()` 兜底 |
| 提醒/通知 | V1.3 显式 out-of-scope,check_in 子类型 v0 草案中 | **双通道**: `UNUserNotificationCenter` + `Task.sleep` in-app (见 [§5](#5-提醒与通知)) |
| NLP 快速新增 | 手动 (浮窗 input box) | **344 行** `TaskQuickAddParser` 支持中文日期/时间/优先级/标签/项目/时长 (见 [§6](#6-快速新增与-nlp)) |
| 浮动/悬浮 UI | 浮窗 320×36 / 360×280, 4 态切换 | **悬浮岛 3 态切换**: 数字岛(172×30) / 专注岛(340×52) / 行动岛(440×动态) |
| 标签 / 项目 | 无 (V1.2 PRD 不在范围) | ✅ `tagsRawValue` + `projectName` |
| 子任务 | 无 | ✅ `[TaskSubtask]` JSON 字段 |
| 重复规则 | 无 | ✅ `TaskRepeatRule`: daily/weekly/monthly/yearly |
| 推迟(postpone) | 无 | ✅ 4 选项: 15min / laterToday / tomorrow / thisWeek |
| 视图 | 主窗 = 设置页(单列) | 10 视图: 全部/今天/建议/高优/即将/无日期/标签/项目/已完成/回顾 |
| 导入/导出 | **D23 显式不做** (本地 SQLite 单源) | ✅ JSON / Markdown / CSV 双向 + Apple Reminders 双向 |
| 设置持久化 | 单 JSON 文件 + atomic write + settings-changed 事件 | **15 个独立 `UserDefaults` key** + 迁移标志 |
| 全局快捷键 | `Cmd/Ctrl+Shift+Space` 切换浮窗 | `Control+Option+N` (可改) 打开快速新增 |
| 托盘 / 状态栏 | 托盘 4 项菜单 (V1.4) | ✅ `NSStatusItem` 实时显示待办数 / 当前任务标题 |
| 悬浮 UI 平台分 | Tauri `transparent + decorations(false) + alwaysOnTop` (三平台统一) | macOS-only: `NSPanel` + `hidesOnDeactivate` + `level = .floating` |
| 多显示器 | 浮动窗居中 (V1.3 spec) | `NSApplication.didChangeScreenParametersNotification` 监听重排 |
| 测试 / 工程纪律 | **TDD 硬约束 + smoke 5 层 (CLAUDE.md)** | `TaskIslandChecks` 轻量 sanity binary,无 CI / 无 smoke 自动化 |
| 玻璃视觉 | 自有 `glassmorphism-impl-spec.md` | 自有 `GlassStyle.swift` (12 行) + `CapsuleIslandView` 1047 行内联实现 |

---

## 1. 数据模型

| 字段(语义对齐) | Mindtap `task` | TaskIsland `TaskItem` |
|---|---|---|
| 主键 | `id` (i64 autogen) | `id: UUID` (`@Attribute(.unique)`) |
| 文本 | `content` | `title` + `notes`(单独备注字段) |
| 状态 | `status` (`pending`/`active`/`paused`/`done`) | `isCompleted: Bool` + `isCurrent: Bool` (二字段组合) |
| 排序 | `record.sort_order` | `sortIndex: Int` + `todaySortIndex: Int?` |
| 优先级 | 无 | `priorityRawValue: Int?` (high=0/med=1/low=2) |
| 截止/提醒 | `due_at` / `reminder_at` (DATETIME) | `dueAt: Date?` / `reminderAt: Date?` |
| 重复 | 无 | `repeatRuleRawValue: String?` |
| 标签 | 无 | `tagsRawValue: String?` (逗号分隔) |
| 项目 | 无 | `projectName: String?` |
| 预估时长 | 无 | `estimatedMinutes: Int?` |
| 子任务 | 无 | `subtasksRawValue: String?` (JSON-encoded `[TaskSubtask]`) |
| 焦点计时 | `first_focused_at` / `focus_started_at` / `paused_at` / `duration_ms` / `focused_count` | `focusStartedAt: Date?` + `focusAccumulatedSeconds: Double?` |
| 推迟 | 无 | `postponedAt: Date?` + `postponeCountRawValue: Int?` |
| 时间戳 | `created_at` / `updated_at` | `createdAt: Date` / `updatedAt: Date` + `completedAt: Date?` |
| **双写视图** | ✅ `record(kind, source_id, content, status, created_at)` 视图表 | ❌ 无对应视图表,UI 直接读 `@Published tasks` |

**差距分析**:

- **Mindtap 的"窄 + 双写"路线**:`task` 表只存焦点相关字段(9 个),`record` 视图表承担所有"展示给用户"的列表聚合。`record_get_active_task` command 用 `source_id` 回查 `task` 拿完整计时数据。**这是显式的 CQRS-lite**——写窄表 + 读宽表,schema 演进可独立,代价是双写事务必带 `conn.transaction()`。
- **TaskIsland 的"宽 + 单写"路线**:`TaskItem` 把 21 个字段全装在一张 SwiftData `@Model` 上,读路径直接遍历 `@Published tasks`,`autosaveEnabled = true` 自动落盘。**ORM 友好**,SwiftData 用 `init` / 属性包装器自动算出增量列,代码极短;代价是状态机散在 `isCompleted` / `isCurrent` / `focusStartedAt` 三个字段,必须靠 `normalizeCurrentTask()` 兜底(对应 Mindtap 的 L1 不变量)。

**对 Mindtap 的启示**:
- ✅ 不必学。Mindtap 的双写架构对 SQLite + Rust + 显式 SQL 是更可控的——ORM 友好不等于 Rust 友好。
- ⚠️ 如果未来加 `due_at` / 提醒(目前 V1.3 显式 out-of-scope),参考 `TaskItem.priorityRawValue` 的 enum-int 编码(而不是 `TEXT` enum),在 SQLite 上查询时直接走索引,无需字符串比较。

---

## 2. 状态机

```text
Mindtap (db/task.rs):
  pending ──start_timer──▶ active ◀──resume── paused ──pause── active
                              │                                  │
                              └──complete──▶ done ◀──undo────────┘
                              ▼
                          archive (任意态 → archived_at 非空)

TaskIsland (TaskStore.swift:343-481, 隐式 2-3 态):
  (任意未完成) ──setCurrent──▶ isCurrent=true  ──startFocus──▶ focusStartedAt ≠ nil
                                  │                              │
                                  │                              ├──pauseFocus──▶ focusStartedAt=nil (累加到 focusAccumulatedSeconds)
                                  │                              └──stopFocus──▶ focusStartedAt=nil
                                  └──complete──▶ isCompleted=true (+ makeNextRecurringTask)
```

**差距分析**:

| 不变量 | Mindtap | TaskIsland |
|---|---|---|
| L1 全局唯一 active | **硬约束**:任何 `→active` 前 `SELECT ... WHERE status='active' AND id != ?`,违反抛 `AppError::ActiveExists` | **软约束**:`normalizeCurrentTask()` 在 init / setCurrent / startFocus / complete 后调用兜底,清掉所有 `isCurrent=true` 留下当前一个;**理论上多线程竞争可能并存**(`TaskStore` 标了 `@MainActor` 才安全) |
| L2 暂停保留时长 | `pause` 累加 `now - focus_started_at` 到 `duration_ms` 后清 `focus_started_at` | 同样累加到 `focusAccumulatedSeconds`,在 `pauseFocus` 调 `stopFocusClock` |
| L3 非法转换 | `pause` / `complete` 要求前置 `active`,`resume` / `undo` 要求前置 `paused` / `done`,否则抛 `AppError::InvalidTransition` | **无显式检查**——`pauseFocus` 只 `guard !task.isCompleted`,允许"已完成任务进入暂停态"这种空操作;靠 UI 隐藏按钮避免 |
| L4 完成清 focus | ✅ 完整清理 | ✅ `stopFocusClock` + `clearFocusAttentionIfNeeded` |
| L5 重复展开 | ❌ 不支持 | ✅ `makeNextRecurringTask(from:)` 在 `complete` 时插入下一条 |

**对 Mindtap 的启示**:
- ✅ L1/L2/L3 的硬约束是 Mindtap 比 TaskIsland 严谨的地方,**保留**——Rust 编译器 + 事务 + 显式 `AppError` 是优势,不能学 SwiftData 的"靠 @MainActor 兜底"。
- 🟡 重复规则 (L5) TaskIsland 用 49 行函数就搞定了,值得未来借鉴——但要等 V1.x 之后再说,V1.2 PRD 显式不在范围。

---

## 3. 浮动/悬浮 UI

| 维度 | Mindtap FloatShell | TaskIsland CapsuleIslandView |
|---|---|---|
| 状态数 | 4 (collapsed / quick-input / focus-running / settings) | **3** (数字岛 / 专注岛 / 行动岛) |
| 折叠尺寸 | 320×36 (固定) | 172×30 (固定) |
| 展开尺寸 | 360×280 (固定) | 440×动态(高 = visibleRows×35+17,1-3 行) |
| 专注尺寸 | (含于 quick-input) | 340×52 |
| 视觉 | `backdrop-filter: blur(24px)`,3 层玻璃 + 透明白渐变 | `AngularGradient` rotation attention glow,密度自适应 (transparency > 72% 时) |
| 平台分 | `tauri.conf.json` 三平台统一 `transparent + decorations(false) + alwaysOnTop` | macOS-only:`NSPanel` + `level = .floating` + `canJoinAllSpaces` |
| 拖动 | (V1.3 spec 未明示,默认 titlebar 不可见) | ✅ `panelDragStartFrame` / `mouseDownCanMoveWindow = false` 显式实现拖动 |
| 多显示器 | (V1.3 spec 仅居中) | ✅ 监听 `NSApplication.didChangeScreenParametersNotification` 重排 |
| 默认位置 | (CLAUDE.md 要求 macOS 显式 `setPosition` 避免被菜单栏遮) | `capsuleYOffset` + `capsuleTopY` 可调,默认顶部对齐 |

**差距分析**:

- **TaskIsland 的"动态高度"**:`expandedSize` 根据 `store.incompleteCount` 计算 92-122px,行动岛只显示 1-3 条,**避免空列表拉伸**。Mindtap 固定 360×280 是一刀切,空状态也会占同样大空间。
- **TaskIsland 的"焦点+提醒冲突优先级"**:`refreshLayout()` 里 `if store.focusAttentionTask != nil, !isPinned, isExpanded { collapseImmediatelyForAttention(); return }`——专注态强制折叠展开岛,避免视觉打架。Mindtap 的 4 态切换通过 React 条件渲染实现,没有这个冲突,但也没这么显式。
- **TaskIsland 的 attention glow**:`AngularGradient` 旋转动画,transparency > 72% 时触发 "density boost" 视觉强化。Mindtap 的 Glassic UI 在 `glassmorphism-impl-spec.md` 有自己的 token,不走旋转动画路径。

**对 Mindtap 的启示**:
- 🟡 **动态高度**(行动岛自适应) 值得借鉴,但要等 V1.6+ 看主窗是否也走"列表自适应"再统一设计。
- 🟡 **`didChangeScreenParameters` 多屏监听** 在 Tauri 上有对应 `WindowEvent::Resized` / monitor change 事件,可以做——但 V1.3 spec 只要求"居中",优先级低。
- ❌ **attention glow 旋转动画** 跟 Mindtap "极简" 调性冲突,不学。

---

## 4. 标签 / 项目 / 子任务 / 重复 / 推迟

这五个维度 TaskIsland 全做, Mindtap **一个都没做**。原因见 `docs/archive/v1.0/prd-v1.2.md` 的 V1.2 PRD——核心定位是"轻量焦点",不是"任务管理系统"。

| 维度 | TaskIsland 实现 | 行数参考 | Mindtap 状态 |
|---|---|---|---|
| 标签 | `tagsRawValue: String?` 逗号分隔 + `tags: [String]` computed | 13 行 getter/setter | ❌ V1.2 不在范围 |
| 项目 | `projectName: String?` 字符串 | 1 字段 | ❌ V1.2 不在范围 |
| 子任务 | `subtasksRawValue: String?` JSON-encoded `[TaskSubtask]` | 30 行 (含 `TaskSubtask` struct + computed) | ❌ V1.2 不在范围 |
| 重复 | `repeatRuleRawValue: String?` (4 枚举) + `makeNextRecurringTask` | 49 行 (estimate) | ❌ V1.2 不在范围 |
| 推迟 | 4 选项 enum + `dueAt` 重算 + `postponeCount` 自增 | 30 行 | ❌ V1.2 不在范围 |

**对 Mindtap 的启示**:
- ❌ V1.x **全部不收**。任何"加个标签吧"的需求出现时,直接指向 V1.2 PRD D23 决策:"本阶段不做任务管理系统的扩展,只做轻量焦点 + 提醒"。
- 🟢 如果未来(假设 V2.0)需要,TaskIsland 的"逗号分隔 tagsRawValue + JSON-encoded subtasksRawValue"是 **典型的"省一次迁移"小聪明**——但代价是失去 SQL 索引能力。**Mindtap 真要做应该走单独表** + 外键,SQLite 索引能用上。

---

## 5. 提醒与通知

| 维度 | Mindtap | TaskIsland |
|---|---|---|
| 范围 | **V1.3 显式 out-of-scope**;V1.4 check_in 子类型 v0 草案(7 sub_types: emotion/sleep/water/med/habit/food/review) | ✅ 完整双通道 |
| 系统通知 | 无 | `UNUserNotificationCenter` + `UNTimeIntervalNotificationTrigger` |
| 应用内提醒 | 无 | `Task<Void, Never>` + `Task.sleep(nanoseconds:)` + `onReminderDue` 回调 |
| 调度策略 | 无 | `sync(tasks:)` 每次 `store.$tasks` 变化时全量重算,先 cancel stale 再 add new |
| 权限 | 无 | `requestAuthorization(options: [.alert, .sound])` + 失败提示 |
| 沙箱身份 | 无 | `taskisland-reminder-<UUID>` identifier 前缀便于清理 |

**TaskIsland 关键代码** (`ReminderNotificationScheduler.swift`):
- 18 行 `sync(tasks:)` 入口——`compactMap` 出未完成且 `reminderAt > Date()` 的快照
- `syncInAppReminders` 用 `[String: Task<Void, Never>]` map 管理,每次全 cancel + 重 spawn
- `Task.sleep` 后 `MainActor.run` 回调,触发悬浮岛 `showReminderAlert(taskID:)`

**对 Mindtap 的启示**:
- 🟡 **V1.4 check_in 子类型** 正在 spec 阶段(7 sub_types 已定),提醒是其中"habit"子类型的核心。**借鉴 `sync(tasks:)` 全量重算模式**——Tauri 这边对应 `invoke('refresh_checkin_reminders')` 后端 command,Rust 端做 schedule diff,前端 `useEffect` 监听 `checkin-reminders-updated` 事件重渲。
- 🟡 **`taskisland-reminder-<UUID>` 命名空间** 思路好,前端用 `localStorage` key 前缀 / Tauri 端用 sqlite `reminder_id` 唯一键都可类比。
- ❌ **`UNUserNotificationCenter` 跨平台替代** 是 `tauri-plugin-notification`,但权限模型不同(Windows / macOS / Linux 行为不一致),**当前 V1.4 阶段先 in-app,V1.5+ 再考虑系统通知**。

---

## 6. 快速新增与 NLP

`TaskQuickAddParser.swift` **344 行**,纯 Swift `NSRegularExpression` 解析,无外部 NLP 库依赖。

支持 token:

| 类型 | 例子 | 语义 |
|---|---|---|
| 优先级 | `!高` / `!high` / `p1` / `优先级高` / `!中` / `p2` / `!低` / `p3` | high / medium / low |
| 标签 | `#工作` / `#urgent-fix` | tag 列表 |
| 项目 | `+个人` / `+side-project` | 单 projectName |
| 时长 | `/30m` / `/2h` / `30分钟` / `2小时` | estimatedMinutes |
| 日期 | `今天` / `今晚` / `明天` / `明晚` / `后天` / `周一` ... `周六` | dueAt |
| 重复 | `每天` / `每日` / `每周` / `每星期` / `每月` / `每年` | TaskRepeatRule |
| 时间 | `10:30` / `10点半` / `10点` / `今晚` (=20:00) / `明早` (=9:00) | hour + minute |
| 上下午 | `下午` / `晚上` / `今晚` / `明晚` | hour<12 时 +12 |

完整例子: `明天 10点 发周报 #工作 !高 /30m` → 标题"发周报", `dueAt = 明天 10:00`, `tags = [工作]`, `priority = high`, `estimatedMinutes = 30`。

**Mindtap 现状**: 浮窗 quick-input state 只有一个 `<input>` + submit,**无 NLP 解析**,用户写什么存什么。

**对 Mindtap 的启示**:
- 🟡 **轻量 token 解析** 是值得做的——MVP 范围: 优先级 (`!高`/`!低`) + 标签 (`#xxx`) + 时长 (`/30m`),共 30 行正则足够,不需要 344 行全套。位置: `src/lib/quick-add-parser.ts`,浮窗 quick-input 提交前过一遍。
- ❌ **中文日期 / 时间 / 重复** 太重,先不做。V1.2 PRD 用户画像是"自由职业 / 创作者",手动选 due date 比 NLP 更可控。
- ⚠️ 边界: 解析失败的 token 要**留在 title 里**,不要静默吞掉——参考 `TaskQuickAddParser` 的 `removeRange` 模式("匹配成功的才移除"),保证 "明天 10点 发周报 !乱码" 中的 "!乱码" 留在标题里。

---

## 7. 视图 / 列表 / 搜索

| 维度 | Mindtap | TaskIsland |
|---|---|---|
| 视图数 | 1 (主窗=设置页,V1.5) | **10** (全部/今天/建议/高优/即将/无日期/标签/项目/已完成/回顾) |
| 列表数据源 | `record` 视图表 (聚合) | `@Published tasks` 数组 + `sorted` / `sortedByPriority` / `sortedToday` 三种排序函数 |
| 搜索 | 无 | `tasks(matching:)` 跨 title/notes/tags/projectName 4 字段 |
| "今天"语义 | `record.record_date` 字段 | `todaySortIndex != nil` 标记 + `Calendar.isDateInToday` |
| "建议"算法 | 无 | `suggestedTodayTasks(limit:)` 综合 priority + dueAt + sortIndex 打分 |
| 折叠已完成 | (V1.x 未到) | V0.1.3 默认折叠,只显示数量+展开按钮 |
| 每日回顾 | check_in (V1.4 草案) | `dailyReview(now:)` 返回 `TaskDailyReview` struct |

**对 Mindtap 的启示**:
- ❌ 多视图 (10 个) **不做**。V1.5 主窗=设置页是有意为之——轻量定位,不在主窗堆任务列表。
- 🟡 **`suggestedTodayTasks` 打分算法** 在"建议"场景有借鉴价值,但 Mindtap 没有"今天"语义——等 V1.4 check_in 落地后再考虑。
- 🟡 **折叠已完成** 是个好 UX 决策,等 Mindtap 有"任务列表"组件时直接套用。

---

## 8. 导入/导出与 Apple Reminders 桥接

| 维度 | Mindtap | TaskIsland |
|---|---|---|
| 决策 | **D23 显式不做** (V1.2 PRD) | ✅ 完整支持 |
| JSON | ❌ | ✅ `TaskArchive(version: 2, exportedAt, tasks: [TaskArchiveItem])` + ISO8601 + prettyPrinted + sortedKeys |
| Markdown | ❌ | ✅ checkbox 风格 + 优先级/截止/项目/标签/时长 metadata 行 |
| CSV | ❌ | ✅ 表头中文(`标题`/`优先级`/`截止`/...),带 Todoist 风格导入识别 |
| Apple Reminders | ❌ (跨平台,EventKit 仅 macOS) | ✅ 双向: `importIncompleteReminders` + `exportIncompleteTasks`,自动建"任务岛"calendar,`TaskIsland-ID:<UUID>` 标识防重复 |

**对 Mindtap 的启示**:
- ❌ **D23 不做就是不做**——导入导出意味着 schema 兼容性问题、迁移工具、版本号管理,跨平台更复杂(EventKit 没有 Windows / Linux 等价物)。**V1.x 阶段坚守 D23**。
- 🟢 如果未来真要做,**优先级排序**: ① JSON dump/restore (灾难恢复) > ② Markdown 单向导出 (用户友好) > ③ CSV (Power User) > ④ Apple Reminders 桥 (V2.0 再说)。
- ⚠️ 任何 export 必须**显式带 schema version**,参考 `TaskArchive(version: 2, ...)`——版本号错一位就全量数据迁移。

---

## 9. 设置持久化

| 维度 | Mindtap | TaskIsland |
|---|---|---|
| 存储 | **单 JSON 文件** `~/Library/Application Support/com.mindtap.app/settings.json` | **15 个独立 `UserDefaults` key** + 迁移标志 |
| 原子写 | ✅ `tmp → fsync → rename` (atomic) | ❌ `UserDefaults` 内部处理,无显式 fsync |
| 写后通知 | ✅ `emit("settings-changed", ())` → `useSettings` 订阅 | ❌ `@Published` 自动驱动 SwiftUI 重渲 |
| 迁移 | schema.rs 改字段加默认值 | `didMigrateTopAlignedOffset` / `didMigrateTransparencySemantic` 两个 bool 标志 |
| Source of truth | JSON 文件 | UserDefaults 标准套件 |
| 跨平台 | ✅ 路径用 `app_log_dir()` 跨平台 | ❌ UserDefaults 是 Apple 生态 |
| 设置面板 | 7 sections (V1.5 spec) | 3 sections: 显示与专注 / 优先级与悬浮岛 / 快捷键与数据 |

**TaskSettings 字段全表** (`AppSettings.swift:182-201`):
```
showCapsule / showTitleInMenuBar / darkGlassMode /
defaultFocusMinutes / quickAddShortcutKeyCode / quickAddShortcutModifiersRawValue /
highPriorityColorHex / mediumPriorityColorHex / lowPriorityColorHex /
capsuleYOffset / capsuleTransparencyPercent / capsuleBackgroundColorHex / capsuleTextColorHex /
hasCapsuleCustomPosition / capsuleAnchorX / capsuleTopY
```

**对 Mindtap 的启示**:
- ✅ **单 JSON + atomic write** 比 15 个 UserDefaults key 更可控——schema 集中可 diff,跨平台一致,**保留**。
- 🟡 **`@Published` 自动驱动 UI** 在 SwiftUI 是天然优势,在 React 这边对应 `useSettings` hook + `settings-changed` 事件,**我们已经做到了**,无差距。
- ⚠️ **迁移标志 bool** (`didMigrateXxx`) 是 TaskIsland 的痛点——加一个迁移就多一个 bool,版本多了就乱。Mindtap 的 `Settings` 结构体在 Rust 端有 `serde(default)`,加字段只写 default 即可,**更优雅**。

---

## 10. 全局快捷键

| 维度 | Mindtap | TaskIsland |
|---|---|---|
| 默认 | `Cmd/Ctrl+Shift+Space` 切换浮窗 | `Control+Option+N` 打开快速新增 |
| 库 | `tauri-plugin-global-shortcut` | `Carbon` (macOS-only) `RegisterEventHotKey` |
| 自定义 | V1.5 spec 有 Hotkey bitmask u32 + Code enum | ✅ `quickAddShortcutKeyCode` + `modifiersRawValue` (7 modifiers × 27 keys = 189 组合) |
| 冲突处理 | (V1.5 spec 计划) | "这个快捷键可能已被其他程序占用,请换一个组合。" (`AppCoordinator.swift:119`) |
| 多热键 | (V1.5 spec 计划) | 只一个 (快速新增) |

**对 Mindtap 的启示**:
- ✅ **冲突处理** TaskIsland 的错误提示值得直接抄——"这个快捷键可能已被其他程序占用,请换一个组合。" 中文用户友好,**纳入 V1.5 settings 页面**。
- 🟡 **多热键** Mindtap V1.5 已规划 (Cmd+Shift+Space 浮窗 + 可能加一个 focus toggle),沿用 Tauri 插件即可,无需新设计。

---

## 11. 托盘 / 状态栏

| 维度 | Mindtap (V1.4) | TaskIsland |
|---|---|---|
| 库 | `tauri-plugin-tray` | `NSStatusItem` |
| 菜单 | 4 项: 切换浮窗/切换主窗/Autostart/Quit | 动态 7+ 项 (视图切换 + 数据操作 + 退出) |
| 状态显示 | 无 | ✅ 实时显示待办数 / 当前任务标题 (`StatusItemController.swift:40-50`) |
| 重建策略 | (V1.4 spec: 每次 autostart 状态变化重建) | Combine sink on `settings.$showTitleInMenuBar` |
| 工具提示 | 无 | `button.toolTip = "任务岛: \(incompleteCount) 个待办"` |

**对 Mindtap 的启示**:
- 🟡 **状态栏动态数字** (`$incompleteCount` 个待办) 是个低成本 UX 增值——Tauri tray 插件支持 `set_title()`,**V1.4 之后可加**。
- ❌ **多菜单项 (7+)** 跟 Mindtap "极简" 调性冲突,V1.4 4 项足够。

---

## 12. 测试与工程纪律

| 维度 | Mindtap | TaskIsland |
|---|---|---|
| 测试策略 | **TDD 硬约束**: 新增/修改 `src/**` 或 `src-tauri/**/*.rs` 必须先写失败测试 → 最小实现 → 全层套件绿 (CLAUDE.md 第 28 行) | 无明确测试策略 |
| 测试类型 | 单元 + 契约 + visual baseline + 浮窗 smoke 5 层 | 1 个 `TaskIslandChecks` 轻量 sanity binary (人工跑) |
| CI | (无 .github/workflows,但有本地四件套脚本) | 无 |
| Smoke 自动化 | **`npm run smoke:floating` 5 层**,任何浮窗改动必须 5/5 PASS | 无 |
| Lint | Rust `cargo check` + TypeScript `tsc --noEmit` + Vitest | 无 |
| Cargo.lock | `.gitignore` (单二进制惯例) | n/a (Swift Package) |

**对 Mindtap 的启示**:
- ✅ **TDD + smoke 五层** 是 Mindtap 的硬护城河,TaskIsland 在这块**远落后于我们**。**保留并强化**。
- 🟡 `TaskIslandChecks` 思路可借鉴——一个独立 executable binary 跑 invariants,适合做 release 前 sanity check。Mindtap 已经有 `cargo test`,**无需额外**。

---

## 13. 视觉风格

| 维度 | Mindtap | TaskIsland |
|---|---|---|
| 规范文档 | `docs/projects/design-system/glassmorphism-impl-spec.md` (项目自有) | `GlassStyle.swift` (12 行) + 视图内联 |
| 实施层 | Tailwind v4 + CSS 变量 + Radix primitive | SwiftUI `Material` + `AngularGradient` + 自定义 shape |
| 玻璃 token | 完整 token 体系(blur, alpha, tint) | `darkGlassMode` 单一开关 + 透明度百分比 |
| 配色自定义 | 暂未开放 | ✅ 3 优先级颜色 + 悬浮岛背景色/文字色/透明度共 7 个可调 |
| 动画 | CSS transition / framer-motion (V1.3 spec) | `withAnimation(.easeOut)` + `AngularGradient` rotation |
| 多档玻璃 | (V1.3 spec 透明度梯度) | transparency > 72% 时 density boost |

**对 Mindtap 的启示**:
- ✅ **设计 token 集中规范** 比 TaskIsland 散在视图里好——**保留**。
- 🟡 **配色自定义 (7 个可调)** 是 Power User 喜欢的功能,但 V1.5 主窗=设置页阶段,先把 7 sections 落实,**配色自定义放到 V1.6+ 再说**。
- ❌ **`AngularGradient` 旋转动画** 不适合 Mindtap 的"静态居中"调性。

---

## 14. 多显示器 / 系统集成

| 维度 | Mindtap | TaskIsland |
|---|---|---|
| 多显示器 | (V1.3 spec 浮窗居中) | ✅ `NSApplication.didChangeScreenParametersNotification` |
| 屏幕变化重排 | (V1.3 spec 未明示) | ✅ `screenParametersDidChange() → islandPanelController?.refreshLayout()` |
| URL Scheme | 无 | ✅ `taskisland://add?title=...` / `taskisland://focus` / `taskisland://complete` / `taskisland://show` |
| 系统通知 | (V1.4+ 计划) | ✅ UN + in-app 双通道 |
| 登录启动 | (V1.5 spec: autostart 真实状态镜像) | ✅ "登录启动安装配置" |
| Apple 提醒事项 | ❌ 跨平台不做 | ✅ EventKit 双向 |
| `NSPanel` 高级行为 | n/a | `.canJoinAllSpaces` + `.fullScreenAuxiliary` (全屏辅助) |

**对 Mindtap 的启示**:
- 🟡 **URL Scheme** 是 V2.0+ 的扩展点 (类似 TaskIsland),但 V1.x 不在范围。
- 🟡 **多显示器屏幕变化监听** Tauri 2 有 `WindowEvent::Resized` / `currentMonitor` 变化事件,可做但优先级低。
- ❌ **Apple 提醒事项桥** 跨平台无解,不做。

---

## 15. 业务定位差异 (战略层)

| 维度 | Mindtap | TaskIsland |
|---|---|---|
| 一句话定位 | "极简记录,液态玻璃" | "任务随手记,提醒刚刚好" |
| 目标用户 | 自由职业 / 创作者 / 注意力分散者 | 通用任务管理用户 |
| 核心场景 | 快速记一个念头 + 进入焦点 | 完整 Todoist-style 任务管理 |
| 视觉调性 | 静态居中、极简、单一焦点 | 动态悬浮岛、密度自适应、状态丰富 |
| 数据哲学 | 本地 SQLite,绝不外传 | 本地 SwiftData + 可导入导出 |
| 状态机哲学 | **显式 4 态 + 不变量硬约束** | 隐式多态 + @MainActor 兜底 |
| 范围扩张风险 | 低 (V1.x 主动收缩) | 高 (已经是 Todoist 替代品) |

**结论**:
- **不是同赛道**——Mindtap 是 "**焦点工具**",TaskIsland 是 "**任务管理器**"。
- TaskIsland 的功能我们大多**主动不做** (V1.2 PRD D23 决策)。
- TaskIsland 在 **NLP 解析 / 提醒 / 标签 / 重复** 上是参考样板,但**仅在 V2.0+ 借鉴,不抢 V1.x 节奏**。

---

## 16. 统计

### TaskIsland 代码量 (`wc -l` 实测)

| 文件 | 行数 |
|---|---|
| `Sources/TaskIslandCore/TaskStore.swift` | **1469** |
| `Sources/TaskIsland/Views/CapsuleIslandView.swift` | **1047** |
| `Sources/TaskIsland/IslandPanelController.swift` | 720 |
| `Sources/TaskIsland/Views/MenuBarWindowView.swift` | 1721 |
| `Sources/TaskIsland/Views/TaskRowView.swift` | 766 |
| `Sources/TaskIsland/AppleRemindersBridge.swift` | 242 |
| `Sources/TaskIslandCore/TaskQuickAddParser.swift` | 344 |
| `Sources/TaskIslandCore/TaskItem.swift` | 241 |
| `Sources/TaskIsland/AppSettings.swift` | 203 |
| `Sources/TaskIsland/TaskPanelController.swift` | 196 |
| `Sources/TaskIsland/Views/QuickAddView.swift` | 173 |
| `Sources/TaskIsland/ReminderNotificationScheduler.swift` | 117 |
| `Sources/TaskIsland/QuickAddPanelController.swift` | 108 |
| `Sources/TaskIsland/HotKeyManager.swift` | 99 |
| `Sources/TaskIsland/TaskIslandShortcut.swift` | 99 |
| `Sources/TaskIsland/AppCoordinator.swift` | 129 |
| **小计 (Top 16)** | **7674** |
| **总计 (`wc -l` 全量)** | **8398** |

### 字段数对比

| 数据结构 | 字段数 |
|---|---|
| Mindtap `task` 表 (源表) | 9 |
| Mindtap `record` 表 (视图表) | 7 |
| TaskIsland `TaskItem` stored | **21** + 5 computed |
| TaskIsland `AppSettings` `@Published` | **15** |

### 版本

- TaskIsland 当前 **0.1.3** (2026-06-03),初始 0.1.0 (2026-06-01),**2 周内 3 个迭代**——开发速度比 Mindtap 快,但缺乏版本约束纪律(无 CHANGELOG,无 semver 严格遵循)。
- Mindtap 截至 2026-06-20 仍在 V1.5 (设置页) 阶段。

---

## 跨上下文复检

### 显式"未改的 + 为什么"

| TaskIsland 特性 | Mindtap 状态 | 为什么不引入 |
|---|---|---|
| 标签 / 项目 / 子任务 / 重复 | ❌ 不做 | V1.2 PRD D23:"本阶段不做任务管理系统扩展,只做轻量焦点 + 提醒" |
| 10 任务视图 | ❌ 不做 | V1.5 主窗=设置页是有意为之,极简定位,不在主窗堆任务列表 |
| 导入/导出 (JSON/MD/CSV) | ❌ 不做 | V1.2 PRD D23,跨平台 schema 兼容性问题;V2.0+ 再考虑 |
| Apple Reminders 桥 | ❌ 不做 | 跨平台无解 (EventKit 仅 macOS),与多平台策略冲突 |
| 系统通知 (UN) | 🟡 V1.4+ 计划 | V1.3 显式 out-of-scope,check_in 子类型 v0 草案阶段 |
| NLP 完整 344 行解析器 | 🟡 30 行 MVP | 只做优先级 + 标签 + 时长 token,中文日期/时间/重复先不做 |
| `AngularGradient` 旋转动画 | ❌ 不学 | 与 Mindtap 静态居中调性冲突 |
| `NSPanel` 高级行为 | n/a | Tauri 自有窗口 API,跨平台不需模仿 |
| 多显示器屏幕变化监听 | 🟡 优先级低 | V1.3 spec 仅要求"居中",未要求重排 |
| URL Scheme | ❌ V1.x 不做 | 跟"快捷键一键唤起浮窗"价值重叠 |
| 配色自定义 7 项 | 🟡 V1.6+ 再说 | V1.5 先把 7 sections 落实,不在设置页堆视觉配置 |
| 推迟 4 选项 | ❌ 不做 | 跟 V1.x "完成就 done"调性冲突,推迟会破坏焦点流 |

### 借鉴清单 (按优先级)

| 借鉴项 | 优先级 | 目标版本 | 来源行 |
|---|---|---|---|
| 浮窗快速新增 token 解析 (`!高` / `#xxx` / `/30m`) | 🟡 P1 | V1.4 浮窗 quick-input | `TaskQuickAddParser.swift:32-78` |
| 系统快捷键冲突的中文错误提示 | 🟡 P1 | V1.5 设置页 hotkey 段 | `AppCoordinator.swift:119` |
| `sync(tasks:)` 全量重算提醒模式 | 🟡 P1 | V1.4 check_in habit 子类型 | `ReminderNotificationScheduler.swift:18-77` |
| 行动岛动态高度 (1-3 行自适应) | 🟢 P2 | V1.6+ 主窗若做任务列表 | `IslandPanelController.swift:31-35` |
| 状态栏动态显示待办数 | 🟢 P2 | V1.4 之后 tray 增强 | `StatusItemController.swift:40-50` |
| `taskisland-reminder-<UUID>` 命名空间 | 🟢 P2 | V1.4 check_in | `ReminderNotificationScheduler.swift:7` |
| `TaskArchive(version: 2, ...)` JSON 导出带 schema version | ⚪ P3 | V2.0+ 灾难恢复 | `TaskStore.swift:651-661` |
| `didChangeScreenParameters` 多屏监听 | ⚪ P3 | V2.0+ | `AppCoordinator.swift:111-113` |
| URL Scheme (`taskisland://`) | ⚪ P3 | V2.0+ | (README 第 161-166 行) |

### 风险点

- **TaskIsland 开发速度比我们快**——2 周 3 个迭代,我们 V1.5 还在设计中。要保持不被它"压着走"的信心,牢记**定位差异** (极简焦点 ≠ 任务管理),不因功能对比而焦虑。
- **TaskIsland 缺工程纪律**——无 CI / 无自动化测试 / 无 smoke,我们不要学。
- **TaskIsland 的 `normalizeCurrentTask` 兜底是技术债**——他们不显式 throw 错误,只静默清掉多个 `isCurrent`,将来排查"为什么 isCurrent 丢了"会很痛。**我们的 L1 硬约束是更好的设计**,保留。

---

## 引用源码位置 (速查)

- 数据模型字段: `Sources/TaskIslandCore/TaskItem.swift:75-100`
- 状态机核心: `Sources/TaskIslandCore/TaskStore.swift:343-481`
- 重复规则展开: `Sources/TaskIslandCore/TaskStore.swift:980` (`makeNextRecurringTask`,在 `complete` 中调用见 `:346`)
- 推迟 4 选项 enum 定义: `Sources/TaskIslandCore/TaskStore.swift:5-36`;`postpone` 方法体: `:527-557`
- NLP 解析器: `Sources/TaskIslandCore/TaskQuickAddParser.swift:1-344`
- 提醒双通道: `Sources/TaskIsland/ReminderNotificationScheduler.swift:1-117`
- 悬浮岛 3 态: `Sources/TaskIsland/IslandPanelController.swift:25-35` (尺寸) + `Sources/TaskIsland/Views/CapsuleIslandView.swift:1-1047`
- 状态栏动态标题: `Sources/TaskIsland/StatusItemController.swift:40-50`
- 设置字段 15 个: `Sources/TaskIsland/AppSettings.swift:7-71`
- 设置 UserDefaults 迁移: `Sources/TaskIsland/AppSettings.swift:96-114`
- Apple Reminders 桥: `Sources/TaskIsland/AppleRemindersBridge.swift:1-242`
- 快捷键冲突提示: `Sources/TaskIsland/AppCoordinator.swift:119`
- 多屏监听: `Sources/TaskIsland/AppCoordinator.swift:111-113`
- 导出 JSON 带 version: `Sources/TaskIslandCore/TaskStore.swift:651-661`
- URL Scheme: `README.md:161-166`

---

## 维护说明

- 本文档以 **TaskIsland v0.1.3 (2026-06-03)** 为基线,TaskIsland 后续版本需重新对比。
- Mindtap 基线为 **V1.5 设置页** (2026-06-19 spec),后续 V1.6+ 需更新借鉴清单的执行状态。
- 任何"借鉴 TaskIsland 特性"的 PR,必须在本文件"借鉴清单"加一行 + 标注完成。
- 任何"否定 TaskIsland 特性"的决策,必须在"显式未改的 + 为什么"加一行 + 给出 spec 引用。

---

## 附录 A · 完整功能对比表

> 把正文章节里所有"维度 / 子项"摊平,每行一项,**保留可定位的源行号**。Mindtap 列给出现状与 V1.x 基线归属,TaskIsland 列给出现状与源行号,差距列写"差距 + 是否借鉴"。

### A.1 数据存储

| # | 子项 | Mindtap | TaskIsland | 差距 / 是否借鉴 |
|---|---|---|---|---|
| 1 | 平台 | macOS 26+ / Windows 11+ | macOS 26+ only | Mindtap 多 1 平台;**不借鉴**(我们多平台是优势) |
| 2 | 存储引擎 | SQLite (`rusqlite`) | SwiftData (`@Model` + `ModelContext(autosaveEnabled: true)`) | 范式差异;**不借鉴** |
| 3 | 数据库 schema 来源 | `src-tauri/src/db/schema.rs::create_tables` | SwiftData `Schema([TaskItem.self])` | 都代码生成;等价 |
| 4 | 全局锁 | `DbState(Mutex<Connection>)` 单连接 | `ModelContext` 自动管理 + `@MainActor` 串行 | Mindtap 更显式;**保留** |
| 5 | 任务表字段数 | **9** (id/content/status/duration_ms/focus_started_at/paused_at/first_focused_at/focused_count/...) | **21** stored + 5 computed (`TaskItem.swift:75-100`) | 差距 12 字段,见 A.2 |
| 6 | 视图表 (双写) | ✅ `record(kind, source_id, content, status, created_at)` 7 字段 | ❌ 无,UI 直接读 `@Published tasks` | Mindtap CQRS-lite;**不借鉴** |
| 7 | 主键类型 | `INTEGER PRIMARY KEY AUTOINCREMENT` | `UUID` (`@Attribute(.unique)`) | Mindtap 整数更紧凑;**不借鉴** |
| 8 | 写后事件 | `emit("focus-changed")` / `emit("record-updated")` | Combine `@Published` 自动驱动 | 范式差异,等价 |

### A.2 任务模型字段 (语义对齐)

| # | 字段语义 | Mindtap 字段 | TaskIsland 字段 | TaskIsland 源行 | 是否借鉴 |
|---|---|---|---|---|---|
| 1 | 主键 | `id` | `id: UUID` | `TaskItem.swift:78` | 不借鉴(UUID 字符串占空间) |
| 2 | 标题 | `content` | `title` | `TaskItem.swift:79` | 等价 |
| 3 | 备注 | ❌ | `notes: String` | `TaskItem.swift:80` | ❌ V1.x 不收 |
| 4 | 完成态 | `status = 'done'` | `isCompleted: Bool` | `TaskItem.swift:81` | 等价 |
| 5 | 当前任务 | `status = 'active'` | `isCurrent: Bool` | `TaskItem.swift:82` | 等价 |
| 6 | 优先级 | ❌ | `priorityRawValue: Int?` (0=高,1=中,2=低) | `TaskItem.swift:87` | ❌ V1.x 不收 |
| 7 | 截止 | ❌ | `dueAt: Date?` | `TaskItem.swift:88` | ❌ V1.3 显式 out-of-scope |
| 8 | 提醒 | ❌ | `reminderAt: Date?` | `TaskItem.swift:89` | ❌ V1.3 显式 out-of-scope |
| 9 | 重复 | ❌ | `repeatRuleRawValue: String?` | `TaskItem.swift:90` | ❌ V1.x 不收 |
| 10 | 标签 | ❌ | `tagsRawValue: String?` (逗号分隔) | `TaskItem.swift:91` | ❌ V1.x 不收 |
| 11 | 项目 | ❌ | `projectName: String?` | `TaskItem.swift:92` | ❌ V1.x 不收 |
| 12 | 预计专注分钟 | ❌ | `estimatedMinutes: Int?` | `TaskItem.swift:93` | ❌ V1.x 不收 |
| 13 | 今日队列标记 | ❌ | `todaySortIndex: Int?` | `TaskItem.swift:94` | ❌ V1.x 不收 |
| 14 | 子任务 | ❌ | `subtasksRawValue: String?` (JSON) | `TaskItem.swift:95` | ❌ V1.x 不收 |
| 15 | 焦点起始 | `focus_started_at` | `focusStartedAt: Date?` | `TaskItem.swift:96` | 等价 |
| 16 | 累计专注秒 | `duration_ms` | `focusAccumulatedSeconds: Double?` | `TaskItem.swift:97` | 等价 |
| 17 | 首次专注时间 | `first_focused_at` | ❌ | — | Mindtap 独有 |
| 18 | 暂停时间 | `paused_at` | ❌ (靠 `focusStartedAt = nil` 推断) | — | Mindtap 显式,更易查询 |
| 19 | 累计专注次数 | `focused_count` | ❌ | — | Mindtap 独有,用于统计 |
| 20 | 推迟时间 | ❌ | `postponedAt: Date?` | `TaskItem.swift:98` | ❌ V1.x 不收 |
| 21 | 推迟次数 | ❌ | `postponeCountRawValue: Int?` | `TaskItem.swift:99` | ❌ V1.x 不收 |
| 22 | 排序 | `record.sort_order` | `sortIndex: Int` | `TaskItem.swift:86` | 等价 |
| 23 | 创建时间 | `created_at` | `createdAt: Date` | `TaskItem.swift:83` | 等价 |
| 24 | 更新时间 | `updated_at` | `updatedAt: Date` | `TaskItem.swift:84` | 等价 |
| 25 | 完成时间 | (靠 `status='done' + 事件时序`) | `completedAt: Date?` | `TaskItem.swift:85` | 借鉴后会更准 |

### A.3 状态机

| # | 子项 | Mindtap | TaskIsland | 差距 / 是否借鉴 |
|---|---|---|---|---|
| 1 | 状态数 | **显式 4**: pending / active / paused / done | **隐式 2-3**: `isCompleted` + `isCurrent` + `focusStartedAt` 组合 | Mindtap 更显式;**保留** |
| 2 | 归档 | ✅ `archived_at IS NOT NULL` 任意态 | ❌ 无 (只软"完成" = `isCompleted = true`) | 等价语义不同实现 |
| 3 | 暂停语义 | `status='paused'` + `paused_at` | `focusStartedAt = nil` + 累加 `focusAccumulatedSeconds` | 等价 |
| 4 | L1 全局唯一 active | ✅ 硬约束 + `AppError::ActiveExists` | `normalizeCurrentTask()` 兜底 (TaskStore.swift:init) | Mindtap 更严谨;**保留** |
| 5 | L2 暂停保留时长 | ✅ `now - focus_started_at` 累加到 `duration_ms` | ✅ 累加到 `focusAccumulatedSeconds` (TaskStore.swift:460-466) | 等价 |
| 6 | L3 非法转换抛错 | ✅ `AppError::InvalidTransition` | ❌ 静默 no-op | Mindtap 严谨;**保留** |
| 7 | 重复展开 (L5) | ❌ 不支持 | ✅ `makeNextRecurringTask(from:)` (TaskStore.swift:980) | 借鉴推迟到 V2.0+ |
| 8 | 转换入口 command | `start_timer` / `pause_timer` / `resume_timer` / `complete_timer` / `undo_complete` | `startFocus` / `pauseFocus` / `stopFocus` / `toggleFocus` / `complete` | 范式差异 |

### A.4 任务操作 (CRUD + 业务)

| # | 子项 | Mindtap | TaskIsland | TaskIsland 源行 | 是否借鉴 |
|---|---|---|---|---|---|
| 1 | 新增 | `add_task` (Rust command) | `addTask(title:priority:)` | `TaskStore.swift:220-252` | 等价 |
| 2 | NLP 解析 | ❌ 无 | ✅ 344 行 (优先级/标签/项目/时长/日期/时间/重复) | `TaskQuickAddParser.swift:1-344` | 🟡 30 行 MVP,V1.4+ 借鉴 |
| 3 | 完成 | `complete_timer` | `complete(_:now:)` (含重复展开) | `TaskStore.swift:343-360` | 等价 |
| 4 | 撤销完成 | `undo_complete` | ❌ 无 (SwiftData 用 `task.isCompleted = false` 但无 command) | — | Mindtap 独有 |
| 5 | 删除 | `delete_task` / `delete_completed` | `delete(_:)` / `deleteCompleted()` | `TaskStore.swift:362-367, 627-632` | 等价 |
| 6 | 设为当前 | `switch_focus` (隐式) | `setCurrent(_:)` (显式) | `TaskStore.swift:369-376` | Mindtap 主动用 active 字段,不暴露 setCurrent |
| 7 | 改优先级 | ❌ 无 | `setPriority(_:priority:)` | `TaskStore.swift:378-383` | ❌ V1.x 不收 |
| 8 | 改截止 | ❌ 无 | `setDueDate(_:dueAt:reminderAt:)` | `TaskStore.swift:385-393` | ❌ V1.3 不收 |
| 9 | 改今日队列 | ❌ 无 | `setTodayQueue(_:isInTodayQueue:)` | `TaskStore.swift:395-403` | ❌ V1.x 不收 |
| 10 | 改备注 | ❌ 无 | `updateNotes(_:notes:)` | `TaskStore.swift:405-409` | ❌ V1.x 不收 |
| 11 | 改标题 | `update_task` (假设) | `updateTitle(_:title:)` | `TaskStore.swift:411-418` | 等价 |
| 12 | 改重复 | ❌ 无 | `setRepeatRule(_:repeatRule:)` | `TaskStore.swift:420-424` | ❌ V1.x 不收 |
| 13 | 改项目 | ❌ 无 | `setProjectName(_:projectName:)` | `TaskStore.swift:426-431` | ❌ V1.x 不收 |
| 14 | 改标签 | ❌ 无 | `setTags(_:tags:)` | `TaskStore.swift:433-437` | ❌ V1.x 不收 |
| 15 | 改预计时长 | ❌ 无 | `setEstimatedMinutes(_:estimatedMinutes:)` | `TaskStore.swift:439-443` | ❌ V1.x 不收 |
| 16 | 开始专注 | `start_timer` | `startFocus(_:now:)` | `TaskStore.swift:445-458` | 等价 |
| 17 | 暂停专注 | `pause_timer` | `pauseFocus(_:now:)` | `TaskStore.swift:460-466` | 等价 |
| 18 | 停止专注 | `stop_timer` | `stopFocus(_:now:)` | `TaskStore.swift:468-473` | 等价 |
| 19 | 切换专注 | (前端 `toggleFocus`) | `toggleFocus(_:now:)` | `TaskStore.swift:475-481` | 等价 |
| 20 | 加子任务 | ❌ 无 | `addSubtask(_:to:)` | `TaskStore.swift:498-507` | ❌ V1.x 不收 |
| 21 | 切换子任务 | ❌ 无 | `toggleSubtask(_:in:)` | `TaskStore.swift:509-517` | ❌ V1.x 不收 |
| 22 | 删子任务 | ❌ 无 | `deleteSubtask(_:from:)` | `TaskStore.swift:519-525` | ❌ V1.x 不收 |
| 23 | 推迟 (postpone) | ❌ 无 | 4 选项 enum: 15min / laterToday / tomorrow / thisWeek | `TaskStore.swift:527-557` | ❌ V1.x 不收 |
| 24 | 每日回顾 | check_in (V1.4 草案) | `dailyReview(now:)` → `TaskDailyReview` | `TaskStore.swift:584-609` | 🟡 V1.4 check_in 借鉴结构 |
| 25 | 推进 current | (无,active 隐式) | `advanceCurrent()` (循环) | `TaskStore.swift:611-625` | Mindtap 主动不做 |

### A.5 浮窗 / 悬浮 UI

| # | 子项 | Mindtap FloatShell | TaskIsland CapsuleIslandView | TaskIsland 源行 | 是否借鉴 |
|---|---|---|---|---|---|
| 1 | 形态 | 浮动 webview window | macOS `NSPanel` | `IslandPanelController.swift:47-49` | 范式差异 |
| 2 | 状态数 | 4 (collapsed / quick-input / focus-running / settings) | 3 (数字岛 / 专注岛 / 行动岛) | `CapsuleIslandView.swift` | 范式差异 |
| 3 | 折叠尺寸 | 320×36 | 172×30 | `IslandPanelController.swift:25` | Mindtap 更大 |
| 4 | 展开尺寸 | 360×280 (固定) | 440×动态(高 = 92-122px) | `IslandPanelController.swift:31-35` | 🟢 P2 借鉴自适应 |
| 5 | 专注尺寸 | (含于 quick-input) | 340×52 | `IslandPanelController.swift:26` | — |
| 6 | 跨平台 | ✅ 三平台统一 | ❌ macOS-only | `Package.swift:8` | Mindtap 优势 |
| 7 | 拖动 | (V1.3 spec 未明示) | ✅ `panelDragStartFrame` + `mouseDownCanMoveWindow=false` | `TaskPanelController.swift:82-103` | 🟡 P3 借鉴 |
| 8 | 钉住 / 固定 | (V1.3 spec 未到) | ✅ `panelState.isPinned` + `hidesOnDeactivate` | `TaskPanelController.swift:77-80` | 🟡 V1.4 借鉴 |
| 9 | 多显示器 | 居中 (V1.3) | ✅ 监听 `didChangeScreenParametersNotification` 重排 | `AppCoordinator.swift:111-113` | 🟡 P3 借鉴 |
| 10 | 默认位置 | macOS 需显式 setPosition 避开菜单栏 | `capsuleYOffset` + `capsuleTopY` 可调 | `AppSettings.swift:45-71` | 等价 (CLAUDE.md 已要求) |
| 11 | Hover 展开 | (V1.3 spec 未到) | ✅ `handleHoverChanged(_:)` 触发 setExpanded | `IslandPanelController.swift:135-145` | 🟡 V1.4+ 借鉴 |
| 12 | 焦点/提醒冲突 | (4 态条件渲染) | ✅ 专注时强制 collapseImmediatelyForAttention | `IslandPanelController.swift:97-100` | 等价 |
| 13 | 提醒 alert UI | (V1.4 计划) | ✅ `showReminderAlert(taskID:)` 18s 自动消失 | `IslandPanelController.swift:107-133` | 🟡 V1.4 借鉴 |
| 14 | 角点 hit-test | (V1.3 spec) | ✅ `handleIslandTap(at:)` 3 动作 (complete/delete/quick-add) | `CapsuleIslandView.swift` | 🟡 V1.4 借鉴 |
| 15 | Attention glow | ❌ 无 | ✅ `AngularGradient` rotation | `CapsuleIslandView.swift` | ❌ 不学 (调性冲突) |
| 16 | Density boost | ❌ 无 | ✅ transparency > 72% 时强化 | `CapsuleIslandView.swift` | ❌ 不学 |

### A.6 提醒 / 通知

| # | 子项 | Mindtap | TaskIsland | TaskIsland 源行 | 是否借鉴 |
|---|---|---|---|---|---|
| 1 | 系统通知 | ❌ V1.3 显式 out-of-scope | ✅ `UNUserNotificationCenter` + `UNTimeIntervalNotificationTrigger` | `ReminderNotificationScheduler.swift:60-74` | 🟡 V1.4+ 计划 |
| 2 | 应用内提醒 | ❌ | ✅ `Task<Void, Never>` + `Task.sleep` | `ReminderNotificationScheduler.swift:90-108` | 🟡 V1.4 借鉴 |
| 3 | 双通道并行 | — | ✅ 同一份 `NotificationSnapshot` 走两条路 | `ReminderNotificationScheduler.swift:35-37` | 🟡 V1.4 借鉴 |
| 4 | 调度策略 | — | `sync(tasks:)` 全量重算,先 cancel stale 再 add new | `ReminderNotificationScheduler.swift:18-77` | 🟡 V1.4 借鉴核心 |
| 5 | 权限申请 | — | `requestAuthorization(options: [.alert, .sound])` | `ReminderNotificationScheduler.swift:50` | 🟡 V1.4 借鉴 |
| 6 | Identifier 命名空间 | — | `taskisland-reminder-<UUID>` 前缀 | `ReminderNotificationScheduler.swift:7` | 🟡 V1.4 借鉴 |
| 7 | 提醒触发 UI | — | `onReminderDue` 回调 → `islandPanelController.showReminderAlert` | `AppCoordinator.swift:49-51` | 🟡 V1.4 借鉴 |
| 8 | 通知 body 构造 | — | `高优先级 · 项目 · #tag1 #tag2` | `ReminderNotificationScheduler.swift:79-88` | 🟡 V1.4 借鉴 |
| 9 | 提醒清理 | — | `removePendingNotificationRequests(withIdentifiers:)` 清理 stale | `ReminderNotificationScheduler.swift:38-47` | 🟡 V1.4 借鉴 |
| 10 | check_in 7 子类型 | V1.4 草案中 (emotion/sleep/water/med/habit/food/review) | ❌ 无对应概念 | — | Mindtap 独有 |

### A.7 快速新增 / NLP

| # | token 类型 | Mindtap | TaskIsland | TaskIsland 源行 | 是否借鉴 |
|---|---|---|---|---|---|
| 1 | 优先级 (`!高`/`!p1`) | ❌ 无 | ✅ 11 写法 (高/中/低 + p1/p2/p3 + 优先级高/中优/低优) | `TaskQuickAddParser.swift:32-43` | 🟡 P1 V1.4 借鉴 |
| 2 | 标签 (`#xxx`) | ❌ 无 | ✅ 正则 `(?<!\S)#([\p{L}\p{N}_-]+)` | `TaskQuickAddParser.swift:45-52` | 🟡 P1 V1.4 借鉴 |
| 3 | 项目 (`+xxx`) | ❌ 无 | ✅ 正则 `(?<!\S)\+([\p{L}\p{N}_-]+)` | `TaskQuickAddParser.swift:54-58` | ❌ V1.x 不收项目 |
| 4 | 时长 (`/30m` `/2h`) | ❌ 无 | ✅ 4 写法 (`/Nm` `/Nh` `N分钟` `N小时`) | `TaskQuickAddParser.swift:60-78` | 🟡 P1 V1.4 借鉴 |
| 5 | 日期 (`今天/明天/周一`) | ❌ 无 | ✅ 5 简单词 + 7 周枚举 + `每X` 前缀 | `TaskQuickAddParser.swift:126-167` | ❌ V1.x 不收 |
| 6 | 重复 (`每天/每周`) | ❌ 无 | ✅ 6 写法 (每天/每日/每周/每星期/每月/每年) | `TaskQuickAddParser.swift:169-186` | ❌ V1.x 不收 |
| 7 | 时间 (`10:30` `10点半` `10点`) | ❌ 无 | ✅ 3 正则 + `今晚`/`明早` 默认值 | `TaskQuickAddParser.swift:188-220` | ❌ V1.x 不收 |
| 8 | 上下午 (`下午/晚上/今晚/明晚`) | ❌ 无 | ✅ 命中时 hour<12 → hour+12 | `TaskQuickAddParser.swift:206-208` | ❌ V1.x 不收 |
| 9 | 边界处理 | — | ✅ `nonOverlappingRanges` 避免重复匹配 + `removeRange` 失败保留在 title | `TaskQuickAddParser.swift:269-295` | 🟡 V1.4 借鉴边界 |
| 10 | 解析失败回退 | — | ✅ 解析后 title 为空时回退 `normalizedTitle(rawInput)` | `TaskQuickAddParser.swift:114` | 🟡 V1.4 借鉴 |

### A.8 视图 / 列表 / 搜索

| # | 子项 | Mindtap | TaskIsland | TaskIsland 源行 | 是否借鉴 |
|---|---|---|---|---|---|
| 1 | 视图数 | 1 (主窗=设置页) | 10 (全部/今天/建议/高优/即将/无日期/标签/项目/已完成/回顾) | `MenuBarWindowView.swift` | ❌ 不学 (V1.5 定位) |
| 2 | 列表数据源 | `record` 视图表 (聚合) | `@Published tasks` + `sorted`/`sortedByPriority`/`sortedToday` | `TaskStore.swift:115-148` | 范式差异 |
| 3 | 跨字段搜索 | ❌ 无 | ✅ `tasks(matching:)` 跨 title/notes/tags/projectName | `TaskStore.swift:323-333` | ❌ V1.x 不收 |
| 4 | 优先级筛选 | ❌ | ✅ `incompleteTasks(for:)` | `TaskStore.swift:307-309` | ❌ |
| 5 | 标签筛选 | ❌ | ✅ `incompleteTasks(tagged:)` | `TaskStore.swift:311-315` | ❌ |
| 6 | 项目筛选 | ❌ | ✅ `incompleteTasks(inProject:)` | `TaskStore.swift:317-321` | ❌ |
| 7 | "今天"语义 | `record.record_date` 字段 | `todaySortIndex != nil` 标记 | `TaskItem.swift:137-139` | 等价语义 |
| 8 | "建议"打分 | ❌ | ✅ `suggestedTodayTasks(limit:)` 综合 priority + dueAt + sortIndex | `TaskStore.swift:180-196` | 🟡 V1.4+ 借鉴 |
| 9 | 折叠已完成 | (无任务列表) | ✅ V0.1.3 默认折叠,只显示数量+展开按钮 | (CHANGELOG) | 🟡 未来主窗若做列表,借鉴 |
| 10 | 每日回顾 | check_in (V1.4 草案) | ✅ `dailyReview(now:)` → `TaskDailyReview` | `TaskStore.swift:584-609` | 🟡 V1.4 借鉴结构 |
| 11 | "高优" 视图 | ❌ | `incompleteTasks(for: .high)` | (推断) | ❌ |
| 12 | "即将" 视图 | ❌ | `upcomingTasks` (`dueAt` 排序) | `TaskStore.swift:170-178` | ❌ V1.x 不收 |
| 13 | "无日期" 视图 | ❌ | 推断 `incompleteTasks.filter { $0.dueAt == nil }` | (推断) | ❌ |
| 14 | 排序函数 | `record.sort_order` (单键) | `sortIndex` (主) + `todaySortIndex` (今日) + `priority` (备) | `TaskStore.swift` | Mindtap 更简洁 |

### A.9 导入 / 导出 / 桥接

| # | 子项 | Mindtap | TaskIsland | TaskIsland 源行 | 是否借鉴 |
|---|---|---|---|---|---|
| 1 | 范围决策 | **D23 显式不做** | ✅ 完整支持 | — | 保留 D23 |
| 2 | JSON 导出 | ❌ | ✅ `TaskArchive(version: 2, ...)` + ISO8601 + prettyPrinted + sortedKeys | `TaskStore.swift:651-661` | ❌ V1.x 不收 |
| 3 | Markdown 导出 | ❌ | ✅ checkbox + 优先级/截止/项目/标签/时长 metadata | `TaskStore.swift:663-710` | ❌ |
| 4 | CSV 导出 | ❌ | ✅ 表头中文 (标题/优先级/截止/...) | `TaskStore.swift:710-757` | ❌ |
| 5 | JSON/MD/CSV 导入 | ❌ | ✅ 双向 | `TaskStore.swift:757-784` | ❌ |
| 6 | Todoist 风格 CSV | ❌ | ✅ 字段名识别 (见 README 154 行) | `TaskStore.swift:784+` | ❌ |
| 7 | Apple Reminders 导入 | ❌ (跨平台无解) | ✅ `importIncompleteReminders(into:)` + 防重复 (title + day) | `AppleRemindersBridge.swift:11-41` | ❌ |
| 8 | Apple Reminders 导出 | ❌ | ✅ `exportIncompleteTasks(from:)` + 自动建"任务岛" calendar | `AppleRemindersBridge.swift:43-69` | ❌ |
| 9 | 跨平台迁移标识 | n/a | ✅ `TaskIsland-ID:<UUID>` 写在 notes 防重复 | `AppleRemindersBridge.swift:166-181` | ❌ |
| 10 | 字段名迁移 | n/a | ✅ 字段缺失给默认值,不报错 | (推断) | — |

### A.10 设置持久化

| # | 子项 | Mindtap | TaskIsland | TaskIsland 源行 | 是否借鉴 |
|---|---|---|---|---|---|
| 1 | 存储介质 | 单 JSON 文件 `settings.json` | 15 个独立 `UserDefaults` key | `AppSettings.swift:182-201` | **保留** (更可控) |
| 2 | 文件位置 | `~/Library/Application Support/com.mindtap.app/settings.json` (macOS) | `UserDefaults.standard` (沙箱) | — | 范式差异 |
| 3 | 跨平台 | ✅ 路径用 `app_log_dir()` | ❌ UserDefaults 仅 Apple | — | Mindtap 优势 |
| 4 | 原子写 | ✅ `tmp → fsync → rename` | ❌ UserDefaults 内部处理 | — | Mindtap 优势 |
| 5 | 写后事件 | ✅ `emit("settings-changed", ())` → `useSettings` 订阅 | `@Published` 自动驱动 SwiftUI 重渲 | `AppSettings.swift:7-71` | 范式差异,等价 |
| 6 | 迁移机制 | `serde(default)` 加字段即可 | `didMigrateTopAlignedOffset` / `didMigrateTransparencySemantic` 两个 bool 标志 | `AppSettings.swift:96-114` | **保留** Rust serde 更优雅 |
| 7 | 字段 1: 是否显示悬浮岛 | `floating.show` (假设) | `showCapsule: Bool` | `AppSettings.swift:7-9, 77` | 等价 |
| 8 | 字段 2: 菜单栏显示标题 | (无托盘文本) | `showTitleInMenuBar: Bool` | `AppSettings.swift:11-13, 78` | 🟡 V1.4 tray 借鉴 |
| 9 | 字段 3: 暗夜模式 | (设计 spec 定义) | `darkGlassMode: Bool` | `AppSettings.swift:15-17, 79` | 🟡 V1.5+ 借鉴 |
| 10 | 字段 4: 默认专注分钟 | `floating.defaultFocusMinutes` | `defaultFocusMinutes: Double` (5-180, 默认 25) | `AppSettings.swift:19-21, 80-82` | 等价 |
| 11 | 字段 5: 快捷键 keyCode | `hotkey.code` (u32 bitmask + Code enum) | `quickAddShortcutKeyCode: Int` | `AppSettings.swift:23-25, 84-86` | 等价 (KeyCode 编码) |
| 12 | 字段 6: 快捷键 modifiers | (同 field 5) | `quickAddShortcutModifiersRawValue: Int` | `AppSettings.swift:27-29, 85-86` | 等价 |
| 13 | 字段 7: 快捷键状态消息 | (无) | `quickAddShortcutStatusMessage: String?` | `AppSettings.swift:31, 91` | 🟡 P1 V1.5 借鉴 (中文提示) |
| 14 | 字段 8-10: 3 优先级颜色 | (设计 spec) | `highPriorityColorHex` / `mediumPriorityColorHex` / `lowPriorityColorHex` | `AppSettings.swift:33-43, 92-94` | 🟡 V1.6+ 借鉴 |
| 15 | 字段 11: 悬浮岛 Y 偏移 | (无) | `capsuleYOffset: Double` | `AppSettings.swift:45-47, 97-102` | 🟡 V1.4 借鉴 |
| 16 | 字段 12: 悬浮岛透明度 | (设计 spec) | `capsuleTransparencyPercent: Double` (0-100, 含迁移) | `AppSettings.swift:49-51, 104-114` | 🟡 V1.5 借鉴 |
| 17 | 字段 13-14: 背景/文字色 | (设计 spec) | `capsuleBackgroundColorHex` / `capsuleTextColorHex` | `AppSettings.swift:53-59, 115-116` | 🟡 V1.6+ 借鉴 |
| 18 | 字段 15-17: 自定义位置 | (无) | `hasCapsuleCustomPosition` + `capsuleAnchorX` + `capsuleTopY` | `AppSettings.swift:61-71, 117-119` | 🟡 V1.4 借鉴 |
| 19 | 字段类型 | 强类型 struct (Rust) | `@Published` 15 个独立 var | — | Mindtap 优势 |

### A.11 全局快捷键

| # | 子项 | Mindtap | TaskIsland | TaskIsland 源行 | 是否借鉴 |
|---|---|---|---|---|---|
| 1 | 默认 | `Cmd/Ctrl+Shift+Space` 切换浮窗 | `Control+Option+N` 打开快速新增 | `TaskIslandShortcut.swift:12-15` | 范式差异 |
| 2 | 库 | `tauri-plugin-global-shortcut` | `Carbon` `RegisterEventHotKey` (macOS-only) | `HotKeyManager.swift:70-77` | 范式差异 |
| 3 | 自定义 UI | V1.5 spec 计划 bitmask u32 + Code enum | ✅ 7 modifiers × 27 keys = 189 组合 (含空格) | `TaskIslandShortcut.swift:17-55` | 🟡 P1 V1.5 借鉴 |
| 4 | 冲突检测 | (V1.5 计划) | ✅ `status != noErr` 时回退到 default + 显示错误消息 | `HotKeyManager.swift:79-84, AppCoordinator.swift:119` | 🟡 P1 V1.5 借鉴中文错误消息 |
| 5 | 冲突错误文本 | (V1.5 计划) | "这个快捷键可能已被其他程序占用,请换一个组合。" | `AppCoordinator.swift:119` | 🟡 P1 V1.5 借鉴 |
| 6 | 多热键 | (V1.5 计划多热键) | 只一个 (快速新增) | — | — |
| 7 | 跨平台 | ✅ | ❌ | — | Mindtap 优势 |
| 8 | Sanitize | (V1.5 计划) | ✅ `sanitized(keyCode:modifiersRawValue:)` 校验合法性,失败回退 default | `TaskIslandShortcut.swift:65-72` | 🟡 P1 V1.5 借鉴 |

### A.12 托盘 / 状态栏

| # | 子项 | Mindtap (V1.4) | TaskIsland | TaskIsland 源行 | 是否借鉴 |
|---|---|---|---|---|---|
| 1 | 库 | `tauri-plugin-tray` | `NSStatusItem` | `StatusItemController.swift:19` | 范式差异 |
| 2 | 菜单项 | 4 (切换浮窗/切换主窗/Autostart/Quit) | 7+ (视图切换/数据/退出) | (推断) | ❌ 不学 (调性冲突) |
| 3 | 状态显示 | ❌ | ✅ 实时显示待办数 / 当前任务标题 | `StatusItemController.swift:40-50` | 🟢 P2 借鉴 |
| 4 | 工具提示 | ❌ | ✅ `button.toolTip = "任务岛: \(incompleteCount) 个待办"` | `StatusItemController.swift:52-58` | 🟢 P2 借鉴 |
| 5 | 图标切换 | (V1.4 单一图标) | ✅ `circle.dashed.inset.filled` (有) / `checkmark.circle.fill` (空) | `StatusItemController.swift:33-34` | 🟢 P2 借鉴 |
| 6 | 重建策略 | (V1.4 每次 autostart 状态变化重建) | Combine sink on `settings.$showTitleInMenuBar` | `AppCoordinator.swift:79-83` | 等价 |
| 7 | 跨平台 | ✅ | ❌ | — | Mindtap 优势 |

### A.13 工程纪律 / 测试

| # | 子项 | Mindtap | TaskIsland | 差距 |
|---|---|---|---|---|
| 1 | TDD 硬约束 | ✅ CLAUDE.md 第 28 行: 写失败测试 → 最小实现 → 全层绿 | ❌ 无 | Mindtap 优势 |
| 2 | 单元测试 | ✅ Rust `cargo test` + Vitest | ❌ 无 | Mindtap 优势 |
| 3 | 契约测试 | ✅ Vitest | ❌ 无 | Mindtap 优势 |
| 4 | Visual baseline | ✅ 12-scenario floating baseline | ❌ 无 | Mindtap 优势 |
| 5 | 浮窗 smoke | ✅ 5 层 (`npm run smoke:floating` 必须 5/5 PASS) | ❌ 无 | Mindtap 优势 |
| 6 | Sanity binary | ❌ 无 | ✅ `TaskIslandChecks` (人工跑) | — |
| 7 | CI | ❌ (本地四件套脚本) | ❌ | 等价 (都缺) |
| 8 | `cargo check` 必跑 | ✅ 浮窗改动 DoD 第 4 件 | ❌ | Mindtap 优势 |
| 9 | TypeScript 类型检查 | ✅ `npx tsc --noEmit` | n/a | — |
| 10 | `Cargo.lock` 策略 | `.gitignore` (单二进制惯例) | n/a | — |
| 11 | 自动化覆盖 | 4 件套 + smoke 5 层 | 无 | Mindtap 优势 |

### A.14 平台 / 系统集成

| # | 子项 | Mindtap | TaskIsland | TaskIsland 源行 | 是否借鉴 |
|---|---|---|---|---|---|
| 1 | 多显示器监听 | (V1.3 spec 仅居中) | ✅ `NSApplication.didChangeScreenParametersNotification` | `AppCoordinator.swift:111-113` | 🟡 P3 V2.0+ 借鉴 |
| 2 | 屏幕变化重排 | (无) | ✅ `screenParametersDidChange() → islandPanelController?.refreshLayout()` | `AppCoordinator.swift:111-113` | 🟡 P3 |
| 3 | URL Scheme | ❌ | ✅ `taskisland://add?title=...` / `taskisland://focus` / `taskisland://complete` / `taskisland://show` | README:161-166 | ❌ V1.x 不做 |
| 4 | 登录启动 | (V1.5 spec: autostart 镜像) | ✅ "登录启动安装配置" (README:18) | — | 等价 |
| 5 | Apple 提醒事项 | ❌ (跨平台) | ✅ EventKit 双向 | `AppleRemindersBridge.swift:1-242` | ❌ |
| 6 | `NSPanel` 高级行为 | n/a | ✅ `.canJoinAllSpaces` + `.fullScreenAuxiliary` (全屏辅助) | `TaskPanelController.swift:180-184` | n/a |
| 7 | 沙箱身份 | (Tauri 平台相关) | ✅ `taskisland-reminder-<UUID>` identifier 前缀 | `ReminderNotificationScheduler.swift:7` | 🟡 V1.4 借鉴 |
| 8 | 打包 | `npm run tauri build` (`.exe` / `.app`) | `Scripts/package-app.sh` + `package-pkg.sh` + `package-dmg.sh` | (Scripts/) | 范式差异 |
| 9 | 公证 | ❌ | ❌ (README:181-183 提示) | — | 等价 |

### A.15 视图组件 / 渲染层

| # | 子项 | Mindtap | TaskIsland | TaskIsland 源行 | 是否借鉴 |
|---|---|---|---|---|---|
| 1 | 渲染层 | React 19 + Vite 7 | SwiftUI | — | 范式差异 |
| 2 | UI 组件库 | shadcn 源码拷 + Radix primitive + Tailwind token | SwiftUI 原生 + 自定义 shape | — | 范式差异 |
| 3 | 设计规范文档 | `docs/projects/design-system/glassmorphism-impl-spec.md` | `GlassStyle.swift` 12 行 + 视图内联 | `GlassStyle.swift:1-12` | Mindtap 优势 (集中规范) |
| 4 | 玻璃 API | 自有 L1/L2/L3 tier + CSS 变量 | SwiftUI `Material` (`ultraThinMaterial`) + macOS 26 `glassEffect(.regular.interactive(true))` | `GlassStyle.swift:7-9` | 范式差异 |
| 5 | 颜色变量 | 18 个 CSS 变量 (3 tier × blur/fill/border/shadow) | 7 个 hex 字符串 (3 优先级 + 背景 + 文字 + 透明度) | `AppSettings.swift` | Mindtap 更体系化 |
| 6 | 透明度 | 0.35 / 0.42 / 0.50 三档 | 0-100% 滑条 (1 个变量) | `AppSettings.swift:49-51` | 等价 |
| 7 | 动画库 | CSS transition / framer-motion (V1.3) | SwiftUI `withAnimation(.easeOut)` | — | 范式差异 |
| 8 | 阴影 | `0 8px 32px rgba(0, 30, 80, 0.08-0.12)` (3 档) | `hasShadow = false/true` (单一开关) | `TaskPanel.swift:84` | Mindtap 更精细 |
| 9 | 模糊 | `blur(20/24/28px) saturate(120%)` | 系统 `Material` 决定 | `glassmorphism.css:67` | 范式差异 |
| 10 | Fallback | ✅ `@supports not (backdrop-filter)` 降级 | macOS 13 fallback `ultraThinMaterial` | `glassmorphism.css:39-48, GlassStyle.swift:9` | Mindtap 跨平台更细 |
| 11 | 暗色模式 | (设计 spec) | `darkGlassMode: Bool` | `AppSettings.swift:15-17` | 🟡 V1.5+ 借鉴 |
| 12 | 渐变 | `radial-gradient` body 背景 | `AngularGradient` (悬浮岛 attention) | `CapsuleIslandView.swift` | ❌ 不学 |
| 13 | 形状 | 默认矩形 | `IslandGlassShape` 胶囊 / 圆角矩形 | `CapsuleIslandView.swift` | 🟡 V1.4 借鉴胶囊 |

### A.16 业务 / 战略层

| # | 维度 | Mindtap | TaskIsland | 差距 / 是否借鉴 |
|---|---|---|---|---|
| 1 | 一句话定位 | "极简记录,液态玻璃" | "任务随手记,提醒刚刚好" | — |
| 2 | 目标用户 | 自由职业 / 创作者 / 注意力分散者 | 通用任务管理用户 | — |
| 3 | 核心场景 | 快速记一个念头 + 进入焦点 | 完整 Todoist-style 任务管理 | — |
| 4 | 视觉调性 | 静态居中、极简、单一焦点 | 动态悬浮岛、密度自适应、状态丰富 | — |
| 5 | 数据哲学 | 本地 SQLite,绝不外传 | 本地 SwiftData + 可导入导出 | — |
| 6 | 状态机哲学 | 显式 4 态 + 不变量硬约束 | 隐式多态 + @MainActor 兜底 | Mindtap 严谨 |
| 7 | 范围扩张风险 | 低 (V1.x 主动收缩) | 高 (已经是 Todoist 替代品) | Mindtap 自律 |
| 8 | 当前版本 | V1.5 (设置页) 阶段 | v0.1.3 (2026-06-03) | — |
| 9 | 开发节奏 | 慢 (V1.x 主动控制范围) | 快 (2 周 3 个迭代) | — |
| 10 | 工程纪律 | 强 (TDD + smoke 5 层) | 弱 (无 CI / 无自动化) | Mindtap 优势 |
| 11 | 跨平台 | ✅ (Tauri 2) | ❌ (macOS-only) | Mindtap 优势 |
| 12 | 国际化 | 中文为主 | 中文为主 | 等价 |

---

## 附录 B · 完整设计对比表

> 功能 vs 设计分离。设计维度专注 **视觉 token / 形状 / 动画 / 排版 / 状态视觉**。

### B.1 设计 token 体系

| # | token | Mindtap 值 | TaskIsland 值 | 来源 (TaskIsland) |
|---|---|---|---|---|
| 1 | 玻璃 tier 数 | **3** (L1/L2/L3) | **1** (`Material.regular`) | `GlassStyle.swift:7` |
| 2 | 模糊 (L1) | `blur(20px) saturate(120%)` | 系统 `Material` 决定 | — |
| 3 | 模糊 (L2) | `blur(24px) saturate(120%)` | — | — |
| 4 | 模糊 (L3) | `blur(28px) saturate(120%)` | — | — |
| 5 | 填充 (L1) | `rgba(255, 255, 255, 0.35)` | n/a | — |
| 6 | 填充 (L2) | `rgba(255, 255, 255, 0.42)` | n/a | — |
| 7 | 填充 (L3) | `rgba(255, 255, 255, 0.50)` | n/a | — |
| 8 | 边框 (L1) | `rgba(255, 255, 255, 0.60)` | n/a | — |
| 9 | 边框 (L2) | `rgba(255, 255, 255, 0.70)` | n/a | — |
| 10 | 边框 (L3) | `rgba(255, 255, 255, 0.80)` | n/a | — |
| 11 | 阴影 (L1) | `0 8px 32px rgba(0, 30, 80, 0.08)` | `hasShadow = false/true` | `TaskPanel.swift:84` |
| 12 | 阴影 (L2) | `0 8px 32px rgba(0, 30, 80, 0.10)` | — | — |
| 13 | 阴影 (L3) | `0 8px 32px rgba(0, 30, 80, 0.12)` | — | — |
| 14 | 品牌主色 | `#165DFF` (--primary-500) | n/a | — |
| 15 | 品牌主色 hover | `#0E4AD9` (--primary-600) | n/a | — |
| 16 | 品牌主色 active | `#0A3DBC` (--primary-700) | n/a | — |
| 17 | 主色 glow | `0 4px 12px rgba(22, 93, 255, 0.25)` | n/a | — |
| 18 | 主色 glow hover | `0 6px 16px rgba(22, 93, 255, 0.35)` | n/a | — |
| 19 | 画布起点 | `#F5F9FF` (--canvas-start) | n/a | — |
| 20 | 画布终点 | `#E8F1FF` (--canvas-end) | n/a | — |
| 21 | 正文色 | `#1D2939` (body) | n/a | — |
| 22 | 字体 | Geist Variable | 系统默认 | — |
| 23 | 高优色 | (设计 spec) | `highPriorityColorHex` (默认 hex) | `AppSettings.swift:33-35, 92` |
| 24 | 中优色 | (设计 spec) | `mediumPriorityColorHex` | `AppSettings.swift:37-39, 93` |
| 25 | 低优色 | (设计 spec) | `lowPriorityColorHex` | `AppSettings.swift:41-43, 94` |
| 26 | 悬浮岛背景 | (设计 spec) | `capsuleBackgroundColorHex` (默认 `#DDF7FF`) | `AppSettings.swift:53-55, 115` |
| 27 | 悬浮岛文字 | (设计 spec) | `capsuleTextColorHex` (默认 `""` 自动) | `AppSettings.swift:57-59, 116` |
| 28 | 悬浮岛透明度 | (设计 spec) | `capsuleTransparencyPercent: Double` (0-100, 含迁移) | `AppSettings.swift:49-51, 104-114` |
| 29 | Fallback | ✅ `@supports not (backdrop-filter)` 降级 | ✅ `if #available(macOS 26.0, *)` 降级 `ultraThinMaterial` | `glassmorphism.css:39-48, GlassStyle.swift:7-9` |

### B.2 形状 / 尺寸

| # | 元素 | Mindtap | TaskIsland | 源行 |
|---|---|---|---|---|
| 1 | 浮窗折叠 | 320×36 (矩形) | 172×30 (胶囊形) | `IslandPanelController.swift:25` |
| 2 | 浮窗展开 | 360×280 (矩形) | 440×动态(高 92-122px, 圆角矩形) | `IslandPanelController.swift:31-35` |
| 3 | 浮窗专注 | (含于 quick-input) | 340×52 (胶囊形) | `IslandPanelController.swift:26` |
| 4 | 任务面板 | (无,主窗=设置页) | 430×590 (圆角矩形) | `TaskPanelController.swift:14` |
| 5 | 快速新增 | (浮窗 quick-input) | 500×156 (圆角矩形) | `QuickAddPanelController.swift:16` |
| 6 | 浮窗圆角 | (V1.3 spec) | `IslandGlassShape` 自定义 | `CapsuleIslandView.swift` |
| 7 | 浮窗阴影 | (V1.3 spec) | `hasShadow = false` (浮窗) / `true` (快速新增) | `TaskPanel.swift:84, QuickAddPanel.swift:84` |

### B.3 动画 / 过渡

| # | 动画 | Mindtap | TaskIsland | 源行 |
|---|---|---|---|---|
| 1 | 浮窗展开 | (V1.3 spec) | `.easeInOut(duration: 0.18)` | `IslandPanelController.swift:158` |
| 2 | 浮窗折叠 | (V1.3 spec) | `.easeOut(duration: contentFadeDuration)` (0.12s) | `IslandPanelController.swift:27-28, 154` |
| 3 | 浮窗总动画时长 | (V1.3 spec) | 0.45s | `IslandPanelController.swift:27` |
| 4 | Attention glow | ❌ | `AngularGradient` rotation | `CapsuleIslandView.swift` |
| 5 | 提醒 alert 时长 | (V1.4 计划) | 18s 自动消失 | `IslandPanelController.swift:29, 121-132` |
| 6 | 拖动反馈 | (V1.3 spec 未明示) | 即时 (无动画) | `TaskPanelController.swift:82-103` |
| 7 | Density boost | ❌ | transparency > 72% 触发 | `CapsuleIslandView.swift` |

### B.4 颜色映射

| # | 用途 | Mindtap | TaskIsland | 源行 |
|---|---|---|---|---|
| 1 | 高优先级 | (V1.6+ 计划) | 用户可改 hex (默认见 `TaskPriority.defaultColorHex`) | `AppSettings.swift:92` |
| 2 | 中优先级 | (V1.6+ 计划) | 用户可改 hex | `AppSettings.swift:93` |
| 3 | 低优先级 | (V1.6+ 计划) | 用户可改 hex | `AppSettings.swift:94` |
| 4 | 背景渐变 | `radial-gradient` body 起点 / 终点 | n/a | — |
| 5 | 暗色模式 | (设计 spec) | `darkGlassMode: Bool` | `AppSettings.swift:15-17` |

### B.5 排版 / 字体

| # | 项 | Mindtap | TaskIsland |
|---|---|---|---|
| 1 | 字体 | Geist Variable (`@fontsource-variable/geist`) | 系统默认 |
| 2 | 标题截断 | (前端组件) | `String.truncated(to: 20)` (菜单栏) | `StatusItemController.swift:65-69` |
| 3 | 状态栏文字 | (无托盘文本) | " 任务岛" / " \(count)" / " \(title.truncated)" | `StatusItemController.swift:40-50` |
| 4 | 提醒 body 格式 | (V1.4 计划) | "高优先级 · 项目 · #tag1 #tag2" | `ReminderNotificationScheduler.swift:79-88` |

### B.6 状态视觉

| # | 状态 | Mindtap | TaskIsland | 源行 |
|---|---|---|---|---|
| 1 | 折叠态视觉 | (V1.3 spec) | 数字岛 (高/中/低 优先级数) | `CapsuleIslandView.swift` |
| 2 | 专注态视觉 | (V1.3 spec) | 专注岛 (TimelineView + 倒计时) | `CapsuleIslandView.swift` |
| 3 | 行动态视觉 | (V1.3 spec) | 行动岛 (1-3 条预览 + 4 角点) | `CapsuleIslandView.swift` |
| 4 | 提醒态视觉 | (V1.4 计划) | attention glow 18s 后消失 | `CapsuleIslandController.swift:107-133` |
| 5 | 任务完成视觉 | (V1.3 spec) | `task.isCompleted` 划线 + 灰显 | `TaskRowView.swift` |
| 6 | 子任务完成视觉 | n/a | `subtask.isCompleted` checkbox | `TaskRowView.swift` |
| 7 | 拖动视觉 | (V1.3 spec 未明示) | `mouseDownCanMoveWindow = false` 显式拦截 | `TaskPanelController.swift:194-196` |

### B.7 交互 / 反馈

| # | 交互 | Mindtap | TaskIsland | 源行 |
|---|---|---|---|---|
| 1 | Hover 展开 | (V1.3 spec) | ✅ `handleHoverChanged(_:)` | `IslandPanelController.swift:135-145` |
| 2 | 点击展开 | (V1.3 spec) | ✅ `onOpenTasks` 回调 | `CapsuleIslandView.swift` |
| 3 | 角点 hit-test | (V1.3 spec) | ✅ 3 动作 (complete/delete/quick-add) | `CapsuleIslandView.swift` |
| 4 | Esc 关闭 | (V1.3 spec) | ✅ `keyCode == 53` (Esc) | `QuickAddPanel.swift:101-107` |
| 5 | 失去焦点关闭 | (V1.3 spec) | ✅ `windowDidResignKey` + `!isPinned` | `TaskPanelController.swift:71-75` |
| 6 | `cancelOperation` 关闭 | (V1.3 spec) | ✅ `cancelOperation(_:)` → onCancel | `TaskPanel.swift:189-191` |
| 7 | 拖动关闭检测 | (V1.3 spec) | ✅ `finishDraggingPanel()` 重置 | `TaskPanelController.swift:100-103` |
| 8 | 屏幕外 clamp | (V1.3 spec) | ✅ `clampedFrame(_:)` 限制在 visibleFrame | `TaskPanelController.swift:150-159` |
| 9 | 多屏重排 | (V1.3 spec 仅居中) | ✅ `screenParametersDidChange` | `AppCoordinator.swift:111-113` |
| 10 | 冲突热键提示 | (V1.5 计划) | ✅ "这个快捷键可能已被其他程序占用" | `AppCoordinator.swift:119` |

### B.8 平台 / 渲染层差异

| # | 项 | Mindtap | TaskIsland | 影响 |
|---|---|---|---|---|
| 1 | 窗口类型 | Tauri webview (`transparent + decorations(false) + alwaysOnTop`) | `NSPanel` (`hidesOnDeactivate + .floating level`) | 范式差异 |
| 2 | 玻璃 API | CSS `backdrop-filter: blur() saturate()` | SwiftUI `Material` / macOS 26 `glassEffect` | 范式差异 |
| 3 | 跨平台 | ✅ macOS / Windows / Linux | ❌ macOS-only | Mindtap 优势 |
| 4 | 跨平台 fallback | ✅ `@supports not (backdrop-filter)` | ✅ `if #available(macOS 26.0, *)` | 等价 |
| 5 | 系统通知 API | (V1.4+ 计划 tauri-plugin-notification) | `UNUserNotificationCenter` | 范式差异 |
| 6 | 系统集成 | Tauri plugins (opener/dialog/autostart/global-shortcut/tray) | AppKit (NSStatusItem/NSPanel/NSApplication) | 范式差异 |
| 7 | 渲染进程隔离 | ✅ webview (Tauri 强隔离) | ❌ 同进程 SwiftUI | Mindtap 更安全 |
| 8 | 包大小 | Tauri 5-15MB | SwiftUI 内置 (n/a) | 范式差异 |

### B.9 图标 / 系统资源

| # | 项 | Mindtap | TaskIsland |
|---|---|---|---|
| 1 | 应用图标 | (Tauri 资源) | `Resources/` |
| 2 | 托盘图标 | (V1.4 spec) | `NSImage(systemSymbolName: "circle.dashed.inset.filled" / "checkmark.circle.fill")` |
| 3 | SF Symbols 使用 | ❌ | ✅ 大量使用 (系统标准) |
| 4 | 自定义字体 | Geist Variable | 系统默认 |

---

## 附录 C · 速查统计

| 统计维度 | Mindtap | TaskIsland | 差距 |
|---|---|---|---|
| 总行数 (wc -l) | (数千行 TS+Rust) | **8398** | — |
| 任务模型字段数 | 9 (源) + 7 (视图) = **16** | **21** stored + 5 computed = **26** | TaskIsland 多 10 |
| 状态机不变量 | 5 (L1-L5) | 0 显式, 1 兜底 | Mindtap 严谨 |
| 浮窗/悬浮岛状态 | 4 | 3 | 范式差异 |
| 设置字段 | (7 sections, 强类型 struct) | **15** 独立 `@Published` | 范式差异 |
| 任务视图数 | 1 (设置页) | **10** | 范式差异 |
| 任务操作 command | (10 估计) | **25** | TaskIsland 多 (D23 不收) |
| 测试纪律 | TDD + smoke 5 层 | 1 sanity binary | Mindtap 优势 |
| 跨平台 | ✅ 三平台 | ❌ macOS-only | Mindtap 优势 |
| 设计 token | 18 CSS 变量 | 7 UserDefaults + 系统 `Material` | Mindtap 集中 |
| 动画 token | (V1.3 spec) | 5 显式 (0.18s, 0.12s, 0.45s, 18s) | TaskIsland 显式 |
| API/平台集成 | 5 Tauri plugins | AppKit + EventKit + UserNotifications | 范式差异 |

