import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface SidebarNavLinkProps {
  to: string;
  icon: ReactNode;
  label: string;
  end?: boolean;
}

/**
 * SidebarNavLink — 统一 Sidebar 导航链接实现
 *
 * 3 层状态视觉(spec: 1-design/10-focus-state-spec.md §四 + §五):
 * - Layer 2 (Navigation active): aria-current="page" + bg-primary + text-white + font-semibold + border-l-2 brand
 * - Layer 3 (Keyboard focus): :focus-visible ring-2 brand offset-2(WCAG 1.4.11 ≥ 3:1)
 * - Layer 3 (Hover): bg-black/[0.04] + text-text-1
 *
 * 关键设计:
 * - :focus-visible 而非 :focus(避免鼠标点击后 ring 残留)
 * - active 同时有 inset left border(色盲友好,WCAG 1.4.1)
 * - hover 跟 focus 不冲突(ring 在 hover 背景之上)
 */
export function SidebarNavLink({ to, icon, label, end }: SidebarNavLinkProps) {
  const { pathname } = useLocation();
  const isActive = end
    ? pathname === to
    : pathname === to || pathname.startsWith(to + '/');

  return (
    <RouterNavLink
      to={to}
      end={end}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm',
        'transition-colors duration-150 ease-[var(--ease-out)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isActive
          ? 'bg-primary text-white font-semibold border-l-2 border-primary'
          : 'text-text-2 hover:bg-black/[0.04] hover:text-text-1'
      )}
    >
      {icon}
      <span>{label}</span>
    </RouterNavLink>
  );
}