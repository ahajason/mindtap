import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FloatingApp } from "./App";

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    setSize: vi.fn().mockResolvedValue(undefined),
    setPosition: vi.fn().mockResolvedValue(undefined),
    outerPosition: vi.fn().mockResolvedValue({ x: 0, y: 0 }),
    outerSize: vi.fn().mockResolvedValue({ width: 320, height: 36 }),
  }),
  LogicalSize: class {},
  PhysicalPosition: class {},
}));

vi.mock("../../lib/tauri-bridge", () => ({
  api: {
    timerSession: {
      getActive: vi.fn().mockResolvedValue(null),
      getById: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      updateFocusMs: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn().mockResolvedValue({}),
      resume: vi.fn().mockResolvedValue({}),
      complete: vi.fn().mockResolvedValue({}),
    },
    app: {
      exit: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

describe("FloatingApp 根 div 挂 .floating-root 类（V0.2 修 V1.5 漏挂 bug）", () => {
  it("折叠态根 div className 含 'floating-root folded'", async () => {
    render(<FloatingApp />);
    const foldedRoot = await screen.findByTestId("floating-root-folded");
    expect(foldedRoot.className).toContain("floating-root");
    expect(foldedRoot.className).toContain("folded");
  });

  it("浮窗不含 'cursor: grab' (V0.1.6 retro lesson 5 反 HIG)", async () => {
    render(<FloatingApp />);
    const foldedRoot = await screen.findByTestId("floating-root-folded");
    expect(foldedRoot.className).not.toContain("cursor-grab");
  });

  it("折叠态根 div data-tauri-drag-region=\"deep\" (V0.1.6 sidebar 模式, Tauri 自动拖动)", async () => {
    render(<FloatingApp />);
    const foldedRoot = await screen.findByTestId("floating-root-folded");
    expect(foldedRoot.getAttribute("data-tauri-drag-region")).toBe("deep");
  });
});