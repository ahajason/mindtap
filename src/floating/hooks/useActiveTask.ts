import { useEffect, useState } from "react";
import { api, events, type Task } from "../../lib/tauri-bridge";

export function useActiveTask(): Task | null {
  const [active, setActive] = useState<Task | null>(null);

  useEffect(() => {
    // vite dev 浏览器无 Tauri runtime：invoke / listen 同步抛错。
    // 不 try/catch 会导致 React 整个 tree uncaught exception → unmount → DOM 空。
    // tauri dev / build 后正常调 IPC。
    try {
      refresh();
      const unlisten = events.onFocusChanged(() => refresh());
      return () => {
        unlisten.then((u) => u()).catch(() => {});
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
