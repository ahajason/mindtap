# V0.2.2 可信台账与复盘 — 设计契约

> 阶段二设计文档。业务真值在 `../轻念Mindtap产品需求文档.md` 阶段二；领域基础复用 `../L-1-workbench/` 三态模型与 focus_interval 激活日志。

## 1. 版本概览

| 项 | 值 |
|---|---|
| 版本 | V0.2.2 |
| 名称 | 可信台账与复盘 |
| 依赖 | V0.2.1 工作台（Item 三态 + focus_interval + 空闲检测 + 系统通知） |
| 基线 | ADR-0014：范围不再包含时间盒，聚焦阶段二 |

## 2. 范围

### 2.0 前置项：1.4 系统通知补齐

**根因**：阶段一 1.4 的「系统通知 XX 已自动暂停」未真正生效。三个问题：
1. 前端 BubbleApp 15s 轮询抢在后端 30s 扫描之前 pause，导致后端通知路径走不到
2. 从未请求系统通知权限
3. 无可关开关

**修复**：
- 空闲自动暂停统一由后端 30s 线程驱动（竞争路径消除）
  - 后端检测空闲超阈值 → `item::pause(id, pending_ms=实际时长)` → emit `floating:dormant` 事件
  - 前端 BubbleApp 收到事件 → 显示气泡 [记入]/[丢弃]（5s 超时自动确认）
  - 前端轮询只做 `check_dormant`（失真检测），**不做 idle pause**
- 后端发通知前检查 `notification_enabled` 开关
- 添加设置项：`app_setting` 中 `notification_enabled`（全局开关）、`notification_level_idle`（空闲超时通知级别）
- 首次启动请求通知权限

### 2.1 每日复盘视图

**场景 S5**：下班前复盘，一屏回答今天推进了什么、各投入多久、哪些晾着、哪些未闭合。

**四块面板**：
| 面板 | 数据源 | 交互 |
|---|---|---|
| 今日完成清单 | 今日归档的 item + 各 focus_interval 汇总时长 | 列表展示；点击展开详情 |
| 时间分布 | 今日所有 focus_interval 按任务汇总 | 数字汇总（无图表）；任务名 + 时长 |
| 晾着任务 | todo/active 中 last_active_at > 24h | 列表展示，可顺延/完成/删除 |
| 未覆盖时段 | 今日时间线中 focus_interval 未覆盖的 gap | 一键关联建卡或忽略 |

**未闭合任务操作**：逐条顺延 / 完成 / 删除。

### 2.2 活动信号与智能提示

**场景 S6**：漏记自愈——系统发现"你在干活但台账没动"。

**信号流**：
```
前台切换检测 → 10 分钟持续工作且未计时 → 浮窗视觉强化 → 建议文案
  → 一键确认（建卡+计时）/ 一键忽略
  → 同一信号反复忽略 → 降频但汇入复盘批量处理
```

**打扰级别**（每类信号可配）：
| 级别 | 行为 |
|---|---|
| 静默 | 不提示，仅数据记录。汇入复盘 |
| 视觉强化 | 浮窗呼吸/变色，不抢焦点 |
| 系统通知 | 弹出系统通知 |

**全局开关**：关闭后完全不监听。

### 2.3 主窗管理

**主窗角色**：从 Style Guide 页面改造为业务页面。

**功能**：
- 全部条目列表（搜索 / 按状态筛选 / 内容编辑）
- 归档/删除入口
- 删除流程：
  - 点击删除 → toast 带撤销按钮（5 秒窗口）
  - 5 秒内撤销 → 完全恢复（`undo_delete`）
  - 5 秒后 → 任务进入「回收站」（`deleted_at IS NOT NULL`），**可随时恢复**
  - 回收站中可彻底删除（`hard_delete`，同时清除 focus_interval 引用）
  - focus_interval 记录永远保留
- 回收站视图（`/manage?tab=trash`）：列出所有已删除条目，可恢复或彻底删除
- 托盘/菜单栏入口

## 3. 架构变更

### 3.1 主窗口路由改造

**当前**：`/` → Style Guide 页面
**目标**：侧边栏布局 + 扁平路由，主窗从设计系统改造为业务窗口

```
AppLayout (侧边栏)
├── /               → 复盘视图（2.1，默认页）
├── /manage         → 主窗管理列表（2.3）
├── /settings       → 设置页（通知开关、打扰级别、活动监听）
└── /style-guide    → 设计系统页面（侧边栏底部入口，视为开发工具）
```

**布局**：左侧窄侧边栏（图标 + 文字），内容区占满剩余宽度。800×600 窗口下侧边栏约 48px 图标模式，hover 展开文字。

**改造策略**：
1. 新建 `AppLayout.tsx`（带侧边栏），复用 `StyleGuideLayout` 的布局结构
2. 现有 Style Guide 路由整体移到 `/style-guide` 前缀下
3. 侧边栏底部提供「设计系统」入口，不暴露给普通用户

