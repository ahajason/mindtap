import { act, renderHook, waitFor } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useActiveTasks } from "./useActiveTasks";
import type { Item } from "../../lib/tauri-bridge";

const ACTIVE: Item = {
  id: 1,
  content: "写代码",
  type: "task",
  status: "active",
  focus_ms: 0,
  last_active_at: 0,
  progress_note: null,
  source: "manual",
  pending_ms: null,
  created_at: 0,
  updated_at: 0,
};

const TODO: Item = {
  id: 2,
  content: "回邮件",
  type: "task",
  status: "todo",
  focus_ms: 0,
  last_active_at: null,
  progress_note: null,
  source: "manual",
  pending_ms: null,
  created_at: 0,
  updated_at: 0,
};

describe("useActiveTasks", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
  });

  it("拉取 active 与 todo 列表(三态:待办含原收件箱)", async () => {
    vi.mocked(invoke).mockImplementation(async (command: string) => {
      if (command === "item_get_active") return [ACTIVE];
      if (command === "item_get_todo") return [TODO];
      return null;
    });

    const { result } = renderHook(() => useActiveTasks());
    await waitFor(() => {
      expect(result.current.active).toHaveLength(1);
      expect(result.current.todo).toHaveLength(1);
    });
    expect(result.current.active[0].content).toBe("写代码");
    expect(result.current.todo[0].content).toBe("回邮件");
  });

  it("setActive / setTodo 支持本地更新(切换/暂停后同步)", async () => {
    vi.mocked(invoke).mockImplementation(async (command: string) => {
      if (command === "item_get_active") return [ACTIVE];
      if (command === "item_get_todo") return [];
      return null;
    });

    const { result } = renderHook(() => useActiveTasks());
    await waitFor(() => expect(result.current.active).toHaveLength(1));

    // 模拟:该卡被暂停(退回待办)
    act(() => {
      result.current.setActive([]);
    });
    expect(result.current.active).toHaveLength(0);
  });

  it("拉取失败时不崩溃,返回空列表", async () => {
    vi.mocked(invoke).mockRejectedValue(new Error("db error"));

    const { result } = renderHook(() => useActiveTasks());
    await waitFor(() => {
      expect(result.current.active).toEqual([]);
      expect(result.current.todo).toEqual([]);
    });
  });
});
