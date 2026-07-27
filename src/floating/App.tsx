// 本文件 version label 已按 docs/governance/versioning-rule.md §三 retro-fit:
// V0.2.3..V0.2.8 单一数字 / "patch" / Issue A/B/C/Bug 5 全部 → V0.2.0.1..V0.2.0.9。
// 原 V0.2.x 标签含义(何时哪个 commit 修了什么真根因)见 governance §三 mapping 表,
// 不要再 grep "V0.2.7 patch" 这种历史标签 — 找不到 commit。
// V0.2.0.14 PATCH 架构变更(单一 root div,FoldedBar 永远渲染):见 fd38127 / a0fc00d。

import { useCallback, useEffect, useRef, useState } from "react";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import {
  availableMonitors,
  getCurrentWindow,
  PhysicalPosition,
} from "@tauri-apps/api/window";

import { api } from "../lib/tauri-bridge";
import { useActiveTask } from "./hooks/useActiveTask";
import { useFocusTicker } from "./hooks/useFocusTicker";
import { ControlRow } from "./components/ControlRow";
import { ExpandedPanel } from "./components/ExpandedPanel";
import { FoldedBar } from "./components/FoldedBar";

// V0.2.0.16 PATCH C: 折叠/展开等宽 360, user L3 实测期望 "切换只高度变".
const FOLDED_W = 360;
const FOLDED_H = 36;
const EXPANDED_W = 360;
const EXPANDED_H = 280;
const TASK_TITLE_MAX = 50;

