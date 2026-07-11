import { useCallback, useEffect, useRef, useState } from "react";

import { api, type TimerSession } from "../../lib/tauri-bridge";

export function useActiveTask() {
  const [session, setSession] = useState<TimerSession | null>(null);
  const aliveRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const next = await api.timerSession.getActive();
      if (aliveRef.current) setSession(next);
    } catch (err) {
      console.error("[active-task] refresh failed", err);
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    void refresh();
    return () => {
      aliveRef.current = false;
    };
  }, [refresh]);

  return { session, refresh, setSession };
}
