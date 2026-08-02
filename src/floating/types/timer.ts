// V0.2.1: 三态状态机(todo/active/archived)。
// 取代旧三态 TimerStatus(active/paused/completed)。
export type ItemStatus = "todo" | "active" | "archived";

// 兼容:旧组件仍引用 TimerStatus(折叠条 status 语义)
export type TimerStatus = "active" | "paused" | "completed";
