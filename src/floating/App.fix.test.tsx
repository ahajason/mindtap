// App.fix.test.tsx — V0.2.0.16 PATCH 行为 e2e (行为断言, 反模式 16 防御)
// 仅保留必要的行为测试; 静态 spec 检查与 V0.2.0.16 PATCH 自检并入 App.v0.2.0.16.test.tsx.

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";

import { FloatingApp } from "./App";

describe("V0.2.0.6 patch — Issue A: 右键不被折叠态根 div 抢占 (P0-9 复活防御)", () => {
  it("折叠态右键 mousedown+up 不触发展开 (行为断言: dragRef 被 e.button 守卫, 不创建)", async () => {
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.mouseDown(root, { button: 2, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(root, { clientX: 10, clientY: 10 });
    expect(document.querySelector("input[placeholder]")).toBeNull();
  });

  it("折叠态右键 mousedown+up 不调 startDragging IPC (右键不该启动 OS 拖窗)", async () => {
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.mouseDown(root, { button: 2, clientX: 10, clientY: 10 });
    fireEvent.mouseMove(document, { clientX: 30, clientY: 30 });
    fireEvent.mouseUp(document, { clientX: 30, clientY: 30 });
    expect(document.querySelector("input[placeholder]")).toBeNull();
  });

  it("折叠态右键 contextmenu 事件触发 Rust 原生 Menu IPC (V0.2.0.12: popup_menu 替代 HTML 渲染)", async () => {
    const invokeMock = vi.mocked(invoke);
    invokeMock.mockClear();
    render(<FloatingApp />);
    await screen.findByTestId("floating-root");
    fireEvent.contextMenu(document, { button: 2, clientX: 50, clientY: 60 });
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("show_floating_context_menu", undefined);
    });
    expect(screen.queryByRole("menu", { name: "浮窗右键菜单" })).toBeNull();
  });

  it("左键短按仍触发展开 (回归: e.button !== 0 守卫不影响左键 toggle 路径)", async () => {
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(root, { clientX: 10, clientY: 10 });
    await waitFor(() => {
      if (document.querySelector("input[placeholder]")) {
        return;
      }
      throw new Error("not yet");
    });
  });
});

describe("V0.2.0.15 E-2 fix — 折叠态 4px 阈值行为锁 (反模式 16 行为断言)", () => {
  it("折叠态 root mousedown 后 4px 阈值满足调 win.startDragging IPC", async () => {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const startDragging = getCurrentWindow().startDragging;
    (startDragging as unknown as { mockClear: () => void }).mockClear();

    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseMove(document, { clientX: 15, clientY: 10 });

    await waitFor(() => {
      expect(startDragging).toHaveBeenCalled();
    });
  });

  it("折叠态 root mousedown 后 4px 内移动不调 win.startDragging (阈值锁)", async () => {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const startDragging = getCurrentWindow().startDragging;
    (startDragging as unknown as { mockClear: () => void }).mockClear();

    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseMove(document, { clientX: 13, clientY: 10 });

    await new Promise((r) => setTimeout(r, 50));
    expect(startDragging).not.toHaveBeenCalled();
  });
});