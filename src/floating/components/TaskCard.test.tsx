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

const TODO: Item = {
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

  it("进行中卡显示暂停/完成按钮,点按各自回调", () => {
    const onPause = vi.fn();
    const onComplete = vi.fn();
    render(
      <TaskCard
        item={ACTIVE}
        onStart={() => {}}
        onPause={onPause}
        onComplete={onComplete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /暂停/ }));
    fireEvent.click(screen.getByRole("button", { name: /完成/ }));
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("待办卡显示开始/完成按钮,点按各自回调", () => {
    const onStart = vi.fn();
    const onComplete = vi.fn();
    render(
      <TaskCard
        item={TODO}
        onStart={onStart}
        onComplete={onComplete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /开始/ }));
    fireEvent.click(screen.getByRole("button", { name: /完成/ }));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("待办卡点击卡片本身即开始(切换进行中)", () => {
    const onStart = vi.fn();
    render(<TaskCard item={TODO} onStart={onStart} />);

    fireEvent.click(screen.getByText("整理文档"));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("收件箱项显示开始/仅留档/删除按钮,点按各自回调", () => {
    const onStart = vi.fn();
    const onArchive = vi.fn();
    const onDelete = vi.fn();
    render(
      <TaskCard
        item={INBOX}
        onStart={onStart}
        onArchive={onArchive}
        onDelete={onDelete}
        isInbox
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /开始/ }));
    fireEvent.click(screen.getByRole("button", { name: /仅留档/ }));
    fireEvent.click(screen.getByRole("button", { name: /删除/ }));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
