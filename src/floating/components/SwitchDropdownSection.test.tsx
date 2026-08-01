import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SwitchDropdownSection } from "./SwitchDropdownSection";

vi.mock("../hooks/useRecentTaskTitles", () => ({
  useRecentTaskTitles: vi.fn(),
}));

import { useRecentTaskTitles } from "../hooks/useRecentTaskTitles";

const mockUse = useRecentTaskTitles as unknown as ReturnType<typeof vi.fn>;

describe("SwitchDropdownSection", () => {
  it("点击历史任务返回任务名", () => {
    mockUse.mockReturnValue({
      recs: [{ content: "写周报", last_used: Date.now() - 60_000 }],
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

  it("读取失败时降级为空状态", () => {
    mockUse.mockReturnValue({
      recs: null,
      loading: false,
      error: new Error("db read failed"),
      refresh: vi.fn(),
    });
    render(<SwitchDropdownSection onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /或选择已有任务/ }));

    expect(screen.getByText("暂无历史任务")).toBeVisible();
  });

  it("方向键移动后按 Enter 选择当前项", () => {
    mockUse.mockReturnValue({
      recs: [
        { content: "first", last_used: Date.now() - 60_000 },
        { content: "second", last_used: Date.now() - 120_000 },
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

  it("按 Escape 关闭列表", () => {
    mockUse.mockReturnValue({
      recs: [{ content: "first", last_used: Date.now() - 60_000 }],
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    render(<SwitchDropdownSection onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /或选择已有任务/ }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
