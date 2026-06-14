// src/floating/App.tsx
import { useLayoutEffect, useRef, useState } from "react";
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

export default function App() {
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // ResizeObserver 监听根容器尺寸 → setSize 让窗口跟随内容
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const sync = () => {
      const r = el.getBoundingClientRect();
      const w = Math.max(MIN_W, Math.min(MAX_W, Math.ceil(r.width)));
      const h = Math.max(MIN_H, Math.min(MAX_H, Math.ceil(r.height)));
      getWin()
        .setSize(new LogicalSize(w, h))
        .catch((e) => console.error("setSize failed:", e));
    };

    const ro = new ResizeObserver(sync);
    ro.observe(el);
    sync(); // 初始同步一次
    return () => ro.disconnect();
  }, []);

  if (expanded) {
    return (
      <div ref={rootRef} className="floating-root expanded">
        <ExpandState />
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
    </div>
  );
}
