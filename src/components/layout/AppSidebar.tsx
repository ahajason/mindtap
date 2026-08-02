// V0.2.2 业务侧边栏:复盘 + 管理 + 设置(2026-08-03)。
// 与 StyleGuide 的 Sidebar 共用视觉结构,但用独立 nav 项。

import { businessNav } from '@/lib/nav-order';
import { SidebarNavLink } from './SidebarNavLink';
import { Separator } from '@/components/ui/separator';

export default function AppSidebar() {
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
        {businessNav.map((item) => (
          <SidebarNavLink key={item.to} item={item} />
        ))}
      </nav>
    </aside>
  );
}