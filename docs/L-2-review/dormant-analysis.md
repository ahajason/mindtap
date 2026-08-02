# 失真确认闭环业务能力定义 & 现有实现偏差分析

> ADR-0012 业务本质拆解 + 代码偏差定位。2026-08-03。

## 1. 业务本质

### 1.1 失真确认闭环解决什么问题

用户在 Mindtap 中点「开始」计时后，可能忘记暂停（去开会、午休、下班）。如果不处理，计时会无限膨胀，台账失真。

**失真确认闭环 = 系统主动询问用户"这个任务还在进行中吗？"，判定权交给用户，系统不武断抹除时间。**

### 1.2 两条触发路径

| 路径 | 触发条件 | 数据变更 | 气泡文案 |
|---|---|---|---|
| **冷却检测** | active 卡 2h 无更新 | 挂 `pending_ms`，**卡保持 active**，计时继续 | "X 还在进行中，还要继续吗？" [继续] [暂停] |
| **空闲检测** | 系统 10min 无键鼠输入 | `pause()` -> active→todo，挂 `pending_ms`，停表 | "X 已自动暂停，刚才是专注吗？" [记入] [丢弃] |

### 1.3 气泡两阶段生命周期

```
阶段1: 询问态（冷却触发）
  "X 还在进行中，还要继续吗？" [继续] [暂停]
  -> 用户点「继续」: 清 pending_ms，继续计时
  -> 用户点「暂停」: pause()，进入待确认态
  -> 5s 无操作: 自动 pause()，进入待确认态

阶段2: 待确认态
  "刚才这 X 要计入吗？" [记入] [丢弃]
  -> 记入: pending_ms 计入 focus_ms（确认投入）
  -> 丢弃: pending_ms 清零（否决投入）

（空闲触发直接进入阶段2，因为已经 pause 了）
```

### 1.4 核心业务价值

- **风险二次校验**：不武断抹除时间，用户判定是否真实投入
- **操作不可逆兜底**：5s 超时自动暂停，防止无限计时
- **失真窗口留痕**：pending_ms 记录待确认时长，confirm_pending 后清空

### 1.5 合理触发场景

| 场景 | 合理触发？ | 理由 |
|---|---|---|
| 浮窗气泡窗口（BubbleApp） | ✅ 唯一合法入口 | ADR-0012 设计：独立小窗 280×80，不抢焦点 |
| 主窗口（DormantConfirmDialog） | ❌ 不合理 | 主窗是管理/复盘界面，不是实时确认场景 |
| Review 页面 stale 列表 | ✅ 补充入口 | 用户主动复盘时处理遗漏的待确认 |

## 2. 现有实现偏差分析

### 2.1 偏差 1: 后端 emit floating:dormant 后未 show bubble 窗口 ⚠️ 关键

**根因**：`lib.rs` 后台线程检测到失真后 `app_handle.emit("floating:dormant", &p)`，但 bubble 窗口 `visible: false`（`tauri.conf.json` line 59），事件广播到所有窗口但 bubble 窗口不可见，用户看不到气泡。

**代码位置**：`src-tauri/src/lib.rs` line 160, 201
```rust
// 当前：只 emit 事件
let _ = app_handle.emit("floating:dormant", &p);
// 缺失：没有 bubble_window.show()
```

**修复方案**：emit 前先 `app_handle.get_webview_window("bubble").show()`

### 2.2 偏差 2: DormantConfirmDialog 返回 null（正确决策）

**现状**：`DormantConfirmDialog.tsx` 返回 null，不再监听 `floating:dormant` 事件。

**判定**：✅ 正确。主窗不属于失真确认气泡的合理触发场景。主窗的待确认操作通过 Review 页面 stale 列表按钮完成。

### 2.3 偏差 3: BubbleApp 前端轮询 + 事件监听双路径

**现状**：`BubbleApp.tsx` 同时使用：
- `useDormantCheck(POLL_MS, ...)` 每 5 分钟轮询 `item_check_dormant`
- `listen("floating:dormant", ...)` 监听后端事件

**判定**：⚠️ 冗余但可接受。轮询作为兜底（后端线程可能未启动），事件作为主路径。但需确认轮询路径也能 show bubble 窗口。

### 2.4 偏差 4: 空闲检测路径 emit 但未 show bubble 窗口

**现状**：`lib.rs` line 172-188，空闲检测 `scan_and_auto_pause` 后发系统通知，但 emit `floating:dormant` 的代码块在失真检测部分（line 192-204），空闲检测路径可能不 emit 事件。

**代码追踪**：
- `scan_and_auto_pause` 返回 `Vec<PauseResult>`，每个 result 含 `pending_ms`
- 后端发通知（line 184-188）
- 但**没有** emit `floating:dormant` 事件给这些空闲暂停的卡

**修复方案**：空闲检测 pause 后也 emit `floating:dormant` 事件 + show bubble 窗口

### 2.5 偏差 5: 冷却阈值/空闲超时/轮询间隔硬编码

**现状**：
- `dormant.rs` line 12: `DISTORTION_IDLE_MS = 2 * 60 * 60 * 1000`（硬编码 2h）
- `idle.rs` line 13: `IDLE_AUTO_PAUSE_MS = 10 * 60 * 1000`（硬编码 10min）
- `BubbleApp.tsx` line 15: `POLL_MS = 300_000`（硬编码 5min）
- `lib.rs` line 128: 后台线程 30s 间隔（硬编码）

**需求**：设置页增加 4 个可调参数，持久化到 `app_setting` 表。

## 3. 代码触发入口点位

| 入口 | 文件 | 职责 |
|---|---|---|
| 后端 30s 线程 | `lib.rs:132-217` | 空闲检测 + 失真检测 + 前台监听 |
| 失真检测核心 | `dormant.rs:settle_dormant()` | 冷却 2h 挂 pending + 跨天退回 todo |
| 空闲检测核心 | `idle.rs:scan_and_auto_pause()` | 10min 无键鼠 -> pause |
| 前端轮询 | `useDormantCheck.ts` | 5min 调 `item_check_dormant` |
| 气泡窗口 | `BubbleApp.tsx` | 监听事件 + 轮询 -> 显示气泡 |
| 气泡 UI | `Bubble.tsx` | 询问态/待确认态渲染 |
| 主窗 Dialog | `DormantConfirmDialog.tsx` | 返回 null（已废弃） |
| Review stale | `Review.tsx` | stale 列表确认/忽略按钮 |
| check_dormant 命令 | `commands/item.rs:134` | 前端调用的失真检测入口 |
