import {
  Sparkles, Square, MousePointerClick, TextCursorInput,
  MessageSquare, Layout, Palette, CalendarCheck, ListTodo, Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

/** 设计语言导航(用于 StyleGuideLayout 侧边栏) */
export const navOrder: readonly NavItem[] = [
  { to: '/style-guide',         label: '设计语言',                 icon: Sparkles,         end: true },
  { to: '/style-guide/surface', label: 'Card / Separator',         icon: Square },
  { to: '/style-guide/button',  label: 'Button',                   icon: MousePointerClick },
  { to: '/style-guide/input',   label: 'Input / Textarea / Label', icon: TextCursorInput },
  { to: '/style-guide/feedback',label: 'Badge / Toast / Dialog',   icon: MessageSquare },
  { to: '/style-guide/overlay', label: 'Tooltip / Tabs',           icon: Layout },
  { to: '/style-guide/tokens',  label: 'Token 速查',               icon: Palette },
] as const;

/** 业务导航(用于 AppLayout 侧边栏) */
export const businessNav: readonly NavItem[] = [
  { to: '/',         label: '每日复盘',                 icon: CalendarCheck,  end: true },
  { to: '/manage',   label: '任务管理',                 icon: ListTodo },
  { to: '/settings', label: '设置',                     icon: Settings },
] as const;