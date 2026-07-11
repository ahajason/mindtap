import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EmptyHistoryHint } from "./EmptyHistoryHint";

describe("EmptyHistoryHint", () => {
  it("renders hint text with emoji", () => {
    render(<EmptyHistoryHint onClickCreate={vi.fn()} />);
    expect(screen.getByText(/还没有历史任务/)).toBeTruthy();
    expect(screen.getByText(/👋/)).toBeTruthy();
  });

  it("calls onClickCreate when clicked", () => {
    const onClick = vi.fn();
    render(<EmptyHistoryHint onClickCreate={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
