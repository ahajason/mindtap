import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/floating.css";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { FloatingApp } from "./App";
import { BubbleApp } from "./BubbleApp";

// 两个窗口共用 floating.html:
// - floating(360×36/280):主浮窗(折叠/捕获/列表)
// - bubble(280×80):失真确认气泡独立小窗
// V0.2.1: 按窗口 label 分派根组件。
const win = getCurrentWindow();
const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    {win.label === "bubble" ? <BubbleApp /> : <FloatingApp />}
  </StrictMode>,
);
