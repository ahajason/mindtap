import { act, renderHook } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDormantCheck } from "./useDormantCheck";
import type { DormantPayload } from "../../lib/tauri-bridge";

const PAYLOAD: DormantPayload = {
  id: 1,
  content: "写代码",
  pending_ms: 7200000,
};

describe("useDormantCheck(运行期失真检测)", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("轮询 checkDormant,有失真卡时返回 payload", async () => {
    vi.mocked(invoke).mockImplementation(async (command: string) => {
      if (command === "item_check_dormant") return [PAYLOAD];
      return null;
    });

    const onDormant = vi.fn();
    renderHook(() => useDormantCheck(60_000, onDormant));

    // 首次 check 是异步 effect,flush 微任务
    await act(async () => {
      await Promise.resolve();
    });
    expect(invoke).toHaveBeenCalledWith("item_check_dormant", undefined);
    await act(async () => {
      await Promise.resolve();
    });
    expect(onDormant).toHaveBeenCalledWith([PAYLOAD]);
  });

  it("无失真卡时不回调", async () => {
    vi.mocked(invoke).mockResolvedValue([]);
    const onDormant = vi.fn();
    renderHook(() => useDormantCheck(60_000, onDormant));

    await act(async () => {
      await Promise.resolve();
    });
    expect(invoke).toHaveBeenCalledWith("item_check_dormant", undefined);
    expect(onDormant).not.toHaveBeenCalled();

    // 推进一个轮询周期,确认仍无回调
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(onDormant).not.toHaveBeenCalled();
  });

  it("错误时不崩溃", async () => {
    vi.mocked(invoke).mockRejectedValue(new Error("db error"));
    const onDormant = vi.fn();
    renderHook(() => useDormantCheck(60_000, onDormant));

    await act(async () => {
      await Promise.resolve();
    });
    expect(onDormant).not.toHaveBeenCalled();
  });
});
