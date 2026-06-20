import { useEffect, useState } from "react";
import { api, events, type Task } from "../../lib/tauri-bridge";

export function useActiveTask(): Task | null {
  const [active, setActive] = useState<Task | null>(null);

  useEffect(() => {
    // 防御:invoke / listen 在 vite dev / 测试 jsdom 下抛错,unhandled rejection
    // 会让 React unmount 整个 App。三处吞错:外层 try/catch 兜同步 throw;
    // onFocusChanged 返 Promise 挂 .catch(() => null) 吞初始 reject;
    // refresh() 内部 try/catch 写 console.error 不抛。
    try {
      refresh();
      const unlisten = events
        .onFocusChanged(() => refresh())
        .catch(() => null);
      return () => {
        unlisten
          .then((u) => {
            if (typeof u === 'function') u();
          })
          .catch(() => {});
      };
    } catch {
      return; // 非 Tauri 环境 = 永远空 active
    }

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
