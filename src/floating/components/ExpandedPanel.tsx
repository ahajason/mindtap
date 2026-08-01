import { useEffect, useRef } from "react";

import { useRecentTaskTitles } from "../hooks/useRecentTaskTitles";
import { EmptyHistoryHint } from "./EmptyHistoryHint";
import { InputBar } from "./InputBar";
import { SwitchDropdownSection } from "./SwitchDropdownSection";

// ExpandedPanel 只渲染空闲展开态内容；外层 floating-body 统一负责展开区间距。
// 浮窗材质仍由唯一 root material layer 负责，本组件不叠加容器背景。

// V0.2.0.13 PATCH C-3: 拆 onCancel → onDismiss + onClearAndDismiss:
// - onDismiss: 只折叠 (panel 外 click 用), 保留 taskTitle state 让用户切回不丢输入
// - onClearAndDismiss: 清 taskTitle + 折叠 (用户显式 "取消" button + Esc 用)
// V0.2.0.14 PATCH C-3 改用 document mousedown listener 替代 input blur listener (在 App.tsx),
// 单一 root div panelRef 覆盖整个 panel 区域, panel 外 mousedown → onDismiss, panel 内 mousedown → 不动.
type ExpandedPanelProps = {
  taskTitle: string;
  onTaskTitleChange: (v: string) => void;
  /** 开始:捕获 + 直接计时(active) */
  onStart: () => void;
  /** 保存:捕获进待办 + 收起 */
  onSave: () => void;
  onClearAndDismiss: () => void;
  maxLength: number;
  submitting: boolean;
};

export function ExpandedPanel(props: ExpandedPanelProps) {
  const { taskTitle, onTaskTitleChange, onStart, onSave, onClearAndDismiss, maxLength, submitting } =
    props;

  const inputRef = useRef<HTMLInputElement | null>(null);

  const { recs, loading } = useRecentTaskTitles();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      // V0.2.1: 回车 = 保存(进待办),不直接开计时。
      e.preventDefault();
      onSave();
    } else if (e.key === "Escape") {
      // V0.2.0.13 PATCH C-3: Esc 是用户显式取消意图, 清输入 + 折叠。
      e.preventDefault();
      onClearAndDismiss();
    }
  }

  const empty = taskTitle.trim().length === 0;

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
          className="h-8 rounded-[10px] px-4 text-[13px] font-medium text-text-2 transition-colors hover:bg-white/40 hover:text-text-1 disabled:opacity-50"
          onClick={onSave}
          disabled={empty || submitting}
        >
          保存
        </button>
        <button
          type="button"
          data-no-expand
          className="h-8 rounded-[10px] bg-primary px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
          onClick={onStart}
          disabled={empty || submitting}
        >
          开始
        </button>
      </div>
    </>
  );
}