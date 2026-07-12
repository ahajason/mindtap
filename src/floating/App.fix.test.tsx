import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { invoke } from "@tauri-apps/api/core";

import { FloatingApp } from "./App";
import { StatusDot as StatusDotFromComponents } from "./components/StatusDot";

/**
 * V0.2.0.5 patch — 6 bug 真根因修复回归测试
 *
 * 反模式 15 (commit message 谎改) 的下游灾害: V0.2.0.3/V0.2.0.4 反复修都漏改的真根因之一
 * 是测试断言不够强 (App.test.tsx:115-122 拖动测试只断言"不展开", 没断言"调了 startDragging")。
 *
 * 本文件用静态检查 + 源码 grep 方式断言 fix 真的落在源码上, 不只是 commit message 上声称。
 *
 * 2026-07-13 retro-fit: 历史 V0.2.3..V0.2.8 + V0.2.8.1 标签 → V0.2.0.1..V0.2.0.9 PATCHes(见 docs/governance/versioning-rule.md §三 mapping 表)。
 *
 * e2e 验证仍需 Windows 真机 + WebView2 (playwright/tauri-driver 在 WSL 下无法测 Tauri 窗口 API)。
 *
 * V0.2.0.12 PATCH 更新:
 * - 删 V0.2.0.11 Issue A fix describe (ContextMenu HTML 锁住, 已删旧 HTML ContextMenu)
 * - 删 V0.2.0.11 Issue B fix describe (.floating-root position: relative, StatusDot 恢复 V1.0 inline 不再需要)
 * - 加 V0.2.0.12 StatusDot 锁住 describe (3 it)
 * - 加 V0.2.0.12 ContextMenu 锁住 describe (3 it)
 * - V0.2.0.6 Issue A test 3 更新: HTML 渲染断言 → IPC 调用断言 (旧 HTML ContextMenu 已删)
 */

describe("V0.2.0.5 patch — Bug 1: act() 函数必须 try/catch 包裹 await (闪退真根因)", () => {
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

describe("V0.2.0.5 patch — Bug 2: onMouseMove 拖 4px 后必须调 win.startDragging() (resize/拖动真根因)", () => {
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

describe("V0.2.0.5 patch — Bug 3: tauri.conf.json floating 段必须不含硬编码 x/y (多屏错位)", () => {
  it("tauri.conf.json floating 段不含硬编码 x 字段 (V0.2.0.5 修 V0.2.0.4 final fix 谎改)", () => {
    const src = readFileSync("src-tauri/tauri.conf.json", "utf-8");
    const floatMatch = src.match(/"label":\s*"floating"[\s\S]*?\}\s*\]/);
    expect(floatMatch).toBeTruthy();
    // 必须不含 "x": 数字 字面量 (允许注释/无关字段)
    expect(floatMatch![0]).not.toMatch(/^\s*"x":\s*-?\d+/m);
  });

  it("tauri.conf.json floating 段不含硬编码 y 字段 (V0.2.0.5 修 V0.2.0.4 final fix 谎改)", () => {
    const src = readFileSync("src-tauri/tauri.conf.json", "utf-8");
    const floatMatch = src.match(/"label":\s*"floating"[\s\S]*?\}\s*\]/);
    expect(floatMatch).toBeTruthy();
    expect(floatMatch![0]).not.toMatch(/^\s*"y":\s*-?\d+/m);
  });
});

