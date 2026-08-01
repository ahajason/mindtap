import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FoldedBar } from "./FoldedBar";

describe("FoldedBar(并行计数条)", () => {
  it("显示收件箱数与活跃任务数", () => {
    render(<FoldedBar inboxCount={3} activeCount={2} pendingCount={0} />);

    expect(screen.getByText("收件箱 3")).toBeVisible();
    expect(screen.getByText("进行中 2")).toBeVisible();
    expect(screen.getByRole("status")).toHaveAccessibleName(
      "Mindtap 工作台账，收件箱 3，进行中 2",
    );
  });

  it("零活跃时显示为空", () => {
    render(<FoldedBar inboxCount={0} activeCount={0} pendingCount={0} />);

    expect(screen.getByRole("status")).toHaveAccessibleName(
      "Mindtap 工作台账，收件箱 0，进行中 0",
    );
  });

  it("有待确认时折叠条显示待确认标记", () => {
    render(<FoldedBar inboxCount={1} activeCount={1} pendingCount={2} />);

    expect(screen.getByText("待确认 2")).toBeVisible();
  });
});
