import { useCallback, useEffect, useRef, useState } from "react";

import { api, type TitleRec } from "../../lib/tauri-bridge";

const CACHE_TTL_MS = 30_000;

export function useRecentTaskTitles() {
  const [recs, setRecs] = useState<TitleRec[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fetchedAt, setFetchedAt] = useState(0);
  const aliveRef = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.item.getHistoryTitles(5);
      if (aliveRef.current) {
        setRecs(data);
        setFetchedAt(Date.now());
      }
    } catch (e) {
      if (aliveRef.current) setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    if (Date.now() - fetchedAt > CACHE_TTL_MS || recs === null) {
      void refresh();
    }
    return () => {
      aliveRef.current = false;
    };
  }, [fetchedAt, recs, refresh]);

  return { recs, loading, error, refresh };
}