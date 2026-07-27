import type { TimerStatus } from "../types/timer";

type ControlRowProps = {
  status: TimerStatus;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
};

export function ControlRow({ status, onPause, onResume, onComplete }: ControlRowProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      {status === "active" && (
        <button
          type="button"
          data-no-expand
          onClick={onPause}
          className="h-8 rounded-[10px] px-4 text-[13px] font-medium text-text-2 transition-colors hover:bg-white/40"
        >
          暂停
        </button>
      )}
      {status === "paused" && (
        <button
          type="button"
          data-no-expand
          onClick={onResume}
          className="h-8 rounded-[10px] bg-white/40 px-4 text-[13px] font-medium text-text-1 transition-colors hover:bg-white/60"
        >
          恢复
        </button>
      )}
      {status !== "completed" && (
        <button
          type="button"
          data-no-expand
          onClick={onComplete}
          className="h-8 rounded-[10px] bg-white/40 px-4 text-[13px] font-medium text-text-1 transition-colors hover:bg-white/60"
        >
          完成
        </button>
      )}
    </div>
  );
}