// V0.2.1: 失真确认气泡独立窗口根组件(bubble 窗口)。
// 监听 Rust 发出的 floating:dormant 事件 → 显示气泡(询问态/待确认态)。
// 5 秒超时自动暂停(只停不抹,ADR-0012);用户记入/丢弃后关闭窗口。
import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";

import { api } from "../lib/tauri-bridge";
import { Bubble } from "./components/Bubble";

const TIMEOUT_MS = 5000;

type DormantPayload = {
  id: number;
  content: string;
  pending_ms: number;
};

export function BubbleApp() {
  const [payload, setPayload] = useState<DormantPayload | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 监听失真事件
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    (async () => {
      try {
        unlisten = await listen<DormantPayload>("floating:dormant", (event) => {
          setPayload(event.payload);
          setPendingConfirm(false);
          setDismissed(false);
        });
      } catch (err) {
        console.error("[bubble] listen failed", err);
      }
    })();
    return () => {
      unlisten?.();
    };
  }, []);

  // 5 秒超时自动暂停(只停不抹,挂待确认)
  useEffect(() => {
    if (!payload || pendingConfirm || dismissed) return;
    timeoutRef.current = setTimeout(async () => {
      try {
        await api.item.pause(payload.id, payload.pending_ms);
        setPendingConfirm(true);
      } catch (err) {
        console.error("[bubble] auto-pause failed", err);
      }
    }, TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [payload, pendingConfirm, dismissed]);

  const close = () => {
    const win = getCurrentWindow();
    void win.hide();
    setDismissed(true);
  };

  // 继续:保持 active,关闭气泡
  async function handleContinue() {
    close();
  }

  // 暂停:主动暂停,关闭气泡
  async function handlePause() {
    if (!payload) return;
    try {
      await api.item.pause(payload.id, null);
    } catch (err) {
      console.error("[bubble] pause failed", err);
    }
    close();
  }

  // 记入:失真窗口计入 focus_ms
  async function handleKeep() {
    if (!payload) return;
    try {
      await api.item.confirmPending(payload.id, true);
    } catch (err) {
      console.error("[bubble] keep failed", err);
    }
    close();
  }

  // 丢弃:失真窗口不计入
  async function handleDiscard() {
    if (!payload) return;
    try {
      await api.item.confirmPending(payload.id, false);
    } catch (err) {
      console.error("[bubble] discard failed", err);
    }
    close();
  }

  if (!payload || dismissed) return null;

  return (
    <div className="bubble-shell">
      <Bubble
        content={payload.content}
        pendingMs={payload.pending_ms}
        pendingConfirm={pendingConfirm}
        onContinue={handleContinue}
        onPause={handlePause}
        onKeep={handleKeep}
        onDiscard={handleDiscard}
      />
    </div>
  );
}
