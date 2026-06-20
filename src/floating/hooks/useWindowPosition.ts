import { useEffect } from "react";
import { getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";

const KEY = "floating-position";

type Pos = { x: number; y: number };

export function useWindowPosition() {
  useEffect(() => {
    const win = getCurrentWindow();
    const saved = localStorage.getItem(KEY);
    if (saved) {
      try {
        const pos: Pos = JSON.parse(saved);
        win.setPosition(new PhysicalPosition(pos.x, pos.y));
      } catch (e) {
        console.error(e);
      }
    }
    const unlisten = win.onMoved(({ payload }) => {
      localStorage.setItem(KEY, JSON.stringify(payload));
    });
    return () => {
      unlisten.then((u) => u());
    };
  }, []);
}