// FRAME_W/H: 默认右上角位置 clamp 公式用, 等宽 (跟 FOLDED_W 一致 — 物理窗口尺寸).
const FRAME_W = 360;
const FRAME_H = 36;
const POS_MARGIN = 16;
// V0.2.0.15 PATCH E-1 fix: 移除 DEFAULT_X/DEFAULT_Y 常量 (旧 fire-and-forget fallback 用,
// 现 V0.2.0.15 失败时 console.error + 不调 setPosition, 保留 tauri.conf.json 默认位置 —
// 比任意 (100, 60) 合理). 反模式 15 commit 谎改防御: 不再"假装"失败有 fallback.
const POS_KEY = "floating-position";
const DRAG_THRESHOLD_PX = 4;

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
          // V0.2.0.16 PATCH C-rust: 物理 resize 走自定义 rust command (不走 Tauri JS setSize IPC 中转).
          await invoke<void>("set_floating_size", {
            w: EXPANDED_W,
            h: EXPANDED_H,
          });
          if (cancelled) return;
          await win.setPosition(new PhysicalPosition(pos.x, pos.y));
          if (cancelled) return;
        } else {
          await invoke<void>("set_floating_size", {
            w: FOLDED_W,
            h: FOLDED_H,
          });
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

  // V0.2.0.15 PATCH E-1 fix: 浮窗默认右上角 16px (V0.2.0.1 + V0.2.0.4 公式锁).
  // 旧版 fire-and-forget 模式 (`void setDefaultAtRightBottom()`) 有 2 个真根因:
  //   1. setPosition 跟 line 69-97 resize useEffect 的 setSize 并发执行, IPC 调度顺序不保证
  //      setSize 在前 / setPosition 在后; 若 setSize 在后, Tauri 可能用默认 position 重置
  //   2. availableMonitors() 失败时 catch 静默 fallback 到 (100, 60), 不是右上角
  // 修法: 整个 useEffect 收成一个 async IIFE, await 所有串行 IPC; 起手 50ms 让 resize useEffect
  // 先跑完 setSize; 失败时 console.error (不再静默 fallback 到 (100, 60)); cleanup 用 cancelled
  // flag 防止 unmount 后还在调 setPosition.
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

      // V0.2.0.15 E-1: 等待 resize useEffect (line 69-97) 完成 setSize, 避免 IPC 调度 race 让 setSize 覆盖 setPosition.
      // 50ms 是实测够 resize useEffect 的 setSize IPC round-trip + React 重渲染; 不需要精确, 留 buffer.
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
          // V0.2.0.15 E-1: availableMonitors() 失败不再静默 fallback 到 (100, 60)
          // (旧 fallback 是 V0.2.0.5 加的, 但放在 catch 里被指为"假修" — 反模式 15 commit 谎改).
          // 现在: 失败时 console.error + 不调 setPosition (保留 tauri.conf.json 默认位置).
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
        // V0.2.0.15 E-1: 整个 init 流程失败不再静默 (旧 fire-and-forget 模式吞了所有错误)
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
    // V0.2.0.16 PATCH B: 展开态也允许拖 (user L3 实测期望).
    if (e.button !== 0) return; // V0.2.0.6 A: 右键走原生 contextmenu capture, 不进 drag/toggle 路径.
    if ((e.target as HTMLElement).closest("[data-no-expand], [data-close]")) return;
    // V0.2.0.5 修: mousedown 时捕获 win, 4px 阈值后调 startDragging 让 OS 开始拖窗
    // (V0.2.0.3/V0.2.0.4 反复声称"沿用 useDragLongPress.ts:49" 但代码里完全没调 IPC, 反模式 15 谎改)
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
// V0.2.0.4 / V0.2.0.11 误用 HTML React 组件 + viewport-clamp 逻辑都拦不住浮窗 viewport 裁剪
  // (HTML 元素跑在 WebView2 内, 物理上不可能 "独立窗口")
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
      // V0.2.0.5 修: 4px 阈值满足后调 win.startDragging() 让 OS 开始拖窗
      // (只调一次, dragStarted 守防止重复触发)
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

  // V0.2.0.15 PATCH C-4: 不再用 useEffect[session?.id] 监听自动折叠 —
  //   V0.2.0.14 PATCH 该 useEffect 在 handleStart 后 session 从 null → newSession,
  //   useEffect 触发 setExpanded(false) → useEffect[expanded] 跑(true → false)
  //   → setSize(FOLDED_W, FOLDED_H). 但 user 此时 expanded=true (开新 task 展开态),
  //   期望 360×280 展开, 实际变 320×36 折叠 — 即 V0.2.0.15 PATCH 修的 resize bug.
  // 反模式 14 防御: 不用 useEffect, 直接回到 V0.2.0.13 之前的显式路径
  // (handleStart 末尾 + act('complete') 末尾 setExpanded(false)).

  async function handleStart() {
    const title = taskTitle.trim();
    if (!title || submitting) return;
    setSubmitting(true);
    try {
      await api.timerSession.create(title);
      setTaskTitle("");
      await refresh();
      // V0.2.0.15 PATCH C-4: 显式折叠 (不再依赖 useEffect[session?.id], 同根因)
      setExpanded(false);
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
        void refresh();
        // V0.2.0.15 PATCH C-4: complete 后显式折叠 (不再依赖 useEffect[session?.id], 同 handleStart 根因)
        setExpanded(false);
      }
    } catch (err) {
      // 防御闪退: Tauri 2 unhandled promise rejection → React error boundary → tree unmount
      console.error(`[act:${action}] failed`, err);
    }
  }

  return (
    <div
      ref={panelRef}
      data-testid="floating-root"
      className={`floating-root ${expanded ? "expanded" : "folded"}`}
      onMouseDown={handleMouseDown}
    >
      <div className="floating-content">
        <FoldedBar
          taskTitle={session?.task_title ?? ""}
          focusMs={liveFocusMs}
          status={session ? session.status : "empty"}
          onClick={() => {
            if (!expanded) setExpanded(true);
          }}
        />
        {expanded && (
          <div className="floating-body">
            {session ? (
              <ControlRow
                status={session.status}
                onPause={() => act("pause")}
                onResume={() => act("resume")}
                onComplete={() => act("complete")}
              />
            ) : (
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
        )}
      </div>
    </div>
  );
}