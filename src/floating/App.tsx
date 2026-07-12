import { useEffect, useRef, useState } from "react";
import {
  availableMonitors,
  getCurrentWindow,
  LogicalSize,
  PhysicalPosition,
} from "@tauri-apps/api/window";

import { api } from "../lib/tauri-bridge";
import { useActiveTask } from "./hooks/useActiveTask";
import { useFocusTicker } from "./hooks/useFocusTicker";
import { ContextMenu } from "./components/ContextMenu";
import { ExpandedPanel } from "./components/ExpandedPanel";
import { FoldedBar } from "./components/FoldedBar";
import { StatusDot } from "./components/StatusDot";

const FOLDED_W = 320;
const FOLDED_H = 36;
const EXPANDED_W = 360;
const EXPANDED_H = 280;
const TASK_TITLE_MAX = 50;

const FRAME_W = 320;
const FRAME_H = 36;
const POS_MARGIN = 16;
const DEFAULT_X = 100;
const DEFAULT_Y = 60;
const POS_KEY = "floating-position";
const DRAG_THRESHOLD_PX = 4;

export function FloatingApp() {
  const { session, refresh, setSession } = useActiveTask();
  const liveFocusMs = useFocusTicker(session, 1000);

  const [expanded, setExpanded] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    isDragging: boolean;
    dragStarted: boolean;
    win: ReturnType<typeof getCurrentWindow> | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const win = getCurrentWindow();
    (async () => {
      try {
        if (cancelled) return;
        if (expanded) {
          const pos = await win.outerPosition();
          if (cancelled) return;
          await win.setSize(new LogicalSize(EXPANDED_W, EXPANDED_H));
          if (cancelled) return;
          // V0.2.7 修: 不再 -20px 偏移 (V0.2.6 final fix 偏移公式让贴右边缘时右边被截 4px,
          // 因为 (FOLDED_W - EXPANDED_W) / 2 = -20)
          await win.setPosition(new PhysicalPosition(pos.x, pos.y));
          if (cancelled) return;
        } else {
          await win.setSize(new LogicalSize(FOLDED_W, FOLDED_H));
          if (cancelled) return;
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[resize/position] failed", err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expanded]);

  useEffect(() => {
    let win: ReturnType<typeof getCurrentWindow> | null = null;
    try {
      win = getCurrentWindow();
    } catch {
      return;
    }
    if (!win?.setPosition || !win?.onMoved) return;

    const clampInsideMonitor = (pos: { x: number; y: number }, monitors: { position: { x: number; y: number }; size: { width: number; height: number } }[]): boolean => {
      return monitors.some(
        (m) =>
          pos.x >= m.position.x + POS_MARGIN &&
          pos.x + FRAME_W <= m.position.x + m.size.width - POS_MARGIN &&
          pos.y >= m.position.y + POS_MARGIN &&
          pos.y + FRAME_H <= m.position.y + m.size.height - POS_MARGIN,
      );
    };

    const setDefaultAtRightBottom = async () => {
      try {
        const monitors = await availableMonitors();
        const primary = monitors.find((m) => m.position.x === 0) ?? monitors[0];
        if (!primary) {
          win!.setPosition(new PhysicalPosition(DEFAULT_X, DEFAULT_Y));
          return;
        }
        win!.setPosition(
          new PhysicalPosition(
            primary.position.x + primary.size.width - FRAME_W - POS_MARGIN,
            primary.position.y + POS_MARGIN,
          ),
        );
      } catch {
        win!.setPosition(new PhysicalPosition(DEFAULT_X, DEFAULT_Y));
      }
    };

    const saved = localStorage.getItem(POS_KEY);
    if (saved) {
      try {
        const pos = JSON.parse(saved) as { x: number; y: number };
        availableMonitors().then((monitors) => {
          if (clampInsideMonitor(pos, monitors)) {
            win!.setPosition(new PhysicalPosition(pos.x, pos.y));
          } else {
            localStorage.removeItem(POS_KEY);
            void setDefaultAtRightBottom();
          }
        }).catch(() => {
          localStorage.removeItem(POS_KEY);
          void setDefaultAtRightBottom();
        });
      } catch {
        localStorage.removeItem(POS_KEY);
        void setDefaultAtRightBottom();
      }
    } else {
      void setDefaultAtRightBottom();
    }

    const unlisten = win.onMoved(({ payload }) => {
      try {
        localStorage.setItem(POS_KEY, JSON.stringify(payload));
      } catch {
        // localStorage 不可用 → 静默放弃持久化
      }
    });
    return () => {
      unlisten.then((u) => u());
    };
  }, []);

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (expanded) return;
    if (e.button !== 0) return; // V0.2.8 Issue A: 右键 (button=2) 走原生 contextmenu capture listener 弹 ContextMenu, 不走 drag/toggle 路径
    if ((e.target as HTMLElement).closest("[data-no-expand], [data-close]")) return;
    // V0.2.7 修: mousedown 时捕获 win, 4px 阈值后调 startDragging 让 OS 开始拖窗
    // (V0.2.5/V0.2.6 反复声称"沿用 useDragLongPress.ts:49" 但代码里完全没调 IPC, 反模式 15 谎改)
    let win: ReturnType<typeof getCurrentWindow> | null = null;
    try {
      win = getCurrentWindow();
    } catch {
      // dev / vitest 环境无 Tauri runtime, win 保持 null, 拖动仍可走纯前端逻辑 (虽然不生效)
    }
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      isDragging: true,
      dragStarted: false,
      win,
    };
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current?.isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      // V0.2.7 修: 4px 阈值满足后调 win.startDragging() 让 OS 开始拖窗
      // (只调一次, dragStarted 守防止重复触发)
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
        setExpanded(true);
      }
      dragRef.current = null;
    };
    const onContextMenuCapture = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY });
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

  async function handleStart() {
    const title = taskTitle.trim();
    if (!title || submitting) return;
    setSubmitting(true);
    try {
      await api.timerSession.create(title);
      setTaskTitle("");
      setExpanded(false);
      await refresh();
    } catch (err) {
      console.error("[start] failed", err);
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [contextMenu]);

  if (!expanded) {
    return (
      <div
        data-testid="floating-root-folded"
        className="floating-root folded flex items-center gap-2 px-2 py-1"
        onMouseDown={handleMouseDown}
      >
        <StatusDot
          status={session?.status ?? "empty"}
          size="sm"
          position="absolute"
        />
        <FoldedBar
          taskTitle={session?.task_title ?? ""}
          focusMs={liveFocusMs}
          status={session ? session.status : "empty"}
          onClick={() => setExpanded(true)}
        />
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    );
  }

  async function act(action: "pause" | "resume" | "complete") {
    if (!session) return;
    try {
      const updated = await api.timerSession[action](session.id);
      setSession(updated);
      if (action === "complete") {
        setExpanded(false);
        void refresh();
      }
    } catch (err) {
      // 防御闪退: Tauri 2 unhandled promise rejection → React error boundary → tree unmount
      // 沿用反模式 13 修复路径 (Win11 WebView2 setFocusable panic) 的错误可见性标准
      console.error(`[act:${action}] failed`, err);
    }
  }

  return (
    <ExpandedPanel
      taskTitle={taskTitle}
      onTaskTitleChange={setTaskTitle}
      onStart={handleStart}
      onCancel={() => {
        setTaskTitle("");
        setExpanded(false);
      }}
      maxLength={TASK_TITLE_MAX}
      submitting={submitting}
      activeSession={session}
      onPause={() => act("pause")}
      onResume={() => act("resume")}
      onComplete={() => act("complete")}
    />
  );
}