import { render, screen } from "@testing-library/react";
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
});