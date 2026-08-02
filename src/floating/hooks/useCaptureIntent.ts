// V0.2.1: 监听 Rust 快捷键发出的 floating:capture 事件 → 进入捕获意图。
// Rust 侧:全局快捷键 handler 在 show 浮窗后 emit 此事件(前端聚焦输入框)。
import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";

export function useCaptureIntent() {
  const [intent, setIntent] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let alive = true;
    (async () => {
      try {
        unlisten = await listen("floating:capture", () => {
          if (alive) setIntent(true);
        });
      } catch (err) {
        console.error("[capture-intent] listen failed", err);
      }
    })();
    return () => {
      alive = false;
      unlisten?.();
    };
  }, []);

  const clear = useCallback(() => setIntent(false), []);

  return { intent, setIntent, clear };
}
