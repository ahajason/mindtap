import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

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