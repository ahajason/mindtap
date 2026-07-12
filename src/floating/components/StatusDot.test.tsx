import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusDot } from "./StatusDot";

// V0.2.0.12 PATCH: StatusDot 恢复 V1.0 archive inline-block span 设计 (见 .archive/src/floating/StatusDot.tsx)
// V0.2.x 的 position prop (inline | absolute) 已删 — 折叠态是 flex 第 1 child, 不是右上角 absolute。

describe("StatusDot", () => {
  it("null status 不渲染", () => {
    const { container } = render(<StatusDot status={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("active 渲染绿色圆点", () => {
    const { container } = render(<StatusDot status="active" />);
    const dot = container.querySelector("span");
    expect(dot?.className).toContain("bg-emerald-400");
  });

  it("paused 渲染琥珀色圆点", () => {
    const { container } = render(<StatusDot status="paused" />);
    const dot = container.querySelector("span");
    expect(dot?.className).toContain("bg-amber-400");
  });

  it("completed 渲染灰色圆点", () => {
    const { container } = render(<StatusDot status="completed" />);
    const dot = container.querySelector("span");
    expect(dot?.className).toContain("bg-zinc-400");
  });

  it("默认渲染 inline-block span, 不挂 absolute / top-1 / right-1 (V0.2.0.12 inline 形态锁定)", () => {
    const { container } = render(<StatusDot status="active" />);
    const dot = container.querySelector("span");
    expect(dot).toBeTruthy();
    expect(dot?.className).toContain("inline-block");
    expect(dot?.className).not.toContain("absolute");
    expect(dot?.className).not.toContain("top-1");
    expect(dot?.className).not.toContain("right-1");
  });

  it("active 状态挂 animate-pulse-dot 呼吸动画 (V0.2.0.12 active 形态锁定)", () => {
    const { container } = render(<StatusDot status="active" />);
    const dot = container.querySelector("span");
    expect(dot?.className).toContain("animate-pulse-dot");
  });
});
