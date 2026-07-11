import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InputBar } from "./InputBar";

describe("InputBar", () => {
  it("渲染 placeholder + 字符计数 0/50", () => {
    render(
      <InputBar
        value=""
        onChange={() => {}}
        onKeyDown={() => {}}
        inputRef={{ current: null }}
        maxLength={50}
        submitting={false}
      />,
    );
    const input = screen.getByPlaceholderText(/我现在在做什么/);
    expect(input).toBeInTheDocument();
    expect(input.getAttribute("maxlength")).toBe("50");
    expect(screen.getByText("0/50")).toBeInTheDocument();
  });

  it("字符计数随 value 变化", () => {
    render(
      <InputBar
        value="写代码"
        onChange={() => {}}
        onKeyDown={() => {}}
        inputRef={{ current: null }}
        maxLength={50}
        submitting={false}
      />,
    );
    expect(screen.getByText("3/50")).toBeInTheDocument();
  });

  it("Enter 键触发 onKeyDown (spec §3.2 Enter = 开始)", () => {
    const onKeyDown = vi.fn();
    render(
      <InputBar
        value="X"
        onChange={() => {}}
        onKeyDown={onKeyDown}
        inputRef={{ current: null }}
        maxLength={50}
        submitting={false}
      />,
    );
    fireEvent.keyDown(screen.getByPlaceholderText(/我现在在做什么/), { key: "Enter" });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it("submitting 时 input disabled", () => {
    render(
      <InputBar
        value=""
        onChange={() => {}}
        onKeyDown={() => {}}
        inputRef={{ current: null }}
        maxLength={50}
        submitting={true}
      />,
    );
    expect(screen.getByPlaceholderText(/我现在在做什么/)).toBeDisabled();
  });
});