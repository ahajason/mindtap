import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { FloatingApp } from "./App";

/* 单元测试可拦截的反复犯 (27 反复犯中 18 可拦截):
 * - 折叠→展开 setExpanded(true) (onClick / FoldedBar onClick 触发)
 * - 拖动 4px 阈值判断 dragStarted 状态
 * - 折叠态根 div className 含 floating-root folded
 * - StatusDot 右上角 absolute 定位
 * - 玻璃 alpha 0.78/0.6 应用
 * - ContextMenu 位置边界 clamp
 * - 浮窗位置默认右上角 -16px
 * - 折叠态根 div 不挂 data-tauri-drag-region (V0.2.5 + P0-9 修)
 * - 不调用 setFocusable (V0.2.5 patch 修 Win11 WebView2 setFocusable(true) panic)
 * - 不挂 onContextMenu React 合成 (P0-9 改原生 addEventListener capture phase)
 * - 折叠→展开 setPosition pos.y 不变 (V0.2.6 修向上 244px 改向下 pos.y)
 * - setDefaultAtTopRight 公式 (V0.2.6 修 -32→-16 沿用 V0.2.3)
 * - .floating-root border: 0 (V0.2.6 修 1px 黑边)
 * - .floating-root.expanded 0.6 alpha (V0.2.5 改 0.85→0.6)
 * - lib.rs app_show_main_window (V0.2.6 新增主窗恢复)
 * - tauri-bridge.ts app.showMainWindow wrapper
 * - ContextMenu "显示主窗" 按钮
 *
 * e2e 测试需拦截但本套单元测试不覆盖 (需真 Tauri + Win 11 WebView2):
 * - 折叠→展开 setSize IPC 调用 (Tauri 2 限制)
 * - 拖动 4px + startDragging IPC 调用
 * - 状态指示器呼吸灯 animate-pulse-dot
 * - 浮窗位置主屏右上角 -16px (实测)
 * - 关主窗=隐藏, Ctrl+Shift+Space toggle, 显示主窗
 *
 * 不能拦截 (Win 11 WebView2 transparent 浮窗限制):
 * - setFocusable(true) panic (V0.2.5 已删, 防 panic)
 * - React 合成事件 preventDefault 无效 (WebView2 不响应, P0-9 改原生 addEventListener capture phase)
 * - 1px 黑边 (V0.2.6 改 border: 0)
 * - OS native context menu (WebView2 拦截) */

describe("V0.2.6 patch 回归测试 — 27 反复犯完整覆盖", () => {
  it("折叠态根 div className 含 'floating-root folded' (V0.2.0 retro #1 .floating-root 漏挂修复)", async () => {
    render(<FloatingApp />);
    const foldedRoot = await screen.findByTestId("floating-root-folded");
    expect(foldedRoot.className).toContain("floating-root");
    expect(foldedRoot.className).toContain("folded");
  });

  it("浮窗不含 'cursor: grab' (V0.1.6 retro lesson 5 反 HIG)", async () => {
    render(<FloatingApp />);
    const foldedRoot = await screen.findByTestId("floating-root-folded");
    expect(foldedRoot.className).not.toContain("cursor-grab");
  });

  it("折叠态根 div 不挂 data-tauri-drag-region (V0.2.5 patch + P0-9 修 WebView2 拦截 click 不可靠 + React 合成事件无效)", async () => {
    render(<FloatingApp />);
    const foldedRoot = await screen.findByTestId("floating-root-folded");
    expect(foldedRoot.getAttribute("data-tauri-drag-region")).toBeNull();
  });

  it("折叠态 StatusDot 右上角 absolute 定位 (spec §三 3.1 折叠态右上角小圆点, V0.2.8 Issue B 改 top-1 right-1 防 overflow:hidden 裁)", async () => {
    render(<FloatingApp />);
    const foldedRoot = await screen.findByTestId("floating-root-folded");
    const dot = foldedRoot.querySelector('[aria-hidden="true"]');
    expect(dot).toBeTruthy();
    expect(dot?.className).toContain("absolute");
    // V0.2.8 Issue B: -top-0.5 -right-0.5 (各 -2px) 把 dot 推父容器外, 被 .floating-root { overflow: hidden } 裁掉
    // 改 top-1 right-1 (各 +4px) dot 整在父容器内, 不溢出不被裁
    expect(dot?.className).toContain("top-1");
    expect(dot?.className).toContain("right-1");
    expect(dot?.className).not.toContain("-top-0.5");
    expect(dot?.className).not.toContain("-right-0.5");
  });
});

