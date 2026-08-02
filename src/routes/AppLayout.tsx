// V0.2.2 业务页面布局:侧边栏 + 内容区(2026-08-03)。
// 与 StyleGuideLayout 共用视觉结构,但用 AppSidebar 代替 StyleGuide 的 Sidebar。

import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { DormantConfirmDialog } from '@/components/DormantConfirmDialog';
import { useWindowActive } from '@/hooks/useWindowActive';

export default function AppLayout() {
  useWindowActive();

  return (
    <div className="fixed inset-0 z-0 rounded-2xl glass-l1 overflow-hidden flex gap-3">
      <div
        data-tauri-drag-region="deep"
        className="absolute top-0 left-0 w-[252px] h-10"
      />
      <AppSidebar />
      <main className="flex-1 mr-3 mt-3 mb-3 overflow-y-auto app-main-scroll p-[var(--spacing-6)]" style={{ scrollbarGutter: 'stable' }}>
        <div
          data-tauri-drag-region
          className="h-9 -mx-[var(--spacing-6)] -mt-[var(--spacing-6)] mb-3"
        />
        <Outlet />
      </main>
      <DormantConfirmDialog />
    </div>
  );
}