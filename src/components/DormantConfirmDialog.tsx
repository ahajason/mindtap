// V0.2.2 待确认弹窗(主窗口)。
// V0.2.2 修订: 不再监听 floating:dormant 事件 -- 该事件由 BubbleApp(气泡窗口)独占处理。
// 主窗口的待确认操作通过 Review 页面的 stale 列表按钮完成,避免双窗口同时弹出。
// 本组件保留为占位(未来可复用),当前返回 null。

export function DormantConfirmDialog() {
  return null;
}
