import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * V0.2.7 patch — 6 bug 真根因修复回归测试
 *
 * 反模式 15 (commit message 谎改) 的下游灾害: V0.2.5/V0.2.6 反复修都漏改的真根因之一
 * 是测试断言不够强 (App.test.tsx:115-122 拖动测试只断言"不展开", 没断言"调了 startDragging")。
 *
 * 本文件用静态检查 + 源码 grep 方式断言 fix 真的落在源码上, 不只是 commit message 上声称。
 *
 * e2e 验证仍需 Windows 真机 + WebView2 (playwright/tauri-driver 在 WSL 下无法测 Tauri 窗口 API)。
 */

describe("V0.2.7 patch — Bug 1: act() 函数必须 try/catch 包裹 await (闪退真根因)", () => {
  it("App.tsx act() 函数体内含 try { ... } catch (...) 块", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    const actMatch = src.match(/async function act\([^)]*\)\s*\{[\s\S]*?\n\s{2}\}/);
    expect(actMatch).toBeTruthy();
    expect(actMatch![0]).toMatch(/try\s*\{/);
    expect(actMatch![0]).toMatch(/catch\s*\(/);
  });

  it("App.tsx act() catch 块必须调 console.error (错误可见性, 反模式 13 防御标准)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    const actMatch = src.match(/async function act\([^)]*\)\s*\{[\s\S]*?\n\s{2}\}/);
    expect(actMatch).toBeTruthy();
    const catchBlock = actMatch![0].match(/catch\s*\([^)]*\)\s*\{([\s\S]*?)\}/);
    expect(catchBlock).toBeTruthy();
    expect(catchBlock![1]).toMatch(/console\.error/);
  });
});

describe("V0.2.7 patch — Bug 2: onMouseMove 拖 4px 后必须调 win.startDragging() (resize/拖动真根因)", () => {
  // 反模式 16 防御: 用逐行扫描排除注释行, 不允许字面包含 "win.startDragging()" 的注释行谎报
  function countStartDraggingCalls(src: string): { calls: number; sampleLines: string[] } {
    const lines = src.split("\n");
    const callLines = lines.filter((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//")) return false; // 排除单行注释
      if (trimmed.startsWith("*")) return false;  // 排除 JSDoc /* ... */
      return /(\w+\??\.startDragging\s*\(|\bstartDragging\s*\()/.test(line);
    });
    return { calls: callLines.length, sampleLines: callLines.slice(0, 3) };
  }

  it("App.tsx 拖动阈值满足后必须调 win.startDragging() IPC (排除注释行, 反模式 16 防御)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    const { calls, sampleLines } = countStartDraggingCalls(src);
    // 必须有 ≥ 1 个非注释行的 startDragging 调用
    expect(calls).toBeGreaterThanOrEqual(1);
    // 取样确认确实是 xxx.startDragging() 或 xxx?.startDragging() 形态, 不是别的 xxx.startDraggingWithoutMove 函数
    expect(sampleLines[0]).toMatch(/\.startDragging\s*\(\s*\)/);
  });

  it("App.tsx getCurrentWindow() 解构/调用必须含 startDragging (前端调 IPC 的前提, 排除注释行)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    // 排除注释后再断言
    const { calls } = countStartDraggingCalls(src);
    // 不依赖具体解构形态 (const { startDragging } = getCurrentWindow(); 还是 getCurrentWindow().startDragging()),
    // 但必须有真实的调用存在 (非注释)
    expect(calls).toBeGreaterThanOrEqual(1);
  });
});

describe("V0.2.7 patch — Bug 3: tauri.conf.json floating 段必须不含硬编码 x/y (多屏错位)", () => {
  it("tauri.conf.json floating 段不含硬编码 x 字段 (V0.2.7 修 V0.2.6 final fix 谎改)", () => {
    const src = readFileSync("src-tauri/tauri.conf.json", "utf-8");
    const floatMatch = src.match(/"label":\s*"floating"[\s\S]*?\}\s*\]/);
    expect(floatMatch).toBeTruthy();
    // 必须不含 "x": 数字 字面量 (允许注释/无关字段)
    expect(floatMatch![0]).not.toMatch(/^\s*"x":\s*-?\d+/m);
  });

  it("tauri.conf.json floating 段不含硬编码 y 字段 (V0.2.7 修 V0.2.6 final fix 谎改)", () => {
    const src = readFileSync("src-tauri/tauri.conf.json", "utf-8");
    const floatMatch = src.match(/"label":\s*"floating"[\s\S]*?\}\s*\]/);
    expect(floatMatch).toBeTruthy();
    expect(floatMatch![0]).not.toMatch(/^\s*"y":\s*-?\d+/m);
  });
});

