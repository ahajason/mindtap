import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ExpandedPanel } from "./ExpandedPanel";

const baseProps = {
  taskTitle: "",
  onTaskTitleChange: () => {},
  onStart: () => {},
  onClearAndDismiss: () => {},
  maxLength: 50,
  submitting: false,
};

describe("ExpandedPanel", () => {
  it("任务名为空时不能开始", () => {
    render(<ExpandedPanel {...baseProps} />);
    expect(screen.getByRole("button", { name: "开始" })).toBeDisabled();
  });

  it("按 Enter 开始非空任务", () => {
    const onStart = vi.fn();
    render(<ExpandedPanel {...baseProps} taskTitle="写代码" onStart={onStart} />);

    fireEvent.keyDown(screen.getByPlaceholderText(/做什么/), { key: "Enter" });

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("按 Escape 清空并折叠", () => {
    const onClearAndDismiss = vi.fn();
    render(<ExpandedPanel {...baseProps} onClearAndDismiss={onClearAndDismiss} />);

    fireEvent.keyDown(screen.getByPlaceholderText(/做什么/), { key: "Escape" });

    expect(onClearAndDismiss).toHaveBeenCalledTimes(1);
  });
});
