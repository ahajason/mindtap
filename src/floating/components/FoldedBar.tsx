import type { TimerStatus } from "../types/timer";

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

export function FoldedBar({ taskTitle, focusMs, status, onClick }: FoldedBarProps) {
  const isEmpty = status === "empty";
  const title = isEmpty ? "未命名任务" : taskTitle;

  return (
    <div
      className="glass-l2 flex cursor-pointer items-center justify-between rounded-full px-3 py-1 text-[12px]"
      role="status"
      aria-label={
        isEmpty
          ? "Mindtap 计时器，未开始任务"
          : `当前任务 ${title}，已计时 ${formatFocusMs(focusMs)}`
      }
      onClick={onClick}
    >
      <span className="truncate pr-2">{title}</span>
      <span className="tabular-nums">{formatFocusMs(focusMs)}</span>
    </div>
  );
}