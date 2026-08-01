// V0.2.1: 失真确认气泡(ADR-0012)。独立小窗呈现。
// 两种态:询问态(还在进行中,还要继续吗)→ 待确认态(刚才这段时间要计入吗)。
import { formatFocusMs } from "./TaskCard";

type BubbleProps = {
  content: string;
  /** 失真窗口毫秒 */
  pendingMs?: number;
  /** 询问态 */
  onContinue?: () => void;
  onPause?: () => void;
  /** 待确认态 */
  pendingConfirm?: boolean;
  onKeep?: () => void;
  onDiscard?: () => void;
};

export function Bubble({
  content,
  pendingMs,
  onContinue,
  onPause,
  pendingConfirm,
  onKeep,
  onDiscard,
}: BubbleProps) {
  return (
    <div
      className="bubble-root"
      role="dialog"
      aria-label="任务失真确认"
      aria-live="assertive"
    >
      {pendingConfirm ? (
        <>
          <p className="text-[13px] font-medium text-text-1">
            刚才这 {formatFocusMs(pendingMs ?? 0)} 要计入吗？
          </p>
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onDiscard}
              className="h-7 rounded-[8px] px-3 text-[12px] font-medium text-text-2 transition-colors hover:bg-white/40"
            >
              丢弃
            </button>
            <button
              type="button"
              onClick={onKeep}
              className="h-7 rounded-[8px] bg-primary px-3 text-[12px] font-semibold text-white shadow-sm"
            >
              记入
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[13px] font-medium text-text-1">
            {content} 还在进行中，还要继续吗？
          </p>
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onPause}
              className="h-7 rounded-[8px] px-3 text-[12px] font-medium text-text-2 transition-colors hover:bg-white/40"
            >
              暂停
            </button>
            <button
              type="button"
              onClick={onContinue}
              className="h-7 rounded-[8px] bg-primary px-3 text-[12px] font-semibold text-white shadow-sm"
            >
              继续
            </button>
          </div>
        </>
      )}
    </div>
  );
}
