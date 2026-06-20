import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";

const PROJECT_ROOT = "/private/var/www/mindtap";
const GM_PATH = `${PROJECT_ROOT}/src/styles/glassmorphism.css`;

describe("Tailwind v4 CSS migration", () => {
  it("glassmorphism.css has no v3 @tailwind directives", () => {
    const gm = readFileSync(GM_PATH, "utf-8");
    expect(gm).not.toMatch(/@tailwind base/);
    expect(gm).not.toMatch(/@tailwind components/);
    expect(gm).not.toMatch(/@tailwind utilities/);
  });

  it("glassmorphism.css has no v3 @apply bg-background / text-foreground", () => {
    const gm = readFileSync(GM_PATH, "utf-8");
    expect(gm).not.toMatch(/@apply\s+bg-background/);
    expect(gm).not.toMatch(/@apply\s+text-foreground/);
  });

  it("main.tsx imports index.css before glassmorphism.css", () => {
    const main = readFileSync(`${PROJECT_ROOT}/src/main.tsx`, "utf-8");
    const idxImport = main.search(/import\s+["']\.\/index\.css["']/);
    const gmImport = main.search(/import\s+["']\.\/styles\/glassmorphism\.css["']/);
    expect(idxImport).toBeGreaterThan(-1);
    expect(gmImport).toBeGreaterThan(-1);
    expect(idxImport).toBeLessThan(gmImport);
  });

  it("floating/main.tsx imports index.css before glassmorphism.css", () => {
    const floating = readFileSync(`${PROJECT_ROOT}/src/floating/main.tsx`, "utf-8");
    const idxImport = floating.search(/import\s+["']\.\.\/index\.css["']/);
    const gmImport = floating.search(/import\s+["']\.\.\/styles\/glassmorphism\.css["']/);
    expect(idxImport).toBeGreaterThan(-1);
    expect(gmImport).toBeGreaterThan(-1);
    expect(idxImport).toBeLessThan(gmImport);
  });

  it("npm run build completes without bg-background error", () => {
    let output = "";
    let failed = false;
    try {
      output = execFileSync("npm", ["run", "build"], {
        encoding: "utf-8",
        cwd: PROJECT_ROOT,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e: any) {
      failed = true;
      output = (e.stdout ?? "") + (e.stderr ?? "");
    }
    // Build must succeed AND not contain the bg-background error
    expect(output).not.toMatch(/Cannot apply unknown utility class.*bg-background/);
    expect(failed).toBe(false);
  }, 120_000);
});
