// V0.2.1: 多卡状态拉取。取代单卡 useActiveTask。
// 拉取 active(进行中)+ todo(待办,含原收件箱并入)。本地更新支持切换/暂停后即时同步。
// V0.2.2: 监听 floating:data_changed 事件自动刷新 + 30s 轮询兜底。
import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";

import { api, type Item } from "../../lib/tauri-bridge";

const POLL_INTERVAL_MS = 30_000; // 30s 轮询兜底,确保浮窗常驻时数据相对新鲜

export function useActiveTasks() {
  const [active, setActive] = useState<Item[]>([]);
  const [todo, setTodo] = useState<Item[]>([]);
  const aliveRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [a, t] = await Promise.all([
        api.item.getActive(),
        api.item.getTodo(),
      ]);
      if (aliveRef.current) {
        setActive(Array.isArray(a) ? a : []);
        setTodo(Array.isArray(t) ? t : []);
      }
    } catch (err) {
      console.error("[useActiveTasks] refresh failed", err);
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    void refresh();

    // 监听跨窗口数据变更事件 -> 自动刷新
    let cancelled = false;
    let cleanup: (() => void) | null = null;
    (async () => {
      try {
        const unlisten = await listen("floating:data_changed", () => {
          if (!cancelled) void refresh();
        });
        if (cancelled) {
          unlisten();
        } else {
          cleanup = unlisten;
        }
      } catch {
        // 无 Tauri runtime -> 静默降级,仅靠轮询
      }
    })();

    // 30s 轮询兜底:即使事件丢失,数据也不会太陈旧
    const pollId = setInterval(() => {
      if (aliveRef.current) void refresh();
    }, POLL_INTERVAL_MS);

    return () => {
      aliveRef.current = false;
      cancelled = true;
      cleanup?.();
      clearInterval(pollId);
    };
  }, [refresh]);

  return { active, todo, refresh, setActive, setTodo };
}
