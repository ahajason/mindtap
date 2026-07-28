import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("主窗视觉一致性契约", () => {
  it("主背景与 section 背景由 theme.css 单一 token 控制，body 与 6 个 route 不再硬编码", () => {
    const theme = readFileSync("src/styles/theme.css", "utf8");
    const index = readFileSync("src/index.css", "utf8");
    const layout = readFileSync("src/routes/StyleGuideLayout.tsx", "utf8");
    const surface = readFileSync("src/routes/Surface.tsx", "utf8");
    const button = readFileSync("src/routes/Button.tsx", "utf8");
    const input = readFileSync("src/routes/Input.tsx", "utf8");
    const feedback = readFileSync("src/routes/Feedback.tsx", "utf8");
    const overlay = readFileSync("src/routes/Overlay.tsx", "utf8");
    const tokens = readFileSync("src/routes/Tokens.tsx", "utf8");

    expect(theme).toMatch(/--color-bg-section:\s*rgba\(\s*245,\s*249,\s*255,\s*0\.92\s*\)/);
    expect(index).not.toMatch(/body\s*\{[\s\S]*?background:\s*rgba\(\s*245,\s*249,\s*255,\s*0\.92\s*\)/);
    expect(index).toMatch(/body\s*\{[\s\S]*?background:\s*var\(--color-bg-section\)/);

    for (const file of [layout, surface, button, input, feedback, overlay, tokens]) {
      expect(file).not.toMatch(/bg-white\/95/);
    }
  });

  it("section 背景使用主背景 token 而不是 95% 纯白", () => {
    const surface = readFileSync("src/routes/Surface.tsx", "utf8");
    expect(surface).toMatch(/bg-\[var\(--color-bg-section\)\]/);
  });
});