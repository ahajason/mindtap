import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FloatingApp } from "./App";

describe("FloatingApp 折叠态根 div 挂 .floating-root 类（V0.2 修 V1.5 漏挂 bug）", () => {
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

  it("折叠态根 div 自实现 onMouseDown handler（不依赖 data-tauri-drag-region attribute, 沿用 V1.0 FloatShell 模式）", async () => {
    render(<FloatingApp />);
    const foldedRoot = await screen.findByTestId("floating-root-folded");
    expect(foldedRoot.getAttribute("data-tauri-drag-region")).toBeNull();
  });
});

describe("FloatingApp 折叠态 drag vs click 冲突（沿用 V1.0 FloatShell.test.tsx 4px threshold 模式）", () => {
  it("折叠态短按触发展开（onMouseDown + onMouseUp 无位移）", async () => {
    render(<FloatingApp />);
    const foldedRoot = await screen.findByTestId("floating-root-folded");
    fireEvent.mouseDown(foldedRoot, { clientX: 10, clientY: 10 });
    fireEvent.mouseUp(foldedRoot, { clientX: 10, clientY: 10 });
    expect(document.querySelector(".floating-root.expanded")).toBeTruthy();
  });

  it("折叠态拖动超 4px 不触发展开（drag-started 状态保留）", async () => {
    render(<FloatingApp />);
    const foldedRoot = await screen.findByTestId("floating-root-folded");
    fireEvent.mouseDown(foldedRoot, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(foldedRoot, { clientX: 20, clientY: 15 });
    fireEvent.mouseUp(foldedRoot, { clientX: 20, clientY: 15 });
    expect(document.querySelector(".floating-root.expanded")).toBeNull();
  });
});