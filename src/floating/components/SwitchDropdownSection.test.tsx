import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SwitchDropdownSection } from "./SwitchDropdownSection";

vi.mock("../hooks/useRecentTaskTitles", () => ({
  useRecentTaskTitles: vi.fn(),
}));

import { useRecentTaskTitles } from "../hooks/useRecentTaskTitles";

const mockUse = useRecentTaskTitles as unknown as ReturnType<typeof vi.fn>;

describe("SwitchDropdownSection", () => {
  it("renders 5 recs with relative time when opened", () => {
    mockUse.mockReturnValue({
      recs: [
        { task_title: "写周报", last_used: Date.now() - 60_000 },
        { task_title: "review PR", last_used: Date.now() - 3_600_000 },
      ],
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    render(<SwitchDropdownSection onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /或选择已有任务/ }));
    expect(screen.getByText("写周报")).toBeTruthy();
    expect(screen.getByText("1 分钟前")).toBeTruthy();
    expect(screen.getByText("review PR")).toBeTruthy();
    expect(screen.getByText("1 小时前")).toBeTruthy();
  });

  it("calls onSelect with task_title when item clicked", () => {
    mockUse.mockReturnValue({
      recs: [{ task_title: "写周报", last_used: Date.now() - 60_000 }],
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    const onSelect = vi.fn();
    render(<SwitchDropdownSection onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /或选择已有任务/ }));
    fireEvent.click(screen.getByText("写周报"));
    expect(onSelect).toHaveBeenCalledWith("写周报");
  });

  it("renders empty state when recs is empty", () => {
    mockUse.mockReturnValue({
      recs: [],
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    render(<SwitchDropdownSection onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /或选择已有任务/ }));
    expect(screen.getByText("暂无历史任务")).toBeTruthy();
  });

  it("renders empty state when error is set (spec §3.7)", () => {
    mockUse.mockReturnValue({
      recs: null,
      loading: false,
      error: new Error("db read failed"),
      refresh: vi.fn(),
    });
    render(<SwitchDropdownSection onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /或选择已有任务/ }));
    expect(screen.getByText("暂无历史任务")).toBeTruthy();
  });

  it("ArrowDown then Enter selects active item", () => {
    mockUse.mockReturnValue({
      recs: [
        { task_title: "first", last_used: Date.now() - 60_000 },
        { task_title: "second", last_used: Date.now() - 120_000 },
      ],
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    const onSelect = vi.fn();
    render(<SwitchDropdownSection onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /或选择已有任务/ }));
    fireEvent.keyDown(document, { key: "ArrowDown" });
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("second");
  });

  it("Escape closes popover", () => {
    mockUse.mockReturnValue({
      recs: [{ task_title: "first", last_used: Date.now() - 60_000 }],
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    render(<SwitchDropdownSection onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /或选择已有任务/ }));
    expect(screen.getByRole("listbox")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
