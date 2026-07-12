import { useCallback, useEffect, useRef, useState } from "react";
import {
  availableMonitors,
  getCurrentWindow,
  LogicalSize,
  PhysicalPosition,
} from "@tauri-apps/api/window";

import { api } from "../lib/tauri-bridge";
import { useActiveTask } from "./hooks/useActiveTask";
import { useFocusTicker } from "./hooks/useFocusTicker";
import { ControlRow } from "./components/ControlRow";
import { ExpandedPanel } from "./components/ExpandedPanel";
import { FoldedBar } from "./components/FoldedBar";

const FOLDED_W = 320;
const FOLDED_H = 36;
const EXPANDED_W = 360;
const EXPANDED_H = 280;
const TASK_TITLE_MAX = 50;

const FRAME_W = 320;
const FRAME_H = 36;
const POS_MARGIN = 16;
const DEFAULT_X = 100;
const DEFAULT_Y = 60;
const POS_KEY = "floating-position";
const DRAG_THRESHOLD_PX = 4;

// V0.2.0.14 PATCH A-2 重构: 提取 PANEL_STYLE 到 App.tsx 顶层常量, 单一 root div 复用.
// V0.2.0.13 PATCH FoldedBar 与 ExpandedPanel 各带一份 PANEL_STYLE + 各自 rounded / padding, 嵌套出多 2 层容器.
// V0.2.0.14 单一 root div 永远用 PANEL_STYLE + flex-col + rounded-2xl + p-3, 内容只 2 行:
//   - FoldedBar (圆点 + 标题 + 时间) — always
//   - (active session) ControlRow / (!active && expanded) ExpandedPanel
const PANEL_STYLE: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.6)",
  backdropFilter: "blur(28px) saturate(120%)",
  WebkitBackdropFilter: "blur(28px) saturate(120%)",
  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 8px 32px rgba(0, 30, 80, 0.08)",
};