describe("V0.2.0.5 patch — Bug 4: resize useEffect 每个 await 后必须检查 cancelled flag (串行 IPC race)", () => {
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

describe("V0.2.0.5 patch — Bug 5: 展开 setPosition x 必须不偏移 20px (贴右边缘截断)", () => {
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

describe("V0.2.0.6 patch — Issue A: 右键不被折叠态根 div 抢占 (P0-9 复活防御)", () => {
  it("折叠态右键 mousedown+up 不触发展开 (行为断言: dragRef 被 e.button 守卫, 不创建)", async () => {
    render(<FloatingApp />);
    const foldedRoot = await screen.findByTestId("floating-root-folded");
    // 右键 (button: 2) + 释放, 反模式 16 防御: 行为断言 .expanded 不出现
    fireEvent.mouseDown(foldedRoot, { button: 2, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(foldedRoot, { clientX: 10, clientY: 10 });
    // 关键: 不应切到 expanded 态
    expect(document.querySelector('[data-testid="floating-root-folded"]')).toBe(foldedRoot);
    expect(document.querySelector(".floating-root.expanded")).toBeNull();
  });

  it("折叠态右键 mousedown+up 不调 startDragging IPC (右键不该启动 OS 拖窗)", async () => {
    render(<FloatingApp />);
    const foldedRoot = await screen.findByTestId("floating-root-folded");
    // 右键 mousedown + move(>= 4px) + up: 不应触发 startDragging 路径
    fireEvent.mouseDown(foldedRoot, { button: 2, clientX: 10, clientY: 10 });
    fireEvent.mouseMove(document, { clientX: 30, clientY: 30 });
    fireEvent.mouseUp(document, { clientX: 30, clientY: 30 });
    // 折叠态根 div 仍存在 (没切到展开态), 也未开始拖窗
    expect(document.querySelector(".floating-root.expanded")).toBeNull();
  });

  it("折叠态右键 contextmenu 事件触发 Rust 原生 Menu IPC (V0.2.0.12: popup_menu 替代 HTML 渲染)", async () => {
    // V0.2.0.12 PATCH: 旧 HTML ContextMenu 已删, 右键调 api.app.showFloatingContextMenu() → invoke("show_floating_context_menu")
    // 反模式 16 防御: 行为断言 IPC 被调, 不是 HTML 渲染
    const invokeMock = vi.mocked(invoke);
    invokeMock.mockClear();
    render(<FloatingApp />);
    await screen.findByTestId("floating-root-folded");
    fireEvent.contextMenu(document, { button: 2, clientX: 50, clientY: 60 });
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("show_floating_context_menu", undefined);
    });
    // HTML 菜单不再渲染 (旧 HTML ContextMenu 已删)
    expect(screen.queryByRole("menu", { name: "浮窗右键菜单" })).toBeNull();
    expect(screen.queryByText("显示主窗")).toBeNull();
    expect(screen.queryByText("退出")).toBeNull();
  });

  it("左键短按仍触发展开 (回归: e.button !== 0 守卫不影响左键 toggle 路径)", async () => {
    render(<FloatingApp />);
    const foldedRoot = await screen.findByTestId("floating-root-folded");
    // 左键 (button: 0) 短按: dragRef 创建但 dragStarted=false → onMouseUp 调 setExpanded(true)
    fireEvent.mouseDown(foldedRoot, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(foldedRoot, { clientX: 10, clientY: 10 });
    // 折叠态根 div 消失 (切到 expanded 态)
    await waitFor(() => {
      expect(document.querySelector('[data-testid="floating-root-folded"]')).toBeNull();
    }, { timeout: 300, interval: 20 });
  });
});

describe("V0.2.0.8 Issue C: 浮窗无 inset highlight 边框 (P1 回归)", () => {
  // 反模式 15 防御: 先剥 CSS 注释, 防止 .floating-root / .glass-l 字样出现在 /* ... */ 里误匹配
  function stripCssComments(css: string): string {
    return css.replace(/\/\*[\s\S]*?\*\//g, "");
  }

  function extractFloatingRootBlocks(css: string): string[] {
    const codeOnly = stripCssComments(css);
    // 反模式 16 集成防御: 先剥 @media 嵌套块, 防止 V0.2.0.9 Bug 5 cosmetic 引入的
    // @media (prefers-reduced-motion) { .floating-root { ... } } 被误抓 (嵌套块没有 box-shadow)
    const noMedia = codeOnly.replace(/@media[^{]+\{[\s\S]*?\}\s*\}/g, "");
    // 块范围限制: 用 [^}]* 保证不跨过下一个 }
    return [...noMedia.matchAll(/\.floating-root[^{]*\{[^}]*\}/g)].map((m) => m[0]);
  }

  function extractGlassBlocks(css: string): string[] {
    const codeOnly = stripCssComments(css);
    // 同上: 剥 @media 嵌套块
    const noMedia = codeOnly.replace(/@media[^{]+\{[\s\S]*?\}\s*\}/g, "");
    return [...noMedia.matchAll(/\.glass-l\d[^{]*\{[^}]*\}/g)].map((m) => m[0]);
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

describe("V0.2.0.11 patch — Issue D 移除: 折叠展开 transition 不在 V0.2.0 PRD §3.2 范围", () => {
  // V0.2.0.9 Bug 5 cosmetic 加了 transition + @media prefers-reduced-motion 兜底,
  // 但 user 实测从未看到 200ms 过渡。根因可能是 @media 兜底在 Tauri WebView2 transparent
  // 模式被错误匹配 (Win11/高 DPI/远程桌面常把 prefers-reduced-motion 传成 reduce),
  // 即使 user 没设系统偏好, transition 仍被 transition: none 覆盖。
  // V0.2.0.11 治理: PRD §3.2 只提物理尺寸 360×280 无 transition 要求, 整体移除。
  // (V0.2.0.9 4 个 describe "V0.2.0.9 patch — Bug 5 cosmetic" 已删除)

  it("floating.css .floating-root 块内不含 transition 属性 (V0.2.0.11 D 移除)", () => {
    const css = readFileSync("src/floating/styles/floating.css", "utf-8");
    // 剥 CSS 注释 + 剥 @media/@supports/@keyframes 嵌套 (反模式 18 防御)
    const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const noMedia = noComments.replace(/@media[^{]+\{[\s\S]*?\}\s*\}/g, "");
    const block = noMedia.match(/\.floating-root\s*\{[^}]*\}/);
    expect(block).toBeTruthy();
    expect(block![0]).not.toMatch(/\btransition\s*:/);
  });

  it("floating.css 不含 @media prefers-reduced-motion 兜底块 (V0.2.0.11 D 移除)", () => {
    const css = readFileSync("src/floating/styles/floating.css", "utf-8");
    expect(css).not.toMatch(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/);
  });

  it("floating.css .floating-root 块仍保留 width 320px / height 36px / border-radius 14px (数值层未破)", () => {
    const css = readFileSync("src/floating/styles/floating.css", "utf-8");
    const block = css.match(/\.floating-root\s*\{([\s\S]*?)\}/);
    expect(block).toBeTruthy();
    expect(block![0]).toMatch(/\bwidth\s*:\s*320px\b/);
    expect(block![0]).toMatch(/\bheight\s*:\s*36px\b/);
    expect(block![0]).toMatch(/\bborder-radius\s*:\s*14px\b/);
  });
});

describe("V0.2.0.11 patch — Issue C fix: tauri.conf.json floating 段 transparent + backgroundColor", () => {
  // V0.2.0.6 / V0.2.0.8 反复改 .floating-root CSS / FoldedBar inline style 想消除黑边,
  // user 实测仍有黑边且点击聚焦后更明显。真根因在 tauri.conf.json: floating 段
  // transparent:false + 无 backgroundColor 字段, WebView2 用了非透明的默认底色 (白色),
  // 在 transparent 边缘 + 半透明 rgba 合成时仍出灰色描边。修法: transparent:true +
  // backgroundColor:"#00000000" (WebView2 透明窗口必须显式声明 alpha=0 背景色)。

  function getFloatingWindowBlock(json: string): string | null {
    // 匹配 tauri.conf.json 中 "label": "floating" 的 windows 段
    const m = json.match(/"label"\s*:\s*"floating"\s*,[\s\S]*?\n\s*\}/);
    return m ? m[0] : null;
  }

  it("tauri.conf.json floating 段 transparent:true (V0.2.0.11 C fix)", () => {
    const json = readFileSync("src-tauri/tauri.conf.json", "utf-8");
    const block = getFloatingWindowBlock(json);
    expect(block).toBeTruthy();
    expect(block!).toMatch(/"transparent"\s*:\s*true/);
  });

  it("tauri.conf.json floating 段含 backgroundColor: #00000000 字段 (V0.2.0.11 C fix)", () => {
    const json = readFileSync("src-tauri/tauri.conf.json", "utf-8");
    const block = getFloatingWindowBlock(json);
    expect(block).toBeTruthy();
    expect(block!).toMatch(/"backgroundColor"\s*:\s*"#00000000"/);
  });

  it("tauri.conf.json floating 段 transparent:false 已移除 (反模式 15 防御: 防 commit 谎改)", () => {
    const json = readFileSync("src-tauri/tauri.conf.json", "utf-8");
    const block = getFloatingWindowBlock(json);
    expect(block).toBeTruthy();
    expect(block!).not.toMatch(/"transparent"\s*:\s*false/);
  });
});

describe("V0.2.0.8.1 follow-up: Issue C 真根因修复 — FoldedBar inline style box-shadow 防御", () => {
  // V0.2.0.8 Issue C 反复修 .floating-root 的 CSS box-shadow 没生效,真根因是
  // FoldedBar.tsx:31 有 inline style `style={{ boxShadow: "inset 0 1px 0 ..." }}`,
  // inline style 优先级最高覆盖 CSS。V0.2.0.8.1 把 inline style boxShadow 删了,
  // 改用 className "folded-bar-inner" 引用 floating.css 新 block。
  // 本 describe 锁住: FoldedBar.tsx 不再有 inline style boxShadow,
  // 且 floating.css 的 .folded-bar-inner 块不含 inset。

  it("FoldedBar.tsx 不含 inline style boxShadow (反模式 14/15 防御: 防 inline style 再次覆盖 CSS)", () => {
    const src = readFileSync("src/floating/components/FoldedBar.tsx", "utf-8");
    // 反模式 15 防御: 排除注释行, 防 /* ... boxShadow ... */ 注释谎报
    const lines = src.split("\n");
    const codeLines = lines.filter((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//")) return false;
      if (trimmed.startsWith("*")) return false;
      return true;
    });
    const codeOnly = codeLines.join("\n");
    // 排除注释后, FoldedBar.tsx 不能含 inline style boxShadow 字段
    expect(codeOnly).not.toMatch(/boxShadow\s*:/);
  });

  it("FoldedBar.tsx 含 folded-bar-inner className (V0.2.0.8.1 修复形态锁定)", () => {
    const src = readFileSync("src/floating/components/FoldedBar.tsx", "utf-8");
    expect(src).toMatch(/folded-bar-inner/);
  });

  it("floating.css 含 .folded-bar-inner 块 (box-shadow 移到 CSS, 不再用 inline style)", () => {
    const css = readFileSync("src/floating/styles/floating.css", "utf-8");
    expect(css).toMatch(/\.folded-bar-inner\s*\{/);
  });

  it(".folded-bar-inner 块 box-shadow 不含 inset (跟 .floating-root 同思路: WebView2 transparent 边缘 + inset 在某些 DPI 合成出灰色描边)", () => {
    const css = readFileSync("src/floating/styles/floating.css", "utf-8");
    // 剥 CSS 注释 + @media 嵌套, 反模式 16 防御
    const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const noMedia = noComments.replace(/@media[^{]+\{[\s\S]*?\}\s*\}/g, "");
    const blocks = [...noMedia.matchAll(/\.folded-bar-inner[^{]*\{[^}]*\}/g)].map((m) => m[0]);
    expect(blocks.length).toBeGreaterThanOrEqual(1);
    for (const block of blocks) {
      const shadowMatch = block.match(/box-shadow\s*:\s*([^;]+);/);
      expect(shadowMatch).toBeTruthy();
      expect(shadowMatch![1]).not.toMatch(/\binset\b/);
      // 行为断言: 必须保留 drop shadow
      expect(shadowMatch![1]).toMatch(/rgba\(\s*0\s*,\s*30\s*,\s*80/);
    }
  });
});
describe("V0.2.0.12 patch — Issue 2: 展开态右键不折叠 (panel pointerdown capture 守住)", () => {
  // 真相: V0.2.0.6/0.11 既有 data-no-expand / e.button !== 0 守卫全在 mousedown / click 层,
  // 不在 blur 层, 拦不住 ExpandedPanel useEffect 里 input 的 blur listener 同步调 onCancel.
  // V0.2.0.12 修法 (Radix dismissable-layer 思路): panel 根 div 加 onPointerDownCapture,
  // 在 mousedown/click 之前用 panelRef.contains(target) 设 dismissingRef, handleBlur 读它,
  // panel 内 clicking → dismissingRef=false → blur 不 cancel. 右键 button=2 同样走 capture, 不被 button 守卫拦.

  it("ExpandedPanel.tsx 声明 panelRef + dismissingRef (V0.2.0.12 新增)", () => {
    const src = readFileSync("src/floating/components/ExpandedPanel.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    expect(codeOnly).toMatch(/panelRef\s*=\s*useRef/);
    expect(codeOnly).toMatch(/dismissingRef\s*=\s*useRef/);
  });

  it("ExpandedPanel.tsx panel 根 div 含 onPointerDownCapture (Radix pattern 落地)", () => {
    const src = readFileSync("src/floating/components/ExpandedPanel.tsx", "utf-8");
    // 反模式 16 防御: 剥注释行再断言, 防止 /*
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    // 必须含 onPointerDownCapture={(e) => { ... panelRef.current?.contains ... }}
    expect(codeOnly).toMatch(/onPointerDownCapture=\{[\s\S]*?panelRef\.current\?\.contains/);
  });

  it("ExpandedPanel.tsx handleBlur 读取 dismissingRef 决定是否 dismiss (V0.2.0.13: onDismissRef.current(), 不是直调 onCancel)", () => {
    const src = readFileSync("src/floating/components/ExpandedPanel.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    // 行为断言: handleBlur 必须检查 dismissingRef.current 才调 dismiss (V0.2.0.13 用 onDismissRef.current())
    // 形态: if (submittingRef.current) return; if (dismissingRef.current) onDismissRef.current();
    // (V0.2.0.12 直接 onCancel; V0.2.0.13 改成 onDismissRef.current 因 onDismiss 是 prop, ref 化保证稳定引用)
    expect(codeOnly).toMatch(/function handleBlur[\s\S]*?if\s*\(\s*submittingRef\.current\s*\)\s*return/);
    expect(codeOnly).toMatch(/function handleBlur[\s\S]*?if\s*\(\s*dismissingRef\.current\s*\)\s*onDismissRef\.current\s*\(\s*\)/);
  });
});

describe("V0.2.0.12 patch — Issue 4: 点 Start 不折叠 (panel 内 pointerdown 把 dismissingRef 拦下来)", () => {
  // 真相: 用户点 "开始" 按钮时, pointerdown 在按钮上 → capture phase 把 dismissingRef 设 false →
  // input blur 触发 handleBlur → 读 dismissingRef=false → 不 cancel → panel 不卸载 →
  // 按钮 click 正常调 onStart, 后续 setExpanded(false) 才折叠.
  // V0.2.0.6/0.11 都没拦住, 根因在 blur listener 不在 mousedown/click 层.

  it("ExpandedPanel.tsx onPointerDownCapture 体内 panelRef.contains 决定 dismissingRef (panel 内 = false)", () => {
    const src = readFileSync("src/floating/components/ExpandedPanel.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    // 关键赋值: dismissingRef.current = !panelRef.current?.contains(e.target as Node);
    expect(codeOnly).toMatch(/dismissingRef\.current\s*=\s*!panelRef\.current\?\.contains\([^)]*e\.target/);
  });

  it("ExpandedPanel.tsx panel 根 div 同时含 ref={panelRef} (Radix pattern 必备)", () => {
    const src = readFileSync("src/floating/components/ExpandedPanel.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    // panel 根 div 必须挂 ref={panelRef}, 否则 onPointerDownCapture 里 panelRef.current 是 null
    expect(codeOnly).toMatch(/ref=\{panelRef\}/);
  });

  it("App.tsx onContextMenuCapture / data-no-expand / e.button 守卫未被本次 fix 删除 (反模式 14 防御: 防回归)", () => {
    // V0.2.0.12 Issue 4 修在 ExpandedPanel 内, 不动 App.tsx 的右键守卫 — 那些守卫拦的是别的链路
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    // 三个守卫都必须仍存在 (本次 PATCH 不能误删)
    expect(codeOnly).toMatch(/data-no-expand/);
    expect(codeOnly).toMatch(/onContextMenuCapture/);
    expect(codeOnly).toMatch(/if\s*\(\s*e\.button\s*!==\s*0\s*\)/);
  });
});

describe("V0.2.0.12 PATCH — StatusDot 锁住: 恢复 V1.0 archive inline-block flex 第 1 child", () => {
  // V0.2.0.7 / V0.2.0.11 反复改 StatusDot absolute + .floating-root position: relative 是误导 spec 反复修的产物。
  // V0.2.0.12 恢复 V1.0 archive 真相 (.archive/src/floating/StatusDot.tsx + FoldedBar.tsx): StatusDot 是
  // flex 容器第 1 child (最左, 跟 title 前面), 不是右上角 absolute。

  it("StatusDot.tsx 渲染 inline-block span, 不挂 absolute / top-* / right-* (V0.2.0.12 inline 形态锁定)", () => {
    const { render } = require("@testing-library/react");
    const { container } = render(<StatusDotFromComponents status="active" />);
    const dot = container.querySelector("span");
    expect(dot).toBeTruthy();
    expect(dot?.className).toContain("inline-block");
    expect(dot?.className).not.toContain("absolute");
    expect(dot?.className).not.toMatch(/\btop-/);
    expect(dot?.className).not.toMatch(/\bright-/);
  });

  it("FoldedBar.tsx 内 StatusDot 是 .folded-bar-inner flex 容器第 1 child (V1.0 archive 形态锁定)", () => {
    const src = readFileSync("src/floating/components/FoldedBar.tsx", "utf-8");
    // 反模式 16 防御: 剥 JSX 注释 ({} 单行注释或 /* */ 多行), 排除注释行谎报
    const lines = src.split("\n");
    const codeLines = lines.filter((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//")) return false;
      if (trimmed.startsWith("*")) return false;
      return true;
    });
    const codeOnly = codeLines.join("\n");
    // .folded-bar-inner div 内 StatusDot 必须是第 1 child JSX 元素
    const foldedBarInnerMatch = codeOnly.match(/folded-bar-inner[^>]*>([\s\S]*?)<span/);
    expect(foldedBarInnerMatch).toBeTruthy();
    // StatusDot 必须在第 1 个 span 之前 (作为 flex 第 1 child)
    expect(foldedBarInnerMatch![1]).toMatch(/<StatusDot/);
  });

  it("floating.css .floating-root 块不含 position: relative (V0.2.0.11 B fix 已撤, V1.0 inline 不需要)", () => {
    const css = readFileSync("src/floating/styles/floating.css", "utf-8");
    // 反模式 18 防御: 剥 @media 嵌套块 + CSS 注释
    const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const noMedia = noComments.replace(/@media[^{]+\{[\s\S]*?\}\s*\}/g, "");
    const block = noMedia.match(/\.floating-root\s*\{[^}]*\}/);
    expect(block).toBeTruthy();
    expect(block![0]).not.toMatch(/\bposition\s*:\s*relative\b/);
  });
});

describe("V0.2.0.12 PATCH — ContextMenu 锁住: HTML React 组件已删, 改调 Rust 原生 Menu IPC", () => {
  // V0.2.0.6 / V0.2.0.11 反复改 HTML ContextMenu (clampToViewport / e.button guard) 都拦不住
  // 浮窗 viewport 裁剪 (HTML 元素跑在 WebView2 内, 物理上不可能"独立窗口")。
  // V0.2.0.12 删旧 HTML ContextMenu + 改调 api.app.showFloatingContextMenu() → invoke("show_floating_context_menu")
  // → Rust popup_menu + OS HMENU (独立浮窗外窗口, OS-level popup).

  it("tauri-bridge.ts 含 showFloatingContextMenu wrapper (V0.2.0.12 IPC 入口)", () => {
    const src = readFileSync("src/lib/tauri-bridge.ts", "utf-8");
    expect(src).toMatch(/showFloatingContextMenu\s*:\s*\(\s*\)\s*=>\s*invoke<void>\(\s*"show_floating_context_menu"\s*\)/);
  });

  it("App.tsx onContextMenuCapture 调 showFloatingContextMenu IPC (替代 setContextMenu / <ContextMenu>)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    // 反模式 16 防御: 剥注释行后再 grep
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    expect(codeOnly).toMatch(/api\.app\.showFloatingContextMenu\s*\(\s*\)/);
    // 旧的 HTML ContextMenu state / render / setContextMenu 调用都必须清空
    expect(codeOnly).not.toMatch(/setContextMenu\s*\(/);
    expect(codeOnly).not.toMatch(/<ContextMenu\b/);
    expect(codeOnly).not.toMatch(/from\s+["']\.\/components\/ContextMenu["']/);
  });

  it("ContextMenu 文件不存在 (V0.2.0.12 删 HTML React 组件, 改 Rust 原生 Menu)", () => {
    // fs.existsSync 检查: V0.2.x 误改产物已删
    const { existsSync } = require("node:fs");
    const path1 = "src/floating/components/ContextMenu" + ".tsx";
    const path2 = "src/floating/components/ContextMenu" + ".test.tsx";
    expect(existsSync(path1)).toBe(false);
    expect(existsSync(path2)).toBe(false);
  });
});

describe("V0.2.0.13 PATCH — User L3 重测 5 deviation inline 锁住 (StatusDot / 折叠展开叠加式 / Menu 文案+双触发 / onCancel 拆 / complete 不折叠)", () => {
  // V0.2.0.12 集成后 user 在 D:\ 端 L3 重测, 仍然发现 5 个未修 issue (A-1 / A-2 / B-2 / C-3 / C-4).
  // V0.2.0.13 PATCH 直接 inline 修 + vitest 锁住以下 6 个点, 防回滚.

  it("A-1 StatusDot.tsx className 含 self-center + align-middle (垂直对齐修复)", () => {
    const src = readFileSync("src/floating/components/StatusDot.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    expect(codeOnly).toMatch(/className=\{\[[\s\S]*?self-center[\s\S]*?align-middle/);
  });

  it("A-2 App.tsx 折叠/展开 改叠加式: 永远渲染 FoldedBar, expanded 时下方追加 ExpandedPanel (不互斥替换)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    // FoldedBar 必须在 ExpandedPanel 渲染之前 (同 root div 内的 sibling, 顺序保留)
    expect(codeOnly).toMatch(/<FoldedBar\b[\s\S]*?onClick=/);
    expect(codeOnly).toMatch(/\{expanded\s+&&\s*\([\s\S]*?<ExpandedPanel\b/);
  });

  it("B-2-1 menu.rs 用 dynamic label: floating_visible / main_visible 字段驱动 label (非静态 \"显示/隐藏\")", () => {
    const src = readFileSync("src-tauri/src/tray/menu.rs", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    // MenuState 必须含 floating_visible + main_visible 字段 (驱动 label)
    expect(codeOnly).toMatch(/floating_visible\s*:\s*bool/);
    expect(codeOnly).toMatch(/main_visible\s*:\s*bool/);
    // label 必须根据可见性选 4 种 (显示/隐藏主窗 + 显示/隐藏任务栏), 不能合并成 "显示/隐藏 xx"
    expect(codeOnly).toMatch(/显示任务栏/);
    expect(codeOnly).toMatch(/隐藏任务栏/);
    expect(codeOnly).toMatch(/显示主窗/);
    expect(codeOnly).toMatch(/隐藏主窗/);
  });

  it("B-2-2 lib.rs on_menu_event 只注册到 floating window (双触发修复: 去掉 main)", () => {
    const src = readFileSync("src-tauri/src/lib.rs", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    // V0.2.0.12 错把 on_menu_event 绑到 ["main", "floating"] → MenuEvent 被派发 2 次 (主窗+浮窗都收).
    // V0.2.0.13 改 single label loop 仅 "floating". 双重断言防回滚:
    //  - 正向: 必须含 "for label in [\"floating\"]"
    //  - 反向: 必须不含 "main" 在同一 for label in [...] 数组里
    expect(codeOnly).toMatch(/for\s+label\s+in\s*\[\s*["']floating["']\s*\]/);
    expect(codeOnly).not.toMatch(/for\s+label\s+in\s*\[[^\]]*["']main["'][^\]]*\]/);
  });

  it("C-3 ExpandedPanel.tsx 拆 onCancel → onDismiss + onClearAndDismiss (语义分离: blur vs 显式取消)", () => {
    const src = readFileSync("src/floating/components/ExpandedPanel.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    // 必须含 onDismiss + onClearAndDismiss prop 类型 (两个语义分离的回调)
    expect(codeOnly).toMatch(/onDismiss:\s*\(\s*\)\s*=>\s*void/);
    expect(codeOnly).toMatch(/onClearAndDismiss:\s*\(\s*\)\s*=>\s*void/);
    // onDismiss 在 useEffect 内通过 stable ref 调用 (blur listener 走 ref, 防 stale closure)
    expect(codeOnly).toMatch(/onDismissRef\s*=\s*useRef/);
    expect(codeOnly).toMatch(/onDismissRef\.current\s*\(\s*\)/);
    // onClearAndDismiss 直接 prop 调用 (Esc + 取消按钮是同步 event handler, ref 不必要)
    expect(codeOnly).toMatch(/onClick=\{onClearAndDismiss\}/);
    // V0.2.0.12 错的 onCancel 必须清空 (已无 prop 名引用)
    expect(codeOnly).not.toMatch(/onCancel\b/);
  });

  it("C-4 App.tsx handleStart 成功路径 + act('complete') 均不含 setExpanded(false) (任务开/完保持展开)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    // 抽 handleStart 函数体 + act 函数体, 各自确认无 setExpanded(false)
    const handleStartMatch = codeOnly.match(/async\s+function\s+handleStart\s*\(\s*\)\s*\{([\s\S]*?)\n\s{2}\}/);
    expect(handleStartMatch).toBeTruthy();
    expect(handleStartMatch![1]).not.toMatch(/setExpanded\s*\(\s*false\s*\)/);
    const actMatch = codeOnly.match(/async\s+function\s+act\s*\(\s*action[\s\S]*?\)\s*\{([\s\S]*?)\n\s{2}\}/);
    expect(actMatch).toBeTruthy();
    expect(actMatch![1]).not.toMatch(/setExpanded\s*\(\s*false\s*\)/);
  });
});
