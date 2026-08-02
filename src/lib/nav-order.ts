import {
  Sparkles, Square, MousePointerClick, TextCursorInput,
  MessageSquare, Layout, Palette, CalendarCheck,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const navOrder: readonly NavItem[] = [
  { to: '/',         label: '设计语言',                 icon: Sparkles,         end: true },
  { to: '/surface',  label: 'Card / Separator',         icon: Square },
  { to: '/button',   label: 'Button',                   icon: MousePointerClick },
  { to: '/input',    label: 'Input / Textarea / Label', icon: TextCursorInput },
  { to: '/feedback', label: 'Badge / Toast / Dialog',   icon: MessageSquare },
  { to: '/overlay',  label: 'Tooltip / Tabs',           icon: Layout },
  { to: '/tokens',   label: 'Token 速查',               icon: Palette },
  { to: '/review',   label: '每日复盘',                   icon: CalendarCheck },
] as const;