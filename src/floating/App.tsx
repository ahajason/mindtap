// V0.2.1: 浮窗三态折叠 → folded(计数条) / compose(捕获输入) / list(并行卡片列表)。
// 取代旧单卡三态(folded/compose/controls)。
// 拖动/位置记忆/dismiss/原生菜单等机制保留 V0.2.0 既有实现。

import { useCallback, useEffect, useRef, useState } from "react";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import {
  availableMonitors,
  getCurrentWindow,
  PhysicalPosition,
} from "@tauri-apps/api/window";

import { api } from "../lib/tauri-bridge";
import { useActiveTasks } from "./hooks/useActiveTasks";
import { useCaptureIntent } from "./hooks/useCaptureIntent";
import { ExpandedPanel } from "./components/ExpandedPanel";
import { FoldedBar } from "./components/FoldedBar";
import { TaskCard } from "./components/TaskCard";

type FloatingPresentation = "folded" | "compose" | "list";

const FLOATING_SIZE: Record<FloatingPresentation, { w: number; h: number }> = {
  folded: { w: 360, h: 36 },
  compose: { w: 360, h: 280 },
  list: { w: 360, h: 280 },
};

const TASK_TITLE_MAX = 200;
const WIP_SOFT_LIMIT = 5;

// FRAME_W/H: 默认右上角位置 clamp 公式用, 折叠态物理窗口尺寸.
const FRAME_W = 360;
const FRAME_H = 36;
const POS_MARGIN = 16;
const POS_KEY = "floating-position";
const DRAG_THRESHOLD_PX = 4;

// 冷却档位:按 last_active_at 时间差派生(ADR-0012)。活跃/冷却/晾着 = 真实性衰减,非状态。
function coldLevel(la: number | null | undefined, now: number): "cooling" | "stale" | undefined {
  if (la == null) return undefined;
  const diff = now - la;
  if (diff > 24 * 3600 * 1000) return "stale";
  if (diff > 2 * 3600 * 1000) return "cooling";
  return undefined;
}

