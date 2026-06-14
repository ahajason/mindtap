import { useState } from "react";
import { api } from "../../lib/tauri-bridge";
import { useActiveTask } from "../hooks/useActiveTask";
import { ControlRow } from "./ControlRow";
import "./expand-state.css";

type Type = "task" | "idea" | "check_in";

export function ExpandState() {
  const active = useActiveTask();
  const [content, setContent] = useState("");
  const [type, setType] = useState<Type>("task");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (dueAt?: number) => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      if (type === "task") {
        const t = await api.taskCreate(content, dueAt);
        await api.taskStartTimer(t.id);
      } else if (type === "idea") {
        await api.ideaCreate(content);
      } else {
        await api.checkInCreate(content);
      }
      setContent("");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const endOfToday = () => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  };
  const endOfTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  };

  return (
    <div className="expand-state">
      {active && (
        <div className="expand-focus">
          <span className="dot dot-active" />
          <span className="tag tag-focus">FOCUS</span>
          <span className="title">{active.content}</span>
        </div>
      )}
      <ControlRow active={active} />
      <div className="divider" />
      <textarea
        className="content-input"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="事项内容…"
        autoFocus
      />
      <div className="type-row">
        <button
          className={type === "task" ? "type-btn active" : "type-btn"}
          onClick={() => setType("task")}
        >
          ✓ 待办
        </button>
        <button
          className={type === "idea" ? "type-btn active" : "type-btn"}
          onClick={() => setType("idea")}
        >
          ✎ 灵感
        </button>
        <button
          className={type === "check_in" ? "type-btn active" : "type-btn"}
          onClick={() => setType("check_in")}
        >
          ⚡ 打卡
        </button>
      </div>
      <div className="cta-row">
        {type === "task" && (
          <>
            <button className="date-btn" onClick={() => submit(endOfToday())}>
              📅 稍后
            </button>
            <button className="date-btn" onClick={() => submit(endOfTomorrow())}>
              📅 明天
            </button>
          </>
        )}
        <button
          className="start-btn"
          onClick={() => submit()}
          disabled={submitting}
        >
          ⏵ 开始计时
        </button>
      </div>
    </div>
  );
}