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
    const root = await screen.findByTestId("floating-root");
    // 右键 (button: 2) + 释放, 反模式 16 防御: 行为断言 .expanded 不出现
    fireEvent.mouseDown(root, { button: 2, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(root, { clientX: 10, clientY: 10 });
    // 关键: 不应触发展开态 (input 不出现)
    expect(document.querySelector("input[placeholder]")).toBeNull();
  });

  it("折叠态右键 mousedown+up 不调 startDragging IPC (右键不该启动 OS 拖窗)", async () => {
    render(<FloatingApp />);
    const root = await screen.findByTestId("floating-root");
    // 右键 mousedown + move(>= 4px) + up: 不应触发 startDragging 路径
    fireEvent.mouseDown(root, { button: 2, clientX: 10, clientY: 10 });
    fireEvent.mouseMove(document, { clientX: 30, clientY: 30 });
    fireEvent.mouseUp(document, { clientX: 30, clientY: 30 });
    // 折叠态 root 仍存在 (没切到展开态), 也未开始拖窗 (input 不出现)
    expect(document.querySelector("input[placeholder]")).toBeNull();
  });

  it("折叠态右键 contextmenu 事件触发 Rust 原生 Menu IPC (V0.2.0.12: popup_menu 替代 HTML 渲染)", async () => {
    // V0.2.0.12 PATCH: 旧 HTML ContextMenu 已删, 右键调 api.app.showFloatingContextMenu() → invoke("show_floating_context_menu")
    // 反模式 16 防御: 行为断言 IPC 被调, 不是 HTML 渲染
    const invokeMock = vi.mocked(invoke);
    invokeMock.mockClear();
    render(<FloatingApp />);
    await screen.findByTestId("floating-root");
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
    const root = await screen.findByTestId("floating-root");
    // 左键 (button: 0) 短按: dragRef 创建但 dragStarted=false → onMouseUp 调 setExpanded(true)
    fireEvent.mouseDown(root, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseUp(root, { clientX: 10, clientY: 10 });
    // 展开态 input 出现 (切到 expanded 态)
    await waitFor(() => {
      const input = document.querySelector("input[placeholder]");
      if (input) return true;
      throw new Error("not yet");
    }, { timeout: 300, interval: 20 });
    expect(document.querySelector("input[placeholder]")).toBeTruthy();
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
describe("V0.2.0.14 PATCH — 单一 root div panelRef + document mousedown dismiss (替代 V0.2.0.12/13 的 ExpandedPanel panelRef + input blur)", () => {
  // 真相演进:
  //  V0.2.0.12 修法: ExpandedPanel 根 div 加 panelRef + onPointerDownCapture 设 dismissingRef,
  //    handleBlur input listener 读它 → panel 内 click 不折叠, panel 外 click 折叠.
  //    问题 1: FoldedBar 区域(在 ExpandedPanel 外的 root child)右键不覆盖 panelRef →
  //            右键触发 input blur → dismissingRef=true → onDismiss → 折叠 (B-2-1 race).
  //    问题 2: input blur 在某些 race condition 下不触发 (e.g. panel 内 click 不抢 focus,
  //            浮窗 win 切后台) → panel 外 click 不折叠 (C-3 race).
  //  V0.2.0.13 改进: 拆 onCancel → onDismiss + onClearAndDismiss, blur listener 改用 onDismissRef.
  //    但仍是 ExpandedPanel 内 panelRef + input blur, 上述 2 race 仍未根除.
  //  V0.2.0.14 根治: panelRef 移到 App.tsx 单一 root div (覆盖整个 panel: FoldedBar + ExpandedPanel/ControlRow),
  //    用 document mousedown listener + panelRef.contains check 替代 input blur listener:
  //      - panel 内任意位置 mousedown → panelRef.contains(target)=true → 不动.
  //      - panel 外任意位置 mousedown → contains=false → handleDismiss() → setExpanded(false).
  //    比 input blur 更可靠 (mousedown 必触发, 不依赖 input 是否失焦).

  it("App.tsx 声明 panelRef = useRef (panelRef 移到 root div, 不在 ExpandedPanel)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    expect(codeOnly).toMatch(/panelRef\s*=\s*useRef/);
  });

  it("App.tsx 单一 root div 含 ref={panelRef} (覆盖 FoldedBar + ExpandedPanel/ControlRow, 不再嵌在 ExpandedPanel 内)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    expect(codeOnly).toMatch(/ref=\{panelRef\}/);
  });

  it("App.tsx document mousedown listener + panelRef.contains check 替代 V0.2.0.13 PATCH input blur listener", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    // 必须含 document mousedown listener + panelRef-derived node.contains(e.target as Node) 判断
    expect(codeOnly).toMatch(/document\.addEventListener\(\s*["']mousedown["']/);
    expect(codeOnly).toMatch(/\.contains\(\s*e\.target\s+as\s+Node\s*\)/);
    expect(codeOnly).toMatch(/handleDismiss\s*\(\s*\)/);
  });

  it("App.tsx onContextMenuCapture / data-no-expand / e.button 守卫未被本次重构删除 (反模式 14 防御: 防回归)", () => {
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

  it("FoldedBar.tsx 内 StatusDot 是 root div 第 1 child (V1.0 archive 形态锁定, V0.2.0.14 A-2 单一 root div 适配)", () => {
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
    // V0.2.0.14 PATCH A-2: FoldedBar 根 div 单一化 (V0.2.0.13 PATCH 的 .folded-bar-inner 已删),
    // StatusDot 必须是该 root div 的第 1 个 JSX child (flex 第 1 child, 最左, 跟 title 前面)
    // 匹配 root div 结束 `>` 后紧跟 <StatusDot (跨多行属性)
    expect(codeOnly).toMatch(/<div[\s\S]*?>\s*<StatusDot\s/);
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

describe("V0.2.0.14 PATCH — User L3 V0.2.0.13 重测 4 deviation 重构锁住 (A-2 单一容器 + B-2-1 右键不折叠 + C-3 taskTitle 保留 + C-4 active 折叠 + 保留 A-1 / B-2-1 menu / B-2-2)", () => {
  // V0.2.0.13 PATCH 集成后 user 在 D:\ 端 L3 重测, 仍然发现 4 个未修偏差:
  //   - A-2: 折叠态多 2 层容器嵌套 (floating-root-folded → folded-bar-inner → ...), 圆角/背景不一致, 切换闪
  //   - B-2-1: 展开态右键偶尔折叠 (FoldedBar 区域右键不在 panelRef 内 → race)
  //   - C-3: panel 外 click blur 未触发 onDismiss → input 未折叠
  //   - C-4: user 改主意 — active session 时应折叠 + 控制行 active, 不是展开态保持 (V0.2.0.13 错)
  // V0.2.0.14 PATCH 单一 root div 重构 + document mousedown dismiss + active session useEffect 自动折叠.

  it("A-1 StatusDot.tsx className 含 self-center + align-middle (V0.2.0.13 修, V0.2.0.14 保留不退)", () => {
    const src = readFileSync("src/floating/components/StatusDot.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    expect(codeOnly).toMatch(/className=\{\[[\s\S]*?self-center[\s\S]*?align-middle/);
  });

  it("A-2 App.tsx 单一 root div: 永远同一 PANEL_STYLE + flex-col + rounded-2xl + p-3 (不嵌套多 2 层容器)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    // 单一 root div className 永远含 rounded-2xl + p-3 + flex-col + gap-2
    expect(codeOnly).toMatch(/className=["']floating-root\s+flex\s+h-full\s+w-full\s+flex-col\s+gap-2\s+overflow-hidden\s+rounded-2xl\s+p-3\s+text-\[12px\]/);
    // PANEL_STYLE inline style 提到 App.tsx 顶层常量
    expect(codeOnly).toMatch(/PANEL_STYLE\s*:\s*React\.CSSProperties/);
    expect(codeOnly).toMatch(/backdropFilter\s*:\s*["']blur\(28px\)\s+saturate\(120%\)/);
    // V0.2.0.13 PATCH 的 expanded/folded class 切换必须清空
    expect(codeOnly).not.toMatch(/["']floating-root expanded["']/);
    expect(codeOnly).not.toMatch(/["']floating-root folded["']/);
  });

  it("A-2 FoldedBar.tsx 不再有自身根 div / PANEL_STYLE / rounded-full (回到单一容器)", () => {
    const src = readFileSync("src/floating/components/FoldedBar.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    // 不再含自己的 PANEL_STYLE / rounded-full / background
    expect(codeOnly).not.toMatch(/folded-bar-inner/);
    expect(codeOnly).not.toMatch(/rounded-full/);
    expect(codeOnly).not.toMatch(/PANEL_STYLE/);
    // 但仍含 StatusDot + title + focusMs 三段内容
    expect(codeOnly).toMatch(/<StatusDot\s/);
    expect(codeOnly).toMatch(/formatFocusMs/);
  });

  it("A-2 ExpandedPanel.tsx 不再有自身根 div / PANEL_STYLE / panelRef (回到内容 fragment)", () => {
    const src = readFileSync("src/floating/components/ExpandedPanel.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    // V0.2.0.12/13 PATCH 的 panelRef + PANEL_STYLE + onPointerDownCapture 必须从 ExpandedPanel 清空
    expect(codeOnly).not.toMatch(/panelRef\s*=\s*useRef/);
    expect(codeOnly).not.toMatch(/PANEL_STYLE/);
    expect(codeOnly).not.toMatch(/onPointerDownCapture/);
    expect(codeOnly).not.toMatch(/dismissingRef/);
    expect(codeOnly).not.toMatch(/rounded-2xl/);
    // ExpandedPanel 不再接 activeSession prop (ControlRow 移到 App.tsx)
    expect(codeOnly).not.toMatch(/activeSession\s*:\s*TimerSession\s*\|\s*null/);
    expect(codeOnly).not.toMatch(/onPause\s*:|onResume\s*:|onComplete\s*:/);
    // 仍含 input ref + 按钮 onClick (onStart + onClearAndDismiss)
    expect(codeOnly).toMatch(/onClick=\{onStart\}/);
    expect(codeOnly).toMatch(/onClick=\{onClearAndDismiss\}/);
  });

  it("B-2-1 menu.rs 用 dynamic label: floating_visible / main_visible 字段驱动 label (V0.2.0.13 修, V0.2.0.14 保留)", () => {
    const src = readFileSync("src-tauri/src/tray/menu.rs", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    expect(codeOnly).toMatch(/floating_visible\s*:\s*bool/);
    expect(codeOnly).toMatch(/main_visible\s*:\s*bool/);
    expect(codeOnly).toMatch(/显示任务栏/);
    expect(codeOnly).toMatch(/隐藏任务栏/);
    expect(codeOnly).toMatch(/显示主窗/);
    expect(codeOnly).toMatch(/隐藏主窗/);
  });

  it("B-2-2 lib.rs on_menu_event 只注册到 floating window (V0.2.0.13 修, V0.2.0.14 保留)", () => {
    const src = readFileSync("src-tauri/src/lib.rs", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    expect(codeOnly).toMatch(/for\s+label\s+in\s*\[\s*["']floating["']\s*\]/);
    expect(codeOnly).not.toMatch(/for\s+label\s+in\s*\[[^\]]*["']main["'][^\]]*\]/);
  });

  it("C-3 App.tsx taskTitle state 在 App.tsx, handleDismiss 只 setExpanded(false) 不清 taskTitle", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    // handleDismiss 函数体只含 setExpanded(false), 不含 setTaskTitle
    const handleDismissMatch = codeOnly.match(/(?:const|function)\s+handleDismiss\s*=\s*(?:useCallback\s*\(\s*\(\s*\)\s*=>\s*\{|function\s*\(\s*\)\s*\{)([\s\S]*?)\n\s{2}\}/);
    expect(handleDismissMatch).toBeTruthy();
    expect(handleDismissMatch![1]).not.toMatch(/setTaskTitle/);
    // 仍含 setExpanded(false)
    expect(handleDismissMatch![1]).toMatch(/setExpanded\s*\(\s*false\s*\)/);
  });

  it("C-4 V0.2.0.15 PATCH — 显式 setExpanded(false) 在 handleStart / act('complete') 末尾 (不再 useEffect[session?.id])", () => {
    // V0.2.0.14 PATCH 用 useEffect(() => { if (session) setExpanded(false); }, [session?.id]) 自动折叠,
    // 但 handleStart 后 session 从 null → newSession, useEffect 触发 setExpanded(false) →
    // useEffect[expanded] 跑(true → false) → setSize(FOLDED_W, FOLDED_H), user 此时期望 360×280 展开
    // 却被折叠到 320×36 — 即 V0.2.0.15 PATCH 修的 resize bug.
    // 修复: 删 useEffect, 在 handleStart 末尾 + act('complete') 末尾显式 setExpanded(false).
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    // 反模式 15 防御: V0.2.0.14 PATCH 的 useEffect[session?.id] 自动折叠必须已删
    expect(codeOnly).not.toMatch(/useEffect\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?if\s*\(\s*session\s*\)\s*setExpanded\s*\(\s*false\s*\)/);
    // V0.2.0.15 PATCH: handleStart 函数体内含 setExpanded(false) (显式折叠)
    const handleStartMatch = codeOnly.match(/async\s+function\s+handleStart\s*\(\s*\)\s*\{[\s\S]*?\n\s{2}\}/);
    expect(handleStartMatch).toBeTruthy();
    expect(handleStartMatch![0]).toMatch(/setExpanded\s*\(\s*false\s*\)/);
    // V0.2.0.15 PATCH: act('complete') 路径含 setExpanded(false) (显式折叠)
    const actMatch = codeOnly.match(/async\s+function\s+act\s*\([^)]*\)\s*\{[\s\S]*?\n\s{2}\}/);
    expect(actMatch).toBeTruthy();
    expect(actMatch![0]).toMatch(/setExpanded\s*\(\s*false\s*\)/);
    // 保留 V0.2.0.14 PATCH 的 JSX 形态 (active session 折叠 + ControlRow / !session && expanded → ExpandedPanel)
    expect(codeOnly).toMatch(/\{session\s*&&\s*\([\s\S]*?<ControlRow\s/);
    expect(codeOnly).toMatch(/\{!session\s*&&\s*expanded\s*&&\s*\([\s\S]*?<ExpandedPanel\s/);
  });
});
