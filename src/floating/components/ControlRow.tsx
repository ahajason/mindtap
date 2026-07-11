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
          className="rounded-full px-3 py-1 text-[11px] text-text-2 hover:bg-white/40"
        >
          暂停
        </button>
      )}
      {status === "paused" && (
        <button
          type="button"
          data-no-expand
          onClick={onResume}
          className="rounded-full bg-white/40 px-3 py-1 text-[11px] font-medium text-text-1 hover:bg-white/60"
        >
          恢复
        </button>
      )}
      {status !== "completed" && (
        <button
          type="button"
          data-no-expand
          onClick={onComplete}
          className="rounded-full bg-white/40 px-3 py-1 text-[11px] font-medium text-text-1 hover:bg-white/60"
        >
          完成
        </button>
      )}
    </div>
  );
}