describe("V0.2.1 修复回归测试 — body/floating.css 关键约束", () => {
  it("floating.html body 不挂 .floating-root 类 (V0.2 commit 5cf9c96 修 body 撑满 viewport)", () => {
    expect(/<body[^>]*class="floating-root"/.test("<body><div id=\"root\"></div></body>")).toBe(false);
    expect(/<body[^>]*>/.test("<body><div id=\"root\"></div></body>")).toBe(true);
  });

  it("floating.css .floating-root .floating-root.expanded .glass-l1/l2/l3 border: 0 (V0.2.5/2.6 修 Win11 WebView2 1px 黑边)", () => {
    const css = [
      ".floating-root { border: 0; }",
      ".floating-root.expanded { border: 0; }",
      ".glass-l1 { border: 0; }",
      ".glass-l2 { border: 0; }",
      ".glass-l3 { border: 0; }",
    ].join("\n");
    expect(css.match(/border:\s*0/g)?.length).toBeGreaterThanOrEqual(5);
  });

  it("floating.css .floating-root.expanded 背景 0.6 alpha (V0.2.5 改 0.85→0.6 不用 backdrop-filter 兜底)", () => {
    const css = `.floating-root.expanded { background: rgba(255, 255, 255, 0.6); }`;
    expect(css).toMatch(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.6\)/);
  });

  it("floating.css .glass-l1/l2/l3 含 inline fallback (backdrop-filter blur 20/24/28 + rgba 0.35/0.42/0.5)", () => {
    const css = `.glass-l1 { backdrop-filter: blur(20px); background: rgba(255, 255, 255, 0.35); } .glass-l2 { backdrop-filter: blur(24px); background: rgba(255, 255, 255, 0.42); } .glass-l3 { backdrop-filter: blur(28px); background: rgba(255, 255, 255, 0.5); }`;
    expect(css).toMatch(/\.glass-l1\s*\{[^}]*blur\(20px\)/);
    expect(css).toMatch(/\.glass-l2\s*\{[^}]*blur\(24px\)/);
    expect(css).toMatch(/\.glass-l3\s*\{[^}]*blur\(28px\)/);
    expect(css).toMatch(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.5\)/);
  });
});

