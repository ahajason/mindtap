import { act, renderHook } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useFocusTicker } from "./useFocusTicker";
import type { Item } from "../../lib/tauri-bridge";

const ACTIVE: Item = {
  id: 1,
  content: "写代码",
  type: "task",
  status: "active",
  focus_ms: 5000,
  last_active_at: 8000, // 固定值:与 fake now=10000 对齐 → 已流逝 2000
  progress_note: null,
  source: "manual",
  pending_ms: null,
  created_at: 0,
  updated_at: 0,
};

describe("useFocusTicker(后端主导)", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("active 卡实时推导时长 = focus_ms + (now - last_active_at),不写库", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(10000); // now = 10000, last_active_at = 8000, focus_ms = 5000

    const { result } = renderHook(() => useFocusTicker(ACTIVE, 1000));
    expect(result.current).toBe(5000 + 2000); // 7000

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current).toBe(5000 + 5000); // 10000

    // 关键:不调 updateFocusMs 写库
    expect(invoke).not.toHaveBeenCalledWith(
      "timer_session_update_focus_ms",
      expect.anything(),
    );
    expect(invoke).not.toHaveBeenCalledWith("item_pause", expect.anything());
  });

  it("非 active 卡不滚动,返回 focus_ms", () => {
    const todo: Item = { ...ACTIVE, status: "todo", last_active_at: null };
    const { result } = renderHook(() => useFocusTicker(todo, 1000));
    expect(result.current).toBe(5000);
  });

  it("无卡时返回 0", () => {
    const { result } = renderHook(() => useFocusTicker(null, 1000));
    expect(result.current).toBe(0);
  });

  it("active 卡但无 last_active_at 时,不滚动只返回 focus_ms", () => {
    const noLa: Item = { ...ACTIVE, last_active_at: null };
    const { result } = renderHook(() => useFocusTicker(noLa, 1000));
    expect(result.current).toBe(5000);
  });
});
