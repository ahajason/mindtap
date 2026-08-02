// V0.2.2 待确认弹窗:监听 floating:dormant 事件,弹出确认弹窗。
// 用户可"确认"(keep=true 记入 focus_ms)或"关闭"(不修改状态)。
// 与 BubbleApp 的气泡不同,这是主窗口的全屏 Dialog。
import { useEffect, useState, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { DialogWrapper } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api, type DormantPayload } from '@/lib/tauri-bridge';
import { toast } from 'sonner';

function formatPending(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} 分钟`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`;
}

export function DormantConfirmDialog() {
  const [payload, setPayload] = useState<DormantPayload | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | null = null;
    (async () => {
      try {
        const unlisten = await listen<DormantPayload>('floating:dormant', (event) => {
          if (!cancelled) setPayload(event.payload);
        });
        if (cancelled) {
          unlisten();
        } else {
          cleanup = unlisten;
        }
      } catch {
        // 无 Tauri runtime -> 静默降级
      }
    })();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!payload) return;
    setConfirming(true);
    try {
      await api.item.confirmPending(payload.id, true);
      toast.success('已确认专注时间');
      setPayload(null);
    } catch (e) {
      toast.error('确认失败: ' + String(e));
    } finally {
      setConfirming(false);
    }
  }, [payload]);

  const handleClose = useCallback(() => {
    // 关闭弹窗不修改状态(ADR-0012: 仅确认操作才回写)
    setPayload(null);
  }, []);

  if (!payload) return null;

  return (
    <DialogWrapper
      open={!!payload}
      onOpenChange={(open) => { if (!open) handleClose(); }}
      title="待确认专注时间"
      description={`「${payload.content}」有 ${formatPending(payload.pending_ms)} 未确认的专注时间,是否记入?`}
    >
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose} disabled={confirming}>
          稍后
        </Button>
        <Button variant="secondary" onClick={handleConfirm} disabled={confirming}>
          {confirming ? '确认中…' : '确认记入'}
        </Button>
      </div>
    </DialogWrapper>
  );
}
