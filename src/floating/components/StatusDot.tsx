import type { TimerStatus } from "../types/timer";

type StatusDotProps = {
  status: TimerStatus | "empty" | null | undefined;
  size?: "sm" | "md";
};

const DOT_COLOR: Record<TimerStatus | "empty", string> = {
  empty: "bg-neutral-200",
  active: "bg-emerald-400",
  paused: "bg-amber-400",
  completed: "bg-zinc-400",
};

const SIZE_CLASS: Record<"sm" | "md", string> = {
  sm: "size-2",
  md: "size-2.5",
};

// StatusDot 是 FoldedBar flex 容器的第一个子元素，固定显示在任务标题左侧。
export function StatusDot({ status, size = "sm" }: StatusDotProps) {
  if (!status) return null;
  const key = status === "empty" ? "empty" : status;
  const isPulsing = status === "active";
  return (
    <span
      aria-hidden="true"
      className={[
        "inline-block shrink-0 self-center rounded-full ring-2 ring-white/40",
        DOT_COLOR[key],
        SIZE_CLASS[size],
        isPulsing ? "animate-pulse-dot" : "",
      ].join(" ")}
    />
  );
}