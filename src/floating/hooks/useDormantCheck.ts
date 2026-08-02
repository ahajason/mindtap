// V0.2.1: 运行期失真检测。每 intervalMs 调 item_check_dormant,
// 返回失真卡 payload 后交给回调(BubbleApp 显示气泡)。
// ponytail: 只做「发现+回调」,显示逻辑由 bubble 窗口承接,本 hook 不持有 UI 状态。
import { useEffect } from "react";

import { api, type DormantPayload } from "../../lib/tauri-bridge";

export function useDormantCheck(
  intervalMs = 300_000, // 默认 5 分钟
  onDormant: (payloads: DormantPayload[]) => void,
): void {
  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const payloads = await api.item.checkDormant();
        if (!cancelled && payloads.length > 0) onDormant(payloads);
      } catch (err) {
        console.error("[dormant-check] failed", err);
      }
    };

    void check();
    const id = setInterval(check, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs, onDormant]);
}
