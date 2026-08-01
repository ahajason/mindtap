// V0.2.1: 并行任务卡。四要素直接显示(内容/累计时长/冷却深浅/进度备注),不点开。
// 三态动作派生:todo(开始/归档)、active(暂停/归档)。无独立收件箱/已完成。
// 交互:整卡不绑定开始(2d,只有「开始」按钮触发);双击卡 → 行内改名(3a)。
// 冷却深浅(透明度档位)由父级传 data-cold 标记,本组件不持有失真检测逻辑。
import { useEffect, useRef, useState } from "react";

import type { Item } from "../../lib/tauri-bridge";

type TaskCardProps = {
  item: Item;
  onStart: () => void;
  /** 进行中卡手动暂停(退回待办) */
  onPause?: () => void;
  /** todo/active 卡归档(完成即归档,三态唯一出口) */
  onArchive?: () => void;
  /** 双击改名(3a):提交新内容 */
  onRename?: (content: string) => void;
  /** 冷却档位: 'cooling' | 'stale',决定透明度 */
  cold?: "cooling" | "stale";
  /** 当前时间戳(秒级 tick):active 卡实时滚动时长用 */
  now?: number;
};

export function formatFocusMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

const COLD_OPACITY: Record<string, string> = {
  cooling: "opacity-60",
  stale: "opacity-35",
};

const PRIMARY_BTN =
  "h-6 rounded-[8px] bg-primary px-2 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover";
const SECONDARY_BTN =
  "h-6 rounded-[8px] px-2 text-[12px] font-medium text-text-2 transition-colors hover:bg-white/40 hover:text-text-1";

export function TaskCard({
  item,
  onStart,
  onPause,
  onArchive,
  onRename,
  cold,
  now,
}: TaskCardProps) {
  const opacity = cold ? COLD_OPACITY[cold] : "";
  const isActiveCard = item.status === "active";
  const isTodoCard = item.status === "todo";

  // 决策9: 后端主导。active 卡实时时长 = focus_ms + (now - last_active_at),不写库。
  const displayMs =
    isActiveCard && item.last_active_at != null && now != null
      ? item.focus_ms + Math.max(0, now - item.last_active_at)
      : item.focus_ms;

  // 3a 双击行内改名:编辑态本地管理;Esc/失焦/归档改名都及时取消,不让编辑态卡住。
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.content);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  // 编辑态失焦 → 立即取消(不保存草稿),避免"卡在编辑态"。
  useEffect(() => {
    if (!editing) return;
    function onBlur() {
      setEditing(false);
      setDraft(item.content);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setEditing(false);
        setDraft(item.content);
      }
    }
    const input = inputRef.current;
    input?.addEventListener("blur", onBlur);
    document.addEventListener("keydown", onKey);
    return () => {
      input?.removeEventListener("blur", onBlur);
      document.removeEventListener("keydown", onKey);
    };
  }, [editing, item.content]);

  function submitRename() {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== item.content) {
      onRename?.(next);
    } else {
      setDraft(item.content);
    }
  }

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-[10px] px-2 py-1.5 transition-colors hover:bg-white/40 ${opacity}`}
      data-cold={cold ?? undefined}
      // 2d: 整卡不绑定开始(只有「开始」按钮触发)。双击进入行内改名。
      onDoubleClick={() => {
        if (!editing) {
          setDraft(item.content);
          setEditing(true);
        }
      }}
    >
      <div className="flex min-w-0 flex-col">
        {editing ? (
          <input
            ref={inputRef}
            data-no-expand
            value={draft}
            maxLength={200}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                submitRename();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className="w-full rounded-[6px] border border-primary/40 bg-white/60 px-1.5 py-0.5 text-[13px] font-medium text-text-1 outline-none"
            aria-label={`改名 ${item.content}`}
          />
        ) : (
          <>
            <span className="truncate text-[13px] font-medium text-text-1">
              {item.content}
            </span>
            {item.progress_note && (
              <span className="truncate text-[12px] text-text-2">
                {item.progress_note}
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {isActiveCard && (
          <span className="text-[12px] tabular-nums text-text-2" aria-label="累计投入">
            {formatFocusMs(displayMs)}
          </span>
        )}
        {isTodoCard && (
          <button
            type="button"
            data-no-expand
            onClick={(e) => {
              e.stopPropagation();
              onStart();
            }}
            className={PRIMARY_BTN}
          >
            开始
          </button>
        )}
        {isActiveCard && onPause && (
          <button
            type="button"
            data-no-expand
            aria-label={`暂停 ${item.content}`}
            onClick={(e) => {
              e.stopPropagation();
              onPause();
            }}
            className={SECONDARY_BTN}
          >
            暂停
          </button>
        )}
        {(isActiveCard || isTodoCard) && onArchive && (
          <button
            type="button"
            data-no-expand
            aria-label={`归档 ${item.content}`}
            onClick={(e) => {
              e.stopPropagation();
              onArchive();
            }}
            className={SECONDARY_BTN}
          >
            归档
          </button>
        )}
      </div>
    </div>
  );
}
