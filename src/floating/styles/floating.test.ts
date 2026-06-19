import { describe, it, expect } from "vitest";
import floatCss from "./floating.css?raw";

describe("floating.css · 浮窗根容器 Liquid Glass", () => {
  it(".floating-root 应用 backdrop-filter(展开态根容器 Web 端 Glassic 必备)", () => {
    // 删 set_as_panel 后 macOS 失去 NSVisualEffectView 模糊,
    // 改用 Web CSS backdrop-filter 兜底 —— .floating-root 必须挂上
    expect(floatCss).toMatch(/\.floating-root\s*\{[\s\S]*?backdrop-filter/);
  });

  it(".floating-root 也挂 -webkit-backdrop-filter (WebKit 兼容)", () => {
    expect(floatCss).toMatch(/\.floating-root\s*\{[\s\S]*?-webkit-backdrop-filter/);
  });

  it(".floating-root 背景用 var(--glass-bg) token(动态适配 light/dark mode)", () => {
    // 展开态根容器背景必须走 token,不能写死 rgba,
    // 否则 dark mode override 改 token 时浮窗展开态不变色
    expect(floatCss).toMatch(/\.floating-root\s*\{[\s\S]*?background:\s*var\(--glass-bg\)/);
  });

  it(".floating-root 有 border-radius(玻璃圆角轮廓)", () => {
    expect(floatCss).toMatch(/\.floating-root\s*\{[\s\S]*?border-radius:/);
  });

  it(".floating-root 有 box-shadow(玻璃悬浮投影)", () => {
    expect(floatCss).toMatch(/\.floating-root\s*\{[\s\S]*?box-shadow:/);
  });
});