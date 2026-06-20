import { useEffect } from "react";
import { getCurrentWindow, PhysicalPosition, availableMonitors } from "@tauri-apps/api/window";

const KEY = "floating-position";

// F3' 默认位置兜底:Tauri WebviewWindowBuilder 不指定 x/y 时,macOS 把 webview
// 放 (0, 0) 附近 — 菜单栏遮顶部 ~25px,用户报告"屏幕上不出现浮窗"。
// (100, 60) 跨平台安全:macOS 避菜单栏、Windows/Linux 不撞任何 chrome。
const DEFAULT_X = 100;
const DEFAULT_Y = 60;

// P1 clamp 屏外(借鉴 TaskIsland IslandPanelController.swift:472-483 + 528):
// 浮窗拖到屏幕外 / 副屏拔掉导致 saved 悬空 → 拽回默认,持久化默认位置。
// Tauri 没有「拖动中」事件,只在停止时触发 onMoved —— 退而求其次:停止时校验。
// Frame 尺寸来自 tauri.conf.json 折叠态 320×36;clamp 整个 frame 而非 origin,
// 否则浮窗部分出屏也算「屏内」,跟 TaskIsland clampedFrame 语义一致。
const FRAME_W = 320;
const FRAME_H = 36;
const MARGIN = 8;  // TaskIsland 也是 8px visibleFrame 内边距

type Pos = { x: number; y: number };
type Monitor = { position: { x: number; y: number }; size: { width: number; height: number } };

function isInsideAnyMonitor(pos: Pos, monitors: Monitor[]): boolean {
  return monitors.some(
    (m) =>
      pos.x >= m.position.x + MARGIN &&
      pos.x + FRAME_W <= m.position.x + m.size.width - MARGIN &&
      pos.y >= m.position.y + MARGIN &&
      pos.y + FRAME_H <= m.position.y + m.size.height - MARGIN
  );
}

export function useWindowPosition() {
  useEffect(() => {
    // 防御:getCurrentWindow 在 vite dev / 测试 jsdom 下抛错,吞掉避免 React
    // unmount 整个 App。生产 build 走 tauri:// URL,runtime 必然就绪,此分支
    // 不会触发。
    let win: ReturnType<typeof getCurrentWindow> | null = null
    try {
      win = getCurrentWindow()
    } catch {
      return
    }
    if (!win || typeof win.setPosition !== 'function' || typeof win.onMoved !== 'function') {
      return
    }

    const saved = localStorage.getItem(KEY);
    if (saved) {
      try {
        const pos: Pos = JSON.parse(saved);
        // 启动校验:saved 可能因多屏切换 / 屏幕配置变更而悬空
        availableMonitors()
          .then((monitors) => {
            if (isInsideAnyMonitor(pos, monitors)) {
              win!.setPosition(new PhysicalPosition(pos.x, pos.y));
            } else {
              // 屏外(saved 时的副屏拔了)→ 清掉失效坐标,走默认
              localStorage.removeItem(KEY);
              win!.setPosition(new PhysicalPosition(DEFAULT_X, DEFAULT_Y));
            }
          })
          .catch(() => {
            // availableMonitors 失败(jsdom / IPC 异常)→ 降级按 saved 恢复
            win!.setPosition(new PhysicalPosition(pos.x, pos.y));
          });
      } catch (e) {
        console.error(e);
        // 非法 JSON → 清掉,走默认
        localStorage.removeItem(KEY);
        win.setPosition(new PhysicalPosition(DEFAULT_X, DEFAULT_Y));
      }
    } else {
      // 无 saved → 主动挪到 (100, 60) 避 macOS 菜单栏
      win.setPosition(new PhysicalPosition(DEFAULT_X, DEFAULT_Y));
    }
    // 无论哪条路径都 register onMoved:用户拖动后校验屏内 + 持久化
    const unlisten = win.onMoved(async ({ payload }) => {
      try {
        const monitors = await availableMonitors();
        if (isInsideAnyMonitor(payload, monitors)) {
          localStorage.setItem(KEY, JSON.stringify(payload));
        } else {
          // 拖出屏外 → 拽回默认,持久化默认位置
          await win.setPosition(new PhysicalPosition(DEFAULT_X, DEFAULT_Y));
          localStorage.setItem(KEY, JSON.stringify({ x: DEFAULT_X, y: DEFAULT_Y }));
        }
      } catch {
        // availableMonitors 失败 → 降级持久化原 payload
        localStorage.setItem(KEY, JSON.stringify(payload));
      }
    });
    return () => {
      unlisten.then((u) => u());
    };
  }, []);
}
