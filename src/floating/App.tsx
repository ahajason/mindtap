// src/floating/App.tsx
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { FocusBlock } from "./components/FocusBlock";
import { ExpandState } from "./components/ExpandState";
import { useDragLongPress } from "./hooks/useDragLongPress";
import { api } from "../lib/tauri-bridge";

// 缓存窗口实例（getCurrentWindow() 每次返回新对象，避免 effect deps 不稳定）
let cachedWin: ReturnType<typeof getCurrentWindow> | null = null;
function getWin() {
  if (!cachedWin) cachedWin = getCurrentWindow();
  return cachedWin;
}

// 内容自适应边界（与 tauri.conf.json maxInnerSize 同步）
const MIN_W = 320;
const MIN_H = 36;
const MAX_W = 480;
const MAX_H = 460;

// 折叠/展开两种状态的显式尺寸
const FOLD_W = 320;
const FOLD_H = 36;
const EXPAND_W = 360;
const EXPAND_H = 280;

// 过渡动画时长（与 CSS .floating-root transition 同步）
const ANIM_MS = 150;
// 鼠标移出后延迟折叠（避免误触）
const HOVER_OUT_DELAY_MS = 200;

// 过渡阶段：idle=稳定态，entering/leaving=过渡中（CSS 加 .transitioning）
type Phase = "idle" | "entering" | "leaving";

// 诊断日志开关：true 时打印 resize / phase / mouseleave 全链路
// TODO: click-to-expand bug 修复后删除
const DEBUG = true;
const dlog = (...a: unknown[]) => DEBUG && console.log("[floating]", ...a);

// 验证 setSize 是否真的影响 Tauri 窗口（在浏览器中 setSize 是 mock，无效）
function patchWinForDebug() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __floatingDebugPatched?: boolean };
  if (w.__floatingDebugPatched) return;
  w.__floatingDebugPatched = true;
  // 拦截 innerWidth/Height 变化（mock 用）：保留一个可改的 override
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    get: () => (window as any).__mockInnerW ?? window.innerWidth,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    get: () => (window as any).__mockInnerH ?? window.innerHeight,
  });
  dlog("patchWinForDebug: innerWidth/innerHeight override armed");
}

