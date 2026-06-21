import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navOrder } from '@/lib/nav-order';

/**
 * Sidebar — 玻璃容器内 floating,4 角圆,glass-l2
 *
 * - 用 navOrder 数据源,Lucide icon 平铺,无分组容器
 * - 顶部简化标题"轻念 · Mindtap"(单行,无副标题)
 * - 拖动由 NSWindow.setMovableByWindowBackground 接管,不需要 marker
 */
export default function Sidebar() {
  return (
    <aside className="w-60 ml-3 mt-10 mb-3 rounded-xl glass-l2 p-4 flex flex-col gap-3 shrink-0">
      <header>
        <h1 className="text-sm font-medium text-text-2">轻念 · Mindtap</h1>
      </header>

      <nav className="flex flex-col gap-1">
        {navOrder.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all duration-base',
                isActive
                  ? 'bg-primary text-white font-semibold'
                  : 'bg-white/30 text-text-2 hover:bg-white/50'
              )
            }
          >
            <item.icon className="w-4 h-4 shrink-0" aria-hidden />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}