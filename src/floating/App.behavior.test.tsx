import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
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

const TODO_ITEM: Item = {
  id: 3,
  content: "整理文档",
  type: "task",
  status: "todo",
  focus_ms: 0,
  last_active_at: null,
  progress_note: "补充第 3 节",
  source: "manual",
  pending_ms: null,
  created_at: 0,
  updated_at: 0,
};

function mockData(active: Item[], inbox: Item[], todo: Item[] = []) {
  const inboxState = [...inbox];
  vi.mocked(invoke).mockImplementation(async (command: string, args) => {
    if (command === "item_get_active") return active;
    if (command === "item_get_inbox") return inboxState;
    if (command === "item_get_todo") return todo;
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
    expect(screen.getByRole("button", { name: "保存" })).toBeVisible();
    expect(root.className).toContain("expanded");
  });
});

describe("浮窗任务关键路径", () => {
  it("有进行中卡时折叠条滚动展示卡内容，展开后显示并行列表", async () => {
    mockData([ACTIVE_ITEM], [INBOX_ITEM]);
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    // 折叠态:一行展示进行中卡内容(滚动),不显示并行列表
    expect(await screen.findByText("整理窗口样式")).toBeVisible();
    expect(screen.queryByText("回邮件")).toBeNull();
    expect(root.className).toContain("folded");

    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });

    // 展开态:并行列表显示收件箱项 + 进行中卡备注 + 收件箱开始按钮
    expect(await screen.findByText("回邮件")).toBeVisible();
    expect(screen.getByText("接口写完")).toBeVisible();
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

  it("折叠条「+」进入新增面板(compose)", async () => {
    mockData([ACTIVE_ITEM], [INBOX_ITEM]);
    render(<FloatingApp />);
    // 等待刷新完成(折叠条进入进行中卡滚动态)后再点「+」,避免点到刷新前临时节点
    await screen.findByText("整理窗口样式");
    const addBtn = screen.getByRole("button", { name: "新增任务" });

    fireEvent.click(addBtn);

    // 进入 compose 输入面板,而非并行列表
    expect(await screen.findByPlaceholderText(/做什么/)).toBeVisible();
    expect(screen.queryByText("回邮件")).toBeNull();
  });

  it("折叠条内容区点击进入并行列表(list)", async () => {
    mockData([ACTIVE_ITEM], [INBOX_ITEM]);
    render(<FloatingApp />);
    await screen.findByText("整理窗口样式");
    const status = screen.getByRole("status");

    fireEvent.click(status);

    expect(await screen.findByText("回邮件")).toBeVisible();
    expect(screen.queryByPlaceholderText(/做什么/)).toBeNull();
  });

  it("无卡时空展开显示输入面板", async () => {
    mockData([], []);
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });

    expect(await screen.findByPlaceholderText(/做什么/)).toBeVisible();
  });

  it("开始 → item_create + item_start，进入 list 显示新卡(不折叠)", async () => {
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
    // 开始 = 捕获 + 直接计时:先落库再切换 active;进入 list 显示新卡,不折叠
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("item_start", { id: 100 });
      expect(root.className).toContain("expanded");
      expect(screen.getByText("写代码")).toBeVisible();
    });
  });

  it("保存 → item_create 进收件箱并收起(折叠回状态条)", async () => {
    mockData([], []);
    const invokeMock = vi.mocked(invoke);
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });
    const input = await screen.findByPlaceholderText(/做什么/);

    fireEvent.change(input, { target: { value: "写代码" } });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("item_create", { content: "写代码" });
    });
    // 保存 = 进收件箱 + 收起(回到折叠态状态条)
    await waitFor(() => {
      expect(root.className).toContain("folded");
    });
    expect(invokeMock).not.toHaveBeenCalledWith("item_start", expect.anything());
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
    await screen.findByText("任务1");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });

    expect(await screen.findByText("在推进的事有点多")).toBeVisible();
  });
});

