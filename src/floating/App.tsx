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
const POS_MARGIN = 8;
const DEFAULT_X = 100;
const DEFAULT_Y = 60;
const POS_KEY = "floating-position";
const DRAG_THRESHOLD_PX = 4;
const LONG_PRESS_MS = 300;

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
    timerId: number | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const win = getCurrentWindow();
    (async () => {
      try {
        if (cancelled) return;
        if (expanded) {
          const pos = await win.outerPosition();
          const size = await win.outerSize();
          await win.setSize(new LogicalSize(EXPANDED_W, EXPANDED_H));
          await win.setPosition(
            new PhysicalPosition(
              pos.x + Math.round((size.width - EXPANDED_W) / 2),
              pos.y - (EXPANDED_H - FOLDED_H),
            ),
          );
          await win.setFocusable(true);
        } else {
          await win.setSize(new LogicalSize(FOLDED_W, FOLDED_H));
          await win.setFocusable(false);
        }
      } catch (err) {
        console.error("[resize/focus] failed", err);
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
      const monitors = await availableMonitors();
      const primary = monitors.find((m) => m.position.x === 0) ?? monitors[0];
      if (!primary) {
        win!.setPosition(new PhysicalPosition(DEFAULT_X, DEFAULT_Y));
        return;
      }
      win!.setPosition(
        new PhysicalPosition(
          primary.position.x + primary.size.width - FRAME_W - 32,
          primary.position.y + primary.size.height - FRAME_H - 100,
        ),
      );
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
    if ((e.target as HTMLElement).closest("[data-no-expand], [data-close]")) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      isDragging: true,
      dragStarted: false,
      timerId: null,
    };
    const timerId = window.setTimeout(async () => {
      try {
        await getCurrentWindow().startDragging();
        if (dragRef.current) dragRef.current.dragStarted = true;
      } catch (err) {
        console.warn("[startDragging] failed", err);
      }
    }, LONG_PRESS_MS);
    if (dragRef.current) dragRef.current.timerId = timerId;
  }

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      if (!dragRef.current?.isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) dragRef.current.dragStarted = true;
    }
    function handleUp() {
      if (!dragRef.current) return;
      if (dragRef.current.timerId !== null) {
        window.clearTimeout(dragRef.current.timerId);
      }
      if (!dragRef.current.dragStarted) {
        setExpanded(true);
      }
      dragRef.current = null;
    }
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
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

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
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
        onContextMenu={handleContextMenu}
      >
        <StatusDot status={session?.status ?? null} />
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
    const updated = await api.timerSession[action](session.id);
    setSession(updated);
    if (action === "complete") {
      setExpanded(false);
      void refresh();
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