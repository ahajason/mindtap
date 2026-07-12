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

// V0.2.0.12 PATCH: 恢复 V1.0 archive inline-block span 设计 (见 .archive/src/floating/StatusDot.tsx)
// 折叠态 StatusDot 是 flex 容器第 1 child (最左, 跟 title 前面), 不是右上角硬定位。
// V0.2.0.7 / V0.2.0.11 B fix 的右上角硬定位 + .floating-root 单独锚点声明
// 是基于误导 spec 反复修的产物, 不是 V1.0 真相。
export function StatusDot({ status, size = "sm" }: StatusDotProps) {
  if (!status) return null;
  const key = status === "empty" ? "empty" : status;
  const isPulsing = status === "active";
  return (
    <span
      data-no-expand
      aria-hidden="true"
      className={[
        // V0.2.0.13 PATCH: 加 align-middle + self-center 让 inline-block 默认 baseline
        // 在 flex 容器内 + active 状态 scale(1.15) 时, 视觉中心仍对齐父级 items-center 行
        // (V0.2.0.12 状态未垂直对齐 P1 修复)
        "inline-block shrink-0 self-center align-middle rounded-full ring-2 ring-white/40",
        DOT_COLOR[key],
        SIZE_CLASS[size],
        isPulsing ? "animate-pulse-dot" : "",
      ].join(" ")}
    />
  );
}
