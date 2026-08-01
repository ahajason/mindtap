// V0.2.1: 浮窗三态折叠 → folded(计数条) / compose(捕获输入) / list(并行卡片列表)。
// 取代旧单卡三态(folded/compose/controls)。
// 拖动/位置记忆/dismiss/原生菜单等机制保留 V0.2.0 既有实现。

import { useCallback, useEffect, useRef, useState } from "react";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import {
  availableMonitors,
  getCurrentWindow,
  PhysicalPosition,
} from "@tauri-apps/api/window";

import { api } from "../lib/tauri-bridge";
import { useActiveTasks } from "./hooks/useActiveTasks";
import { useCaptureIntent } from "./hooks/useCaptureIntent";
import { ExpandedPanel } from "./components/ExpandedPanel";
import { FoldedBar } from "./components/FoldedBar";
import { TaskCard } from "./components/TaskCard";

type FloatingPresentation = "folded" | "compose" | "list";

const FLOATING_SIZE: Record<FloatingPresentation, { w: number; h: number }> = {
  folded: { w: 360, h: 36 },
  compose: { w: 360, h: 280 },
  list: { w: 360, h: 280 },
};

// V0.2.1 展开态高度可调:list 高度用户可拖拽调整,存 app_setting 表(floating_list_height)。
// 折叠/新增面板高度固定(不跟随),切换态物理 resize 各归各位,不混淆。
const LIST_H_MIN = 200;
const LIST_H_MAX = 600;
const LIST_H_DEFAULT = 280;
const LIST_H_KEY = "floating_list_height";

const TASK_TITLE_MAX = 200;
const WIP_SOFT_LIMIT = 5;

// FRAME_W/H: 默认右上角位置 clamp 公式用, 折叠态物理窗口尺寸.
const FRAME_W = 360;
const FRAME_H = 36;
const POS_MARGIN = 16;
const POS_KEY = "floating-position";
const DRAG_THRESHOLD_PX = 4;

// 冷却档位:按 last_active_at 时间差派生(ADR-0012)。活跃/冷却/晾着 = 真实性衰减,非状态。
function coldLevel(la: number | null | undefined, now: number): "cooling" | "stale" | undefined {
  if (la == null) return undefined;
  const diff = now - la;
  if (diff > 24 * 3600 * 1000) return "stale";
  if (diff > 2 * 3600 * 1000) return "cooling";
  return undefined;
}

