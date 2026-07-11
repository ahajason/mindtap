import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ControlRow } from "./ControlRow";

describe("ControlRow", () => {
  it("active 状态显示 '暂停' + '完成' (无 '恢复')", () => {
    render(
      <ControlRow
        status="active"
        onPause={() => {}}
        onResume={() => {}}
        onComplete={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "完成" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "恢复" })).toBeNull();
  });

  it("paused 状态显示 '恢复' + '完成' (无 '暂停')", () => {
    render(
      <ControlRow
        status="paused"
        onPause={() => {}}
        onResume={() => {}}
        onComplete={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "恢复" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "完成" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "暂停" })).toBeNull();
  });

  it("点 '暂停' 触发 onPause", () => {
    const onPause = vi.fn();
    render(
      <ControlRow
        status="active"
        onPause={onPause}
        onResume={() => {}}
        onComplete={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "暂停" }));
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it("点 '完成' 触发 onComplete", () => {
    const onComplete = vi.fn();
    render(
      <ControlRow
        status="active"
        onPause={() => {}}
        onResume={() => {}}
        onComplete={onComplete}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "完成" }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});