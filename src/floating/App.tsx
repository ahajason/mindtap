// 本文件 version label 已按 docs/governance/versioning-rule.md §三 retro-fit:
// V0.2.3..V0.2.8 单一数字 / "patch" / Issue A/B/C/Bug 5 全部 → V0.2.0.1..V0.2.0.9。
// 原 V0.2.x 标签含义(何时哪个 commit 修了什么真根因)见 governance §三 mapping 表,
// 不要再 grep "V0.2.7 patch" 这种历史标签 — 找不到 commit。
// V0.2.0.14 PATCH 架构变更(单一 root div,FoldedBar 永远渲染):见 fd38127 / a0fc00d。

import { useCallback, useEffect, useRef, useState } from "react";
import type { UnlistenFn } from "@tauri-apps/api/event";
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
// V0.2.0.15 PATCH E-1 fix: 移除 DEFAULT_X/DEFAULT_Y 常量 (旧 fire-and-forget fallback 用,
// 现 V0.2.0.15 失败时 console.error + 不调 setPosition, 保留 tauri.conf.json 默认位置 —
// 比任意 (100, 60) 合理). 反模式 15 commit 谎改防御: 不再"假装"失败有 fallback.
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
  // V0.2.0.15 PATCH E-2 fix: pointer-events: none 让 wrapper 上的 backdrop-filter 不阻挡 root 的 hit-test.
  // WebView2 transparent + backdrop-filter 组合让 root div 在 GPU 层不响应 mousedown, 折叠态拖动失效.
  // 修法: PANEL_STYLE (含 backdrop-filter) 移到 root 内 wrapper, wrapper 加 pointer-events: none,
  // 点击穿透到 root (root 没有 backdrop-filter, 响应 hit-test), onMouseDown 触发, 4px 阈值后 win.startDragging().
  pointerEvents: "none",
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
// V0.2.0.5 修: 不再 -20px 偏移 (V0.2.0.4 final fix 偏移公式让贴右边缘时右边被截 4px,
          // 因为 (FOLDED_W - EXPANDED_W) / 2 = -20)
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
    if (expanded) return;
    if (e.button !== 0) return; // V0.2.0.6 Issue A: 右键 (button=2) 走原生 contextmenu capture listener 弹 Rust 原生 Menu, 不走 drag/toggle 路径
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
  //
  // V0.2.0.15 PATCH E-2 fix: PANEL_STYLE 从 root 移到内层 wrapper, wrapper 加 pointer-events: none.
  // 旧版 PANEL_STYLE 在 root + backdrop-filter 让 root 在 WebView2 transparent 模式下 hit-test 失效,
  // 折叠态 mousedown 走不到 handleMouseDown → dragRef 未设置 → 4px 阈值到不了 win.startDragging().
  // 修法: root 拿掉 PANEL_STYLE (无 backdrop-filter, hit-testable), 内层 wrapper 拿 PANEL_STYLE.
  // wrapper 的 pointer-events: none 让点击穿透到 root (root.onMouseDown 触发); wrapper 内 children
  // (FoldedBar/ControlRow/ExpandedPanel) 默认 pointer-events: auto, 自己的 onClick/按钮不受影响.
  // 单一 root div 仍保留 (test A-2 锁住 className 含 rounded-2xl + p-3 + flex-col + gap-2).
  return (
    <div
      ref={panelRef}
      data-testid="floating-root"
      className="floating-root flex h-full w-full flex-col gap-2 overflow-hidden rounded-2xl p-3 text-[12px]"
      onMouseDown={handleMouseDown}
    >
      {/* V0.2.0.15 E-2: 内层 wrapper 拿 PANEL_STYLE (含 backdrop-filter), pointer-events: none 透传到 root */}
      <div style={PANEL_STYLE} className="flex flex-1 flex-col gap-2">
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
    </div>
  );
}