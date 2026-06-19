// 浮窗高度 clamp 纯函数（V1.5+: 内容自适应，Rust 端也会 clamp 一遍兜底）
// 数值边界必须与 src-tauri/src/commands/floating_cmd.rs 的 MIN_H/MAX_H 同步

export interface ClampBounds {
  minH: number;
  maxH: number;
}

/**
 * 把元素 scrollHeight 夹在 [minH, maxH] 之间，向上取整。
 * - 极小内容（如刚展开时只有 ControlRow）：clamp 到 minH
 * - 超长内容（如 textarea 输入长文本)：clamp 到 maxH
 * - NaN / 负数 / 0：返回 minH（保证窗口至少有最小可见高度）
 */
export function clampHeight(scrollHeight: number, bounds: ClampBounds): number {
  const { minH, maxH } = bounds;
  if (!Number.isFinite(scrollHeight) || scrollHeight <= 0) return minH;
  return Math.max(minH, Math.min(maxH, Math.ceil(scrollHeight)));
}