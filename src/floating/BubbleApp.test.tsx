// V0.2.1 1.4: 空闲自动暂停 → 一键确认。轮询 item_get_idle,命中后以前端 pause(pending_ms)
// 挂待确认窗口(复用 ADR-0012 失真闭环),显示「已自动暂停·待确认」。
import { act, fireEvent, render, screen } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BubbleApp } from "./BubbleApp";
import type { Item } from "../lib/tauri-bridge";

const NOW = Date.UTC(2026, 7, 1); // 2026-08-01T00:00:00Z
const STALE_MS = 11 * 60 * 1000; // 空闲 11 分钟 > 10 分钟阈值

const STALE_ITEM: Item = {
  id: 7,
  content: "写代码",
  type: "task",
  status: "active",
  focus_ms: 0,
  last_active_at: NOW - STALE_MS,
  progress_note: null,
  source: "manual",
  pending_ms: null,
  created_at: 0,
  updated_at: 0,
};

function mockIdle(idle: boolean) {
  let current = idle;
  vi.mocked(invoke).mockImplementation(async (command: string, args) => {
    if (command === "item_check_dormant") return [];
    if (command === "item_get_idle") return current;
    if (command === "item_get_active") return [STALE_ITEM];
    if (command === "item_pause") {
      const { id, pendingMs } = args as { id: number; pendingMs: number };
      return {
        item: { ...STALE_ITEM, id, status: "todo" as const, pending_ms: pendingMs },
        pending_ms: pendingMs,
      };
    }
    if (command === "item_confirm_pending") return STALE_ITEM;
    return null;
  });
  return { setIdle: (v: boolean) => { current = v; } };
}

describe("BubbleApp(空闲自动暂停待确认)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    vi.mocked(invoke).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const flush = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  it("轮询到空闲超阈值 → 自动暂停并显示「已自动暂停」待确认", async () => {
    const { setIdle } = mockIdle(false);
    render(<BubbleApp />);

    // 初始 idle=false → 无气泡、不暂停
    await flush();
    await flush();
    await flush();
    expect(screen.queryByText(/已自动暂停/)).not.toBeInTheDocument();
    expect(invoke).not.toHaveBeenCalledWith("item_pause", expect.anything());

    // 进入空闲超阈值 → 下一轮询触发自动暂停(pending_ms 挂确认窗口)
    setIdle(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    await flush();
    await flush();
    await flush();

    expect(screen.getByText("写代码 已自动暂停，刚才是专注吗？")).toBeVisible();
    expect(invoke).toHaveBeenCalledWith("item_pause", { id: 7, pendingMs: expect.any(Number) });
    const pauseArgs = vi
      .mocked(invoke)
      .mock.calls.find(([c]) => c === "item_pause")?.[1] as { pendingMs: number };
    // 时钟随 advanceTimersByTimeAsync 前进 15s,待确认窗口 = 完整空闲时长(> 10 分钟阈值)
    expect(pauseArgs.pendingMs).toBeGreaterThan(10 * 60 * 1000);

    // [记入] → 复用 confirmPending(keep=true)
    fireEvent.click(screen.getByRole("button", { name: "记入" }));
    await flush();
    await flush();
    expect(invoke).toHaveBeenCalledWith("item_confirm_pending", { id: 7, keep: true });
  });

  it("[丢弃] 复用 confirmPending(keep=false)", async () => {
    mockIdle(true);
    render(<BubbleApp />);

    await flush();
    await flush();
    await flush();
    expect(screen.getByText("写代码 已自动暂停，刚才是专注吗？")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "丢弃" }));
    await flush();
    await flush();
    expect(invoke).toHaveBeenCalledWith("item_confirm_pending", { id: 7, keep: false });
  });

  it("无空闲时不自动暂停、不显示气泡", async () => {
    mockIdle(false);
    render(<BubbleApp />);

    await flush();
    await flush();
    await flush();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(invoke).not.toHaveBeenCalledWith("item_pause", expect.anything());
  });
});
