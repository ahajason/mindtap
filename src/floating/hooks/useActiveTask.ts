import { useCallback, useEffect, useRef, useState } from "react";

import { api, type TimerSession } from "../../lib/tauri-bridge";

type UseActiveTaskResult = {
  session: TimerSession | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useActiveTask(): UseActiveTaskResult {
  const [session, setSession] = useState<TimerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const aliveRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const next = await api.timerSession.getActive();
      if (aliveRef.current) setSession(next);
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    void refresh();
    return () => {
      aliveRef.current = false;
    };
  }, [refresh]);

  return { session, loading, refresh };
}