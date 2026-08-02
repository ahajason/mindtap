// V0.2.2: 失真确认气泡独立窗口根组件(bubble 窗口)。
// 监听 Rust 发出的 floating:dormant 事件 → 显示气泡(询问态/待确认态)。
// 5 秒超时自动暂停(只停不抹,ADR-0012);用户记入/丢弃后关闭窗口。
// V0.2.2: 前端不再轮询 idle 自动暂停。空闲检测由后端 30s 线程独占处理
// (scan_and_auto_pause)并 emit floating:dormant 事件触发气泡。
import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";

import { api, type DormantPayload } from "../lib/tauri-bridge";
import { Bubble } from "./components/Bubble";
import { useDormantCheck } from "./hooks/useDormantCheck";

const TIMEOUT_MS = 5000;
const POLL_MS = 300_000; // 5 分钟

export function BubbleApp() {
  const [payload, setPayload] = useState<DormantPayload | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [autoPaused, setAutoPaused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // V0.2.2: 前端不再轮询 idle 自动暂停,由后端 30s 线程独占处理
  // 并 emit floating:dormant 事件触发气泡,轮询只保留失真检测(5 分钟)
  useDormantCheck(POLL_MS, (payloads) => {
    if (payloads.length > 0) {
      setPayload(payloads[0]);
      setPendingConfirm(false);
      setAutoPaused(false);
      setDismissed(false);
      // 轮询路径也需 show bubble 窗口(兜底)
      const win = getCurrentWindow();
      void win.show();
    }
  });

  // 监听 Rust 启动 emit 的失真事件
  // 用 useRef 存 unlisten 避免 async gap 导致的竞态(组件卸载时 unlisten 可能尚未赋值)
  const unlistenRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const unlisten = await listen<DormantPayload>("floating:dormant", (event) => {
          setPayload(event.payload);
          setPendingConfirm(false);
          setAutoPaused(false);
          setDismissed(false);
        });
        if (cancelled) {
          unlisten();
        } else {
          unlistenRef.current = unlisten;
        }
      } catch (err) {
        console.error("[bubble] listen failed", err);
      }
    })();
    return () => {
      cancelled = true;
      unlistenRef.current?.();
      unlistenRef.current = null;
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
        autoPaused={autoPaused}
        onContinue={handleContinue}
        onPause={handlePause}
        onKeep={handleKeep}
        onDiscard={handleDiscard}
      />
    </div>
  );
}
