// V0.2.1: 失真确认气泡独立窗口根组件(bubble 窗口)。
// 监听 Rust 发出的 floating:dormant 事件 → 显示气泡(询问态/待确认态)。
// 5 秒超时自动暂停(只停不抹,ADR-0012);用户记入/丢弃后关闭窗口。
// V0.2.1 1.4: 轮询 item_get_idle → 空闲超阈值(10 分钟无键鼠输入)前端自动暂停
// (挂 pending_ms 确认窗口)+ 显示「已自动暂停·待确认」,复用 confirmPending。
import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";

import { api, type DormantPayload } from "../lib/tauri-bridge";
import { Bubble } from "./components/Bubble";
import { useDormantCheck } from "./hooks/useDormantCheck";

const TIMEOUT_MS = 5000;
const POLL_MS = 300_000; // 5 分钟
// V0.2.1 1.4: 空闲轮询间隔。必须快于后端 30s 空闲扫描——后端以 pending_ms=None
// 主动暂停(不计失真、不可确认),前端抢先用 pending_ms 挂确认窗口才能走 [记入]/[丢弃]。
const IDLE_POLL_MS = 15_000;
// 与 src-tauri/src/idle.rs IDLE_AUTO_PAUSE_MS 保持一致(10 分钟)。
const IDLE_AUTO_PAUSE_MS = 10 * 60 * 1000;

export function BubbleApp() {
  const [payload, setPayload] = useState<DormantPayload | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [autoPaused, setAutoPaused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 运行期轮询失真(tech §4.2):不依赖 Rust emit,active 静置 2h 也能触发
  useDormantCheck(POLL_MS, (payloads) => {
    if (payloads.length > 0) {
      setPayload(payloads[0]);
      setPendingConfirm(false);
      setAutoPaused(false);
      setDismissed(false);
    }
  });

  // 监听 Rust 启动 emit 的失真事件
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    (async () => {
      try {
        unlisten = await listen<DormantPayload>("floating:dormant", (event) => {
          setPayload(event.payload);
          setPendingConfirm(false);
          setAutoPaused(false);
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

  // V0.2.1 1.4: 空闲超阈值 → 自动暂停(挂待确认)+ 显示「已自动暂停·待确认」。
  // 触发用 item_get_idle 轮询:命中后对 idle 卡前端 pause(pending_ms),把「这段是否专注」
  // 的判定权交给用户,复用 ADR-0012 失真确认闭环。
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        if (!(await api.item.getIdle())) return;
        const actives = await api.item.getActive();
        const now = Date.now();
        const stale = actives.find((it) => {
          const la = it.last_active_at;
          return la != null && now - la > IDLE_AUTO_PAUSE_MS;
        });
        if (!stale || cancelled) return;
        const pendingMs = now - (stale.last_active_at as number);
        const res = await api.item.pause(stale.id, pendingMs);
        if (cancelled) return;
        setPayload({ id: res.item.id, content: res.item.content, pending_ms: pendingMs });
        setAutoPaused(true);
        setPendingConfirm(true);
        setDismissed(false);
      } catch (err) {
        // 卡已被后端以 pending_ms=None 暂停(非 active)/其他错误 → 交给系统通知,不阻塞
        console.error("[bubble] idle auto-pause failed", err);
      }
    };
    void check();
    const id = setInterval(check, IDLE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
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