export default function App() {
  patchWinForDebug();
  const [expanded, setExpanded] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const rootRef = useRef<HTMLDivElement>(null);
  // 手动 resize 期间阻止 ResizeObserver 反馈循环
  const manualResizingRef = useRef(false);
  // 鼠标移出计时器（200ms 缓冲）
  const collapseTimerRef = useRef<number | null>(null);

  dlog("render: expanded=", expanded, "phase=", phase, "inner=", window.innerWidth, "x", window.innerHeight);

  // 显式 setSize：在 expanded 切换时立即同步（兜底 ResizeObserver 漏触发）
  useEffect(() => {
    const w = expanded ? EXPAND_W : FOLD_W;
    const h = expanded ? EXPAND_H : FOLD_H;
    dlog("[toggle useEffect] setSize request:", w, "x", h, "expanded=", expanded);
    getWin()
      .setSize(new LogicalSize(w, h))
      .then(() => {
        // 模拟 setSize 成功后真实窗口尺寸变化（仅 debug mock）
        (window as any).__mockInnerW = w;
        (window as any).__mockInnerH = h;
        dlog("[toggle useEffect] setSize resolved, mock inner=", w, "x", h);
      })
      .catch((e) => console.error("setSize (toggle) failed:", e));
  }, [expanded]);

  // ResizeObserver 监听根容器尺寸 → 动态跟内容（SwitchDropdown、长内容等）
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const sync = () => {
      if (manualResizingRef.current) return; // 手动拖拽期间跳过
      const r = el.getBoundingClientRect();
      const w = Math.max(MIN_W, Math.min(MAX_W, Math.ceil(r.width)));
      const h = Math.max(MIN_H, Math.min(MAX_H, Math.ceil(r.height)));
      dlog("[observer] rect=", r.width.toFixed(0), "x", r.height.toFixed(0),
           "→ setSize", w, "x", h);
      getWin()
        .setSize(new LogicalSize(w, h))
        .then(() => {
          (window as any).__mockInnerW = w;
          (window as any).__mockInnerH = h;
        })
        .catch((e) => console.error("setSize (observer) failed:", e));
    };

    const ro = new ResizeObserver(sync);
    ro.observe(el);
    sync(); // 初始同步一次
    return () => ro.disconnect();
  }, []);

  // unmount 时清理 mouseleave 计时器
  useEffect(
    () => () => {
      if (collapseTimerRef.current !== null) {
        clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
    },
    []
  );

  // 展开：setSize 由 [expanded] useEffect 兜底；phase=entering 首帧渲染后
  // rAF 内切到 idle，触发 CSS transition 淡入 + 缩放回 1
  const expand = useCallback(() => {
    dlog("[expand] click, current phase=", phase, "expanded=", expanded);
    if (collapseTimerRef.current !== null) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
    setExpanded(true);
    setPhase("entering");
    requestAnimationFrame(() => {
      // 二次渲染：移除 .transitioning → CSS transition 触发 fade-in
      dlog("[expand] rAF → setPhase(idle)");
      setPhase("idle");
    });
  }, [phase, expanded]);

  // 折叠：phase=leaving → 150ms 过渡 → 切 expanded=false + phase=idle
  // setSize 仍由 [expanded] useEffect 兜底
  const collapse = useCallback(() => {
    dlog("[collapse] called, expanded=", expanded, "phase=", phase);
    if (collapseTimerRef.current !== null) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
    if (!expanded || phase === "leaving") return; // 已经在折叠或折叠中，幂等
    setPhase("leaving");
    setTimeout(() => {
      dlog("[collapse] timeout → setExpanded(false)");
      setExpanded(false);
      setPhase("idle");
    }, ANIM_MS);
  }, [expanded, phase]);

  // 鼠标移入：清掉待执行的折叠计时
  const onRootMouseEnter = useCallback(() => {
    dlog("[mouse] enter, timer=", collapseTimerRef.current);
    if (collapseTimerRef.current !== null) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  }, []);

  // 鼠标移出：仅在稳定态 + 展开态时启动 200ms 延迟折叠
  const onRootMouseLeave = useCallback(() => {
    dlog("[mouse] leave, expanded=", expanded, "phase=", phase);
    if (!expanded || phase !== "idle") return;
    if (collapseTimerRef.current !== null) return;
    collapseTimerRef.current = window.setTimeout(() => {
      dlog("[mouse] leave 200ms timer fired → collapse()");
      collapseTimerRef.current = null;
      collapse();
    }, HOVER_OUT_DELAY_MS);
  }, [expanded, phase, collapse]);

  // 手动 resize：拖拽右下角手柄
  const onResizeHandleMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      manualResizingRef.current = true;
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = window.innerWidth;
      const startH = window.innerHeight;

      const onMove = (ev: globalThis.MouseEvent) => {
        const dw = ev.clientX - startX;
        const dh = ev.clientY - startY;
        const w = Math.max(MIN_W, Math.min(MAX_W, Math.ceil(startW + dw)));
        const h = Math.max(MIN_H, Math.min(MAX_H, Math.ceil(startH + dh)));
        getWin()
          .setSize(new LogicalSize(w, h))
          .catch(() => {});
      };

      const onUp = () => {
        manualResizingRef.current = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    []
  );

  // 根容器动态 className：phase !== idle 时挂 .transitioning
  const rootClass = [
    "floating-root",
    expanded ? "expanded" : "folded",
    phase !== "idle" ? "transitioning" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // 右键浮窗：弹出 4 项主菜单（V1.4 spec §5.1 / 本次实现）
  const onContextMenu = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      e.preventDefault();
      api.showFloatingContextMenu().catch((err: unknown) => {
        console.error("showFloatingContextMenu failed:", err);
      });
    },
    []
  );

  // 长按拖拽：折叠/展开态各自的根容器都接；window 自带 startDragging
  const drag = useDragLongPress({ thresholdMs: 300 });

  // 展开态：仅当指针在 .floating-root 背景上（target === currentTarget）才起拖；
  // 子元素（按钮/textarea/输入框）的 onPointerDown 在冒泡到根时会被过滤
  const onExpandedPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      drag.onPointerDown(e);
    },
    [drag]
  );

  // 折叠态：整窗可拖；click 处理器在 drag.wasDragged() 时跳过 expand
  const onFoldedClick = useCallback(() => {
    if (drag.wasDragged()) return;
    expand();
  }, [drag, expand]);

  if (expanded) {
    return (
      <div
        ref={rootRef}
        className={rootClass}
        onMouseEnter={onRootMouseEnter}
        onMouseLeave={onRootMouseLeave}
        onContextMenu={onContextMenu}
        onPointerDown={onExpandedPointerDown}
        onPointerUp={drag.onPointerUp}
        onPointerLeave={drag.onPointerCancel}
      >
        <ExpandState onCollapse={collapse} />
        <div
          className="resize-handle"
          onMouseDown={onResizeHandleMouseDown}
          title="拖动调整窗口大小"
          aria-label="resize handle"
        />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={rootClass}
      onClick={onFoldedClick}
      onContextMenu={onContextMenu}
      onPointerDown={drag.onPointerDown}
      onPointerUp={drag.onPointerUp}
      onPointerLeave={drag.onPointerCancel}
    >
      <FocusBlock />
      <div
        className="resize-handle"
        onMouseDown={onResizeHandleMouseDown}
        title="拖动调整窗口大小"
        aria-label="resize handle"
      />
    </div>
  );
}