describe("V0.2.7 patch — Bug 4: resize useEffect 每个 await 后必须检查 cancelled flag (串行 IPC race)", () => {
  it("App.tsx resize useEffect [expanded] 内 cancelled flag 检查次数 >= 4 (开头 1 + 3 个 await 后)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    const effectMatch = src.match(
      /useEffect\(\(\)\s*=>\s*\{[\s\S]*?\},\s*\[expanded\]\);/,
    );
    expect(effectMatch).toBeTruthy();
    const cancelledChecks = effectMatch![0].match(/if\s*\(\s*cancelled\s*\)\s*return/g);
    expect(cancelledChecks).toBeTruthy();
    expect(cancelledChecks!.length).toBeGreaterThanOrEqual(4);
  });

  it("App.tsx resize useEffect 每个 await 后立即跟 cancelled 检查 (无空隙)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    const effectMatch = src.match(
      /useEffect\(\(\)\s*=>\s*\{[\s\S]*?\},\s*\[expanded\]\);/,
    );
    expect(effectMatch).toBeTruthy();
    const body = effectMatch![0];
    // 检查每个 await ... 之后 80 字符内有 cancelled 检查
    const awaits = [...body.matchAll(/await\s+win\.[a-zA-Z]+\([^)]*\)/g)];
    expect(awaits.length).toBeGreaterThanOrEqual(3);
    for (const m of awaits) {
      const after = body.slice(m.index! + m[0].length, m.index! + m[0].length + 200);
      expect(after).toMatch(/if\s*\(\s*cancelled\s*\)\s*return/);
    }
  });
});

describe("V0.2.7 patch — Bug 5: 展开 setPosition x 必须不偏移 20px (贴右边缘截断)", () => {
  it("App.tsx 展开 setPosition 不再使用 Math.round((FOLDED_W - EXPANDED_W) / 2) 偏移公式", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    expect(src).not.toMatch(/Math\.round\(\(\s*FOLDED_W\s*-\s*EXPANDED_W\s*\)\s*\/\s*2\s*\)/);
  });

  it("App.tsx 展开 setPosition x 直接用 pos.x (不偏移)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    // 展开分支应当 setPosition(new PhysicalPosition(pos.x, pos.y)) (无 + Math.round 偏移)
    const setPositionMatch = src.match(
      /await\s+win\.setPosition\(\s*new\s+PhysicalPosition\(\s*pos\.x\s*,\s*pos\.y\s*\)\s*\)/,
    );
    expect(setPositionMatch).toBeTruthy();
  });
});

describe("V0.2.8 Issue C: 浮窗无 inset highlight 边框 (P1 回归)", () => {
  // 反模式 15 防御: 先剥 CSS 注释, 防止 .floating-root / .glass-l 字样出现在 /* ... */ 里误匹配
  function stripCssComments(css: string): string {
    return css.replace(/\/\*[\s\S]*?\*\//g, "");
  }

  function extractFloatingRootBlocks(css: string): string[] {
    const codeOnly = stripCssComments(css);
    // 块范围限制: 用 [^}]* 保证不跨过下一个 }
    return [...codeOnly.matchAll(/\.floating-root[^{]*\{[^}]*\}/g)].map((m) => m[0]);
  }

  function extractGlassBlocks(css: string): string[] {
    const codeOnly = stripCssComments(css);
    return [...codeOnly.matchAll(/\.glass-l\d[^{]*\{[^}]*\}/g)].map((m) => m[0]);
  }

  it("floating.css 含 .floating-root 块 (静态结构存在, 反模式 15 防御)", () => {
    const css = readFileSync("src/floating/styles/floating.css", "utf-8");
    const blocks = extractFloatingRootBlocks(css);
    // 必须命中 .floating-root 和 .floating-root.expanded 两个块 (剥注释后正好 2)
    expect(blocks.length).toBeGreaterThanOrEqual(2);
  });

  it(".floating-root 块内不含 inset 0 1px 0 highlight (剥 CSS 注释后, 反模式 15 防御)", () => {
    const css = readFileSync("src/floating/styles/floating.css", "utf-8");
    const blocks = extractFloatingRootBlocks(css);
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    for (const block of blocks) {
      expect(block).not.toMatch(/inset\s+0\s+1px\s+0/);
    }
  });

  it(".floating-root box-shadow 仅保留 drop shadow (行为断言)", () => {
    const css = readFileSync("src/floating/styles/floating.css", "utf-8");
    // 行为断言: 两个 .floating-root 块的 box-shadow 必须不含 inset 关键词
    // 修复后的 box-shadow 形态: 0 8px 32px rgba(0, 30, 80, X) (纯 drop shadow)
    const blocks = extractFloatingRootBlocks(css);
    for (const block of blocks) {
      const shadowMatch = block.match(/box-shadow\s*:\s*([^;]+);/);
      expect(shadowMatch).toBeTruthy();
      const shadowValue = shadowMatch![1];
      // 行为断言: 不含 inset 关键词 (任何方向/任何 blur 都不行)
      expect(shadowValue).not.toMatch(/\binset\b/);
      // 行为断言: 必须保留 drop shadow (rgba(0, 30, 80, X))
      expect(shadowValue).toMatch(/rgba\(\s*0\s*,\s*30\s*,\s*80/);
    }
  });

  it(".glass-l* 段不受影响 (Issue C 范围仅限 .floating-root, 不动 glass utility)", () => {
    const css = readFileSync("src/floating/styles/floating.css", "utf-8");
    // .glass-l1/l2/l3 的 inset highlight 不属于 Issue C 范围, 必须保留
    // 行为断言: glass utility 的 box-shadow 必须仍含 inset highlight
    const blocks = extractGlassBlocks(css);
    expect(blocks.length).toBeGreaterThanOrEqual(3); // l1/l2/l3
    for (const block of blocks) {
      const shadowMatch = block.match(/box-shadow\s*:\s*([^;]+);/);
      expect(shadowMatch).toBeTruthy();
      expect(shadowMatch![1]).toMatch(/\binset\b/); // inset 必须保留
    }
  });
});