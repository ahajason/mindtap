import { useEffect, useRef } from "react";

import { api } from "../../lib/tauri-bridge";

type ContextMenuProps = {
  x: number;
  y: number;
  onClose: () => void;
};

// V0.2.0.11 Issue A fix: ContextMenu 之前用 single Math.min 做 bottom clamp,
// 折叠态 window.innerHeight = 36px (浮窗 viewport 高), innerHeight - 120 = -84,
// 触发 user 观测 "left: 4px; top: -84px" (菜单跑到 viewport 外, 看不见)。
// 真根因: top 只 clamp bottom, 没 clamp top; left 也只 clamp right, 没 clamp left
// (虽然 left 默认 Math.max(4, ...) 已有最小, 但 right clamp 用 innerWidth - 144 在
//  折叠态 innerWidth=320 也变成 176, 仍可正向, 这部分 OK; 但 top 必须双向 clamp)。
// 修法: 用 MENU_W / MENU_H 常数 + 双向 Math.max + Math.min 完整 viewport clamp。
const MENU_W = 144; // min-w-[140px] + p-1
const MENU_H = 80;  // 两个 menuitem (py-1.5 = 24px * 2 = 48px) + padding + 边框
const VIEWPORT_MARGIN = 4;

function clampToViewport(x: number, y: number): { left: number; top: number } {
  const winW = typeof window !== "undefined" ? window.innerWidth : 1024;
  const winH = typeof window !== "undefined" ? window.innerHeight : 768;
  // 双向 clamp: 不超右/下边界, 不超左/上边界 (MARGIN px)
  // max(MARGIN, winW - MENU_W - MARGIN) 保证右 clamp 不会算成负值 (折叠态 winW=320)
  const maxLeft = Math.max(VIEWPORT_MARGIN, winW - MENU_W - VIEWPORT_MARGIN);
  const maxTop = Math.max(VIEWPORT_MARGIN, winH - MENU_H - VIEWPORT_MARGIN);
  return {
    left: Math.max(VIEWPORT_MARGIN, Math.min(x, maxLeft)),
    top: Math.max(VIEWPORT_MARGIN, Math.min(y, maxTop)),
  };
}

export function ContextMenu({ x, y, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleShowMain() {
    try {
      await api.app.showMainWindow();
    } catch (err) {
      console.error("[showMainWindow] failed", err);
    }
    onClose();
  }

  async function handleExit() {
    try {
      await api.app.exit();
    } catch (err) {
      console.error("[exit] failed", err);
    }
  }

  const { left, top } = clampToViewport(x, y);

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="浮窗右键菜单"
      data-no-expand
      data-tauri-drag-region="false"
      className="glass-l3 fixed z-50 min-w-[140px] rounded-xl border border-white/40 p-1 text-[12px] text-text-1 shadow-lg"
      style={{ left, top }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        role="menuitem"
        data-no-expand
        className="block w-full rounded-lg px-3 py-1.5 text-left hover:bg-white/40"
        onClick={handleShowMain}
      >
        显示主窗
      </button>
      <button
        type="button"
        role="menuitem"
        data-no-expand
        className="block w-full rounded-lg px-3 py-1.5 text-left hover:bg-white/40"
        onClick={handleExit}
      >
        退出
      </button>
    </div>
  );
}