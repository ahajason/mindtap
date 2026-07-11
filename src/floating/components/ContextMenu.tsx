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
      className="glass-l3 fixed z-50 min-w-[120px] rounded-xl border border-white/10 p-1 text-[12px] shadow-lg"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        role="menuitem"
        className="block w-full rounded-lg px-3 py-1.5 text-left text-white hover:bg-white/15"
        onClick={handleExit}
      >
        退出
      </button>
    </div>
  );
}