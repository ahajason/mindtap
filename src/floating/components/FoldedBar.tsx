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

// V0.2.0.12 PATCH: StatusDot 恢复 V1.0 archive 设计 (.archive/src/floating/FoldedBar.tsx:31)
// 放在 .folded-bar-inner flex 容器第 1 child (最左, 跟 title 前面), 不再放外层 App.tsx absolute。
export function FoldedBar({ taskTitle, focusMs, status, onClick }: FoldedBarProps) {
  const isEmpty = status === "empty";
  const title = isEmpty ? "未命名任务" : taskTitle;

  return (
    <div
      className="relative w-full"
      onClick={onClick}
    >
      <div
        className="folded-bar-inner flex h-9 w-full cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-text-1 backdrop-blur-md transition-colors hover:bg-white/30"
        style={{
          background: "rgba(255, 255, 255, 0.45)",
        }}
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
    </div>
  );
}
