import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import { FoldedBar } from "./FoldedBar";

describe("FoldedBar(折叠条滚动展示)", () => {
  const cards = [
    { content: "写报告", focusMs: 61_000 },
    { content: "回邮件", focusMs: 120_000 },
  ];

  it("无进行中卡时显示收件箱数 + [+] 入口", () => {
    render(
      <FoldedBar
        activeCards={[]}
        inboxCount={3}
        pendingCount={0}
        onAdd={() => {}}
        onOpenList={() => {}}
      />,
    );

    expect(screen.getByText("收件箱 3")).toBeVisible();
    expect(screen.getByRole("button", { name: "新增任务" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveAccessibleName("Mindtap 工作台账，收件箱 3");
  });

  it("有进行中卡时展示第一张内容 + 实时时长 + 其余数量", () => {
    render(
      <FoldedBar
        activeCards={cards}
        inboxCount={2}
        pendingCount={0}
        onAdd={() => {}}
        onOpenList={() => {}}
      />,
    );

    expect(screen.getByText("写报告")).toBeVisible();
    expect(screen.getByText("00:01:01")).toBeVisible();
    expect(screen.getByText("+1")).toBeVisible();
  });

  it("单张进行中卡不显示 +N 剩余标记", () => {
    render(
      <FoldedBar
        activeCards={[cards[0]]}
        inboxCount={2}
        pendingCount={0}
        onAdd={() => {}}
        onOpenList={() => {}}
      />,
    );

    expect(screen.getByText("写报告")).toBeVisible();
    expect(screen.queryByText("+1")).toBeNull();
  });

  it("每 2.5 秒轮换展示下一张进行中卡", () => {
    vi.useFakeTimers();
    try {
      render(
        <FoldedBar
          activeCards={cards}
          inboxCount={2}
          pendingCount={0}
          onAdd={() => {}}
          onOpenList={() => {}}
        />,
      );

      expect(screen.getByText("写报告")).toBeVisible();
      act(() => vi.advanceTimersByTime(2500));
      expect(screen.getByText("回邮件")).toBeVisible();
      act(() => vi.advanceTimersByTime(2500));
      expect(screen.getByText("写报告")).toBeVisible();
    } finally {
      vi.useRealTimers();
    }
  });

  it("点击内容区触发 onOpenList", () => {
    const onOpenList = vi.fn();
    render(
      <FoldedBar
        activeCards={cards}
        inboxCount={2}
        pendingCount={0}
        onAdd={() => {}}
        onOpenList={onOpenList}
      />,
    );

    fireEvent.click(screen.getByRole("status"));

    expect(onOpenList).toHaveBeenCalledTimes(1);
  });

  it("点击「+」触发 onAdd 且不触发 onOpenList", () => {
    const onAdd = vi.fn();
    const onOpenList = vi.fn();
    render(
      <FoldedBar
        activeCards={cards}
        inboxCount={2}
        pendingCount={0}
        onAdd={onAdd}
        onOpenList={onOpenList}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "新增任务" }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onOpenList).not.toHaveBeenCalled();
  });

  it("有待确认时折叠条显示待确认标记", () => {
    render(
      <FoldedBar
        activeCards={cards}
        inboxCount={2}
        pendingCount={2}
        onAdd={() => {}}
        onOpenList={() => {}}
      />,
    );

    expect(screen.getByText("待确认 2")).toBeVisible();
  });
});
