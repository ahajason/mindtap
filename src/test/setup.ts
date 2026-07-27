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
    outerSize: vi.fn(() => Promise.resolve({ width: 360, height: 36 })),
    show: vi.fn(() => Promise.resolve()),
    hide: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
    isVisible: vi.fn(() => Promise.resolve(true)),
    onMoved: vi.fn(() => Promise.resolve(() => {})),
  },
}));

vi.mock("@tauri-apps/api/window", () => ({
  availableMonitors: vi.fn(() =>
    Promise.resolve([
      {
        position: { x: 0, y: 0 },
        size: { width: 1920, height: 1080 },
      },
    ]),
  ),
  getCurrentWindow: vi.fn(() => mocks.mockWindow),
  LogicalSize: vi.fn(),
  PhysicalPosition: vi.fn(),
}));

// 每个测试恢复默认 invoke 行为，避免单测自定义 implementation 泄漏到后续用例。
afterEach(() => {
  vi.mocked(invoke).mockReset();
  vi.mocked(invoke).mockResolvedValue(null);
  for (const fn of Object.values(mocks.mockWindow)) {
    (fn as ReturnType<typeof vi.fn>).mockClear();
  }
});