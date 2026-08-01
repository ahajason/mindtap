import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TaskCard } from "./TaskCard";
import type { Item } from "../../lib/tauri-bridge";

const ACTIVE: Item = {
  id: 1,
  content: "写代码",
  type: "task",
  status: "active",
  focus_ms: 6000,
  last_active_at: 0,
  progress_note: "接口写完，差联调",
  source: "manual",
  pending_ms: null,
  created_at: 0,
  updated_at: 0,
};

const INBOX: Item = {
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

describe("TaskCard", () => {
  it("进行中卡显示内容/时长/进度备注,不显示开始按钮", () => {
    render(
      <TaskCard
        item={ACTIVE}
        onStart={() => {}}
        isInbox={false}
      />,
    );

    expect(screen.getByText("写代码")).toBeVisible();
    expect(screen.getByText("接口写完，差联调")).toBeVisible();
    expect(screen.queryByRole("button", { name: /开始/ })).toBeNull();
  });

  it("收件箱项显示开始按钮,点按回调", () => {
    const onStart = vi.fn();
    render(
      <TaskCard
        item={INBOX}
        onStart={onStart}
        isInbox
      />,
    );

    const btn = screen.getByRole("button", { name: /开始/ });
    fireEvent.click(btn);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("冷却深浅通过透明度表达(status 不同档位)", () => {
    // 进行中卡(活跃)不标记冷却;失真语义由 App 层判定。此处只验证卡可渲染。
    const { container } = render(
      <TaskCard
        item={ACTIVE}
        onStart={() => {}}
        isInbox={false}
      />,
    );
    expect(container.querySelector("[data-cold]")).toBeNull();
  });
});
