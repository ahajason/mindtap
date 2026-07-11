import { useEffect, useRef } from "react";

import type { TimerSession } from "../../lib/tauri-bridge";
import { useRecentTaskTitles } from "../hooks/useRecentTaskTitles";
import { ControlRow } from "./ControlRow";
import { EmptyHistoryHint } from "./EmptyHistoryHint";
import { InputBar } from "./InputBar";
import { StatusDot } from "./StatusDot";
import { SwitchDropdownSection } from "./SwitchDropdownSection";

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

const PANEL_STYLE: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.6)",
  backdropFilter: "blur(28px) saturate(120%)",
  WebkitBackdropFilter: "blur(28px) saturate(120%)",
  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 8px 32px rgba(0, 30, 80, 0.08)",
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

  const { recs, loading } = useRecentTaskTitles();

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
    if (!node) return;
    node.addEventListener("blur", handleBlur);
    return () => node.removeEventListener("blur", handleBlur);
  }, []);

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
      <div
        className="relative flex h-full w-full flex-col gap-2 overflow-hidden rounded-2xl p-3 text-[12px]"
        style={PANEL_STYLE}
      >
        <div className="relative flex items-center gap-2 pr-3">
          <span
            className="min-w-0 flex-1 truncate text-[14px] font-semibold text-text-1"
            title={activeSession.task_title}
          >
            {activeSession.task_title}
          </span>
          <StatusDot
            status={activeSession.status}
            size="md"
            position="absolute"
          />
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
    <div
      className="relative flex h-full w-full flex-col gap-2 overflow-hidden rounded-2xl p-3 text-[12px]"
      style={PANEL_STYLE}
    >
      {!activeSession && !loading && recs !== null && (
        <div className="px-0.5 pb-1">
          {recs.length === 0 ? (
            <EmptyHistoryHint onClickCreate={() => inputRef.current?.focus()} />
          ) : (
            <SwitchDropdownSection onSelect={onTaskTitleChange} />
          )}
        </div>
      )}
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
          className="rounded-full px-3 py-1 text-[12px] font-medium text-text-2 transition-colors hover:bg-white/40 hover:text-text-1"
          onClick={onCancel}
        >
          取消
        </button>
        <button
          type="button"
          data-no-expand
          className="rounded-full bg-primary px-4 py-1 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
          onClick={onStart}
          disabled={taskTitle.trim().length === 0 || submitting}
        >
          开始
        </button>
      </div>
    </div>
  );
}