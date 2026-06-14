// src/floating/components/FocusBlock.tsx
import { useActiveTask } from "../hooks/useActiveTask";
import { useTick } from "../hooks/useTick";
import { formatDuration } from "../../lib/time";
import { api } from "../../lib/tauri-bridge";
import "../styles/focus-block.css";

export function FocusBlock() {
  const active = useActiveTask();
  const now = useTick();

  if (!active) {
    return (
      <div className="fold-state empty">
        <div className="fold-inner">
          <span className="dot dot-empty" />
          <span className="tag tag-empty">EMPTY</span>
          <span className="title title-empty">点击记录第一个任务</span>
          <span className="icon icon-blue">+</span>
        </div>
      </div>
    );
  }

  if (active.status === "done") {
    return (
      <div className="fold-state done">
        <div className="fold-inner">
          <span className="dot dot-done" />
          <span className="tag tag-done">DONE</span>
          <span className="title title-done">{active.content}</span>
          <span className="time time-frozen">
            {formatDuration(0)}
          </span>
          <span
            className="icon icon-blue"
            title="撤销"
            onClick={(e) => {
              e.stopPropagation();
              api.taskUndo(active.id);
            }}
          >
            ↶
          </span>
        </div>
      </div>
    );
  }

  const live =
    active.duration_ms +
    (active.status === "active" && active.focus_started_at
      ? now - active.focus_started_at
      : 0);

  return (
    <div className="fold-state active">
      <div className="fold-inner">
        <span className="dot dot-active" />
        <span className="tag tag-focus">FOCUS</span>
        <span className="title">{active.content}</span>
        <span className="time">{formatDuration(live)}</span>
        <span
          className="icon icon-green"
          onClick={(e) => {
            e.stopPropagation();
            if (active.status === "active") {
              api.taskPause(active.id);
            } else {
              api.taskResume(active.id);
            }
          }}
        >
          {active.status === "active" ? "⏸" : "▶"}
        </span>
      </div>
    </div>
  );
}
