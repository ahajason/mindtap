import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

// V0.2.0.15 PATCH: getCurrentWindow 返回稳定 mockWindow (旧版每次调用返回新对象,
// 测试无法跨调用验证同一 method 是否被调 — V0.2.0.15 E-2 fix 测试需要 stable 引用).
const mocks = vi.hoisted(() => ({
  mockWindow: {
    setSize: vi.fn(() => Promise.resolve()),
    setPosition: vi.fn(() => Promise.resolve()),
    setFocusable: vi.fn(() => Promise.resolve()),
    startDragging: vi.fn(() => Promise.resolve()),
    outerPosition: vi.fn(() => Promise.resolve({ x: 0, y: 0 })),
    outerSize: vi.fn(() => Promise.resolve({ width: 320, height: 36 })),
    show: vi.fn(() => Promise.resolve()),
    hide: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
    isVisible: vi.fn(() => Promise.resolve(true)),
    onMoved: vi.fn(() => Promise.resolve(() => {})),
  },
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(() => mocks.mockWindow),
  LogicalSize: vi.fn(),
  PhysicalPosition: vi.fn(),
}));

// V0.2.0.16 PATCH: afterEach 统一重置 invoke + mockWindow 各 method 的 call history,
// 防止前一个 test 设的 mockImplementation 在下一个 test 仍然生效 (反模式 15 防御: test 隔离).
//   - vi.mocked(invoke).mockReset() 重置回 setup.ts 默认实现 Promise.resolve(null)
//     timer_session_get_active 永远返回 null (除非本 test 显式 mockImplementation)
//   - mockWindow 各 vi.fn method mockClear 只清 call history, 保留默认 Promise.resolve 实现
afterEach(() => {
  vi.mocked(invoke).mockReset();
  for (const fn of Object.values(mocks.mockWindow)) {
    (fn as ReturnType<typeof vi.fn>).mockClear();
  }
});