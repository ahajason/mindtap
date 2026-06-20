import { Tabs } from '@base-ui/react/tabs';
import { cn } from '@/lib/utils';

export const TabsRoot = Tabs.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof Tabs.List>) {
  return (
    <Tabs.List
      className={cn(
        'inline-flex items-center gap-1 p-1 glass-l1 rounded-[var(--radius-input)]',
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Tabs.Tab>) {
  return (
    <Tabs.Tab
      className={cn(
        'px-3 py-1.5 text-sm font-medium text-text-2 rounded-md transition-all duration-base',
        'data-[selected]:bg-white/55 data-[selected]:text-text-1',
        'hover:bg-white/35',
        className
      )}
      {...props}
    />
  );
}

export function TabsPanel({
  className,
  ...props
}: React.ComponentProps<typeof Tabs.Panel>) {
  return <Tabs.Panel className={cn('mt-4', className)} {...props} />;
}