export function FloatingApp() {
  const { active, inbox, refresh } = useActiveTasks();
  const { intent, clear } = useCaptureIntent();
  const [nowTick, setNowTick] = useState(() => Date.now());

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 展开态默认:有卡 → list;空 → compose;捕获意图强制 compose
  const hasCards = active.length > 0 || inbox.length > 0;
  const presentation: FloatingPresentation = !isPanelOpen
    ? "folded"
    : intent
      ? "compose"
      : hasCards
        ? "list"
        : "compose";

  // 捕获意图到达:强制展开进入 compose(PRD 1.1:快捷键唤起输入框聚焦)
  useEffect(() => {
    if (intent) setIsPanelOpen(true);
  }, [intent]);

  const panelRef = useRef<HTMLDivElement | null>(null);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    isDragging: boolean;
    dragStarted: boolean;
    win: ReturnType<typeof getCurrentWindow> | null;
  } | null>(null);

  // 每秒刷新 nowTick,驱动冷却档位变化
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const win = getCurrentWindow();
    (async () => {
      try {
        if (cancelled) return;
        const { w, h } = FLOATING_SIZE[presentation];
        if (presentation !== "folded") {
          const pos = await win.outerPosition();
          if (cancelled) return;
          await invoke<void>("set_floating_size", { w, h });
          if (cancelled) return;
          await win.setPosition(new PhysicalPosition(pos.x, pos.y));
          return;
        }

        await invoke<void>("set_floating_size", { w, h });
      } catch (err) {
        if (!cancelled) {
          console.error("[resize/position] failed", err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [presentation]);

  // 位置记忆(保留 V0.2.0.15 实现)
  useEffect(() => {
    let cancelled = false;
    let unlisten: UnlistenFn | null = null;

    (async () => {
      let win: ReturnType<typeof getCurrentWindow> | null = null;
      try {
        win = getCurrentWindow();
      } catch {
        return;
      }
      if (!win?.setPosition || !win?.onMoved) return;

      await new Promise((r) => setTimeout(r, 50));
      if (cancelled) return;

      const clampInsideMonitor = (
        pos: { x: number; y: number },
        monitors: { position: { x: number; y: number }; size: { width: number; height: number } }[],
      ): boolean => {
        return monitors.some(
          (m) =>
            pos.x >= m.position.x + POS_MARGIN &&
            pos.x + FRAME_W <= m.position.x + m.size.width - POS_MARGIN &&
            pos.y >= m.position.y + POS_MARGIN &&
            pos.y + FRAME_H <= m.position.y + m.size.height - POS_MARGIN,
        );
      };

      const setDefaultAtRightBottom = async (): Promise<void> => {
        let monitors;
        try {
          monitors = await availableMonitors();
        } catch (err) {
          console.error("[floating-position] availableMonitors failed", err);
          return;
        }
        const primary = monitors.find((m) => m.position.x === 0) ?? monitors[0];
        if (!primary) {
          console.warn("[floating-position] no monitors detected, skip default position");
          return;
        }
        await win!.setPosition(
          new PhysicalPosition(
            primary.position.x + primary.size.width - FRAME_W - POS_MARGIN,
            primary.position.y + POS_MARGIN,
          ),
        );
      };

      try {
        const saved = localStorage.getItem(POS_KEY);
        if (saved) {
          let pos: { x: number; y: number } | null = null;
          try {
            pos = JSON.parse(saved) as { x: number; y: number };
          } catch {
            localStorage.removeItem(POS_KEY);
          }
          if (pos) {
            let monitors;
            try {
              monitors = await availableMonitors();
            } catch (err) {
              console.error("[floating-position] availableMonitors failed", err);
              localStorage.removeItem(POS_KEY);
              await setDefaultAtRightBottom();
              return;
            }
            if (cancelled) return;
            if (clampInsideMonitor(pos, monitors)) {
              await win.setPosition(new PhysicalPosition(pos.x, pos.y));
            } else {
              localStorage.removeItem(POS_KEY);
              await setDefaultAtRightBottom();
            }
          } else {
            await setDefaultAtRightBottom();
          }
        } else {
          await setDefaultAtRightBottom();
        }
      } catch (err) {
        console.error("[floating-position] init failed", err);
      }

      if (cancelled) return;

      try {
        unlisten = await win.onMoved(({ payload }) => {
          try {
            localStorage.setItem(POS_KEY, JSON.stringify(payload));
          } catch {
            // localStorage 不可用 → 静默放弃持久化
          }
        });
      } catch (err) {
        console.error("[floating-position] onMoved register failed", err);
      }
    })();

    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, []);

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-no-expand], [data-close]")) return;
    let win: ReturnType<typeof getCurrentWindow> | null = null;
    try {
      win = getCurrentWindow();
    } catch {
      // dev / vitest 环境无 Tauri runtime, win 保持 null
    }
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      isDragging: true,
      dragStarted: false,
      win,
    };
  }

  async function onContextMenuCapture(e: MouseEvent) {
    if (e.button !== 2) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.app.showFloatingContextMenu();
    } catch (err) {
      console.error("[showFloatingContextMenu] failed", err);
    }
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current?.isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX && !dragRef.current.dragStarted) {
        dragRef.current.dragStarted = true;
        try {
          void dragRef.current.win?.startDragging();
        } catch (err) {
          console.error("[drag] startDragging failed", err);
        }
      }
    };
    const onMouseUp = () => {
      if (!dragRef.current) return;
      if (!dragRef.current.dragStarted) {
        setIsPanelOpen(true);
      }
      dragRef.current = null;
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("contextmenu", onContextMenuCapture, { capture: true });
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("contextmenu", onContextMenuCapture, { capture: true } as EventListenerOptions);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    clear();
    setIsPanelOpen(false);
  }, [clear]);
  const handleClearAndDismiss = useCallback(() => {
    clear();
    setTaskTitle("");
    setIsPanelOpen(false);
  }, [clear]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const node = panelRef.current;
      if (!node) return;
      if (!node.contains(e.target as Node)) {
        handleDismiss();
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [handleDismiss]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && presentation !== "folded") handleDismiss();
    }
    function onWindowBlur() {
      if (dragRef.current?.dragStarted) {
        dragRef.current = null;
        return;
      }
      if (presentation !== "folded") handleDismiss();
    }

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [presentation, handleDismiss]);

  // 捕获:内容非空即存,进收件箱(PRD 1.1 + 3.2 规则 1)
  async function handleStart() {
    const title = taskTitle.trim();
    if (!title || submitting) return;
    setSubmitting(true);
    try {
      await api.item.create(title);
      clear();
      setTaskTitle("");
      setIsPanelOpen(false);
      void refresh();
    } catch (err) {
      console.error("[start] failed", err);
    } finally {
      setSubmitting(false);
    }
  }

  // 开始/切换:inbox/todo → active,零成本切换(后端事务把其他 active 退回 todo)
  async function handleStartItem(id: number) {
    try {
      await api.item.start(id);
      void refresh();
    } catch (err) {
      console.error("[item.start] failed", err);
    }
  }

  const pendingCount = active.filter((a) => a.pending_ms != null).length;

  return (
    <div
      ref={panelRef}
      data-testid="floating-root"
      className={`floating-root ${presentation === "folded" ? "folded" : "expanded"}`}
      onMouseDown={handleMouseDown}
    >
      <div className="floating-content">
        <FoldedBar
          inboxCount={inbox.length}
          activeCount={active.length}
          pendingCount={pendingCount}
          onClick={() => {
            if (presentation === "folded") setIsPanelOpen(true);
          }}
        />
        {presentation !== "folded" && (
          <div className="floating-body">
            {presentation === "list" ? (
              <div className="floating-list">
                {active.length > WIP_SOFT_LIMIT && (
                  <div className="px-2 pb-1 text-[12px] text-amber-600">
                    在推进的事有点多
                  </div>
                )}
                {inbox.map((item) => (
                  <TaskCard
                    key={`inbox-${item.id}`}
                    item={item}
                    isInbox
                    onStart={() => handleStartItem(item.id)}
                  />
                ))}
                {active.map((item) => (
                  <TaskCard
                    key={`active-${item.id}`}
                    item={item}
                    isInbox={false}
                    cold={coldLevel(item.last_active_at, nowTick)}
                    onStart={() => handleStartItem(item.id)}
                  />
                ))}
                {inbox.length === 0 && active.length === 0 && (
                  <div className="px-2 py-2 text-[12px] text-text-2">还没有任务</div>
                )}
                {active.length === 0 && inbox.length === 0 && (
                  <div className="flex justify-end gap-2 px-2 pb-1">
                    <button
                      type="button"
                      data-no-expand
                      className="h-7 rounded-[8px] bg-primary px-3 text-[12px] font-semibold text-white"
                      onClick={() => setIsPanelOpen(false)}
                    >
                      完成
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <ExpandedPanel
                taskTitle={taskTitle}
                onTaskTitleChange={setTaskTitle}
                onStart={handleStart}
                onClearAndDismiss={handleClearAndDismiss}
                maxLength={TASK_TITLE_MAX}
                submitting={submitting}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
