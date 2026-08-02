import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ExpandedPanel } from "./ExpandedPanel";

const baseProps = {
  taskTitle: "",
  onTaskTitleChange: () => {},
  onStart: () => {},
  onSave: () => {},
  onClearAndDismiss: () => {},
  maxLength: 50,
  submitting: false,
};

describe("ExpandedPanel(保存 + 开始两按钮)", () => {
  it("任务名为空时保存与开始按钮都禁用", () => {
    render(<ExpandedPanel {...baseProps} />);
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "开始" })).toBeDisabled();
  });

  it("非空时点保存触发 onSave", () => {
    const onSave = vi.fn();
    render(<ExpandedPanel {...baseProps} taskTitle="写代码" onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("非空时点开始触发 onStart", () => {
    const onStart = vi.fn();
    render(<ExpandedPanel {...baseProps} taskTitle="写代码" onStart={onStart} />);

    fireEvent.click(screen.getByRole("button", { name: "开始" }));

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("按 Enter 触发 onStart(回车即开始)", () => {
    const onStart = vi.fn();
    render(<ExpandedPanel {...baseProps} taskTitle="写代码" onStart={onStart} />);

    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("按 Escape 清空并折叠", () => {
    const onClearAndDismiss = vi.fn();
    render(<ExpandedPanel {...baseProps} onClearAndDismiss={onClearAndDismiss} />);

    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });

    expect(onClearAndDismiss).toHaveBeenCalledTimes(1);
  });
});
