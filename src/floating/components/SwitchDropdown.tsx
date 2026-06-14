// src/floating/components/SwitchDropdown.tsx
import { useEffect, useState } from "react";
import { api, type Record } from "../../lib/tauri-bridge";
import "./switch-dropdown.css";

export function SwitchDropdown() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Record[]>([]);

  useEffect(() => {
    if (!open) return;
    api.recordListSwitchable().then(setList).catch(console.error);
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".switch-dropdown")) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  if (!open) {
    return (
      <button
        className="switch-btn"
        onClick={() => setOpen(true)}
        title="切换 Focus"
      >
        ⇄ <span className="caret">▼</span>
      </button>
    );
  }

  return (
    <div className="switch-dropdown">
      <button
        className="switch-btn open"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(false);
        }}
      >
        ⇄ <span className="caret">▲</span>
      </button>
      <div className="dropdown-panel">
        <div className="dropdown-header">⇄ 切换到</div>
        {list.length === 0 && (
          <div className="dropdown-empty">没有可切换的任务</div>
        )}
        {list.map((r) => (
          <div className="dropdown-item" key={r.id}>
            <span
              className={
                r.status === "paused" ? "item-tag tag-paused" : "item-tag tag-pending"
              }
            >
              {r.status === "paused" ? "暂停" : "未开始"}
            </span>
            <span className="item-title">{r.content}</span>
            <span className="item-time">
              {r.status === "paused" ? "已用时" : ""}
            </span>
            <button
              className="item-play"
              onClick={() => api.taskSwitch(r.source_id)}
            >
              ⏵
            </button>
          </div>
        ))}
        {list.length > 0 && (
          <div className="dropdown-footer">查看全部 {list.length} 个 ›</div>
        )}
      </div>
    </div>
  );
}
