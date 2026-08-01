// V0.2.1: 折叠态 = 并行计数条(收件箱数 + 活跃任务数 + 待确认数)。
// 存在感最低,展示"未整理 + 在推进"的概览。取代旧单任务状态条。
import { StatusDot } from "./StatusDot";

type FoldedBarProps = {
  inboxCount: number;
  activeCount: number;
  pendingCount: number;
  onClick?: () => void;
};

export function FoldedBar({ inboxCount, activeCount, pendingCount, onClick }: FoldedBarProps) {
  return (
    <div
      className="floating-status-bar"
      onClick={onClick}
      role="status"
      aria-label={`Mindtap 工作台账，收件箱 ${inboxCount}，进行中 ${activeCount}`}
    >
      <StatusDot status={activeCount > 0 ? "active" : "empty"} size="sm" />
      <span className="floating-status-title" title={`收件箱 ${inboxCount}`}>
        收件箱 {inboxCount}
      </span>
      <span className="floating-status-timer" aria-label="进行中">
        进行中 {activeCount}
      </span>
      {pendingCount > 0 && (
        <span className="ml-1 rounded-full bg-amber-400/20 px-1.5 text-[11px] font-medium text-amber-700">
          待确认 {pendingCount}
        </span>
      )}
    </div>
  );
}
