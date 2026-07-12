import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ExpandedPanel } from "./ExpandedPanel";

// V0.2.0.14 PATCH: ExpandedPanel 不再接 activeSession/onPause/onResume/onComplete (ControlRow 移到 App.tsx),
// 不再接 onDismiss (panel 外 dismiss 在 App.tsx 用 document mousedown + panelRef.contains check 替代).
// 只剩 input + 开始/取消 按钮.
const baseProps = {
  taskTitle: "",
  onTaskTitleChange: () => {},
  onStart: () => {},
  onClearAndDismiss: () => {},
  maxLength: 50,
  submitting: false,
};

describe("ExpandedPanel", () => {
  it("显示 InputBar + 开始/取消按钮", () => {
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

  it("Esc 键触发 onClearAndDismiss (V0.2.0.13: Esc 是用户显式取消意图, 清输入 + 折叠)", () => {
    const onClearAndDismiss = vi.fn();
    render(<ExpandedPanel {...baseProps} onClearAndDismiss={onClearAndDismiss} />);
    fireEvent.keyDown(screen.getByPlaceholderText(/我现在在做什么/), { key: "Escape" });
    expect(onClearAndDismiss).toHaveBeenCalledTimes(1);
  });

  it("点取消按钮 触发 onClearAndDismiss (用户显式取消意图, 不走 blur 路径)", () => {
    const onClearAndDismiss = vi.fn();
    render(<ExpandedPanel {...baseProps} onClearAndDismiss={onClearAndDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(onClearAndDismiss).toHaveBeenCalledTimes(1);
  });
});