import type { TimerStatus } from "../types/timer";
import { StatusDot } from "./StatusDot";

type FoldedBarProps = {
  taskTitle: string;
  focusMs: number;
  status: TimerStatus | "empty";
  onClick?: () => void;
};

function formatFocusMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

// V0.2.0.14 PATCH A-2 重构: FoldedBar 不再有自己的根 div (PANEL_STYLE / rounded-full / background),
// 只返回横 row 内容 (StatusDot + title + focusMs), 由 App.tsx 单一 root div 统一提供背景/圆角/padding.
// V0.2.0.13 PATCH 让 FoldedBar 嵌套在 floating-root 内 + 自身又套一层 .folded-bar-inner (圆角 + background),
// 跟 ExpandedPanel 的 PANEL_STYLE + rounded-2xl 重复且不一致 — user L3 反馈 "多 2 层容器嵌套 / 圆角不一致 / 切换闪".
// V0.2.0.14 把根 div 单一化, FoldedBar 内容直接 inline 进 root, 折叠态 / 展开态 同一容器同一背景.
export function FoldedBar({ taskTitle, focusMs, status, onClick }: FoldedBarProps) {
  const isEmpty = status === "empty";
  const title = isEmpty ? "未命名任务" : taskTitle;

  return (
    <div
      className="flex h-9 w-full cursor-pointer items-center gap-2 text-text-1"
      onClick={onClick}
      role="status"
      aria-label={
        isEmpty
          ? "Mindtap 计时器，未开始任务"
          : `当前任务 ${title}，已计时 ${formatFocusMs(focusMs)}`
      }
    >
      <StatusDot status={status} size="sm" />
      <span
        className="min-w-0 max-w-[220px] flex-1 truncate text-[13px] font-medium"
        title={title}
      >
        {title}
      </span>
      <span
        className="shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[13px] font-semibold tabular-nums text-primary"
        aria-label="已计时"
      >
        {formatFocusMs(focusMs)}
      </span>
    </div>
  );
}