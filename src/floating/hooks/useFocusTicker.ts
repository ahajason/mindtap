// V0.2.1: 后端主导实时时长推导(决策 9)。
// focus_ms 存已结算值,实时时长 = focus_ms + (now - last_active_at)。
// 前端只显示,不写库(删除了旧 updateFocusMs 调用)。
import { useEffect, useState } from "react";

import type { Item } from "../../lib/tauri-bridge";

export function useFocusTicker(item: Item | null, intervalMs = 1000): number {
  const [displayMs, setDisplayMs] = useState(0);

  useEffect(() => {
    if (!item) {
      setDisplayMs(0);
      return;
    }
    if (item.status !== "active" || item.last_active_at == null) {
      setDisplayMs(item.focus_ms);
      return;
    }

    const elapsedBase = item.last_active_at;
    const setFromClock = () => {
      setDisplayMs(item.focus_ms + Math.max(0, Date.now() - elapsedBase));
    };
    setFromClock();
    const id = setInterval(setFromClock, intervalMs);
    return () => clearInterval(id);
  }, [item?.id, item?.status, item?.focus_ms, item?.last_active_at, intervalMs]);

  return displayMs;
}
