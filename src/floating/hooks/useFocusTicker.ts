import { useEffect, useState } from "react";

import { api, type TimerSession } from "../../lib/tauri-bridge";

export function useFocusTicker(session: TimerSession | null, intervalMs = 1000): number {
  const [displayMs, setDisplayMs] = useState(0);

  useEffect(() => {
    if (!session) {
      setDisplayMs(0);
      return;
    }
    const startMs = session.focus_ms;
    setDisplayMs(startMs);

    if (session.status !== "active") return;

    const baseAt = Date.now();
    const id = setInterval(() => {
      const next = startMs + (Date.now() - baseAt);
      setDisplayMs(next);
      void api.timerSession.updateFocusMs(session.id, next);
    }, intervalMs);
    return () => clearInterval(id);
  }, [session?.id, session?.status, session?.focus_ms]);

  return displayMs;
}
