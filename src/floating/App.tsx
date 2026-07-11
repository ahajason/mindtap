import { LogicalSize, PhysicalPosition, getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

import { api } from "../../lib/tauri-bridge";
import { useActiveTask } from "./hooks/useActiveTask";
import { useFocusTicker } from "./hooks/useFocusTicker";
import { useTick } from "./hooks/useTick";
import { ExpandedPanel } from "./components/ExpandedPanel";
import { FoldedBar } from "./components/FoldedBar";
import { StatusDot } from "./components/StatusDot";

const FOLDED_W = 320;
const FOLDED_H = 36;
const EXPANDED_W = 360;
const EXPANDED_H = 280;
const TASK_TITLE_MAX = 50;

async function resizeFolded() {
  const win = getCurrentWindow();
  await win.setSize(new LogicalSize(FOLDED_W, FOLDED_H));
}

async function expandUpward() {
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
  useFocusTicker(session?.id ?? null, 1000);

  const [expanded, setExpanded] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  if (!expanded) {
    return (
      <div className="flex items-center gap-2 px-2 py-1">
        <StatusDot status={session?.status ?? null} />
        <FoldedBar
          taskTitle={session?.task_title ?? ""}
          focusMs={session?.focus_ms ?? 0}
          status={session ? session.status : "empty"}
          onClick={() => setExpanded(true)}
        />
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
        await api.timerSession.pause(session.id);
        await refresh();
      }}
      onResume={async () => {
        if (!session) return;
        await api.timerSession.resume(session.id);
        await refresh();
      }}
      onComplete={async () => {
        if (!session) return;
        await api.timerSession.complete(session.id);
        await refresh();
      }}
    />
  );
}