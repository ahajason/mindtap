// V0.2.1: 多卡状态拉取。取代单卡 useActiveTask。
// 拉取 active(进行中)+ inbox(收件箱),本地更新支持切换/暂停后即时同步。
import { useCallback, useEffect, useRef, useState } from "react";

import { api, type Item } from "../../lib/tauri-bridge";

export function useActiveTasks() {
  const [active, setActive] = useState<Item[]>([]);
  const [inbox, setInbox] = useState<Item[]>([]);
  const aliveRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [a, i] = await Promise.all([api.item.getActive(), api.item.getInbox()]);
      if (aliveRef.current) {
        setActive(Array.isArray(a) ? a : []);
        setInbox(Array.isArray(i) ? i : []);
      }
    } catch (err) {
      console.error("[active-tasks] refresh failed", err);
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    void refresh();
    return () => {
      aliveRef.current = false;
    };
  }, [refresh]);

  return { active, inbox, refresh, setActive, setInbox };
}
