import { useEffect, useState } from "react";
import { api, events, type Record } from "../../lib/tauri-bridge";

export function useActiveTask(): Record | null {
  const [active, setActive] = useState<Record | null>(null);

  useEffect(() => {
    refresh();
    const unlisten = events.onFocusChanged(() => refresh());
    return () => {
      unlisten.then((u) => u());
    };

    async function refresh() {
      try {
        const r = await api.recordGetActive();
        setActive(r);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  return active;
}
