import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ExpandedPanel } from "./ExpandedPanel";

const baseProps = {
  taskTitle: "",
  onTaskTitleChange: () => {},
  onStart: () => {},
  onCancel: () => {},
  maxLength: 50,
  submitting: false,
  activeSession: null,
  onPause: () => {},
  onResume: () => {},
  onComplete: () => {},
};

describe("ExpandedPanel", () => {
  it("无 active session 时显示 InputBar + 开始/取消按钮", () => {
    render(<ExpandedPanel {...baseProps} />);
    expect(screen.getByPlaceholderText(/我现在在做什么/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
  });

  it("开始按钮在空 task_title 时 disabled (V0.2 spec §3.2 输入空禁用)", () => {
    render(<ExpandedPanel {...baseProps} taskTitle="" />);
    expect(screen.getByRole("button", { name: "开始" })).toBeDisabled();
  });

  it("开始按钮在有 task_title 时 enabled", () => {
    render(<ExpandedPanel {...baseProps} taskTitle="写代码" />);
    expect(screen.getByRole("button", { name: "开始" })).toBeEnabled();
  });

  it("Enter 键触发 onStart (V0.2 spec §3.2 Enter = 开始)", () => {
    const onStart = vi.fn();
    render(<ExpandedPanel {...baseProps} onStart={onStart} />);
    fireEvent.keyDown(screen.getByPlaceholderText(/我现在在做什么/), { key: "Enter" });
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("Esc 键触发 onCancel (V0.2 spec §3.2 Esc = 取消)", () => {
    const onCancel = vi.fn();
    render(<ExpandedPanel {...baseProps} onCancel={onCancel} />);
    fireEvent.keyDown(screen.getByPlaceholderText(/我现在在做什么/), { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("有 active session 时显示 ControlRow (无 InputBar)", () => {
    render(
      <ExpandedPanel
        {...baseProps}
        activeSession={{
          id: 1,
          task_title: "写代码",
          status: "active",
          started_at: 1,
          paused_at: null,
          completed_at: null,
          focus_ms: 0,
          created_at: 1,
          updated_at: 1,
        }}
      />,
    );
    expect(screen.getByText("写代码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/我现在在做什么/)).toBeNull();
  });
});

describe("V0.2.0.12 patch — Issue 2/4: panel pointerdown capture 守住 panel 内点击 (Radix 模式)", () => {
  // 反模式 16 防御: 用 fireEvent.pointerDown(button) + fireEvent.blur(input) 真实模拟浏览器事件序列,
  // 不用 regex 字面断言。V0.2.0.6/0.11 5 个 PATCH 都漏了这个根因 — input 的 blur 同步吞 onCancel → panel 卸载 → 按钮 click 失效。
  // Radix UI dismissable-layer.tsx 用 onPointerDown capture 在 panel 根 div 上设 isPointerInsideReactTreeRef,
  // 早于 blur 一拍, 在这里 dismiss inside 则不再 cancel。

  it("panel 内点 Start 不折叠: pointerdown 设 dismissingRef=false, blur 不调 onCancel, click 调 onStart", () => {
    const onStart = vi.fn();
    const onCancel = vi.fn();
    render(<ExpandedPanel {...baseProps} taskTitle="写代码" onStart={onStart} onCancel={onCancel} />);
    const input = screen.getByPlaceholderText(/我现在在做什么/) as HTMLInputElement;
    const startBtn = screen.getByRole("button", { name: "开始" });
    // 真实事件序列: pointerdown 在 Start 按钮上 (capture phase 先于 blur), blur 在 input 上, click 在 Start 按钮上
    fireEvent.pointerDown(startBtn, { button: 0 });
    fireEvent.blur(input);
    fireEvent.click(startBtn);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled(); // V0.2.0.12 修: 不再因 blur 误触 cancel
  });

  it("panel 内 input 失焦不折叠: panel 内任意 pointerdown 后 blur 不调 onCancel", () => {
    const onCancel = vi.fn();
    render(<ExpandedPanel {...baseProps} onCancel={onCancel} />);
    const input = screen.getByPlaceholderText(/我现在在做什么/) as HTMLInputElement;
    const cancelBtn = screen.getByRole("button", { name: "取消" });
    // 在 panel 内(取消按钮)做 pointerdown capture, 再 blur input
    fireEvent.pointerDown(cancelBtn, { button: 0 });
    fireEvent.blur(input);
    expect(onCancel).not.toHaveBeenCalled(); // panel 内 pointerdown 把 dismissingRef 设成 false
  });

  it("panel 外点 backdrop 折叠: 默认 dismissingRef=true, blur 仍调 onCancel (保留 spec §3.2 语义)", () => {
    const onCancel = vi.fn();
    render(<ExpandedPanel {...baseProps} onCancel={onCancel} />);
    const input = screen.getByPlaceholderText(/我现在在做什么/) as HTMLInputElement;
    // 模拟外部点击触发的 blur: 没有 panel 内 pointerdown 先发生, dismissingRef 保持默认 true
    fireEvent.blur(input);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("展开态右键不折叠: panel 内右键 pointerdown capture 也设 dismissingRef=false (button!=0 不拦)", () => {
    const onCancel = vi.fn();
    render(<ExpandedPanel {...baseProps} onCancel={onCancel} />);
    const input = screen.getByPlaceholderText(/我现在在做什么/) as HTMLInputElement;
    const panelArea = screen.getByRole("button", { name: "取消" });
    // 右键 (button: 2) 在 panel 内: capture phase 仍记录 dismissingRef=false
    fireEvent.pointerDown(panelArea, { button: 2 });
    fireEvent.blur(input);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
