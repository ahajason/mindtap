import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContextMenu } from "./ContextMenu";

describe("ContextMenu", () => {
  it("渲染 '退出' 按钮 + aria-label + role=menu", () => {
    render(<ContextMenu x={10} y={20} onClose={() => {}} />);
    const menu = screen.getByRole("menu");
    expect(menu.getAttribute("aria-label")).toBe("浮窗右键菜单");
    expect(screen.getByRole("menuitem", { name: "退出" })).toBeInTheDocument();
  });

  it("点击 menu item 触发 onClose (点击透传到外层 onClick)", () => {
    const onClose = vi.fn();
    render(<ContextMenu x={10} y={20} onClose={onClose} />);
    fireEvent.click(screen.getByRole("menuitem", { name: "退出" }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Esc 键触发 onClose (V0.2 spec §3.4 浮窗右键菜单交互)", () => {
    const onClose = vi.fn();
    render(<ContextMenu x={10} y={20} onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});