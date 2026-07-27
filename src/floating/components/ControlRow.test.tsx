import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ControlRow } from "./ControlRow";

describe("ControlRow", () => {
  it("活动任务可暂停和完成", () => {
    const onPause = vi.fn();
    const onComplete = vi.fn();
    render(
      <ControlRow
        status="active"
        onPause={onPause}
        onResume={() => {}}
        onComplete={onComplete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "暂停" }));
    fireEvent.click(screen.getByRole("button", { name: "完成" }));

    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "恢复" })).toBeNull();
  });

  it("暂停任务可恢复和完成", () => {
    const onResume = vi.fn();
    render(
      <ControlRow
        status="paused"
        onPause={() => {}}
        onResume={onResume}
        onComplete={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "恢复" }));

    expect(onResume).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "完成" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "暂停" })).toBeNull();
  });
});
