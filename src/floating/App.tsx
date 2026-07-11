import { useEffect, useState } from "react";

import { useActiveTask } from "./hooks/useActiveTask";
import { useFocusTicker } from "./hooks/useFocusTicker";
import { useTick } from "./hooks/useTick";
import { ContextMenu } from "./components/ContextMenu";
import { ExpandedPanel } from "./components/ExpandedPanel";
import { FoldedBar } from "./components/FoldedBar";
import { StatusDot } from "./components/StatusDot";

const FOLDED_W = 320;
const FOLDED_H = 36;
const EXPANDED_W = 360;
const EXPANDED_H = 280;
const TASK_TITLE_MAX = 50;

async function resizeFolded() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  const { LogicalSize } = await import("@tauri-apps/api/window");
  await getCurrentWindow().setSize(new LogicalSize(FOLDED_W, FOLDED_H));
}

async function expandUpward() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  const { LogicalSize, PhysicalPosition } = await import("@tauri-apps/api/window");
  const win = getCurrentWindow();
  const pos = await win.outerPosition();
  const size = await win.outerSize();
  await win.setSize(new LogicalSize(EXPANDED_W, EXPANDED_H));
  await win.setPosition(
    new PhysicalPosition(
      pos.x + Math.round((size.width - EXPANDED_W) / 2),
      pos.y - (EXPANDED_H - FOLDED_H),
    ),
  );
}

export function FloatingApp() {
  const { session, refresh } = useActiveTask();
  useTick(1000);
  const liveFocusMs = useFocusTicker(session, 1000);

  const [expanded, setExpanded] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (cancelled) return;
        if (expanded) await expandUpward();
        else await resizeFolded();
      } catch (err) {
        console.error("[resize] failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expanded]);

  async function handleStart() {
    const title = taskTitle.trim();
    if (!title || submitting) return;
    setSubmitting(true);
    try {
      const { api } = await import("../../lib/tauri-bridge");
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
    function handleClick() {
      setContextMenu(null);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [contextMenu]);

  if (!expanded) {
    return (
      <div
        className="flex items-center gap-2 px-2 py-1"
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
      onPause={async () => {
        if (!session) return;
        const { api } = await import("../../lib/tauri-bridge");
        await api.timerSession.pause(session.id);
        await refresh();
      }}
      onResume={async () => {
        if (!session) return;
        const { api } = await import("../../lib/tauri-bridge");
        await api.timerSession.resume(session.id);
        await refresh();
      }}
      onComplete={async () => {
        if (!session) return;
        const { api } = await import("../../lib/tauri-bridge");
        await api.timerSession.complete(session.id);
        await refresh();
      }}
    />
  );
}