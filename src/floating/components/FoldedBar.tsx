// V0.2.1: 折叠态 = 进行中卡滚动展示(内容 + 实时计时) + 新增「+」入口。
// 有进行中卡:每 2.5 秒轮换展示一张,「+N」指示其余卡;右侧「+」进入新增面板。
// 无进行中卡:退化为「待办 N · [+]」计数条。
// 实时时长由父级按 focus_ms + (now - last_active_at) 算好传入,本组件只展示 + 轮换。
import { useEffect, useState } from "react";

import { StatusDot } from "./StatusDot";
import { formatFocusMs } from "./TaskCard";

type ActiveCardView = { content: string; focusMs: number };

type FoldedBarProps = {
  activeCards: ActiveCardView[];
  todoCount: number;
  pendingCount: number;
  /** 右侧「+」→ 新增面板(compose) */
  onAdd: () => void;
  /** 内容区点击 → 并行列表(list) */
  onOpenList: () => void;
};

const ROTATE_INTERVAL_MS = 2500;

export function FoldedBar({
  activeCards,
  todoCount,
  pendingCount,
  onAdd,
  onOpenList,
}: FoldedBarProps) {
  const [index, setIndex] = useState(0);
  const activeCount = activeCards.length;

  // 卡数量变化时回到第一张,避免越界 / 停留在已消失的卡。
  useEffect(() => setIndex(0), [activeCount]);

  // 轮换:2.5 秒推进一张,数量为 1 时无需轮换。
  useEffect(() => {
    if (activeCount <= 1) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % activeCount),
      ROTATE_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, [activeCount]);

  if (activeCount === 0) {
    return (
      <div
        className="floating-status-bar"
        onClick={onOpenList}
        role="status"
        aria-label={`Mindtap 工作台账，待办 ${todoCount}`}
      >
        <StatusDot status="empty" size="sm" />
        <span className="floating-status-title" title={`待办 ${todoCount}`}>
          待办 {todoCount}
        </span>
        <span className="shrink-0 text-text-3">·</span>
        {pendingCount > 0 && (
          <span className="shrink-0 rounded-full bg-amber-400/20 px-1.5 text-[11px] font-medium text-amber-700">
            待确认 {pendingCount}
          </span>
        )}
        <button
          type="button"
          data-no-expand
          aria-label="新增任务"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="flex h-5 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-semibold leading-none text-primary transition-colors hover:bg-primary/20"
        >
          [+]
        </button>
      </div>
    );
  }

  const card = activeCards[index % activeCount];
  const rest = activeCount - 1;

  return (
    <div
      className="floating-status-bar"
      onClick={onOpenList}
      role="status"
      aria-label={`Mindtap 工作台账，待办 ${todoCount}，进行中 ${activeCount}，当前 ${card.content}`}
    >
      <StatusDot status="active" size="sm" />
      {/* V0.2.1 动效:轮换时卡内容淡入上滑(index 变化 → key 变化 → 重播 rotate-in) */}
      <span
        key={index}
        className="floating-status-title animate-rotate-in"
        title={card.content}
      >
        {card.content}
      </span>
      <span className="floating-status-timer">{formatFocusMs(card.focusMs)}</span>
      {rest > 0 && (
        <span className="shrink-0 rounded-full bg-primary/10 px-1.5 text-[11px] font-medium text-primary">
          +{rest}
        </span>
      )}
      {pendingCount > 0 && (
        <span className="shrink-0 rounded-full bg-amber-400/20 px-1.5 text-[11px] font-medium text-amber-700">
          待确认 {pendingCount}
        </span>
      )}
      <button
        type="button"
        data-no-expand
        aria-label="新增任务"
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[14px] font-semibold leading-none text-primary transition-colors hover:bg-primary/20"
      >
        +
      </button>
    </div>
  );
}
