import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';

/**
 * StyleGuide Layout — 玻璃容器占满整个窗口(L1 透)+ Sidebar floating(L2 实)
 *
 * - 主玻璃容器:`fixed inset-0`,rounded-2xl,**glass-l1**(反转)— 占满整个窗口
 * - macOS native traffic light 在窗口顶左(macOS 系统级画在 glass 容器上,不依赖 webview)
 * - 玻璃容器外**无 transparent 让位区**(用户明确不要)
 * - Body:flex gap-3,Sidebar(L2 实)+ Main(L1 透 + 子内容)并排,间距 12px
 * - Sidebar margin ml-3 mt-3 mb-3(让位 macOS native traffic light 视觉)
 * - Main margin mr-3 mt-3 mb-3 跟容器右/上/下边缘留间距
 * - 拖动由 NSWindow.setMovableByWindowBackground(true) 接管
 */
export default function StyleGuideLayout() {
  return (
    <div className="fixed inset-0 z-0 rounded-2xl glass-l1 overflow-hidden flex gap-3">
      <Sidebar />
      <main className="flex-1 mr-3 mt-3 mb-3 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}