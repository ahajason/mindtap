// V0.2.1: 五态状态机(inbox/todo/active/done/archived),无独立 paused。
// 取代旧三态 TimerStatus(active/paused/completed)。
export type ItemStatus = "inbox" | "todo" | "active" | "done" | "archived";

// 兼容:旧组件仍引用 TimerStatus(折叠条 status 语义)
export type TimerStatus = "active" | "paused" | "completed";
