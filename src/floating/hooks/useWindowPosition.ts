import { useEffect } from "react";
import { getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";

const KEY = "floating-position";

type Pos = { x: number; y: number };

// 2026-06-20 macOS 菜单栏遮住 bug 修复:首次启动主动 setPosition
// 到 (100, 60) 避开 macOS 顶栏(~25px)。原版只恢复 saved 位置,
// 首次启动保留 tauri.conf.json 默认 (0, 0),被菜单栏遮住 ~25px,
// 用户报告"拖动出来一点东西,拖不大"。
const DEFAULT_X = 100;
const DEFAULT_Y = 60;

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
    } else {
      // 首次启动:主动 setPosition 到屏幕中上,避开菜单栏
      win
        .setPosition(new PhysicalPosition(DEFAULT_X, DEFAULT_Y))
        .catch(() => {});
    }
    const unlisten = win.onMoved(({ payload }) => {
      localStorage.setItem(KEY, JSON.stringify(payload));
    });
    return () => {
      unlisten.then((u) => u());
    };
  }, []);
}
