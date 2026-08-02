// V0.2.2 复盘视图:每日专注回顾四块面板(2026-08-03)。
// 依赖:tauri-bridge api.review。纯展示组件,状态由后端主导。
// P3 路由重构后会移到业务路由,目前挂在 StyleGuideLayout 下。

import { useEffect, useState } from 'react';
import { api, type DailyReview } from '@/lib/tauri-bridge';
import PageHeader from '@/components/style-guide/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ReviewRoute() {
  const [data, setData] = useState<DailyReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReview = () => {
    setLoading(true);
    setError(null);
    api.review.getDaily()
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReview();
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="每日复盘" description="加载中…" />
        <div className="glass-l2 rounded-[var(--radius-card)] p-[var(--spacing-4)]">
          <p className="text-text-2">正在加载今日专注数据…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="每日复盘" description="加载失败" />
        <div className="glass-l2 rounded-[var(--radius-card)] p-[var(--spacing-4)]">
          <p className="text-danger-1">加载失败: {error}</p>
          <Button className="mt-2" onClick={fetchReview}>重试</Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <PageHeader
        title="每日复盘"
        description="今日专注回顾 — 已完成 / 分布 / 待确认 / 空档"
      />
      <div className="flex justify-end mb-2">
        <Button variant="secondary" size="sm" onClick={fetchReview}>
          刷新
        </Button>
      </div>

      {/* 面板1: 已完成任务 */}
      <section className="glass-l2 rounded-[var(--radius-card)] p-[var(--spacing-4)] mb-[var(--spacing-4)]">
        <h2 className="text-lg font-semibold text-text-1 mb-2">
          已完成 ({data.completed.length})
        </h2>
        {data.completed.length === 0 ? (
          <p className="text-text-2 text-sm">今天还没有完成的任务。</p>
        ) : (
          <ul className="space-y-1">
            {data.completed.map(item => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-text-1 truncate">{item.content}</span>
                <span className="text-text-3 text-xs ml-2">
                  {(item.focus_ms / 60000).toFixed(0)} 分钟
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 面板2: 专注分布 */}
      <section className="glass-l2 rounded-[var(--radius-card)] p-[var(--spacing-4)] mb-[var(--spacing-4)]">
        <h2 className="text-lg font-semibold text-text-1 mb-2">
          专注分布
        </h2>
        {data.distribution.length === 0 ? (
          <p className="text-text-2 text-sm">今天还没有专注记录。</p>
        ) : (
          <div className="space-y-2">
            {data.distribution.map(d => (
              <div key={d.item_id} className="flex items-center gap-2">
                <span className="text-text-1 text-sm flex-1 truncate">{d.content}</span>
                <div className="h-2 bg-glass-1 rounded-full flex-1 max-w-[200px]">
                  <div
                    className="h-full bg-accent-1 rounded-full"
                    style={{ width: `${Math.min(100, (d.focus_ms / data.distribution[0].focus_ms) * 100)}%` }}
                  />
                </div>
                <span className="text-text-3 text-xs w-16 text-right">
                  {formatDuration(d.focus_ms)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 面板3: 待确认(待处理) */}
      <section className="glass-l2 rounded-[var(--radius-card)] p-[var(--spacing-4)] mb-[var(--spacing-4)]">
        <h2 className="text-lg font-semibold text-text-1 mb-2">
          待确认 ({data.stale.length})
        </h2>
        {data.stale.length === 0 ? (
          <p className="text-text-2 text-sm">没有待确认的卡。</p>
        ) : (
          <ul className="space-y-1">
            {data.stale.map(item => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-text-1 truncate">{item.content}</span>
                <Badge variant="warning">
                  {item.pending_ms ? `${(item.pending_ms / 60000).toFixed(0)} 分钟` : '待处理'}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 面板4: 未覆盖时段(空档) */}
      <section className="glass-l2 rounded-[var(--radius-card)] p-[var(--spacing-4)]">
        <h2 className="text-lg font-semibold text-text-1 mb-2">
          未覆盖时段 ({data.uncovered_gaps.length})
        </h2>
        {data.uncovered_gaps.length === 0 ? (
          <p className="text-text-2 text-sm">今天没有未覆盖的时段。</p>
        ) : (
          <ul className="space-y-1">
            {data.uncovered_gaps.map((gap, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-text-2">
                  {formatTime(gap.start)} — {formatTime(gap.end)}
                </span>
                <span className="text-text-3 text-xs">
                  {formatDuration(gap.duration_ms)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatDuration(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} 分钟`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}