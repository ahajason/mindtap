import type { TimerStatus } from "../types/timer";

type StatusDotProps = {
  status: TimerStatus | "empty" | null | undefined;
  size?: "sm" | "md";
  position?: "inline" | "absolute";
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

// V0.2.8 Issue B fix: 8x8 dot 推 -top-0.5 -right-0.5 (各 -2px) 会超出父容器, 被
// .floating-root { overflow: hidden } 裁掉右上半圆; animate-pulse-dot scale(1.15)
// 让跳动残影明显。改 top-1 right-1 (+4px 内) 整在父容器内, 不溢出不被裁。
const POSITION_CLASS: Record<"inline" | "absolute", string> = {
  inline: "",
  absolute: "absolute top-1 right-1",
};

export function StatusDot({ status, size = "sm", position = "inline" }: StatusDotProps) {
  if (!status) return null;
  const key = status === "empty" ? "empty" : status;
  const isPulsing = status === "active";
  return (
    <span
      aria-hidden="true"
      className={[
        "inline-block shrink-0 rounded-full ring-2 ring-white/40",
        DOT_COLOR[key],
        SIZE_CLASS[size],
        POSITION_CLASS[position],
        isPulsing ? "animate-pulse-dot" : "",
      ].join(" ")}
    />
  );
}