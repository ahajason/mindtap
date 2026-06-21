import { Tooltip } from '@base-ui/react/tooltip';
import { cn } from '@/lib/utils';

export function TooltipProvider({ delay = 200, ...props }: React.ComponentProps<typeof Tooltip.Provider>) {
  return <Tooltip.Provider delay={delay} {...props} />;
}

interface TooltipWrapperProps {
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: React.ReactElement;
}

export function TooltipWrapper({ content, side = 'top', children }: TooltipWrapperProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal>
        <Tooltip.Positioner side={side} sideOffset={6}>
          <Tooltip.Popup className={cn('glass-l2 rounded-md px-2 py-1 text-xs text-text-1')}>
            {content}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
