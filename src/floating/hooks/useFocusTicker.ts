import { useEffect, useRef } from "react";

import { api } from "../../lib/tauri-bridge";

export function useFocusTicker(activeSessionId: number | null, intervalMs = 1000): void {
  const lastFocusMsRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const idRef = useRef(activeSessionId);

  useEffect(() => {
    idRef.current = activeSessionId;
    lastFocusMsRef.current = 0;
    lastTickRef.current = null;
  }, [activeSessionId]);

  useEffect(() => {
    if (activeSessionId === null) return;

    const tick = () => {
      const now = Date.now();
      const base = lastTickRef.current ?? now;
      const delta = lastTickRef.current === null ? 0 : now - base;
      lastTickRef.current = now;
      lastFocusMsRef.current = lastFocusMsRef.current + delta;

      void api.timerSession
        .updateFocusMs(idRef.current as number, lastFocusMsRef.current)
        .catch((err: unknown) => {
          console.error("[focus-tick] update failed", err);
        });
    };

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [activeSessionId, intervalMs]);
}