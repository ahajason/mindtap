import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FoldedBar } from "./FoldedBar";

describe("FoldedBar", () => {
  it("活动任务显示标题、格式化计时和聚合状态语义", () => {
    render(<FoldedBar taskTitle="写代码" focusMs={3_661_000} status="active" />);

    expect(screen.getByText("写代码")).toBeVisible();
    expect(screen.getByText("01:01:01")).toBeVisible();
    expect(screen.getByRole("status")).toHaveAccessibleName(
      "当前任务 写代码，已计时 01:01:01",
    );
  });

  it("空闲状态提供未开始任务语义", () => {
    render(<FoldedBar taskTitle="" focusMs={0} status="empty" />);

    expect(screen.getByText("未命名任务")).toBeVisible();
    expect(screen.getByRole("status")).toHaveAccessibleName("Mindtap 计时器，未开始任务");
  });
});
