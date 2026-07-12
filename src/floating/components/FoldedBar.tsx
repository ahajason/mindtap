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