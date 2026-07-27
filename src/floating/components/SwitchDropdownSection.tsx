import { useEffect, useRef, useState } from "react";

import type { TaskTitleRec } from "../../lib/tauri-bridge";
import { useRecentTaskTitles } from "../hooks/useRecentTaskTitles";

type Props = {
  onSelect: (task_title: string) => void;
};

function formatRelative(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return `${Math.floor(diff / 86_400_000)} 天前`;
}

export function SwitchDropdownSection({ onSelect }: Props) {
  const { recs, loading, error } = useRecentTaskTitles();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      if (ref.current && !ref.current.contains(e.relatedTarget as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (!recs || recs.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % recs.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + recs.length) % recs.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const rec = recs[activeIndex];
        if (rec) handleSelect(rec);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("focusin", onFocusOut);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("focusin", onFocusOut);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, recs, activeIndex]);

  useEffect(() => {
    if (open) setActiveIndex(0);
  }, [open]);

  const handleSelect = (rec: TaskTitleRec) => {
    onSelect(rec.task_title);
    setOpen(false);
  };

  const showEmpty = error || (!loading && recs?.length === 0);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="或选择已有任务"
        className="glass-l2 h-8 w-full rounded-[10px] px-3 text-left text-[13px] text-text-2 hover:bg-white/70"
        onClick={() => setOpen((v) => !v)}
      >
        或选择已有任务 {open ? "▴" : "▾"}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="历史 task_title 列表"
          aria-activedescendant={recs?.[activeIndex] ? `sd-opt-${activeIndex}` : undefined}
          tabIndex={0}
          className="glass-l3 absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg p-1 shadow-lg"
        >
          {loading && (
            <li className="px-3 py-2 text-xs text-text-3">加载中…</li>
          )}
          {showEmpty && (
            <li className="px-3 py-2 text-xs text-text-3">暂无历史任务</li>
          )}
          {!loading &&
            !error &&
            recs?.map((rec, i) => (
              <li
                key={rec.task_title}
                id={`sd-opt-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs text-text-1 hover:bg-white/20 ${i === activeIndex ? "bg-white/30" : ""}`}
                onClick={() => handleSelect(rec)}
              >
                <span className="block whitespace-normal break-words">
                  {rec.task_title}
                </span>
                <span className="ml-2 text-[10px] text-text-3">
                  {formatRelative(rec.last_used)}
                </span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
