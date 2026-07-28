import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { describe, expect, it, vi } from "vitest";

import { FloatingApp } from "./App";
import type { TimerSession } from "../lib/tauri-bridge";

function findResizeCall(
  calls: ReadonlyArray<ReadonlyArray<unknown>>,
  w: number,
  h: number,
): ReadonlyArray<unknown> | undefined {
  return calls.find(
    (args) =>
      args[0] === "set_floating_size" &&
      (args[1] as { w?: unknown; h?: unknown } | undefined)?.w === w &&
      (args[1] as { w?: unknown; h?: unknown } | undefined)?.h === h,
  );
}

describe("浮窗鼠标交互", () => {
  it("右键打开原生菜单，不展开浮窗或启动拖动", async () => {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const startDragging = getCurrentWindow().startDragging;
    const invokeMock = vi.mocked(invoke);

    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.mouseDown(root, { button: 2, clientX: 10, clientY: 10 });
    fireEvent.mouseMove(document, { clientX: 30, clientY: 30 });
    fireEvent.mouseUp(document, { button: 2, clientX: 30, clientY: 30 });
    fireEvent.contextMenu(document, { button: 2, clientX: 50, clientY: 60 });

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("show_floating_context_menu", undefined);
    });
    expect(startDragging).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText(/做什么/)).toBeNull();
    expect(screen.queryByRole("menu", { name: "浮窗右键菜单" })).toBeNull();
  });

  it("左键短按展开浮窗", async () => {
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });

    expect(await screen.findByPlaceholderText(/做什么/)).toBeVisible();
  });

  it("左键移动超过 4px 启动原生拖动且不展开", async () => {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const startDragging = getCurrentWindow().startDragging;

    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseMove(document, { clientX: 15, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 15, clientY: 10 });

    await waitFor(() => expect(startDragging).toHaveBeenCalledTimes(1));
    expect(screen.queryByPlaceholderText(/做什么/)).toBeNull();
  });

  it("展开态移动超过 4px 也启动原生拖动", async () => {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const startDragging = getCurrentWindow().startDragging;

    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });
    await screen.findByPlaceholderText(/做什么/);

    fireEvent.mouseDown(root, { button: 0, clientX: 50, clientY: 50 });
    fireEvent.mouseMove(document, { clientX: 55, clientY: 55 });

    await waitFor(() => expect(startDragging).toHaveBeenCalledTimes(1));
  });
});

describe("浮窗任务关键路径", () => {
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

  it("当前任务展开为紧凑控制面板，不显示创建输入", async () => {
    const invokeMock = vi.mocked(invoke);
    invokeMock.mockImplementation(async (command: string) => {
      if (command === "timer_session_get_active") return ACTIVE_SESSION;
      if (command === "set_floating_size") return null;
      return null;
    });

    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    await screen.findByText("整理窗口样式");

    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });

    expect(await screen.findByRole("button", { name: "暂停" })).toBeVisible();
    expect(screen.getByRole("button", { name: "完成" })).toBeVisible();
    expect(screen.queryByPlaceholderText(/做什么/)).toBeNull();
    expect(screen.queryByRole("button", { name: "开始" })).toBeNull();
    await waitFor(() => {
      expect(findResizeCall(invokeMock.mock.calls, 360, 96)).toBeDefined();
    });
  });

  it("控制面板按 Esc 时折叠并保留当前任务", async () => {
    const invokeMock = vi.mocked(invoke);
    invokeMock.mockImplementation(async (command: string) => {
      if (command === "timer_session_get_active") return ACTIVE_SESSION;
      if (command === "set_floating_size") return null;
      return null;
    });

    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    await screen.findByText("整理窗口样式");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });
    await screen.findByRole("button", { name: "暂停" });

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => expect(root.className).toContain("folded"));
    expect(screen.getByText("整理窗口样式")).toBeVisible();
  });

  it("控制面板失焦时折叠并保留当前任务", async () => {
    const invokeMock = vi.mocked(invoke);
    invokeMock.mockImplementation(async (command: string) => {
      if (command === "timer_session_get_active") return ACTIVE_SESSION;
      if (command === "set_floating_size") return null;
      return null;
    });

    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    await screen.findByText("整理窗口样式");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });
    await screen.findByRole("button", { name: "暂停" });

    fireEvent.blur(window);

    await waitFor(() => expect(root.className).toContain("folded"));
    expect(screen.getByText("整理窗口样式")).toBeVisible();
  });

  it("暂停后保持控制面板并切换为恢复", async () => {
    const invokeMock = vi.mocked(invoke);
    invokeMock.mockImplementation(async (command: string) => {
      if (command === "timer_session_get_active") return ACTIVE_SESSION;
      if (command === "timer_session_pause") return { ...ACTIVE_SESSION, status: "paused" };
      if (command === "set_floating_size") return null;
      return null;
    });

    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    await screen.findByText("整理窗口样式");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });

    fireEvent.click(await screen.findByRole("button", { name: "暂停" }));

    expect(await screen.findByRole("button", { name: "恢复" })).toBeVisible();
    expect(screen.getByRole("button", { name: "完成" })).toBeVisible();
    expect(root.className).toContain("expanded");
  });

  it("从空闲展开开始任务，活动折叠后可展开并完成", async () => {
    const invokeMock = vi.mocked(invoke);
    let activeSession: TimerSession | null = null;

    invokeMock.mockImplementation(async (command: string, args?: unknown) => {
      if (command === "set_floating_size") return null;
      if (command === "timer_session_create") {
        const now = Date.now();
        activeSession = {
          id: 1,
          task_title: ((args ?? {}) as { taskTitle?: string }).taskTitle ?? "",
          status: "active",
          started_at: now,
          paused_at: null,
          completed_at: null,
          focus_ms: 0,
          created_at: now,
          updated_at: now,
        };
        return activeSession;
      }
      if (command === "timer_session_get_active") return activeSession;
      if (command === "timer_session_complete") {
        activeSession = activeSession && { ...activeSession, status: "completed" };
        return activeSession;
      }
      return null;
    });

    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");

    await waitFor(() => {
      expect(findResizeCall(invokeMock.mock.calls, 360, 36)).toBeDefined();
    });

    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });
    const input = await screen.findByPlaceholderText(/做什么/);

    await waitFor(() => {
      expect(findResizeCall(invokeMock.mock.calls, 360, 280)).toBeDefined();
    });

    fireEvent.change(input, { target: { value: "关键路径任务" } });
    fireEvent.click(screen.getByRole("button", { name: "开始" }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith(
        "timer_session_create",
        expect.objectContaining({ taskTitle: "关键路径任务" }),
      );
      expect(root.className).toContain("folded");
    });
    expect(screen.queryByRole("button", { name: "暂停" })).toBeNull();

    fireEvent.mouseDown(root, { button: 0, clientX: 50, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 50, clientY: 10 });
    fireEvent.click(await screen.findByRole("button", { name: "完成" }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith(
        "timer_session_complete",
        expect.objectContaining({ id: 1 }),
      );
      expect(root.className).toContain("folded");
    });
  });
});
