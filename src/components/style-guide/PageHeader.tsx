import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Active 状态:左侧 2px brand border-l,跟 SidebarNavLink active 视觉对齐(opt-in) */
  accent?: boolean;
}

export default function PageHeader({ title, description, accent }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'mb-6 pl-3 -ml-3 border-l-2 transition-colors',
        accent ? 'border-primary' : 'border-transparent'
      )}
    >
      <h1 className="text-2xl font-semibold text-text-1">{title}</h1>
      {description && <p className="text-sm text-text-2 mt-1">{description}</p>}
    </header>
  );
}