export function FloatingApp() {
  const { active, todo, refresh } = useActiveTasks();
  const { intent, clear } = useCaptureIntent();
  const [nowTick, setNowTick] = useState(() => Date.now());

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [duplicateHint, setDuplicateHint] = useState<string | null>(null);
  const [forceCompose, setForceCompose] = useState(false);
  // V0.2.1 展开态高度:从 app_setting 读默认(list 高度可拖拽调整),compose/folded 不受影响。
  const [listHeight, setListHeight] = useState<number | null>(null);
  // compose 进入来源:从列表进(true)→ 取消回落列表;从折叠条「+」/快捷键进(false)→ 取消收起。
  const [composeFromList, setComposeFromList] = useState(false);

  // ADR-0013: 重复捕获轻提示(不阻止不合并)。输入变化时检测同名已有卡。
  useEffect(() => {
    const title = taskTitle.trim();
    if (!title) {
      setDuplicateHint(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const dup = await api.item.listDuplicate(title);
        if (!cancelled) setDuplicateHint(dup.length > 0 ? title : null);
      } catch {
        if (!cancelled) setDuplicateHint(null);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [taskTitle]);

  // 展开态默认:有卡 → list;空 → compose;捕获意图/手动新增 → compose
  const hasCards = active.length > 0 || todo.length > 0;
  const presentation: FloatingPresentation = !isPanelOpen
    ? "folded"
    : forceCompose || intent
      ? "compose"
      : hasCards
        ? "list"
        : "compose";

  // 捕获意图到达:强制展开进入 compose(PRD 1.1:快捷键唤起输入框聚焦)。
  // 已在列表(展开有卡)时快捷键唤起 → 取消回落列表;折叠/无卡时唤起 → 取消收起。
  useEffect(() => {
    if (intent) {
      setComposeFromList(isPanelOpen && !forceCompose && hasCards);
      setIsPanelOpen(true);
    }
  }, [intent]);

  const panelRef = useRef<HTMLDivElement | null>(null);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    isDragging: boolean;
    dragStarted: boolean;
    win: ReturnType<typeof getCurrentWindow> | null;
  } | null>(null);

  // 每秒刷新 nowTick,驱动冷却档位变化
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // V0.2.1 展开态高度:启动读 app_setting,clamp 到 [MIN, MAX]。
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await api.setting.get(LIST_H_KEY);
        if (cancelled) return;
        const n = raw != null ? Number(raw) : NaN;
        setListHeight(
          Number.isFinite(n)
            ? Math.min(LIST_H_MAX, Math.max(LIST_H_MIN, Math.round(n)))
            : LIST_H_DEFAULT,
        );
      } catch {
        if (!cancelled) setListHeight(LIST_H_DEFAULT);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // V0.2.1 拖拽调整 list 高度:底部把手 mousedown → 跟 mouseMove 更新高度 → mouseup 存库。
  // 用 ref 避免 resize 期间触发 re-render 竞态;clamp 到 [MIN, MAX]。
  const resizeRef = useRef<{ startY: number; startH: number } | null>(null);
  function onResizeStart(e: React.MouseEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { startY: e.clientY, startH: listHeight ?? LIST_H_DEFAULT };
  }
  useEffect(() => {
    function onMove(e: MouseEvent) {
      const r = resizeRef.current;
      if (!r) return;
      const dy = e.clientY - r.startY;
      const next = Math.min(LIST_H_MAX, Math.max(LIST_H_MIN, r.startH + dy));
      setListHeight(next);
    }
    function onUp() {
      if (!resizeRef.current) return;
      resizeRef.current = null;
      // 结束时持久化
      setListHeight((h) => {
        const v = h ?? LIST_H_DEFAULT;
        api.setting.set(LIST_H_KEY, String(v)).catch(() => {});
        return v;
      });
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const win = getCurrentWindow();
    (async () => {
      try {
        if (cancelled) return;
        // V0.2.1 高度:list 用可调 listHeight,folded/compose 用固定 FLOATING_SIZE。
        const h = presentation === "list"
          ? (listHeight ?? LIST_H_DEFAULT)
          : FLOATING_SIZE[presentation].h;
        const { w } = FLOATING_SIZE[presentation];
        if (presentation !== "folded") {
          const pos = await win.outerPosition();
          if (cancelled) return;
          await invoke<void>("set_floating_size", { w, h });
          if (cancelled) return;
          await win.setPosition(new PhysicalPosition(pos.x, pos.y));
          return;
        }

        await invoke<void>("set_floating_size", { w, h });
      } catch (err) {
        if (!cancelled) {
          console.error("[resize/position] failed", err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [presentation, listHeight]);

  // 位置记忆(保留 V0.2.0.15 实现)
  useEffect(() => {
    let cancelled = false;
    let unlisten: UnlistenFn | null = null;

    (async () => {
      let win: ReturnType<typeof getCurrentWindow> | null = null;
      try {
        win = getCurrentWindow();
      } catch {
        return;
      }
      if (!win?.setPosition || !win?.onMoved) return;

      await new Promise((r) => setTimeout(r, 50));
      if (cancelled) return;

      const clampInsideMonitor = (
        pos: { x: number; y: number },
        monitors: { position: { x: number; y: number }; size: { width: number; height: number } }[],
      ): boolean => {
        return monitors.some(
          (m) =>
            pos.x >= m.position.x + POS_MARGIN &&
            pos.x + FRAME_W <= m.position.x + m.size.width - POS_MARGIN &&
            pos.y >= m.position.y + POS_MARGIN &&
            pos.y + FRAME_H <= m.position.y + m.size.height - POS_MARGIN,
        );
      };

      const setDefaultAtRightBottom = async (): Promise<void> => {
        let monitors;
        try {
          monitors = await availableMonitors();
        } catch (err) {
          console.error("[floating-position] availableMonitors failed", err);
          return;
        }
        const primary = monitors.find((m) => m.position.x === 0) ?? monitors[0];
        if (!primary) {
          console.warn("[floating-position] no monitors detected, skip default position");
          return;
        }
        await win!.setPosition(
          new PhysicalPosition(
            primary.position.x + primary.size.width - FRAME_W - POS_MARGIN,
            primary.position.y + POS_MARGIN,
          ),
        );
      };

      try {
        const saved = localStorage.getItem(POS_KEY);
        if (saved) {
          let pos: { x: number; y: number } | null = null;
          try {
            pos = JSON.parse(saved) as { x: number; y: number };
          } catch {
            localStorage.removeItem(POS_KEY);
          }
          if (pos) {
            let monitors;
            try {
              monitors = await availableMonitors();
            } catch (err) {
              console.error("[floating-position] availableMonitors failed", err);
              localStorage.removeItem(POS_KEY);
              await setDefaultAtRightBottom();
              return;
            }
            if (cancelled) return;
            if (clampInsideMonitor(pos, monitors)) {
              await win.setPosition(new PhysicalPosition(pos.x, pos.y));
            } else {
              localStorage.removeItem(POS_KEY);
              await setDefaultAtRightBottom();
            }
          } else {
            await setDefaultAtRightBottom();
          }
        } else {
          await setDefaultAtRightBottom();
        }
      } catch (err) {
        console.error("[floating-position] init failed", err);
      }

      if (cancelled) return;

      try {
        unlisten = await win.onMoved(({ payload }) => {
          try {
            localStorage.setItem(POS_KEY, JSON.stringify(payload));
          } catch {
            // localStorage 不可用 → 静默放弃持久化
          }
        });
      } catch (err) {
        console.error("[floating-position] onMoved register failed", err);
      }
    })();

    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, []);

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-no-expand], [data-close]")) return;
    let win: ReturnType<typeof getCurrentWindow> | null = null;
    try {
      win = getCurrentWindow();
    } catch {
      // dev / vitest 环境无 Tauri runtime, win 保持 null
    }
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      isDragging: true,
      dragStarted: false,
      win,
    };
  }

  async function onContextMenuCapture(e: MouseEvent) {
    if (e.button !== 2) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.app.showFloatingContextMenu();
    } catch (err) {
      console.error("[showFloatingContextMenu] failed", err);
    }
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current?.isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX && !dragRef.current.dragStarted) {
        dragRef.current.dragStarted = true;
        try {
          void dragRef.current.win?.startDragging();
        } catch (err) {
          console.error("[drag] startDragging failed", err);
        }
      }
    };
    const onMouseUp = () => {
      if (!dragRef.current) return;
      if (!dragRef.current.dragStarted) {
        setIsPanelOpen(true);
      }
      dragRef.current = null;
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("contextmenu", onContextMenuCapture, { capture: true });
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("contextmenu", onContextMenuCapture, { capture: true } as EventListenerOptions);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    clear();
    setForceCompose(false);
    setIsPanelOpen(false);
  }, [clear]);
  // V0.2.1 design §2.2: 取消/Esc → 从列表进面板时回落列表,从折叠条进面板时收起。
  const handleClearAndDismiss = useCallback(() => {
    const fromList = composeFromList;
    clear();
    setForceCompose(false);
    setTaskTitle("");
    if (fromList) {
      setIsPanelOpen(active.length > 0 || todo.length > 0);
    } else {
      setIsPanelOpen(false);
    }
  }, [clear, composeFromList, active, todo]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const node = panelRef.current;
      if (!node) return;
      if (!node.contains(e.target as Node)) {
        handleDismiss();
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [handleDismiss]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && presentation !== "folded") handleClearAndDismiss();
    }
    function onWindowBlur() {
      if (dragRef.current?.dragStarted) {
        dragRef.current = null;
        return;
      }
      if (presentation !== "folded") handleDismiss();
    }

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [presentation, handleDismiss, handleClearAndDismiss]);

  // 保存:捕获 → 待办 + 收起(PRD 1.1 + 3.2 规则 1)。三态下捕获直接进待办。
  async function handleSave() {
    const title = taskTitle.trim();
    if (!title || submitting) return;
    setSubmitting(true);
    try {
      await api.item.create(title);
      clear();
      setForceCompose(false);
      setTaskTitle("");
      await refresh();
      setIsPanelOpen(false);
    } catch (err) {
      console.error("[save] failed", err);
    } finally {
      setSubmitting(false);
    }
  }

  // 开始:捕获 + 直接计时(先落库,再切换 active)。进入 list 显示新进行中卡(不折叠)。
  async function handleStart() {
    const title = taskTitle.trim();
    if (!title || submitting) return;
    setSubmitting(true);
    try {
      const item = await api.item.create(title);
      await api.item.start(item.id);
      clear();
      setForceCompose(false);
      setTaskTitle("");
      await refresh();
      setIsPanelOpen(true);
    } catch (err) {
      console.error("[start] failed", err);
    } finally {
      setSubmitting(false);
    }
  }

  // 开始:todo → active,并行式(不暂停其他 active 卡)。
  async function handleStartItem(id: number) {
    try {
      await api.item.start(id);
      void refresh();
    } catch (err) {
      console.error("[item.start] failed", err);
    }
  }

  // 手动暂停:active → todo(退回待办)。
  async function handlePauseItem(id: number) {
    try {
      await api.item.pause(id, null);
      void refresh();
    } catch (err) {
      console.error("[item.pause] failed", err);
    }
  }

  // 双击改名:提交新内容(3a)。改名不改变状态机,刷新后新内容生效。
  async function handleRenameItem(id: number, content: string) {
    try {
      await api.item.rename(id, content);
      void refresh();
    } catch (err) {
      console.error("[item.rename] failed", err);
    }
  }

  // 归档:active/todo → archived(完成即归档,三态唯一出口)。结算 active 段,刷新后自然消失。
  async function handleArchiveItem(id: number) {
    try {
      await api.item.complete(id);
      void refresh();
    } catch (err) {
      console.error("[item.complete] failed", err);
    }
  }

  // 捕获意图到达:强制展开进入 compose(PRD 1.1:快捷键唤起输入框聚焦)
  function openCompose() {
    setTaskTitle("");
    setForceCompose(true);
    setIsPanelOpen(true);
  }

  // 待确认 = 有 pending_ms 的卡(active 冷却挂 pending + todo 超时停表挂 pending)
  const pendingCount = [...active, ...todo].filter((i) => i.pending_ms != null).length;  // 折叠条滚动展示的进行中卡视图:实时时长 = focus_ms + (now - last_active_at)(决策 9)。
  const activeCards = active.map((item) => ({
    content: item.content,
    focusMs:
      item.status === "active" && item.last_active_at != null
        ? item.focus_ms + Math.max(0, nowTick - item.last_active_at)
        : item.focus_ms,
  }));

  return (
    <div
      ref={panelRef}
      data-testid="floating-root"
      className={`floating-root ${presentation === "folded" ? "folded" : "expanded"}`}
      onMouseDown={handleMouseDown}
    >
      <div className="floating-content">
        <FoldedBar
          activeCards={activeCards}
          todoCount={todo.length}
          pendingCount={pendingCount}
          onAdd={openCompose}
          onOpenList={() => {
            setForceCompose(false);
            setIsPanelOpen(true);
          }}
        />
        {presentation !== "folded" && (
          <div className="floating-body">
            {presentation === "list" ? (
              <>
                <div className="floating-list">
                {active.length > WIP_SOFT_LIMIT && (
                  <div className="px-2 pb-1 text-[12px] text-amber-600">
                    在推进的事有点多
                  </div>
                )}
                {/* V0.2.1: 列表不再有「记一下」入口,新增移到折叠条右侧「+」 */}
                {active.length > 0 && (
                  <div className="px-2 pb-0.5 pt-1 text-[11px] font-medium text-text-3">
                    进行中
                  </div>
                )}
                {active.map((item) => (
                  <TaskCard
                    key={`active-${item.id}`}
                    item={item}
                    cold={coldLevel(item.last_active_at, nowTick)}
                    now={nowTick}
                    onStart={() => handleStartItem(item.id)}
                    onPause={() => handlePauseItem(item.id)}
                    onArchive={() => handleArchiveItem(item.id)}
                    onRename={(content) => handleRenameItem(item.id, content)}
                  />
                ))}
                {todo.length > 0 && (
                  <div className="px-2 pb-0.5 pt-1 text-[11px] font-medium text-text-3">
                    待办
                  </div>
                )}
                {todo.map((item) => (
                  <TaskCard
                    key={`todo-${item.id}`}
                    item={item}
                    onStart={() => handleStartItem(item.id)}
                    onArchive={() => handleArchiveItem(item.id)}
                    onRename={(content) => handleRenameItem(item.id, content)}
                  />
                ))}
                {active.length === 0 && todo.length === 0 && (
                  <div className="px-2 py-2 text-[12px] text-text-2">
                    暂无任务，点「+」记一笔
                  </div>
                )}
              </div>
              {/* V0.2.1 展开态高度可调:底部把手,拖拽调整列表高度(存 app_setting)。 */}
              <div
                data-no-expand
                aria-label="调整列表高度"
                role="separator"
                onMouseDown={onResizeStart}
                className="group flex h-2.5 shrink-0 cursor-ns-resize items-center justify-center"
              >
                <div className="h-[3px] w-7 rounded-full bg-black/10 transition-colors group-hover:bg-black/20" />
              </div>
              </>
            ) : (
              <>
                <ExpandedPanel
                  taskTitle={taskTitle}
                  onTaskTitleChange={setTaskTitle}
                  onStart={handleStart}
                  onSave={handleSave}
                  onClearAndDismiss={handleClearAndDismiss}
                  maxLength={TASK_TITLE_MAX}
                  submitting={submitting}
                />
                {duplicateHint && (
                  <div className="px-2 pb-1 text-[12px] text-amber-600">
                    已有同名任务「{duplicateHint}」
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
