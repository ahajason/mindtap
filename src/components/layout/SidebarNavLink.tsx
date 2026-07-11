import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/lib/nav-order';

export function SidebarNavLink({ item }: { item: NavItem }) {
  const { to, icon: Icon, label, end } = item;
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
      <Icon className="w-4 h-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </RouterNavLink>
  );
}