### 3.2 通知系统重构

**当前**：后端 30s 线程 + 前端 BubbleApp 15s 轮询，双路径竞态
**目标**：后端独占空闲检测 → pause + emit 事件 → 前端气泡确认。

```
后端 30s 线程:
  scan_and_auto_pause()
    → 查系统空闲时间
    → 超 10 分钟阈值:
      1. item::pause(id, pending_ms=实际空闲时长)  // 挂待确认
      2. emit "floating:dormant" 事件 → 前端气泡弹出
      3. 如 notification_enabled=开 + level=system: 发系统通知
    → 未超阈值: 跳过

前端 BubbleApp:
  只保留 check_dormant 轮询（5min，失真检测用）
  删除 idle pause 轮询（15s 的 useEffect）
  监听 Rust emit 的 idle 事件 + dormant 事件 → 显示气泡
```

**竞态消除**：
- 删除 `BubbleApp.tsx` 第 62-92 行的 `useEffect`（15s idle pause 轮询）
- 后端 30s 线程成为唯一检测 + pause 路径
- 前端气泡通过 `listen("floating:dormant")` 触发，不再轮询 pause

### 3.3 前台应用监听

**技术选型**：Windows 用 `GetForegroundWindow` + `GetWindowModuleFileName`（获取 exe 路径，不依赖窗口标题），`GetWindowText` 作辅助。macOS 暂不实现（预留）。

**Rust 端**：新增 `src-tauri/src/foreground.rs` 模块，封装 `windows` crate API 获取前台应用路径。

**周期**：每 30s 检测一次（与 idle 线程共用 tick），检测前台应用是否变化 + 持续一个应用超过 10 分钟且计时未动。

**信号流**：
```
每 30s tick:
  → 获取当前前台应用 exe 路径
  → 如果与上次不同:
    记录切换时间 + 新应用名
  → 如果同一应用持续 > 10 分钟:
    且 active 卡为空 (没在计时):
      emit "floating:activity_signal" 事件
      → 前端浮窗进入视觉强化态（呼吸动画）
      → 显示建议文案 "看起来你在做 X，要记一下吗？"
      → 一键确认: 建卡 + 开始计时
      → 一键忽略: 浮窗恢复正常，该信号降频
```

**打扰级别配置**：
| 级别 | 行为 |
|---|---|
| 静默 | 不提示，仅数据记录，汇入复盘 |
| 视觉强化 | 浮窗呼吸/变色，不抢键盘焦点 |
| 系统通知 | 弹出系统通知 |

**全局开关**：`activity_monitor_enabled`（默认关，首次启动弹窗告知后默认开）

## 4. 数据模型扩展

### 4.1 app_setting 新增 key

| key | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `notification_enabled` | bool | `true` | 全局通知开关 |
| `notification_level_idle` | string | `"system"` | 空闲超时通知级别 |
| `notification_level_activity` | string | `"visual"` | 活动检测通知级别 |
| `activity_monitor_enabled` | bool | `false` | 前台应用监听全局开关（默认关，首次提示后开） |

### 4.2 focus_interval 扩展

**新增 `source` 字段**：
```sql
ALTER TABLE focus_interval ADD COLUMN source TEXT NOT NULL DEFAULT 'auto';
```

| source 取值 | 含义 |
|---|---|
| `'auto'` | 自动计时产生的真实激活期（默认） |
| `'gap_fill'` | 每日复盘中手动补录的空档时段 |

**新增索引**：
```sql
CREATE INDEX IF NOT EXISTS idx_focus_interval_started_at ON focus_interval (started_at);
```

用于复盘视图按日查询 focus_interval。

### 4.3 新增模块和函数

**`db/review.rs`** 新增模块：
```rust
/// 每日复盘数据
struct DailyReview {
    completed: Vec<ItemSummary>,    // 今日完成清单含时长
    distribution: Vec<TimeDist>,    // 时间分布（按任务汇总）
    stale: Vec<Item>,               // 晾着任务（>24h 未动）
    uncovered_gaps: Vec<TimeRange>, // 未覆盖时段
}

/// 查询空档：取今日所有 source='auto' 的 focus_interval
/// Rust 合并区间 → 反向求 gap → 返回 [TimeRange]
/// 已关联的 gap_fill 记录自然排除（WHERE source='auto'）
fn get_daily_review(conn, local_day_start_ms) -> Result<DailyReview, AppError>

/// 关联空档到任务：INSERT focus_interval (item_id, started_at, ended_at, source='gap_fill')
fn associate_gap(conn, item_id, gap_start, gap_end) -> Result<(), AppError>
```

**`db/foreground.rs`**（V0.2.3 扩展预留）：
```rust
fn get_foreground_app() -> Option<AppInfo>
// AppInfo = { exe_path: String, window_title: String }
```

### 4.4 时区处理

**问题**：`local_day_start_ms` 当前用 UTC 近似（偏移为 0），东八区用户凌晨 0-8 点的记录会被算到前一天。

