import { act, renderHook, waitFor } from "@testing-library/react";
import { listen } from "@tauri-apps/api/event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCaptureIntent } from "./useCaptureIntent";

describe("useCaptureIntent(快捷键捕获意图)", () => {
  beforeEach(() => {
    vi.mocked(listen).mockReset();
  });

  it("监听 floating:capture 事件后 intent=true", async () => {
    type Handler = Parameters<typeof listen>[1];
    let captureHandler: Handler | null = null;
    vi.mocked(listen).mockImplementation((event: string, cb: Handler) => {
      if (event === "floating:capture") captureHandler = cb;
      return Promise.resolve(() => {});
    });

    const { result } = renderHook(() => useCaptureIntent());
    await waitFor(() => expect(listen).toHaveBeenCalled());

    expect(result.current.intent).toBe(false);
    act(() => captureHandler?.({ event: "floating:capture", id: 0, payload: undefined }));
    expect(result.current.intent).toBe(true);
  });

  it("clear 后 intent=false", async () => {
    vi.mocked(listen).mockImplementation(() => Promise.resolve(() => {}));
    const { result } = renderHook(() => useCaptureIntent());
    await waitFor(() => expect(listen).toHaveBeenCalled());

    act(() => result.current.setIntent(true));
    expect(result.current.intent).toBe(true);
    act(() => result.current.clear());
    expect(result.current.intent).toBe(false);
  });

  it("unmount 时 unlisten 被调用", async () => {
    const unlisten = vi.fn();
    vi.mocked(listen).mockResolvedValue(unlisten as unknown as () => void);
    const { unmount } = renderHook(() => useCaptureIntent());
    await waitFor(() => expect(listen).toHaveBeenCalled());
    unmount();
    expect(unlisten).toHaveBeenCalled();
  });
});
