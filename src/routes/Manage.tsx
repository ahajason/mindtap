// V0.2.2 P4 主窗管理:搜索/筛选/回收站(2026-08-03)。
// 四视图:进行中 / 待办 / 归档 / 回收站。软删 5 秒撤销 toast。

import { useEffect, useState, useCallback, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { api, type Item } from '@/lib/tauri-bridge';
import PageHeader from '@/components/style-guide/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MoreHorizontal, Trash2 } from 'lucide-react';

type ViewTab = 'active' | 'todo' | 'archived' | 'deleted';

const VIEW_LABELS: Record<ViewTab, string> = {
  active: '进行中',
  todo: '待办',
  archived: '归档',
  deleted: '回收站',
};

export default function ManageRoute() {
  const [tab, setTab] = useState<ViewTab>('active');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchItems = useCallback(() => {
    setLoading(true);
    const promise = tab === 'deleted'
      ? api.item.listDeleted()
      : tab === 'active'
        ? api.item.getActive()
        : tab === 'todo'
          ? api.item.getTodo()
          : api.item.getArchived();
    promise
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => {
        setItems([]);
        setLoading(false);
      });
  }, [tab]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // 监听跨窗口数据变更事件 -> 自动刷新管理列表
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | null = null;
    (async () => {
      try {
        const unlisten = await listen('floating:data_changed', () => {
          if (!cancelled) fetchItems();
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
  }, [fetchItems]);

  const handleSoftDelete = (id: number) => {
    api.item.softDelete(id).then(() => {
      toast('已删除', {
        duration: 5000,
        action: {
          label: '撤销',
          onClick: () => handleUndoDelete(id),
        },
      });
      fetchItems();
    }).catch((err) => {
      toast.error('删除失败: ' + (err instanceof Error ? err.message : String(err)));
    });
  };

  const handleUndoDelete = (id: number) => {
    api.item.undoDelete(id).then(() => {
      fetchItems();
    }).catch((err) => {
      toast.error('撤销失败: ' + (err instanceof Error ? err.message : String(err)));
    });
  };

  const handleHardDelete = (id: number) => {
    if (!window.confirm('确定永久删除？此操作不可撤销。')) return;
    api.item.hardDelete(id).then(() => {
      toast.success('已永久删除');
      fetchItems();
    }).catch((err) => {
      toast.error('删除失败: ' + (err instanceof Error ? err.message : String(err)));
    });
  };

  const filtered = search.trim()
    ? items.filter(item => item.content.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div>
      <PageHeader title="任务管理" description="管理所有任务，包含回收站" />

      {/* 搜索栏 */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索任务…"
          className="w-full px-3 py-2 rounded-lg bg-glass-1 text-text-1 placeholder:text-text-3 border border-glass-1 focus:outline-none focus:border-primary text-sm"
        />
      </div>

      {/* 视图切换 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(Object.entries(VIEW_LABELS) as [ViewTab, string][]).map(([key, label]) => (
          <Button
            key={key}
            variant={tab === key ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* 任务列表 */}
      {loading ? (
        <div className="glass-l2 rounded-[var(--radius-card)] p-[var(--spacing-4)]">
          <p className="text-text-2 text-sm">加载中…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-l2 rounded-[var(--radius-card)] p-[var(--spacing-4)]">
          <p className="text-text-2 text-sm">
            {search.trim() ? '没有匹配的任务。' : '暂无内容。'}
          </p>
        </div>
      ) : (
        <div className="glass-l2 rounded-[var(--radius-card)] p-[var(--spacing-4)]">
          <ul className="divide-y divide-glass-1">
            {filtered.map(item => (
              <li key={item.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-1 truncate">{item.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default">{item.status}</Badge>
                    {item.focus_ms > 0 && (
                      <span className="text-xs text-text-3">
                        {(item.focus_ms / 60000).toFixed(0)} 分钟
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {tab === 'deleted' ? (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => handleUndoDelete(item.id)}>
                        还原
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleHardDelete(item.id)}>
                        永久删除
                      </Button>
                    </>
                  ) : (
                    <MoreMenu onDelete={() => handleSoftDelete(item.id)} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** 三点下拉菜单:删除操作默认隐藏,点击展开后确认 */
function MoreMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="更多操作"
        onClick={() => setOpen(v => !v)}
        className="h-8 w-8 flex items-center justify-center rounded-[8px] text-text-3 hover:bg-glass-2 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-10 w-32 rounded-[8px] border border-glass-2 bg-glass-l2 shadow-lg p-1">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-sm text-danger hover:bg-danger/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            删除
          </button>
        </div>
      )}
    </div>
  );
}