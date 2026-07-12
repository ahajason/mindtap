import { useEffect, useRef } from "react";

import type { TimerSession } from "../../lib/tauri-bridge";
import { useRecentTaskTitles } from "../hooks/useRecentTaskTitles";
import { ControlRow } from "./ControlRow";
import { EmptyHistoryHint } from "./EmptyHistoryHint";
import { InputBar } from "./InputBar";
import { SwitchDropdownSection } from "./SwitchDropdownSection";

// V0.2.0.13 PATCH: 拆 onCancel → onDismiss + onClearAndDismiss:
// - onDismiss: 只折叠 (panel 外 click blur 用), 保留 taskTitle state 让用户切回不丢输入
// - onClearAndDismiss: 清 taskTitle + 折叠 (用户显式 "取消" button + Esc 用)
// V0.2.0.12 把两者合并成 onCancel 是不对的: panel 外点聚焦其他窗口时不应清输入。
type ExpandedPanelProps = {
  taskTitle: string;
  onTaskTitleChange: (v: string) => void;
  onStart: () => void;
  onDismiss: () => void;
  onClearAndDismiss: () => void;
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
    onDismiss,
    onClearAndDismiss,
    maxLength,
    submitting,
    activeSession,
    onPause,
    onResume,
    onComplete,
  } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const submittingRef = useRef(submitting);
  const dismissingRef = useRef(true); // V0.2.0.12 Issue 2/4: 默认 panel 外才 dismiss
  const onDismissRef = useRef(onDismiss);
  const onClearAndDismissRef = useRef(onClearAndDismiss);
  submittingRef.current = submitting;
  onDismissRef.current = onDismiss;
  onClearAndDismissRef.current = onClearAndDismiss;

  const { recs, loading } = useRecentTaskTitles();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleBlur() {
      // V0.2.0.13 PATCH C-3: panel 外 click → onDismiss (只折叠, 保留 taskTitle state).
      // V0.2.0.12 把 onCancel 同时绑这里 → panel 外点收回输入, 错。
      // panel 内 click(Esc) → onClearAndDismiss (用户显式取消意图, 清输入)。
      if (submittingRef.current) return;
      if (dismissingRef.current) onDismissRef.current();
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
      // V0.2.0.13 PATCH C-3: Esc 是用户显式取消意图, 清输入 + 折叠。
      e.preventDefault();
      onClearAndDismiss();
    }
  }

  // V0.2.0.13 PATCH A-2: activeSession 分支只渲染 ControlRow,
  // 外层 App.tsx 已经 always 渲染 FoldedBar (圆点+标题+时间), 这里不重复 task_title span。
  if (activeSession) {
    return (
      <div
        ref={panelRef}
        onPointerDownCapture={(e) => {
          dismissingRef.current = !panelRef.current?.contains(e.target as Node);
        }}
        className="flex h-full w-full flex-col gap-2 overflow-hidden rounded-2xl p-3 text-[12px]"
        style={PANEL_STYLE}
      >
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
      ref={panelRef}
      onPointerDownCapture={(e) => {
        // V0.2.0.12 Issue 2/4: Radix pointerdown capture 模式 — 授权点击(e.button=0/2)都在 blur 之前设置 dismissingRef,
        // panel 内则 dismissingRef=false (保持 blur 不 dismiss), panel 外则 dismissingRef=true (灵敏地折叠)。
        dismissingRef.current = !panelRef.current?.contains(e.target as Node);
      }}
      className="flex h-full w-full flex-col gap-2 overflow-hidden rounded-2xl p-3 text-[12px]"
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
          onClick={onClearAndDismiss}
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
