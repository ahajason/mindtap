import { describe, it, expect } from "vitest";
import glassCss from "./glass.css?raw";

describe("glass.css · Liquid Glass tokens", () => {
  it("defines --glass-blur with blur() + saturate() (Web 端 Glassic 核心)", () => {
    expect(glassCss).toMatch(/--glass-blur:\s*blur\([^)]+\)\s*saturate\([^)]+\)/);
  });

  it("defines regular --glass-bg translucency (alpha < 1)", () => {
    // rgba 第三/第四参数 = alpha,要求 < 1 但 > 0(不能完全透明,否则 blur 看不到内容)
    expect(glassCss).toMatch(/--glass-bg:\s*rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0?\.\d+\)/);
  });

  it("defines fold / done / empty 三档玻璃 bg token", () => {
    expect(glassCss).toMatch(/--glass-bg-fold:/);
    expect(glassCss).toMatch(/--glass-bg-done:/);
    expect(glassCss).toMatch(/--glass-bg-empty:/);
  });

  it("defines --glass-border (跟浅色背景协调的细描边)", () => {
    expect(glassCss).toMatch(/--glass-border:\s*rgba\(/);
  });

  it("defines ink 三档文字色 (HIG)", () => {
    expect(glassCss).toMatch(/--ink:\s*#/);
    expect(glassCss).toMatch(/--ink-2:\s*#/);
    expect(glassCss).toMatch(/--ink-3:\s*#/);
  });
});

describe("glass.css · dark mode @media 适配", () => {
  it("包含 @media (prefers-color-scheme: dark) 分支", () => {
    expect(glassCss).toMatch(/@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)/);
  });

  it("dark mode override 至少重定义 --ink + --glass-bg + --glass-border", () => {
    // 取 dark block 内容,然后在 block 内查 token 重定义
    const darkMatch = glassCss.match(
      /@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)\s*\{([\s\S]*?)\n\}/,
    );
    expect(darkMatch, "no dark @media block found").toBeTruthy();
    const block = darkMatch![1];
    expect(block).toMatch(/--ink:\s*#[fF]/); // dark 模式文字色要浅(#f5f5f7 等)
    expect(block).toMatch(/--glass-bg:\s*rgba\(/);
    expect(block).toMatch(/--glass-border:\s*rgba\(/);
  });
});