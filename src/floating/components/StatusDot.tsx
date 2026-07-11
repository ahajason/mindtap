import type { TimerStatus } from "../types/timer";

type StatusDotProps = {
  status: TimerStatus | null;
};

const DOT_COLOR: Record<TimerStatus, string> = {
  active: "bg-emerald-400",
  paused: "bg-amber-400",
  completed: "bg-zinc-400",
};

export function StatusDot({ status }: StatusDotProps) {
  if (!status) return null;
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-2 shrink-0 rounded-full ${DOT_COLOR[status]}`}
    />
  );
}