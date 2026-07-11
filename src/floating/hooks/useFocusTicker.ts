import { useEffect, useRef, useState } from "react";

import { api, type TimerSession } from "../../lib/tauri-bridge";

export function useFocusTicker(session: TimerSession | null, intervalMs = 1000): number {
  const [displayMs, setDisplayMs] = useState(0);
  const lastTickRef = useRef<number | null>(null);
  const sessionRef = useRef(session);
  const displayMsRef = useRef(0);

  sessionRef.current = session;
  displayMsRef.current = displayMs;

  useEffect(() => {
    if (!session) {
      lastTickRef.current = null;
      setDisplayMs(0);
      displayMsRef.current = 0;
      return;
    }
    setDisplayMs(session.focus_ms);
    displayMsRef.current = session.focus_ms;
    lastTickRef.current = session.status === "active" ? Date.now() : null;
  }, [session?.id, session?.status]);

  useEffect(() => {
    const tick = () => {
      const s = sessionRef.current;
      if (!s) return;
      if (s.status !== "active") {
        lastTickRef.current = null;
        return;
      }
      const now = Date.now();
      const last = lastTickRef.current ?? now;
      const delta = now - last;
      lastTickRef.current = now;
      const next = displayMsRef.current + delta;
      displayMsRef.current = next;
      setDisplayMs(next);

      void api.timerSession
        .updateFocusMs(s.id, next)
        .catch((err: unknown) => {
          console.error("[focus-tick] update failed", err);
        });
    };
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return displayMs;
}