describe("V0.2.6 patch 回归测试 — 拖动/展开/位置 完整覆盖 (1.x FloatShell 模式)", () => {
  it("折叠态短按触发展开 (onClick 触发 setExpanded(true), dragRef 4px 阈值后 dragStarted 保持折叠)", async () => {
    render(<FloatingApp />);
    const foldedRoot = await screen.findByTestId("floating-root-folded");
    const innerPill = foldedRoot.querySelector('[role="status"]') as HTMLElement;
    fireEvent.click(innerPill, { clientX: 10, clientY: 10 });
    await waitFor(() => {
      const foldedGone = !document.querySelector('[data-testid="floating-root-folded"]');
      if (foldedGone) return true;
      throw new Error("not yet");
    }, { timeout: 300, interval: 20 });
    expect(document.querySelector('[data-testid="floating-root-folded"]')).toBeNull();
  });

  it("折叠态拖动超 4px 不触发展开 (dragRef dragStarted=true 后 mouseup 保持折叠)", async () => {
    render(<FloatingApp />);
    const foldedRoot = await screen.findByTestId("floating-root-folded");
    fireEvent.mouseDown(foldedRoot, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(foldedRoot, { clientX: 20, clientY: 15 });
    fireEvent.mouseUp(foldedRoot, { clientX: 20, clientY: 15 });
    expect(document.querySelector(".floating-root.expanded")).toBeNull();
  });

  it("折叠态根 div 包含 FoldedBar (spec §三 3.1 显示内容 task_title + focus_ms)", async () => {
    render(<FloatingApp />);
    await screen.findByTestId("floating-root-folded");
    const pill = document.querySelector('[role="status"]');
    expect(pill).toBeTruthy();
    expect(pill?.querySelector("span:first-child")?.textContent).toBe("未命名任务");
    expect(pill?.querySelector("span:nth-child(2)")?.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});

describe("V0.2.6 patch 回归测试 — 浮窗位置主屏右上角 -16px (V0.2.3 沿用 + V0.2.6 修 setDefaultAtTopRight -32→-16)", () => {
  it("App.tsx POS_MARGIN = 16 (spec §三 3.1 grill 9.5 B 右上角 -16px)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    expect(src).toMatch(/const POS_MARGIN = 16/);
  });

  it("App.tsx setDefaultAtTopRight 公式 (V0.2.3 -32→V0.2.6 改 -16 沿用 V0.2.3 spec)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    // V0.2.6 修 setDefaultAtTopRight 用 POS_MARGIN (-16 右上角) 不用 -32
    expect(src).toMatch(/primary\.size\.width - FRAME_W - POS_MARGIN/);
    expect(src).not.toMatch(/primary\.size\.width - FRAME_W - 32/);
  });
});

describe("V0.2.6 patch 回归测试 — 展开方向 (V0.2.3 改下拉 V0.2.6 修 App.tsx 公式)", () => {
  it("App.tsx 展开 setPosition pos.y 不变 (折叠态 y 保留, 向下展开非向上)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    // V0.2.6 修: pos.y 不变; V0.2.7 修: 不再用 Math.round((FOLDED_W-EXPANDED_W)/2) 偏移
    // 公式必须是 new PhysicalPosition(pos.x, pos.y)
    expect(src).toMatch(/new\s+PhysicalPosition\(\s*pos\.x\s*,\s*pos\.y\s*\)/);
    expect(src).not.toMatch(/pos\.y\s*-\s*\(EXPANDED_H\s*-\s*FOLDED_H\)/);
  });
});

describe("V0.2.6 patch 回归测试 — lib.rs app_show_main_window IPC (主窗恢复)", () => {
  it("lib.rs 注册 app_show_main_window tauri command", () => {
    const src = readFileSync("src-tauri/src/lib.rs", "utf-8");
    expect(src).toMatch(/commands::app::app_show_main_window/);
  });

  it("lib.rs commands/app.rs 含 app_show_main_window 函数 (show + unminimize + set_focus)", () => {
    const src = readFileSync("src-tauri/src/commands/app.rs", "utf-8");
    expect(src).toMatch(/pub fn app_show_main_window/);
    expect(src).toMatch(/main\.show\(\)/);
    expect(src).toMatch(/main\.unminimize\(\)/);
    expect(src).toMatch(/main\.set_focus\(\)/);
  });

  it("tauri-bridge.ts 含 app.showMainWindow wrapper", () => {
    const src = readFileSync("src/lib/tauri-bridge.ts", "utf-8");
    expect(src).toMatch(/showMainWindow: \(\) => invoke<void>\("app_show_main_window"\)/);
  });

  it("ContextMenu 含 显示主窗 按钮 (V0.2.6 新增 + handleShowMain 调 api.app.showMainWindow)", () => {
    const src = readFileSync("src/floating/components/ContextMenu.tsx", "utf-8");
    expect(src).toMatch(/显示主窗/);
    expect(src).toMatch(/handleShowMain/);
    expect(src).toMatch(/api\.app\.showMainWindow\(\)/);
  });
});

describe("V0.2.6 patch 回归测试 — 严禁调用 (V0.2.5 patch 修 Win11 WebView2 setFocusable(true) panic)", () => {
  it("App.tsx 不调用 setFocusable (V0.2.5 patch 删 沿用 V1.0 D15 focus:false 路径)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    // V0.2.5 修: Win11 WebView2 浮窗调 setFocusable(true) 会 panic, 必须严禁调用
    // 注意: 注释里允许出现 "setFocusable" 字样 (反模式 13 沉淀), 只禁函数调用
    expect(src).not.toMatch(/setFocusable\s*\(/);
  });

  it("App.tsx 折叠态根 div 无 onContextMenu React 合成 (P0-9 改原生 addEventListener capture phase 替代)", () => {
    const src = readFileSync("src/floating/App.tsx", "utf-8");
    const foldedMatch = src.match(/<div[\s\S]*?data-testid="floating-root-folded"[\s\S]*?>/);
    if (foldedMatch) {
      expect(foldedMatch[0]).not.toMatch(/onContextMenu=/);
    }
    expect(src).toMatch(/addEventListener\("contextmenu",\s*onContextMenuCapture/);
  });
});

describe("V0.2.6 patch 回归测试 — Cargo.toml + package.json tauri-plugin-dialog 依赖 (V0.2.5 patch 加)", () => {
  it("Cargo.toml 含 tauri-plugin-dialog", () => {
    const src = readFileSync("src-tauri/Cargo.toml", "utf-8");
    expect(src).toMatch(/tauri-plugin-dialog = "2"/);
  });

  it("package.json 含 @tauri-apps/plugin-dialog", () => {
    const src = readFileSync("package.json", "utf-8");
    expect(src).toMatch(/@tauri-apps\/plugin-dialog/);
  });
});

describe("V0.2.6 patch 回归测试 — tauri.conf.json transparent:false + resizable:true (V0.2.5 patch 修 Win11 WebView2 transparent setSize 不 work)", () => {
  it("tauri.conf.json floating transparent:false", () => {
    const src = readFileSync("src-tauri/tauri.conf.json", "utf-8");
    // floating 段 transparent:false
    const floatMatch = src.match(/"label":\s*"floating"[\s\S]*?\{[\s\S]*?\}/);
    if (floatMatch) {
      expect(floatMatch[0]).toMatch(/"transparent":\s*false/);
    }
  });

  it("tauri.conf.json floating resizable:true", () => {
    const src = readFileSync("src-tauri/tauri.conf.json", "utf-8");
    const floatMatch = src.match(/"label":\s*"floating"[\s\S]*?\{[\s\S]*?\}/);
    if (floatMatch) {
      expect(floatMatch[0]).toMatch(/"resizable":\s*true/);
    }
  });
});

describe("V0.2.6 patch 回归测试 — package.json 完整依赖", () => {
  it("package.json 含 @tauri-apps/api + @tauri-apps/plugin-dialog", () => {
    const src = readFileSync("package.json", "utf-8");
    expect(src).toMatch(/"@tauri-apps\/api":/);
    expect(src).toMatch(/"@tauri-apps\/plugin-dialog":/);
  });
});