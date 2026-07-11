import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FloatingApp } from "./App";

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