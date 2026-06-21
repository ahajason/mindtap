import { navOrder } from '@/lib/nav-order';
import { SidebarNavLink } from './SidebarNavLink';
import { Separator } from '@/components/ui/separator';

/**
 * Sidebar 浮窗(L2)。
 * V0.1.6 drag region:aside + header 都 deep(实测父 deep 不继承到子元素,h1 自动 no-drag),
 *   nav 显式 false 保护 link 可点击。
 * 历史/失败模式见 docs/reports/v0.1.6-retrospective.md
 */
export default function Sidebar() {
  return (
    <aside
      data-tauri-drag-region="deep"
      className="w-60 ml-3 mt-10 mb-3 rounded-xl glass-l2 p-4 flex flex-col gap-3 shrink-0"
    >
      <header data-tauri-drag-region="deep">
        <h1 className="text-sm font-medium text-text-2">轻念 · Mindtap</h1>
      </header>

      <Separator className="bg-white/40" />

      <nav data-tauri-drag-region="false" className="flex flex-col gap-1">
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