**方案**：
- 存储：`focus_interval.started_at`、`item.created_at` 保持 UTC 毫秒
- 计算：`local_day_start_ms(now)` 用 Windows API `GetTimeZoneInformation` 获取真实偏移
- 启动时获取一次时区偏移，存到 `app_setting` key `local_tz_offset_secs`
- 每次前端拉起时重新获取（用户可能跨时区）

## 5. 组件设计

### 5.1 主窗组件

| 组件 | 职责 | 数据源 |
|---|---|---|
| `ReviewPage` | 复盘视图主容器，四块布局 | `api.item.getDailyReview()` |
| `CompletedList` | 今日完成清单 + 时长 | DailyReview.completed |
| `TimeDistribution` | 时间分布（数字汇总） | DailyReview.distribution |
| `StaleTasks` | 晾着任务列表 | DailyReview.stale |
| `UncoveredGaps` | 未覆盖时段 + 一键关联 | DailyReview.uncovered_gaps |
| `ManagePage` | 主窗管理列表页 | `api.item.list()` |
| `ItemList` | 全条目列表 + 搜索筛选 | 搜索/筛选状态 |
| `UndoDeleteToast` | 删除 5 秒撤销 toast | sonner toast |

### 5.2 浮窗增强

| 组件 | 职责 |
|---|---|
| `FoldedBar` 增强 | 新增视觉强化态（呼吸动画），当活动信号检测到未计时时激活 |
| `ActivitySuggestion` | 建议文案 "看起来你在做 X，要记一下吗？" + 确认/忽略按钮 |

### 5.3 设置 UI

| 组件 | 职责 |
|---|---|
| `SettingsPage` | 主窗设置页（通知开关、打扰级别、活动监听开关） |

## 6. 后端 API 新增

| 命令 | 参数 | 返回值 | 用途 |
|---|---|---|---|
| `item_get_daily_review` | 无 | `DailyReview` | 复盘视图数据 |
| `item_list_manage` | `search`, `status`, `type` | `Vec<Item>` | 主窗管理列表 |
| `item_undo_delete` | `id` | `Item` | 5 秒撤销（已有，复用） |
| `item_get_intervals` | `item_id` | `Vec<FocusInterval>` | 单卡激活明细（已有，复用） |
| `foreground_get_active` | 无 | `Option<AppInfo>` | 前台应用信息 |
| `foreground_set_enabled` | `enabled: bool` | `()` | 活动监听开关 |

## 7. 不变量

1. **通知不重复**：同一 active 卡在单次空闲超时周期内只发一次通知
2. **监听不泄露**：关闭活动监听后，完全不采集前台应用信息
3. **复盘仅读**：复盘视图是只读快照，不修改任何数据（未闭合任务操作除外）
4. **未覆盖时段不重复**：已关联的 gap（`source='gap_fill'`）自然排除，不重复出现
5. **删除可撤销**：5 秒内可恢复，超时后进入回收站，仍可恢复（`focus_interval` 永远保留）
6. **后端时间权威**：所有业务逻辑决策（暂停、失真、冷却）由后端 30s 线程统一处理，前端不做业务判断
7. **时区感知**：复盘按用户本地时区计算自然日，存储始终用 UTC

## 8. 测试策略

| 层级 | 测试类型 | 时机 | 覆盖范围 |
|---|---|---|---|
| Rust 后端 | `#[cfg(test)]` 单元测试 | 与需求同步写 | `review.rs` 复盘查询、空档关联、`foreground.rs` 逻辑（mock API） |
| 前端组件 | vitest | UI 确定后写 | `ReviewPage`、`ManagePage`、`ActivitySuggestion`、`FoldedBar` 增强 |
| 不做 | E2E / 截图对比 | — | 不引入 Playwright 或截图测试 |

## 9. 验收标准

| 编号 | 用例 | 验收方法 |
|---|---|---|
| A1 | 空闲超时自动暂停 + 系统通知（开/关） | 离开 10 分钟，收到通知；关闭开关后不通知 |
| A2 | 复盘视图一屏四块，打开即读 | 主窗打开看到四块面板，无额外操作 |
| A3 | 未覆盖时段一键关联 | 点击 gap 关联 → 建卡 + 从 gap 开始计时 |
| A4 | 活动信号 10 分钟未计时 → 浮窗视觉强化 | 切换应用 10 分钟未计时，浮窗呼吸动画 + 建议文案 |
| A5 | 一键确认建卡 | 点击确认 → 建卡 + 开始计时 + 浮窗恢复正常 |
| A6 | 关闭监听后无任何监听行为 | 关闭开关后，前台应用切换不再触发信号 |
| A7 | 删除 5 秒撤销 | 删除后 toast 带撤销，5s 内点击恢复 |
| A8 | 主窗搜索/筛选 | 搜索框输入 → 实时过滤；状态筛选切换 |