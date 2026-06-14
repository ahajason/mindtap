// src/floating/App.tsx
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { FocusBlock } from "./components/FocusBlock";
import { ExpandState } from "./components/ExpandState";

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

export default function App() {
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // 手动 resize 期间阻止 ResizeObserver 反馈循环
  const manualResizingRef = useRef(false);

  // 显式 setSize：在 expanded 切换时立即同步（兜底 ResizeObserver 漏触发）
  useEffect(() => {
    const w = expanded ? EXPAND_W : FOLD_W;
    const h = expanded ? EXPAND_H : FOLD_H;
    getWin()
      .setSize(new LogicalSize(w, h))
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
      getWin()
        .setSize(new LogicalSize(w, h))
        .catch((e) => console.error("setSize (observer) failed:", e));
    };

    const ro = new ResizeObserver(sync);
    ro.observe(el);
    sync(); // 初始同步一次
    return () => ro.disconnect();
  }, []);

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

  if (expanded) {
    return (
      <div ref={rootRef} className="floating-root expanded">
        <ExpandState />
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
      className="floating-root folded"
      onClick={() => setExpanded(true)}
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
