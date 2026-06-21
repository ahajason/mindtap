import { useState } from "react";
import { useRecords, type KindFilter } from "./hooks/useRecords";
import "./styles/timeline.css";

function formatTime(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const diffMs = now.getTime() - ms;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)} 小时前`;
  return d.toLocaleDateString("zh-CN");
}

export function RecordTimeline() {
  const [kind, setKind] = useState<KindFilter>("all");
  const records = useRecords(kind);

  return (
    <div className="timeline">
      <div className="timeline-tabs">
        <button
          className={kind === "all" ? "tab active" : "tab"}
          onClick={() => setKind("all")}
        >
          全部
        </button>
        <button
          className={kind === "task" ? "tab active" : "tab"}
          onClick={() => setKind("task")}
        >
          任务
        </button>
        <button
          className={kind === "idea" ? "tab active" : "tab"}
          onClick={() => setKind("idea")}
        >
          灵感
        </button>
        <button
          className={kind === "check_in" ? "tab active" : "tab"}
          onClick={() => setKind("check_in")}
        >
          打卡
        </button>
      </div>
      <div className="timeline-list">
        {records.length === 0 && (
          <div className="empty">还没有记录</div>
        )}
        {records.map((r) => (
          <div className="record" key={r.id}>
            <span className={`record-tag tag-${r.kind}`}>
              {r.kind === "task" ? "TASK" : r.kind === "idea" ? "IDEA" : "打卡"}
            </span>
            {r.status && (
              <span className={`status-tag status-${r.status}`}>
                {r.status === "pending"
                  ? "未开始"
                  : r.status === "active"
                    ? "进行中"
                    : r.status === "paused"
                      ? "暂停"
                      : "完成"}
              </span>
            )}
            <span className="record-content">{r.content}</span>
            <span className="record-time">{formatTime(r.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
