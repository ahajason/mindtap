import { useEffect, useRef } from "react";

import type { TimerSession } from "../../lib/tauri-bridge";
import { ControlRow } from "./ControlRow";
import { InputBar } from "./InputBar";
import { StatusDot } from "./StatusDot";

type ExpandedPanelProps = {
  taskTitle: string;
  onTaskTitleChange: (v: string) => void;
  onStart: () => void;
  onCancel: () => void;
  maxLength: number;
  submitting: boolean;
  activeSession: TimerSession | null;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
};

export function ExpandedPanel(props: ExpandedPanelProps) {
  const {
    taskTitle,
    onTaskTitleChange,
    onStart,
    onCancel,
    maxLength,
    submitting,
    activeSession,
    onPause,
    onResume,
    onComplete,
  } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const submittingRef = useRef(submitting);
  submittingRef.current = submitting;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleBlur() {
      if (!submittingRef.current) {
        onCancel();
      }
    }
    const node = inputRef.current;
    node?.addEventListener("blur", handleBlur);
    return () => node?.removeEventListener("blur", handleBlur);
  }, [onCancel]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      onStart();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  if (activeSession) {
    return (
      <div className="floating-root expanded glass-l3 flex h-full flex-col gap-2 rounded-2xl p-3 text-[12px]">
        <div className="flex items-center gap-2">
          <StatusDot status={activeSession.status} />
          <span className="truncate font-medium">{activeSession.task_title}</span>
        </div>
        <ControlRow
          status={activeSession.status}
          onPause={onPause}
          onResume={onResume}
          onComplete={onComplete}
        />
      </div>
    );
  }

  return (
    <div className="floating-root expanded glass-l3 flex h-full flex-col gap-2 rounded-2xl p-3 text-[12px]">
      <InputBar
        value={taskTitle}
        onChange={onTaskTitleChange}
        onKeyDown={handleKeyDown}
        inputRef={inputRef}
        maxLength={maxLength}
        submitting={submitting}
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          data-no-expand
          className="rounded-full px-3 py-1 text-[11px] text-text-2 hover:bg-white/40"
          onClick={onCancel}
        >
          取消
        </button>
        <button
          type="button"
          data-no-expand
          className="rounded-full bg-white/40 px-3 py-1 text-[11px] font-medium text-text-1 hover:bg-white/60 disabled:opacity-50"
          onClick={onStart}
          disabled={taskTitle.trim().length === 0 || submitting}
        >
          开始
        </button>
      </div>
    </div>
  );
}