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
      className="glass-l3 fixed z-50 min-w-[120px] rounded-xl border border-white/40 p-1 text-[12px] text-text-1 shadow-lg"
      style={{
        left: Math.max(4, Math.min(x - 60, window.innerWidth - 124)),
        top: y + 8,
      }}
      onClick={(e) => e.stopPropagation()}
    >
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