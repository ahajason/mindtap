// V0.2.1: 并行任务卡。四要素直接显示(内容/累计时长/冷却深浅/进度备注),不点开。
// 收件箱项额外带最小"开始"按钮;进行中卡点击卡本身 = 切换到进行中。
// 冷却深浅(透明度档位)由父级传 data-cold 标记,本组件不持有失真检测逻辑。
import type { Item } from "../../lib/tauri-bridge";

type TaskCardProps = {
  item: Item;
  onStart: () => void;
  isInbox: boolean;
  /** 冷却档位: 'active' | 'cooling' | 'stale',决定透明度 */
  cold?: "cooling" | "stale";
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

export function TaskCard({ item, onStart, isInbox, cold }: TaskCardProps) {
  const opacity = cold ? COLD_OPACITY[cold] : "";
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-[10px] px-2 py-1.5 transition-colors hover:bg-white/40 ${opacity}`}
      data-cold={cold ?? undefined}
      onClick={isInbox ? undefined : onStart}
      role={isInbox ? undefined : "button"}
      aria-label={isInbox ? undefined : `${item.content}，切换到进行中`}
    >
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-[13px] font-medium text-text-1">
          {item.content}
        </span>
        {item.progress_note && (
          <span className="truncate text-[12px] text-text-2">
            {item.progress_note}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!isInbox && (
          <span className="text-[12px] tabular-nums text-text-2" aria-label="累计投入">
            {formatFocusMs(item.focus_ms)}
          </span>
        )}
        {isInbox && (
          <button
            type="button"
            data-no-expand
            onClick={(e) => {
              e.stopPropagation();
              onStart();
            }}
            className="h-6 rounded-[8px] bg-primary px-2 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            开始
          </button>
        )}
      </div>
    </div>
  );
}
