import { Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import { useWindowActive } from '@/hooks/useWindowActive';

/**
 * StyleGuide Layout — 玻璃容器(L1)+ Sidebar(L2)。
 * V0.1.6 drag 用专用 handle(不是整窗 deep):
 *   - 左侧 drag strip:父 div 整 deep 不到 aside 的 mt-10 margin,需独立覆盖 traffic light 让位区
 *   - main 顶部 handle:避免主内容 button / nav 自动 no-drag
 * 历史/失败模式见 docs/reports/v0.1.6-retrospective.md
 */
export default function StyleGuideLayout() {
  useWindowActive();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-0 rounded-2xl glass-l1 overflow-hidden flex gap-3">
      <div
        data-tauri-drag-region="deep"
        className="absolute top-0 left-0 w-[252px] h-10"
      />
      <Sidebar />
      <main className="flex-1 mr-3 mt-3 mb-3 overflow-y-auto p-[var(--spacing-6)]">
        <div
          data-tauri-drag-region
          className="h-9 -mx-[var(--spacing-6)] -mt-[var(--spacing-6)] mb-3 flex items-center"
        >
          <button
            onClick={() => navigate('/')}
            data-tauri-drag-region="false"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-sm text-text-2 hover:bg-black/[0.04] hover:text-text-1 transition-colors duration-150"
            aria-label="返回"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}