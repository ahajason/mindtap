// V0.2.2 P4 主窗管理:搜索/筛选/回收站(2026-08-03)。
// 四视图:进行中 / 待办 / 归档 / 回收站。软删 5 秒撤销 toast。

import { useEffect, useState, useCallback } from 'react';
import { api, type Item } from '@/lib/tauri-bridge';
import PageHeader from '@/components/style-guide/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  const [undoId, setUndoId] = useState<number | null>(null);
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

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

  // 清理 undo timer
  useEffect(() => {
    return () => {
      if (undoTimer) clearTimeout(undoTimer);
    };
  }, [undoTimer]);

  const handleSoftDelete = (id: number) => {
    api.item.softDelete(id).then(() => {
      setUndoId(id);
      const timer = setTimeout(() => {
        setUndoId(null);
        fetchItems();
      }, 5000);
      setUndoTimer(timer);
    });
  };

  const handleUndoDelete = (id: number) => {
    if (undoTimer) clearTimeout(undoTimer);
    api.item.undoDelete(id).then(() => {
      setUndoId(null);
      fetchItems();
    });
  };

  const handleHardDelete = (id: number) => {
    api.item.hardDelete(id).then(() => fetchItems());
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

      {/* 5 秒撤销条 */}
      {undoId !== null && (
        <div className="mb-4 p-3 rounded-lg bg-warning-1/10 border border-warning-1/30 flex items-center justify-between">
          <span className="text-sm text-text-1">已删除，5 秒后可永久消失</span>
          <Button variant="secondary" size="sm" onClick={() => handleUndoDelete(undoId)}>
            撤销
          </Button>
        </div>
      )}

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
                    <Button variant="ghost" size="sm" onClick={() => handleSoftDelete(item.id)}>
                      删除
                    </Button>
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