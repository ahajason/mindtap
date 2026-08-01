import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Bubble } from "./Bubble";

describe("Bubble(失真确认气泡)", () => {
  it("显示失真任务内容与确认文案", () => {
    render(
      <Bubble
        content="写代码"
        pendingMs={7200000}
        onContinue={() => {}}
        onPause={() => {}}
      />,
    );

    expect(screen.getByText("写代码 还在进行中，还要继续吗？")).toBeVisible();
  });

  it("点继续 → onContinue 回调", () => {
    const onContinue = vi.fn();
    render(
      <Bubble
        content="写代码"
        pendingMs={7200000}
        onContinue={onContinue}
        onPause={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "继续" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("点暂停 → onPause 回调", () => {
    const onPause = vi.fn();
    render(
      <Bubble
        content="写代码"
        pendingMs={7200000}
        onContinue={() => {}}
        onPause={onPause}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "暂停" }));
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it("待确认态显示时长并支持记入/丢弃", () => {
    const onKeep = vi.fn();
    const onDiscard = vi.fn();
    render(
      <Bubble
        content="写代码"
        pendingMs={7200000}
        pendingConfirm
        onKeep={onKeep}
        onDiscard={onDiscard}
      />,
    );

    expect(screen.getByText("刚才这 02:00:00 要计入吗？")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "记入" }));
    expect(onKeep).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "丢弃" }));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it("已自动暂停态(复用待确认按钮)显示'已自动暂停'文案并支持记入/丢弃", () => {
    const onKeep = vi.fn();
    const onDiscard = vi.fn();
    render(
      <Bubble
        content="写代码"
        pendingMs={7200000}
        pendingConfirm
        autoPaused
        onKeep={onKeep}
        onDiscard={onDiscard}
      />,
    );

    expect(screen.getByText("写代码 已自动暂停，刚才是专注吗？")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "记入" }));
    expect(onKeep).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "丢弃" }));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});
