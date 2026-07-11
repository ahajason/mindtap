import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FoldedBar } from "./FoldedBar";

describe("FoldedBar", () => {
  it("空状态显示 '未命名任务'", () => {
    render(<FoldedBar taskTitle="" focusMs={0} status="empty" />);
    expect(screen.getByText("未命名任务")).toBeInTheDocument();
  });

  it("active 状态显示 task_title + 时间格式化 HH:MM:SS", () => {
    render(<FoldedBar taskTitle="写代码" focusMs={3_661_000} status="active" />);
    expect(screen.getByText("写代码")).toBeInTheDocument();
    expect(screen.getByText("01:01:01")).toBeInTheDocument();
  });

  it("aria-label 含 task_title + 已计时 (active)", () => {
    render(<FoldedBar taskTitle="写代码" focusMs={5_000} status="active" />);
    const el = screen.getByRole("status");
    expect(el.getAttribute("aria-label")).toBe("当前任务 写代码，已计时 00:00:05");
  });

  it("空状态 aria-label (无任务)", () => {
    render(<FoldedBar taskTitle="" focusMs={0} status="empty" />);
    const el = screen.getByRole("status");
    expect(el.getAttribute("aria-label")).toBe("Mindtap 计时器，未开始任务");
  });

  it("点击触发 onClick (V0.2 spec §3.2 折叠态点击展开)", () => {
    const onClick = vi.fn();
    render(<FoldedBar taskTitle="X" focusMs={0} status="active" onClick={onClick} />);
    fireEvent.click(screen.getByRole("status"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});