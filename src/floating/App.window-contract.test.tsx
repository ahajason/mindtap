import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { FloatingApp } from "./App";
import type { Item } from "../lib/tauri-bridge";

const ACTIVE_ITEM: Item = {
  id: 1,
  content: "整理窗口样式",
  type: "task",
  status: "active",
  focus_ms: 0,
  last_active_at: 0,
  progress_note: null,
  source: "manual",
  pending_ms: null,
  created_at: 0,
  updated_at: 0,
};

describe("浮窗生产契约", () => {
  it("原生窗口以 360×36 透明、无阴影、不抢焦模式启动，并注册物理 resize 命令", () => {
    const config = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf8"));
    const floating = config.app.windows.find((window: { label: string }) => window.label === "floating");
    const rust = readFileSync("src-tauri/src/commands/floating_cmd.rs", "utf8");
    const lib = readFileSync("src-tauri/src/lib.rs", "utf8");

    expect(floating).toMatchObject({
      width: 360,
      height: 36,
      resizable: false,
      transparent: true,
      backgroundColor: "#00000000",
      decorations: false,
      shadow: false,
      focus: false,
    });
    expect(rust).toMatch(/pub\s+fn\s+set_floating_size\s*\([\s\S]*?w:\s*f64[\s\S]*?h:\s*f64/);
    expect(lib).toContain("commands::floating_cmd::set_floating_size");
  });

  it("活动折叠态单行滚动展示进行中卡，展开后才显示并行列表", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockImplementation(async (command: string) => {
      if (command === "item_get_active") return [ACTIVE_ITEM];
      if (command === "item_get_todo") return [];
      return null;
    });

    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    // 折叠态:单行滚动展示进行中卡内容,不显示并行列表
    await screen.findByText("整理窗口样式");
    expect(screen.queryByText("回邮件")).toBeNull();

    expect(root.className).toContain("folded");
    expect(screen.queryByRole("button", { name: /开始/ })).toBeNull();

    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });

    await waitFor(() => expect(root.className).toContain("expanded"));
    // 展开后并行列表出现进行中卡(active 卡非按钮,显示内容与时长;折叠条与列表同时显示 → getAllByText)
    expect(screen.getAllByText("整理窗口样式").length).toBeGreaterThan(0);
  });

  it("呈现状态声明折叠、创建和列表三项固定窗口几何", () => {
    const app = readFileSync("src/floating/App.tsx", "utf8");

    expect(app).toContain('type FloatingPresentation = "folded" | "compose" | "list"');
    expect(app).toMatch(/folded:\s*\{\s*w:\s*360,\s*h:\s*36\s*\}/);
    expect(app).toMatch(/compose:\s*\{\s*w:\s*360,\s*h:\s*165\s*\}/);
    expect(app).toMatch(/list:\s*\{\s*w:\s*360,\s*h:\s*280\s*\}/);
  });

  it("折叠与展开复用固定几何的状态条，展开内容不改变状态条间距", () => {
    const app = readFileSync("src/floating/App.tsx", "utf8");
    const foldedBar = readFileSync("src/floating/components/FoldedBar.tsx", "utf8");
    const css = readFileSync("src/floating/styles/floating.css", "utf8");

    expect(app).toContain('className="floating-body"');
    expect(foldedBar).toContain('className="floating-status-bar"');
    expect(foldedBar).not.toContain("max-w-[220px]");
    expect(css).toMatch(/\.floating-status-bar\s*\{[\s\S]*?height:\s*36px[\s\S]*?padding:\s*0\s+12px/);
    expect(css).toMatch(/\.floating-body\s*\{[\s\S]*?padding:\s*10px\s+12px/);
    expect(css).not.toMatch(/\.floating-root\.expanded\s+\.floating-content\s*\{[\s\S]*?padding:/);
  });

  it("浮窗 CSS fallback 保持单一材质 owner、L2 模糊与阴影，且不绘制白色实体轮廓", () => {
    const app = readFileSync("src/floating/App.tsx", "utf8");
    const html = readFileSync("floating.html", "utf8");
    const css = readFileSync("src/floating/styles/floating.css", "utf8");
    const theme = readFileSync("src/styles/theme.css", "utf8");

    expect(app).not.toContain("PANEL_STYLE");
    expect(app).not.toContain("backdropFilter:");
    expect(html).toContain("<body>");
    expect(theme).toMatch(/--glass-fill-2:\s*28%/);
    expect(theme).toMatch(/--glass-blur-2:\s*24px/);
    expect(theme).toMatch(/--glass-shadow-2:\s*0\.10/);
    expect(css).toMatch(/\.floating-root::before\s*\{[\s\S]*?backdrop-filter:\s*blur\(var\(--glass-blur-2\)\)\s*saturate\(120%\)/);
    expect(css).toMatch(/\.floating-root::before\s*\{[\s\S]*?box-shadow:[\s\S]*?0\s+8px\s+32px[\s\S]*?var\(--glass-shadow-2\)/);
    expect(css).not.toMatch(/\.floating-root::before\s*\{[\s\S]*?inset\s+0\s+0\s+0\s+1px/);
    expect(css).not.toMatch(/\.floating-root::before\s*\{[\s\S]*?inset\s+0\s+1px\s+0/);
    expect(css).not.toMatch(/\.folded-bar-inner/);
  });

  it("输入提示使用可读的次级文字色，保存操作保持同一色阶", () => {
    const inputBar = readFileSync("src/floating/components/InputBar.tsx", "utf8");
    const expandedPanel = readFileSync("src/floating/components/ExpandedPanel.tsx", "utf8");

    expect(inputBar).toContain("placeholder:text-text-2");
    expect(inputBar).not.toContain("placeholder:text-text-3");
    expect(expandedPanel).toMatch(/>\s*保存\s*<\/button>/);
    expect(expandedPanel).toContain("text-text-2");
  });
});
