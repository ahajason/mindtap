import { navOrder } from '@/lib/nav-order';
import { SidebarNavLink } from './SidebarNavLink';

/**
 * Sidebar — 玻璃容器内 floating,4 角圆,glass-l2
 *
 * - 用 navOrder 数据源,Lucide icon 平铺,无分组容器
 * - 顶部简化标题"轻念 · Mindtap"(单行,无副标题)
 * - 拖动由 NSWindow.setMovableByWindowBackground 接管,不需要 marker
 * - V0.1.2: 使用 SidebarNavLink 统一 active + focus + hover 三层视觉
 */
export default function Sidebar() {
  return (
    <aside className="w-60 ml-3 mt-10 mb-3 rounded-xl glass-l2 p-4 flex flex-col gap-3 shrink-0">
      <header>
        <h1 className="text-sm font-medium text-text-2">轻念 · Mindtap</h1>
      </header>

      <nav className="flex flex-col gap-1">
        {navOrder.map((item) => (
          <SidebarNavLink
            key={item.to}
            to={item.to}
            icon={<item.icon className="w-4 h-4 shrink-0" aria-hidden />}
            label={item.label}
            end={item.end}
          />
        ))}
      </nav>
    </aside>
  );
}