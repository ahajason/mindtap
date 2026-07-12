import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusDot } from "./StatusDot";

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

  it("inline position 不挂 absolute 类 (默认 inline 用)", () => {
    const { container } = render(<StatusDot status="active" position="inline" />);
    const dot = container.querySelector("span");
    expect(dot?.className).not.toContain("absolute");
    expect(dot?.className).not.toContain("top-1");
    expect(dot?.className).not.toContain("right-1");
  });

  it("absolute position 用 top-1 right-1 (V0.2.8 Issue B fix: 防 .floating-root overflow:hidden 裁掉)", () => {
    const { container } = render(<StatusDot status="active" position="absolute" />);
    const dot = container.querySelector("span");
    expect(dot?.className).toContain("absolute");
    // V0.2.8 Issue B: 旧 -top-0.5 -right-0.5 (各 -2px) 把 8x8 dot 推父容器外, 被 .floating-root { overflow: hidden } 裁
    // 改 top-1 right-1 (+4px 内) 整在父容器内, 不溢出不被裁
    expect(dot?.className).toContain("top-1");
    expect(dot?.className).toContain("right-1");
    expect(dot?.className).not.toContain("-top-0.5");
    expect(dot?.className).not.toContain("-right-0.5");
  });

  it("active absolute position 仍挂 animate-pulse-dot (呼吸动画不被位置 fix 影响)", () => {
    const { container } = render(<StatusDot status="active" position="absolute" />);
    const dot = container.querySelector("span");
    expect(dot?.className).toContain("animate-pulse-dot");
  });
});