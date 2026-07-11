import { useEffect, useRef } from "react";

import { api } from "../../lib/tauri-bridge";

type ContextMenuProps = {
  x: number;
  y: number;
  onClose: () => void;
};

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

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="浮窗右键菜单"
      data-no-expand
      data-tauri-drag-region="false"
      className="glass-l3 fixed z-50 min-w-[140px] rounded-xl border border-white/40 p-1 text-[12px] text-text-1 shadow-lg"
      style={{
        left: Math.max(4, Math.min(x - 70, (typeof window !== "undefined" ? window.innerWidth : 1024) - 144)),
        top: Math.min(y + 8, (typeof window !== "undefined" ? window.innerHeight : 768) - 120),
      }}
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