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

const TODO_PAUSED: Item = {
  id: 4,
  content: "回邮件",
  type: "task",
  status: "todo",
  focus_ms: 3_600_000, // 已投入 1 小时
  last_active_at: null,
  progress_note: null,
  source: "manual",
  pending_ms: null,
  created_at: 0,
  updated_at: 0,
};

describe("TaskCard", () => {
  it("进行中卡显示内容/时长/进度备注,不显示开始按钮", () => {
    render(<TaskCard item={ACTIVE} onStart={() => {}} />);

    expect(screen.getByText("写代码")).toBeVisible();
    expect(screen.getByText("接口写完，差联调")).toBeVisible();
    expect(screen.queryByRole("button", { name: /开始/ })).toBeNull();
  });

  it("待办卡显示开始按钮,点按回调", () => {
    const onStart = vi.fn();
    render(<TaskCard item={TODO} onStart={onStart} />);

    const btn = screen.getByRole("button", { name: /开始/ });
    fireEvent.click(btn);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("冷却深浅通过透明度表达(status 不同档位)", () => {
    // 进行中卡(活跃)不标记冷却;失真语义由 App 层判定。此处只验证卡可渲染。
    const { container } = render(<TaskCard item={ACTIVE} onStart={() => {}} />);
    expect(container.querySelector("[data-cold]")).toBeNull();
  });

  it("进行中卡显示暂停/归档按钮,点按各自回调", () => {
    const onPause = vi.fn();
    const onArchive = vi.fn();
    render(
      <TaskCard
        item={ACTIVE}
        onStart={() => {}}
        onPause={onPause}
        onArchive={onArchive}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /暂停/ }));
    fireEvent.click(screen.getByRole("button", { name: /归档/ }));
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onArchive).toHaveBeenCalledTimes(1);
  });

  it("待办卡显示开始/归档按钮,点按各自回调", () => {
    const onStart = vi.fn();
    const onArchive = vi.fn();
    render(
      <TaskCard
        item={TODO}
        onStart={onStart}
        onArchive={onArchive}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /开始/ }));
    fireEvent.click(screen.getByRole("button", { name: /归档/ }));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onArchive).toHaveBeenCalledTimes(1);
  });

  it("待办卡整卡点击不开始(2d,只有按钮触发)", () => {
    const onStart = vi.fn();
    render(<TaskCard item={TODO} onStart={onStart} />);

    fireEvent.click(screen.getByText("整理文档"));
    expect(onStart).not.toHaveBeenCalled();
  });

  it("暂停过的待办卡显示累积投入时长(灰色,与 active 区分)", () => {
    render(
      <TaskCard
        item={TODO_PAUSED}
        onStart={() => {}}
      />,
    );

    expect(screen.getByText("01:00:00")).toBeVisible();
  });

  it("未投入过的待办卡不显示 00:00:00", () => {
    render(
      <TaskCard
        item={TODO}
        onStart={() => {}}
      />,
    );

    expect(screen.queryByText("00:00:00")).toBeNull();
  });

  it("三态下无「完成/仅留档/删除」按钮(统一「归档」)", () => {
    render(
      <TaskCard
        item={TODO}
        onStart={() => {}}
        onArchive={() => {}}
      />,
    );

    expect(screen.queryByRole("button", { name: /完成/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /仅留档/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /删除/ })).toBeNull();
  });

  it("双击卡进入行内改名,回车提交 onRename(3a)", () => {
    const onRename = vi.fn();
    render(
      <TaskCard
        item={TODO}
        onStart={() => {}}
        onRename={onRename}
      />,
    );

    fireEvent.doubleClick(screen.getByText("整理文档"));
    const input = screen.getByRole("textbox", { name: "改名 整理文档" });
    fireEvent.change(input, { target: { value: "新名字" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onRename).toHaveBeenCalledWith("新名字");
  });

  it("双击改名 Esc 取消,不提交且退出编辑态(3a 及时取消)", () => {
    const onRename = vi.fn();
    render(
      <TaskCard
        item={TODO}
        onStart={() => {}}
        onRename={onRename}
      />,
    );

    fireEvent.doubleClick(screen.getByText("整理文档"));
    const input = screen.getByRole("textbox", { name: "改名 整理文档" });
    fireEvent.change(input, { target: { value: "不该存" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onRename).not.toHaveBeenCalled();
    // 编辑态已退出,回到内容展示
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("整理文档")).toBeVisible();
  });

  it("双击改名失焦即保存(3a 调整,不丢输入)", () => {
    const onRename = vi.fn();
    render(
      <TaskCard
        item={TODO}
        onStart={() => {}}
        onRename={onRename}
      />,
    );

    fireEvent.doubleClick(screen.getByText("整理文档"));
    const input = screen.getByRole("textbox", { name: "改名 整理文档" });
    fireEvent.change(input, { target: { value: "改到一半" } });
    fireEvent.blur(input);

    expect(onRename).toHaveBeenCalledWith("改到一半");
  });

  it("点编辑图标进入行内改名(3a 可见入口)", () => {
    const onRename = vi.fn();
    render(
      <TaskCard
        item={TODO}
        onStart={() => {}}
        onRename={onRename}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "编辑 整理文档" }));
    const input = screen.getByRole("textbox", { name: "改名 整理文档" });
    fireEvent.change(input, { target: { value: "图标改名" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onRename).toHaveBeenCalledWith("图标改名");
  });
});