describe("浮窗列表分区与动作", () => {
  it("列表按 进行中/待办/收件箱 分区,各卡带对应动作按钮", async () => {
    mockData([ACTIVE_ITEM], [INBOX_ITEM], [TODO_ITEM]);
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    await screen.findByText("整理窗口样式");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });

    // 进行中卡:暂停 + 完成
    expect(screen.getByRole("button", { name: "暂停 整理窗口样式" })).toBeVisible();
    expect(screen.getByRole("button", { name: "完成 整理窗口样式" })).toBeVisible();
    // 待办卡:开始 + 完成
    expect(screen.getByRole("button", { name: "完成 整理文档" })).toBeVisible();
    // 收件箱卡:开始 + 仅留档 + 删除
    expect(screen.getByRole("button", { name: "仅留档 回邮件" })).toBeVisible();
    expect(screen.getByRole("button", { name: "删除 回邮件" })).toBeVisible();
    // 待办 + 收件箱各一个「开始」;进行中卡没有「开始」
    expect(screen.getAllByRole("button", { name: "开始" })).toHaveLength(2);
  });

  it("完成/仅留档/删除/暂停 → item_complete/triage_archive/soft_delete/pause", async () => {
    mockData([ACTIVE_ITEM], [INBOX_ITEM], [TODO_ITEM]);
    const invokeMock = vi.mocked(invoke);
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    await screen.findByText("整理窗口样式");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });
    await screen.findByRole("button", { name: "完成 整理文档" });

    fireEvent.click(screen.getByRole("button", { name: "完成 整理文档" }));
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("item_complete", { id: 3 });
    });

    fireEvent.click(screen.getByRole("button", { name: "仅留档 回邮件" }));
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("item_triage_archive", { id: 2 });
    });

    fireEvent.click(screen.getByRole("button", { name: "删除 回邮件" }));
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("item_soft_delete", { id: 2 });
    });

    fireEvent.click(screen.getByRole("button", { name: "暂停 整理窗口样式" }));
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("item_pause", { id: 1, pendingMs: null });
    });
  });

  it("列表有卡时不显示空态文案", async () => {
    mockData([ACTIVE_ITEM], [INBOX_ITEM]);
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    await screen.findByText("整理窗口样式");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(document, { button: 0, clientX: 10, clientY: 10 });

    await screen.findByText("回邮件");
    expect(screen.queryByText(/暂无任务/)).toBeNull();
  });
});

describe("新增面板取消回落", () => {
  it("从折叠条「+」进 compose,Esc 取消 → 收起", async () => {
    mockData([ACTIVE_ITEM], [INBOX_ITEM]);
    render(<FloatingApp />);
    await screen.findByText("整理窗口样式");
    fireEvent.click(screen.getByRole("button", { name: "新增任务" }));
    await screen.findByPlaceholderText(/做什么/);

    fireEvent.keyDown(document, { key: "Escape" });

    const root = screen.getByTestId("floating-root");
    await waitFor(() => expect(root.className).toContain("folded"));
    expect(screen.queryByPlaceholderText(/做什么/)).toBeNull();
  });

  it("列表中快捷键唤起 compose,Esc 取消 → 回落列表", async () => {
    let captureHandler: Parameters<typeof listen>[1] | null = null;
    vi.mocked(listen).mockImplementation((event: string, cb: Parameters<typeof listen>[1]) => {
      if (event === "floating:capture") captureHandler = cb;
      return Promise.resolve(() => {});
    });
    mockData([ACTIVE_ITEM], [INBOX_ITEM]);
    render(<FloatingApp />);
    await screen.findByText("整理窗口样式");

    // 折叠条主体点击 → 进并行列表
    fireEvent.click(screen.getByRole("status"));
    await screen.findByText("回邮件");
    expect(screen.queryByPlaceholderText(/做什么/)).toBeNull();

    // 快捷键捕获意图 → 新增面板(从列表进)
    act(() => captureHandler?.({ event: "floating:capture", id: 0, payload: undefined }));
    await screen.findByPlaceholderText(/做什么/);

    // Esc 取消 → 回落列表,不收起
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.getByText("回邮件")).toBeVisible());
    expect(screen.queryByPlaceholderText(/做什么/)).toBeNull();
    expect(screen.getByTestId("floating-root").className).toContain("expanded");
  });
});
