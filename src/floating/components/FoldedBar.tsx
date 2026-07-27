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

// 折叠与展开持续复用同一状态条；固定几何和间距由 floating-status-bar 负责。
// 展开内容在状态条下方渲染，不改变状态条的位置或尺寸。
export function FoldedBar({ taskTitle, focusMs, status, onClick }: FoldedBarProps) {
  const isEmpty = status === "empty";
  const title = isEmpty ? "未命名任务" : taskTitle;

  return (
    <div
      className="floating-status-bar"
      onClick={onClick}
      role="status"
      aria-label={
        isEmpty
          ? "Mindtap 计时器，未开始任务"
          : `当前任务 ${title}，已计时 ${formatFocusMs(focusMs)}`
      }
    >
      <StatusDot status={status} size="sm" />
      <span className="floating-status-title" title={title}>
        {title}
      </span>
      <span
        className="floating-status-timer"
        aria-label="已计时"
      >
        {formatFocusMs(focusMs)}
      </span>
    </div>
  );
}