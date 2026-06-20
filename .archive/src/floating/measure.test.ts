import { describe, expect, it } from "vitest";
import { clampHeight } from "./measure";

describe("clampHeight", () => {
  const bounds = { minH: 36, maxH: 460 };

  it("clamp 极小内容到 minH（防止 0 高度窗口）", () => {
    expect(clampHeight(0, bounds)).toBe(36);
    expect(clampHeight(-100, bounds)).toBe(36);
  });

  it("clamp NaN / Infinity 到 minH", () => {
    expect(clampHeight(NaN, bounds)).toBe(36);
    expect(clampHeight(-Infinity, bounds)).toBe(36);
  });

  it("范围内原样向上取整", () => {
    expect(clampHeight(280, bounds)).toBe(280);
    expect(clampHeight(280.4, bounds)).toBe(281);
  });

  it("超长内容 clamp 到 maxH（textarea 多行撑爆窗口）", () => {
    expect(clampHeight(800, bounds)).toBe(460);
    expect(clampHeight(461, bounds)).toBe(460); // 严格 > max → 压回 max
    expect(clampHeight(460, bounds)).toBe(460); // 边界 ==
    expect(clampHeight(459.4, bounds)).toBe(460); // ceil 后正好到 max
  });
});