export function FloatingApp() {
  const { session, refresh, setSession } = useActiveTask();
  const liveFocusMs = useFocusTicker(session, 1000);

  const [expanded, setExpanded] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // V0.2.0.14 PATCH A-2 + B-2-1 + C-3: 单一 root div panelRef 覆盖整个 panel 区域 (FoldedBar + ExpandedPanel/ControlRow).
  // 之前 V0.2.0.13 PATCH panelRef 只在 ExpandedPanel 内, FoldedBar 区域右键不覆盖 → dismissingRef=true → input blur → onDismiss → 折叠 (B-2-1 race).
  // V0.2.0.14 把 panelRef 移到 root 上, 整个 root 都是 panel 内, document mousedown 在 panel 外才 dismiss.
  const panelRef = useRef<HTMLDivElement | null>(null);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    isDragging: boolean;
    dragStarted: boolean;
    win: ReturnType<typeof getCurrentWindow> | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const win = getCurrentWindow();
    (async () => {
      try {
        if (cancelled) return;
        if (expanded) {
          const pos = await win.outerPosition();
          if (cancelled) return;
          await win.setSize(new LogicalSize(EXPANDED_W, EXPANDED_H));
          if (cancelled) return;
          // V0.2.7 修: 不再 -20px 偏移 (V0.2.6 final fix 偏移公式让贴右边缘时右边被截 4px)
          await win.setPosition(new PhysicalPosition(pos.x, pos.y));
          if (cancelled) return;
        } else {
          await win.setSize(new LogicalSize(FOLDED_W, FOLDED_H));
          if (cancelled) return;
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[resize/position] failed", err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expanded]);

  useEffect(() => {
    let win: ReturnType<typeof getCurrentWindow> | null = null;
    try {
      win = getCurrentWindow();
    } catch {
      return;
    }
    if (!win?.setPosition || !win?.onMoved) return;

    const clampInsideMonitor = (pos: { x: number; y: number }, monitors: { position: { x: number; y: number }; size: { width: number; height: number } }[]): boolean => {
      return monitors.some(
        (m) =>
          pos.x >= m.position.x + POS_MARGIN &&
          pos.x + FRAME_W <= m.position.x + m.size.width - POS_MARGIN &&
          pos.y >= m.position.y + POS_MARGIN &&
          pos.y + FRAME_H <= m.position.y + m.size.height - POS_MARGIN,
      );
    };

    const setDefaultAtRightBottom = async () => {
      try {
        const monitors = await availableMonitors();
        const primary = monitors.find((m) => m.position.x === 0) ?? monitors[0];
        if (!primary) {
          win!.setPosition(new PhysicalPosition(DEFAULT_X, DEFAULT_Y));
          return;
        }
        win!.setPosition(
          new PhysicalPosition(
            primary.position.x + primary.size.width - FRAME_W - POS_MARGIN,
            primary.position.y + POS_MARGIN,
          ),
        );
      } catch {
        win!.setPosition(new PhysicalPosition(DEFAULT_X, DEFAULT_Y));
      }
    };

    const saved = localStorage.getItem(POS_KEY);
    if (saved) {
      try {
        const pos = JSON.parse(saved) as { x: number; y: number };
        availableMonitors().then((monitors) => {
          if (clampInsideMonitor(pos, monitors)) {
            win!.setPosition(new PhysicalPosition(pos.x, pos.y));
          } else {
            localStorage.removeItem(POS_KEY);
            void setDefaultAtRightBottom();
          }
        }).catch(() => {
          localStorage.removeItem(POS_KEY);
          void setDefaultAtRightBottom();
        });
      } catch {
        localStorage.removeItem(POS_KEY);
        void setDefaultAtRightBottom();
      }
    } else {
      void setDefaultAtRightBottom();
    }

    const unlisten = win.onMoved(({ payload }) => {
      try {
        localStorage.setItem(POS_KEY, JSON.stringify(payload));
      } catch {
        // localStorage 不可用 → 静默放弃持久化
      }
    });
    return () => {
      unlisten.then((u) => u());
    };
  }, []);

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (expanded) return;
    if (e.button !== 0) return; // V0.2.8 Issue A: 右键 (button=2) 走原生 contextmenu capture listener 弹 Rust 原生 Menu, 不走 drag/toggle 路径
    if ((e.target as HTMLElement).closest("[data-no-expand], [data-close]")) return;
    // V0.2.7 修: mousedown 时捕获 win, 4px 阈值后调 startDragging 让 OS 开始拖窗
    let win: ReturnType<typeof getCurrentWindow> | null = null;
    try {
      win = getCurrentWindow();
    } catch {
      // dev / vitest 环境无 Tauri runtime, win 保持 null, 拖动仍可走纯前端逻辑 (虽然不生效)
    }
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      isDragging: true,
      dragStarted: false,
      win,
    };
  }

  // V0.2.0.12 PATCH: 右键调 Rust 原生 Menu IPC (popup_menu + OS HMENU, 独立浮窗外窗口)
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
        setExpanded(true);
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

  // V0.2.0.14 PATCH C-3: 拆 onCancel → 两个语义不同的 callback:
  // - handleDismiss: 只折叠 (panel 外 mousedown 用), 保留 taskTitle state 让用户切回不丢输入
  // - handleClearAndDismiss: 清 taskTitle + 折叠 (用户显式 "取消" button + Esc 用)
  const handleDismiss = useCallback(() => {
    setExpanded(false);
  }, []);
  const handleClearAndDismiss = useCallback(() => {
    setTaskTitle("");
    setExpanded(false);
  }, []);

  // V0.2.0.14 PATCH C-3: document mousedown listener (替代 V0.2.0.13 PATCH input blur listener).
  // panelRef 在 root div 上, 整个 root (FoldedBar + ExpandedPanel/ControlRow) 都是 panel 内.
  // panel 外 mousedown → handleDismiss (折叠, taskTitle 保留). panel 内 mousedown → 不动.
  // 比 input blur 更可靠: blur 在某些 race condition 下不触发 (e.g. panel 内 click 不抢 focus, 浮窗 win 切后台等).
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

  // V0.2.0.14 PATCH C-4: active session 变化时自动折叠 (user L3 改主意 — 期望 "折叠 + 控制行 active").
  // V0.2.0.13 PATCH 让 active session 时保持展开 (假设 user 想无缝开下一个 task),
  // 但 user L3 实测发现: active task 时浮窗保持展开会遮挡内容, 期望控制行直接在折叠态显示,
  // 让折叠态仍是常态, 展开态仅用于 "开新任务".
  useEffect(() => {
    if (session) setExpanded(false);
  }, [session?.id]);

  async function handleStart() {
    const title = taskTitle.trim();
    if (!title || submitting) return;
    setSubmitting(true);
    try {
      await api.timerSession.create(title);
      // V0.2.0.14 PATCH C-4: 不在 handleStart 里 setExpanded(false), useEffect 监听 active session 变化自动折叠.
      setTaskTitle("");
      await refresh();
    } catch (err) {
      console.error("[start] failed", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function act(action: "pause" | "resume" | "complete") {
    if (!session) return;
    try {
      const updated = await api.timerSession[action](session.id);
      setSession(updated);
      if (action === "complete") {
        // V0.2.0.14 PATCH C-4: complete 后由 useEffect 监听 session 变化 (变 null) 自动折叠回 empty 态.
        void refresh();
      }
    } catch (err) {
      // 防御闪退: Tauri 2 unhandled promise rejection → React error boundary → tree unmount
      console.error(`[act:${action}] failed`, err);
    }
  }

  // V0.2.0.14 PATCH A-2 重构: 单一 root div, 永远同一 PANEL_STYLE + flex-col + rounded-2xl + p-3.
  // 不再有 expanded/folded class 切换 + 嵌套 flex-1 wrapper, 切换折叠/非折叠不闪.
  // 内容 3 段 (互斥, 但 root div 永远存在):
  //   - FoldedBar: always
  //   - active session: ControlRow (在 FoldedBar 下方, 折叠态浮窗第二行)
  //   - !active && expanded: ExpandedPanel (input + 按钮, 展开态)
  return (
    <div
      ref={panelRef}
      data-testid="floating-root"
      className="floating-root flex h-full w-full flex-col gap-2 overflow-hidden rounded-2xl p-3 text-[12px]"
      style={PANEL_STYLE}
      onMouseDown={handleMouseDown}
    >
      {/* FoldedBar: always — 圆点 + 标题 + 时间 */}
      <FoldedBar
        taskTitle={session?.task_title ?? ""}
        focusMs={liveFocusMs}
        status={session ? session.status : "empty"}
        onClick={() => {
          // 仅无 active session 且折叠态 click 触发展开; active 时折叠是常态不展开.
          if (!expanded && !session) setExpanded(true);
        }}
      />
      {/* active session: 折叠态第二行显示 ControlRow (暂停/继续/完成) */}
      {session && (
        <ControlRow
          status={session.status}
          onPause={() => act("pause")}
          onResume={() => act("resume")}
          onComplete={() => act("complete")}
        />
      )}
      {/* 无 active session 且 expanded: 显示 ExpandedPanel (input + 开始/取消) */}
      {!session && expanded && (
        <ExpandedPanel
          taskTitle={taskTitle}
          onTaskTitleChange={setTaskTitle}
          onStart={handleStart}
          onClearAndDismiss={handleClearAndDismiss}
          maxLength={TASK_TITLE_MAX}
          submitting={submitting}
        />
      )}
    </div>
  );
}