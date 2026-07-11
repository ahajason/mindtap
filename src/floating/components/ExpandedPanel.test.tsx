import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ExpandedPanel } from "./ExpandedPanel";

const baseProps = {
  taskTitle: "",
  onTaskTitleChange: () => {},
  onStart: () => {},
  onCancel: () => {},
  maxLength: 50,
  submitting: false,
  activeSession: null,
  onPause: () => {},
  onResume: () => {},
  onComplete: () => {},
};

describe("ExpandedPanel", () => {
  it("无 active session 时显示 InputBar + 开始/取消按钮", () => {
    render(<ExpandedPanel {...baseProps} />);
    expect(screen.getByPlaceholderText(/我现在在做什么/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
  });

  it("开始按钮在空 task_title 时 disabled (V0.2 spec §3.2 输入空禁用)", () => {
    render(<ExpandedPanel {...baseProps} taskTitle="" />);
    expect(screen.getByRole("button", { name: "开始" })).toBeDisabled();
  });

  it("开始按钮在有 task_title 时 enabled", () => {
    render(<ExpandedPanel {...baseProps} taskTitle="写代码" />);
    expect(screen.getByRole("button", { name: "开始" })).toBeEnabled();
  });

  it("Enter 键触发 onStart (V0.2 spec §3.2 Enter = 开始)", () => {
    const onStart = vi.fn();
    render(<ExpandedPanel {...baseProps} onStart={onStart} />);
    fireEvent.keyDown(screen.getByPlaceholderText(/我现在在做什么/), { key: "Enter" });
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("Esc 键触发 onCancel (V0.2 spec §3.2 Esc = 取消)", () => {
    const onCancel = vi.fn();
    render(<ExpandedPanel {...baseProps} onCancel={onCancel} />);
    fireEvent.keyDown(screen.getByPlaceholderText(/我现在在做什么/), { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("有 active session 时显示 ControlRow (无 InputBar)", () => {
    render(
      <ExpandedPanel
        {...baseProps}
        activeSession={{
          id: 1,
          task_title: "写代码",
          status: "active",
          started_at: 1,
          paused_at: null,
          completed_at: null,
          focus_ms: 0,
          created_at: 1,
          updated_at: 1,
        }}
      />,
    );
    expect(screen.getByText("写代码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/我现在在做什么/)).toBeNull();
  });
});