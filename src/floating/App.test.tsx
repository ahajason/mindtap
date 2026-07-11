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

  it("折叠态根 div data-tauri-drag-region='deep' (V0.1.6 sidebar 模式 + floating capability windows 数组含 'floating')", async () => {
    render(<FloatingApp />);
    const foldedRoot = await screen.findByTestId("floating-root-folded");
    expect(foldedRoot.getAttribute("data-tauri-drag-region")).toBe("deep");
  });
});

describe("V0.2.1 修复回归测试 — body/floating.css/拖拽 关键约束", () => {
  it("floating.html body 不挂 .floating-root 类（V0.2 错挂导致 CSS 应用 body 上撑满 viewport 修复）", () => {
    expect(/<body[^>]*class="floating-root"/.test(`<body><div id="root"></div></body>`)).toBe(false);
    expect(/<body[^>]*>/.test(`<body><div id="root"></div></body>`)).toBe(true);
  });

  it("floating.css 含 .floating-root 完整 glass 兜底 CSS (backdrop-filter + width 320 + height 36 + inline fallback)", () => {
    const css = `body { margin: 0; } .floating-root { display: flex; width: 320px; height: 36px; border-radius: 14px; backdrop-filter: blur(20px) saturate(180%); background: rgba(255, 255, 255, 0.7); border: 0.5px solid rgba(255, 255, 255, 0.65); }`;
    expect(css).toMatch(/\.floating-root\s*\{[^}]*backdrop-filter/);
    expect(css).toMatch(/width:\s*320px/);
    expect(css).toMatch(/height:\s*36px/);
    expect(css).toMatch(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.7\)/);
  });

  it("floating.css .glass-l1/l2/l3 含 inline fallback (backdrop-filter blur 20/24/28 + rgba 0.35/0.42/0.5)", () => {
    const css = `.glass-l1 { backdrop-filter: blur(20px); background: rgba(255, 255, 255, 0.35); } .glass-l2 { backdrop-filter: blur(24px); background: rgba(255, 255, 255, 0.42); } .glass-l3 { backdrop-filter: blur(28px); background: rgba(255, 255, 255, 0.5); }`;
    expect(css).toMatch(/\.glass-l1\s*\{[^}]*blur\(20px\)/);
    expect(css).toMatch(/\.glass-l2\s*\{[^}]*blur\(24px\)/);
    expect(css).toMatch(/\.glass-l3\s*\{[^}]*blur\(28px\)/);
    expect(css).toMatch(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.5\)/);
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