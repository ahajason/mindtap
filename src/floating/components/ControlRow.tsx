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
          onClick={onPause}
          className="rounded-full px-3 py-1 text-[11px] text-white/70 hover:bg-white/10"
        >
          暂停
        </button>
      )}
      {status === "paused" && (
        <button
          type="button"
          onClick={onResume}
          className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium hover:bg-white/30"
        >
          恢复
        </button>
      )}
      {status !== "completed" && (
        <button
          type="button"
          onClick={onComplete}
          className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium hover:bg-white/30"
        >
          完成
        </button>
      )}
    </div>
  );
}