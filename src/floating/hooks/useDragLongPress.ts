// src/floating/hooks/useDragLongPress.ts
//
// 长按 N 毫秒后调用 getCurrentWindow().startDragging()，由 OS 接管窗口拖拽。
// 设计目标：短按不触发拖拽（留给 click 处理），长按期间不触发 click 的默认行为。
//
// 用法：
//   const drag = useDragLongPress();
//   <div
//     onPointerDown={drag.onPointerDown}
//     onPointerUp={drag.onPointerUp}
//     onPointerLeave={drag.onPointerCancel}
//     onClick={() => { if (!drag.wasDragged()) expand(); }}
//   >

import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

type Options = {
  /** 长按阈值（毫秒），默认 300 */
  thresholdMs?: number;
  /** 仅响应左键（0），避免右键/中键误触 */
  button?: number;
};

export function useDragLongPress(opts: Options = {}) {
  const { thresholdMs = 300, button = 0 } = opts;

  const timerRef = useRef<number | null>(null);
  // 本次按下是否已起拖；click 处理器读取以决定是否抑制默认行为
  const draggedRef = useRef(false);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== button) return;
      // 每次新按下重置标记；点击事件会在 pointerup 之后才触发，标记仍可见
      draggedRef.current = false;
      cancel();
      timerRef.current = window.setTimeout(async () => {
        timerRef.current = null;
        try {
          await getCurrentWindow().startDragging();
          draggedRef.current = true;
        } catch (err) {
          // 浏览器环境（无 Tauri）会失败，静默即可
          console.warn("[useDragLongPress] startDragging failed:", err);
        }
      }, thresholdMs);
    },
    [button, thresholdMs, cancel]
  );

  // pointerup 触发后 click 仍会 fire；这里不清 draggedRef，让 click 看见
  const onPointerUp = useCallback(() => {
    cancel();
  }, [cancel]);

  // pointerleave（如拖出窗口）取消未触发的 timer
  const onPointerCancel = cancel;

  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    /** 读取本次按下是否已起拖（给 click 处理器判断是否抑制） */
    wasDragged: () => draggedRef.current,
  };
}
