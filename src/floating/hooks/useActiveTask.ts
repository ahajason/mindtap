import { useEffect, useState } from "react";
import { api, events, type Task } from "../../lib/tauri-bridge";

export function useActiveTask(): Task | null {
  const [active, setActive] = useState<Task | null>(null);

  useEffect(() => {
    refresh();
    const unlisten = events.onFocusChanged(() => refresh());
    return () => {
      unlisten.then((u) => u());
    };

    async function refresh() {
      try {
        // 调 recordGetActiveTask 而非 recordGetActive：后者只返回 6 列
        // record（缺 duration_ms / focus_started_at），导致前端算 live 时长
        // 拿到 undefined → formatDuration 输出 NaN。
        const t = await api.recordGetActiveTask();
        setActive(t);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  return active;
}
