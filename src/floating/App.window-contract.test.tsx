import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { FloatingApp } from "./App";
import type { TimerSession } from "../lib/tauri-bridge";

const ACTIVE_SESSION: TimerSession = {
  id: 1,
  task_title: "整理窗口样式",
  status: "active",
  started_at: 0,
  paused_at: null,
  completed_at: null,
  focus_ms: 0,
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

  it("活动折叠态只显示一行，展开后才显示控制项", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    vi.mocked(invoke).mockImplementation(async (command: string) => {
      if (command === "timer_session_get_active") return ACTIVE_SESSION;
      return null;
    });

    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    await screen.findByText("整理窗口样式");

    expect(root.className).toContain("folded");
    expect(screen.queryByRole("button", { name: "暂停" })).toBeNull();
    expect(screen.queryByRole("button", { name: "完成" })).toBeNull();

    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });

    await waitFor(() => expect(root.className).toContain("expanded"));
    expect(screen.getByRole("button", { name: "暂停" })).toBeVisible();
    expect(screen.getByRole("button", { name: "完成" })).toBeVisible();
  });

  it("玻璃材质只有 CSS 一个 owner，并使用共享 G3 token", () => {
    const app = readFileSync("src/floating/App.tsx", "utf8");
    const css = readFileSync("src/floating/styles/floating.css", "utf8");
    const theme = readFileSync("src/styles/theme.css", "utf8");

    expect(app).not.toContain("PANEL_STYLE");
    expect(app).not.toContain("backdropFilter:");
    expect(theme).toMatch(/--glass-fill-1:\s*22%/);
    expect(theme).toMatch(/--glass-blur-1:\s*20px/);
    expect(theme).toMatch(/--glass-shadow-1:\s*0\.08/);
    expect(theme).toMatch(/--glass-fill-3:\s*36%/);
    expect(theme).toMatch(/--glass-blur-3:\s*28px/);
    expect(css).toMatch(/\.floating-root::before\s*\{[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*var\(--glass-fill-1\)\)/);
    expect(css).toMatch(/\.floating-root::before\s*\{[\s\S]*?backdrop-filter:\s*blur\(var\(--glass-blur-1\)\)\s*saturate\(120%\)/);
    expect(css).toMatch(/\.glass-l1\s*\{[\s\S]*?var\(--glass-fill-1\)/);
    expect(css).toMatch(/\.glass-l2\s*\{[\s\S]*?var\(--glass-fill-2\)/);
    expect(css).toMatch(/\.glass-l3\s*\{[\s\S]*?var\(--glass-fill-3\)/);
    expect(css).not.toMatch(/\.folded-bar-inner/);
  });
});
