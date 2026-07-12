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

// V0.2.0.11 Issue B fix 注释修正: V0.2.0.7 改 top-1 right-1 是必要但非充分条件。
// 真正根因是 .floating-root 缺 position: relative (floating.css 已修)。
// 之前 StatusDot absolute 穿透到 body 作为祖先, 跑 viewport 角落错位;
// 现在 .floating-root 是 relative, top-1 right-1 才真正相对浮窗根 div 右上角。
// V0.2.0.7 反复改 top-right 值 (top-0.5 right-0.5 → top-1 right-1) 都没修对,
// 因为根 div 缺 relative 这一层完全漏了 (反模式 14 反复修 + 反模式 15 根因错位)。
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