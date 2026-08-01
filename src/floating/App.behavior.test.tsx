import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
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
  progress_note: "接口写完",
  source: "manual",
  pending_ms: null,
  created_at: 0,
  updated_at: 0,
};

const INBOX_ITEM: Item = {
  id: 2,
  content: "回邮件",
  type: "task",
  status: "inbox",
  focus_ms: 0,
  last_active_at: null,
  progress_note: null,
  source: "manual",
  pending_ms: null,
  created_at: 0,
  updated_at: 0,
};

function mockData(active: Item[], inbox: Item[]) {
  const inboxState = [...inbox];
  vi.mocked(invoke).mockImplementation(async (command: string, args) => {
    if (command === "item_get_active") return active;
    if (command === "item_get_inbox") return inboxState;
    // 捕获成功 → inbox 追加新卡(贴近真实 create 后行为)
    if (
      command === "item_create" &&
      args &&
      typeof args === "object" &&
      !Array.isArray(args) &&
      typeof (args as { content?: unknown }).content === "string"
    ) {
      const content = (args as { content: string }).content;
      inboxState.push({
        id: inboxState.length + 100,
        content,
        type: "task",
        status: "inbox",
        focus_ms: 0,
        last_active_at: null,
        progress_note: null,
        source: "manual",
        pending_ms: null,
        created_at: 0,
        updated_at: 0,
      });
      return inboxState[inboxState.length - 1];
    }
    if (command === "set_floating_size") return null;
    return null;
  });
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

  it("拖动创建面板触发窗口失焦时保持展开", async () => {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const startDragging = getCurrentWindow().startDragging;

    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });
    await screen.findByPlaceholderText(/做什么/);

    fireEvent.mouseDown(root, { button: 0, clientX: 20, clientY: 20 });
    fireEvent.mouseMove(document, { clientX: 25, clientY: 20 });
    await waitFor(() => expect(startDragging).toHaveBeenCalledTimes(1));

    fireEvent.blur(window);

    expect(screen.getByPlaceholderText(/做什么/)).toBeVisible();
    expect(screen.getByRole("button", { name: "开始" })).toBeVisible();
    expect(screen.getByRole("button", { name: "取消" })).toBeVisible();
    expect(root.className).toContain("expanded");
  });
});

describe("浮窗任务关键路径", () => {
  it("有进行中卡时展开为并行列表,显示卡内容/备注/收件箱开始按钮", async () => {
    mockData([ACTIVE_ITEM], [INBOX_ITEM]);
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    // 折叠态:计数条显示概览,不显示任务内容
    await screen.findByText("收件箱 1");
    expect(screen.getByText("进行中 1")).toBeVisible();
    expect(screen.queryByText("整理窗口样式")).toBeNull();

    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });

    // 展开态:收件箱项显示"开始"按钮,进行中卡显示内容/备注
    expect(await screen.findByText("整理窗口样式")).toBeVisible();
    expect(screen.getByText("接口写完")).toBeVisible();
    expect(screen.getByText("回邮件")).toBeVisible();
    expect(screen.getByRole("button", { name: /开始/ })).toBeVisible();
    expect(screen.queryByPlaceholderText(/做什么/)).toBeNull();
  });

  it("收件箱项点开始 → 调 item_start", async () => {
    mockData([], [INBOX_ITEM]);
    const invokeMock = vi.mocked(invoke);
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    await screen.findByText("收件箱 1");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });

    // 展开态:收件箱项显示"开始"按钮
    await screen.findByText("回邮件");
    fireEvent.click(screen.getByRole("button", { name: /开始/ }));
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("item_start", { id: 2 });
    });
  });

  it("折叠条显示收件箱数与进行中数", async () => {
    mockData([ACTIVE_ITEM], [INBOX_ITEM]);
    render(<FloatingApp />);

    expect(await screen.findByText("收件箱 1")).toBeVisible();
    expect(screen.getByText("进行中 1")).toBeVisible();
  });

  it("无卡时空展开显示输入面板", async () => {
    mockData([], []);
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });

    expect(await screen.findByPlaceholderText(/做什么/)).toBeVisible();
  });

  it("捕获后调 item_create 并进入 list 显示新卡(不折叠)", async () => {
    mockData([], []);
    const invokeMock = vi.mocked(invoke);
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });
    const input = await screen.findByPlaceholderText(/做什么/);

    fireEvent.change(input, { target: { value: "写代码" } });
    fireEvent.click(screen.getByRole("button", { name: "开始" }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("item_create", { content: "写代码" });
    });
    // V0.2.1 QA 补全:捕获后进入 list 显示新卡,不折叠(消除"任务去哪了"困惑)
    await waitFor(() => {
      expect(root.className).toContain("expanded");
      expect(screen.getByText("写代码")).toBeVisible();
    });
  });

  it("空输入时开始按钮禁用", async () => {
    mockData([], []);
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });

    const startBtn = await screen.findByRole("button", { name: "开始" });
    expect(startBtn).toBeDisabled();
  });

  it("超过 5 个进行中显示 WIP 轻提示", async () => {
    const manyActive: Item[] = Array.from({ length: 6 }, (_, i) => ({
      ...ACTIVE_ITEM,
      id: i + 1,
      content: `任务${i + 1}`,
    }));
    mockData(manyActive, []);
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    await screen.findByText("进行中 6");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });

    expect(await screen.findByText("在推进的事有点多")).toBeVisible();
  });
});
