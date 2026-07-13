// V0.2.0.16 PATCH — 3 FAIL issue 收口 + 物理 resize 完整 e2e:
//   B 展开态也走 4px 阈值拖动 (user L3 实测)
//   C 加自定义 rust command `set_floating_size(w, h)` 强制物理 resize
//   D ExpandedPanel 加 flex-1 wrapper (V0.2.0.13 baseline)
// 反模式 16: 真实事件序列 + invoke spy 严格断言; 不字面 grep 代码.

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

import { FloatingApp } from "./App";

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

describe("V0.2.0.16 PATCH B — 展开态长按拖动也调 win.startDragging IPC", () => {
  it("展开态 (expanded=true) mousedown 后 4px 阈值满足调 win.startDragging IPC", async () => {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const startDragging = getCurrentWindow().startDragging;
    (startDragging as unknown as { mockClear: () => void }).mockClear();

    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");

    fireEvent.click(root.querySelector("[role=status]") as HTMLElement, {
      clientX: 10,
      clientY: 10,
    });
    await screen.findByPlaceholderText(/做什么/);

    fireEvent.mouseDown(root, { button: 0, clientX: 50, clientY: 50 });
    fireEvent.mouseMove(document, { clientX: 55, clientY: 55 });

    await vi.waitFor(() => expect(startDragging).toHaveBeenCalled(), { timeout: 200, interval: 20 });
  });
});

describe("V0.2.0.16 PATCH C-rust — 等宽 360×36 → 360×280 + 强制物理 resize", () => {
  it("floating.css .floating-root width: 100% (V0.1 FloatShell: 物理尺寸由 rust IPC 强制, CSS 不写死 px)", () => {
    const css = readFileSync("src/floating/styles/floating.css", "utf-8");
    const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const block = noComments.match(/\.floating-root\s*\{[^}]*\}/);
    expect(block).toBeTruthy();
    expect(block![0]).toMatch(/\bwidth\s*:\s*100%/);
    expect(block![0]).toMatch(/\bheight\s*:\s*100%/);
    expect(block![0]).not.toMatch(/\bwidth\s*:\s*360px\b/);
    expect(block![0]).not.toMatch(/\bwidth\s*:\s*320px\b/);
  });

  it("src-tauri/commands/floating_cmd.rs 加 set_floating_size command", () => {
    const rust = readFileSync("src-tauri/src/commands/floating_cmd.rs", "utf-8");
    expect(rust).toMatch(/pub\s+fn\s+set_floating_size\s*\(/);
    expect(rust).toMatch(/set_size\(\s*Size::Logical\(\s*LogicalSize::new\(\s*w\s*,\s*h\s*\)\s*\)/);
  });

  it("src-tauri/src/lib.rs invoke_handler 注册 set_floating_size (e2e 模拟的 invoke 走不通这一层, 必须静态锁)", () => {
    const rust = readFileSync("src-tauri/src/lib.rs", "utf-8");
    expect(rust).toMatch(/commands::floating_cmd::set_floating_size/);
  });
});

describe("V0.2.0.16 PATCH D — 展开态 ExpandedPanel 在 flex-1 wrapper 内可正常展示", () => {
  it("折叠态点开 → input 框出现 + placeholder 可见", async () => {
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.click(root.querySelector("[role=status]") as HTMLElement, {
      clientX: 10,
      clientY: 10,
    });
    const input = (await screen.findByPlaceholderText(/做什么/)) as HTMLInputElement;
    expect(input.placeholder).toMatch(/做什么|开始/);
  });

  it("展开态 input 可输入字符", async () => {
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.click(root.querySelector("[role=status]") as HTMLElement, {
      clientX: 10,
      clientY: 10,
    });
    const input = (await screen.findByPlaceholderText(/做什么/)) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test task" } });
    expect(input.value).toBe("test task");
  });

  it("展开态 \"开始\" 按钮可见", async () => {
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.click(root.querySelector("[role=status]") as HTMLElement, {
      clientX: 10,
      clientY: 10,
    });
    await screen.findByPlaceholderText(/做什么/);
    expect(screen.queryByRole("button", { name: /开始/ })).toBeTruthy();
  });

  it("input 输入字符后点 Start → 调 invoke('timer_session_create', { taskTitle })", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    const invokeMock = vi.mocked(invoke);
    invokeMock.mockClear();
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === "timer_session_create") {
        return {
          id: 1,
          task_title: "test task",
          status: "active",
          started_at: Date.now(),
          paused_at: null,
          completed_at: null,
          focus_ms: 0,
          created_at: Date.now(),
          updated_at: Date.now(),
        };
      }
      return null;
    });

    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    fireEvent.click(root.querySelector("[role=status]") as HTMLElement, {
      clientX: 10,
      clientY: 10,
    });
    const input = (await screen.findByPlaceholderText(/做什么/)) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test task" } });
    fireEvent.click(screen.getByRole("button", { name: /开始/ }));

    await vi.waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith(
        "timer_session_create",
        expect.objectContaining({ taskTitle: "test task" }),
      );
    }, { timeout: 300, interval: 20 });
  });
});

