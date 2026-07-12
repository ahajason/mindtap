import { useEffect, useRef } from "react";

import { useRecentTaskTitles } from "../hooks/useRecentTaskTitles";
import { EmptyHistoryHint } from "./EmptyHistoryHint";
import { InputBar } from "./InputBar";
import { SwitchDropdownSection } from "./SwitchDropdownSection";

// V0.2.0.14 PATCH A-2 重构: ExpandedPanel 不再有自己的根 div (PANEL_STYLE / rounded-2xl / p-3),
// 只返回内容 fragment (recs + InputBar + 取消/开始按钮), 由 App.tsx 单一 root div 统一提供背景/圆角/padding.
// V0.2.0.13 PATCH 让 ExpandedPanel 嵌套在 floating-root + flex-1 wrapper 内, 自身又套一层 PANEL_STYLE,
// 跟 root div 的圆角/背景不一致 — user L3 反馈 "flex-1 overflow-hidden 宽度没铺满 / 切换折叠非折叠闪一下".

// V0.2.0.13 PATCH C-3: 拆 onCancel → onDismiss + onClearAndDismiss:
// - onDismiss: 只折叠 (panel 外 click 用), 保留 taskTitle state 让用户切回不丢输入
// - onClearAndDismiss: 清 taskTitle + 折叠 (用户显式 "取消" button + Esc 用)
// V0.2.0.14 PATCH C-3 改用 document mousedown listener 替代 input blur listener (在 App.tsx),
// 单一 root div panelRef 覆盖整个 panel 区域, panel 外 mousedown → onDismiss, panel 内 mousedown → 不动.
type ExpandedPanelProps = {
  taskTitle: string;
  onTaskTitleChange: (v: string) => void;
  onStart: () => void;
  onClearAndDismiss: () => void;
  maxLength: number;
  submitting: boolean;
};

export function ExpandedPanel(props: ExpandedPanelProps) {
  const { taskTitle, onTaskTitleChange, onStart, onClearAndDismiss, maxLength, submitting } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);

  const { recs, loading } = useRecentTaskTitles();

  useEffect(() => {
    inputRef.current?.focus();
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

  return (
    <>
      {!loading && recs !== null && (
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
    </>
  );
}