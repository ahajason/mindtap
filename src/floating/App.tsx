// src/floating/App.tsx
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { FocusBlock } from "./components/FocusBlock";
import { ExpandState } from "./components/ExpandState";
import { useDragLongPress } from "./hooks/useDragLongPress";
import { clampHeight } from "./measure";
import { api } from "../lib/tauri-bridge";

// 缓存窗口实例（getCurrentWindow() 每次返回新对象，避免 effect deps 不稳定）
// 浏览器开发模式无 Tauri runtime → getCurrentWindow 同步抛错 → React 整个 unmount。
// 加 try/catch 让浮窗在 vite dev 也能 mount（视觉 + DOM 测试用）；
// IPC setSize 在 vite dev 下静默 no-op，tauri dev/build 下正常工作。
let cachedWin: ReturnType<typeof getCurrentWindow> | null | undefined = undefined;
function getWin() {
  if (cachedWin !== undefined) return cachedWin;
  try {
    cachedWin = getCurrentWindow();
  } catch {
    cachedWin = null;
  }
  return cachedWin;
}

// 内容自适应边界（必须与 src-tauri/src/commands/floating_cmd.rs 的 MIN_H/MAX_H 同步）
const MIN_H = 36;
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

// no-op 调试日志（V1.5 之前有 DEBUG=true 模式 + patchWinForDebug mock
// 模拟 Tauri window innerWidth/Height，但 mock 用 getter 自递归导致
// 浏览器栈溢出。已删 mock，仅留 stub 保持调用点不删）
const dlog = (..._a: unknown[]) => {};

export default function App() {
  const [expanded, setExpanded] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const rootRef = useRef<HTMLDivElement>(null);
  // 鼠标移出计时器（200ms 缓冲）
  const collapseTimerRef = useRef<number | null>(null);

  dlog("render: expanded=", expanded, "phase=", phase, "inner=", window.innerWidth, "x", window.innerHeight);

  // 显式 setSize：在 expanded 切换时立即同步（兜底 ResizeObserver 漏触发）
  useEffect(() => {
    const win = getWin();
    if (!win) return; // 浏览器开发模式：getCurrentWindow 抛过 = no-op
    const w = expanded ? EXPAND_W : FOLD_W;
    const h = expanded ? EXPAND_H : FOLD_H;
    dlog("[toggle useEffect] setSize request:", w, "x", h, "expanded=", expanded);
    win.setSize(new LogicalSize(w, h))
      .then(() => {
        dlog("[toggle useEffect] setSize resolved");
      })
      .catch((e) => console.error("setSize (toggle) failed:", e));
  }, [expanded]);

  // 内容自适应：测 rootRef.scrollHeight + rAF 合并 + MutationObserver 监听内容变化
  // （取代之前的 ResizeObserver——后者依赖 root box size，但根容器在没显式 width
  // 约束时不撑开，observer 永远不触发。openless LessComputerPanel 同款范式）
  useLayoutEffect(() => {
    if (!expanded) return; // 折叠态固定 36px，无需 resize
    const el = rootRef.current;
    if (!el) return;

    let frame: number | null = null;
    const measure = () => {
      frame = null;
      const clamped = clampHeight(el.scrollHeight, { minH: MIN_H, maxH: MAX_H });
      dlog("[content] scrollHeight=", el.scrollHeight, "→ setSize(EXPAND_W,", clamped, ")");
      // api.floatingSetHeight 在 vite dev 浏览器下 invoke 同步抛（无 Tauri runtime）
      try {
        api.floatingSetHeight(clamped)
          .catch((e: unknown) => console.error("floatingSetHeight failed:", e));
      } catch {
        // 浏览器开发模式：invoke undefined → 静默跳过
      }
    };
    const schedule = () => {
      if (frame != null) return;
      frame = requestAnimationFrame(measure);
    };

    schedule(); // 初始测量一次
    // textarea 输入 / 子节点增删 / 字符修改 都会撑高根容器 scrollHeight
    const mo = new MutationObserver(schedule);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      mo.disconnect();
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, [expanded]);

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
    </div>
  );
}
