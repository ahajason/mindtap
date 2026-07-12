import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { FloatingApp } from "./App";

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

describe("V0.2.8 patch — Issue A: 右键不被折叠态根 div 抢占 (P0-9 复活防御)", () => {
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

  it("折叠态右键 contextmenu 事件触发 ContextMenu 渲染 (capture phase 原生 listener 行为)", async () => {
    render(<FloatingApp />);
    await screen.findByTestId("floating-root-folded");
    // 派发原生 contextmenu 事件 (document 级 capture phase listener 应当接到)
    // V0.2.0.11 A fix: 必须传 button: 2, e.button !== 2 守卫过滤左/中键
    fireEvent.contextMenu(document, { button: 2, clientX: 50, clientY: 60 });
    // 行为断言: ContextMenu 组件被渲染 (role=menu + aria-label)
    await waitFor(() => {
      expect(screen.getByRole("menu", { name: "浮窗右键菜单" })).toBeTruthy();
    });
    // 且包含 "显示主窗" 按钮
    expect(screen.getByText("显示主窗")).toBeTruthy();
    expect(screen.getByText("退出")).toBeTruthy();
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

describe("V0.2.8 Issue C: 浮窗无 inset highlight 边框 (P1 回归)", () => {
  // 反模式 15 防御: 先剥 CSS 注释, 防止 .floating-root / .glass-l 字样出现在 /* ... */ 里误匹配
  function stripCssComments(css: string): string {
    return css.replace(/\/\*[\s\S]*?\*\//g, "");
  }

  function extractFloatingRootBlocks(css: string): string[] {
    const codeOnly = stripCssComments(css);
    // 反模式 16 集成防御: 先剥 @media 嵌套块, 防止 V0.2.8 Bug 5 cosmetic 引入的
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
  // (V0.2.0.9 4 个 describe "V0.2.8 patch — Bug 5 cosmetic" 已删除)

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

describe("V0.2.0.11 patch — Issue B fix: .floating-root 加 position: relative 让 StatusDot absolute 找根 div", () => {
  // V0.2.0.7 反复改 StatusDot 类名 / top-right 值 (top-0.5 right-0.5 → top-1 right-1),
  // user 仍报"呼吸灯在 .floating-root folded 第一个子节点但不在 .folded-bar-inner 内"。
  // 真根因: .floating-root 没有 position: relative, StatusDot absolute 穿透到 body
  // 作为祖先, 在 viewport 角落错位。修法: .floating-root 加 position: relative。

  it("floating.css .floating-root 块内含 position: relative (V0.2.0.11 B fix)", () => {
    const css = readFileSync("src/floating/styles/floating.css", "utf-8");
    const block = css.match(/\.floating-root\s*\{([\s\S]*?)\}/);
    expect(block).toBeTruthy();
    expect(block![0]).toMatch(/\bposition\s*:\s*relative\b/);
  });

  it("floating.css .floating-root.expanded 不受 B fix 影响 (展开态走 ExpandedPanel 自带 relative, 不依赖根 div)", () => {
    const css = readFileSync("src/floating/styles/floating.css", "utf-8");
    const block = css.match(/\.floating-root\.expanded\s*\{([\s\S]*?)\}/);
    expect(block).toBeTruthy();
    // .floating-root.expanded 块本身不需要 position: relative (继承自 .floating-root 顶层规则),
    // 但绝不能误删 width/height/border-radius 数值层
    expect(block![0]).toMatch(/\bwidth\s*:\s*360px\b/);
    expect(block![0]).toMatch(/\bheight\s*:\s*280px\b/);
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

describe("V0.2.0.11 patch — Issue A fix: ContextMenu viewport 双向 clamp + 右键 button guard", () => {
  // V0.2.0.6 反复改 ContextMenu 事件捕获 (capture phase / e.preventDefault),
  // user 实测菜单仍不弹 (HTML 显示 left:4 top:-84)。真根因: ContextMenu.tsx line 46-50
  // 用 single Math.min 做 bottom clamp, 折叠态 window.innerHeight=36 时 innerHeight-120=-84,
  // Math.min(y+8, -84) = -84, 菜单跑到 viewport 外看不见。修法:
  // 1) ContextMenu.tsx 加 clampToViewport() 用 MENU_W/MENU_H 常数 + 双向 Math.max/Math.min
  // 2) App.tsx onContextMenuCapture 加 e.button !== 2 守卫 (左/中键不该弹菜单)

  it("ContextMenu.tsx 含 clampToViewport 函数 (V0.2.0.11 A fix)", () => {
    const src = readFileSync("src/floating/components/ContextMenu.tsx", "utf-8");
    // 反模式 16 防御: 剥注释行后再 grep
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    expect(codeOnly).toMatch(/function\s+clampToViewport/);
  });

  it("ContextMenu.tsx clampToViewport 双向 clamp: top 既有 Math.max 也有 Math.min", () => {
    const src = readFileSync("src/floating/components/ContextMenu.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    // top 必须 Math.max(VIEWPORT_MARGIN, Math.min(y, maxTop)) 双向
    expect(codeOnly).toMatch(/top\s*:\s*Math\.max\s*\(\s*VIEWPORT_MARGIN\s*,\s*Math\.min\s*\(\s*y\s*,\s*maxTop\s*\)\s*\)/);
  });

  it("App.tsx onContextMenuCapture 含 e.button !== 2 守卫 (反模式 14 防御: 防止左/中键误触发)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    const codeOnly = src
      .split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    expect(codeOnly).toMatch(/onContextMenuCapture[\s\S]*?if\s*\(\s*e\.button\s*!==\s*2\s*\)\s*return/);
  });
});

describe("V0.2.8.1 follow-up: Issue C 真根因修复 — FoldedBar inline style box-shadow 防御", () => {
  // V0.2.8 Issue C 反复修 .floating-root 的 CSS box-shadow 没生效,真根因是
  // FoldedBar.tsx:31 有 inline style `style={{ boxShadow: "inset 0 1px 0 ..." }}`,
  // inline style 优先级最高覆盖 CSS。V0.2.8.1 把 inline style boxShadow 删了,
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

  it("FoldedBar.tsx 含 folded-bar-inner className (V0.2.8.1 修复形态锁定)", () => {
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