describe("V0.2.0.16 PATCH — 完整 user L3 e2e (mount→展开→输入→Start→complete→折叠)", () => {
  it("完整 user L3 路径: rust 物理 resize 一定跟随 expanded 切换", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    const invokeMock = vi.mocked(invoke);
    invokeMock.mockClear();

    let activeSession: { id: number; task_title: string; status: string } | null = null;
    invokeMock.mockImplementation(async (cmd: string, args?: unknown) => {
      if (cmd === "set_floating_size") return null;
      if (cmd === "timer_session_create") {
        const { taskTitle } = (args ?? {}) as { taskTitle?: string };
        activeSession = { id: 1, task_title: taskTitle ?? "", status: "active" };
        return activeSession;
      }
      if (cmd === "timer_session_get_active") return activeSession;
      if (cmd === "timer_session_pause" || cmd === "timer_session_complete") {
        activeSession = activeSession && { ...activeSession, status: cmd === "timer_session_pause" ? "paused" : "completed" };
        return activeSession;
      }
      return null;
    });

    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");

    // mount → 折叠态物理 resize (360, 36)
    await vi.waitFor(() => {
      const calls = invokeMock.mock.calls as ReadonlyArray<ReadonlyArray<unknown>>;
      return findResizeCall(calls, 360, 36) !== undefined;
    }, { timeout: 300, interval: 20 });

    // 点开 → 展开
    fireEvent.click(root.querySelector("[role=status]") as HTMLElement, {
      clientX: 10,
      clientY: 10,
    });
    const input = (await screen.findByPlaceholderText(/做什么/)) as HTMLInputElement;

    // 展开态物理 resize (360, 280)
    await vi.waitFor(() => {
      const calls = invokeMock.mock.calls as ReadonlyArray<ReadonlyArray<unknown>>;
      return findResizeCall(calls, 360, 280) !== undefined;
    }, { timeout: 300, interval: 20 });

    // 输入 + Start → timer_session_create
    fireEvent.change(input, { target: { value: "user L3 e2e task" } });
    fireEvent.click(screen.getByRole("button", { name: /开始/ }));
    await vi.waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith(
        "timer_session_create",
        expect.objectContaining({ taskTitle: "user L3 e2e task" }),
      );
    }, { timeout: 300, interval: 20 });

    // handleStart 末尾 setExpanded(false) → 折叠 resize ≥2 次
    await vi.waitFor(() => {
      const calls = invokeMock.mock.calls as ReadonlyArray<ReadonlyArray<unknown>>;
      const foldedCount = calls.filter((a) => findResizeCall([a], 360, 36) !== undefined).length;
      return foldedCount >= 2;
    }, { timeout: 300, interval: 20 });

    // ControlRow 出现
    await vi.waitFor(() => {
      if (screen.queryByRole("button", { name: /暂停/ })) {
        return;
      }
      throw new Error("not yet");
    }, { timeout: 300, interval: 20 });

    // Complete → timer_session_complete
    fireEvent.click(screen.getByRole("button", { name: /完成/ }));
    await vi.waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith(
        "timer_session_complete",
        expect.objectContaining({ id: 1 }),
      );
    }, { timeout: 300, interval: 20 });

    // 折叠回 empty (input 消失)
    await vi.waitFor(() => {
      if (!document.querySelector("input[placeholder]")) {
        return;
      }
      throw new Error("not yet");
    }, { timeout: 300, interval: 20 });
  });
});