import { Dialog } from '@base-ui/react/dialog';
import { cn } from '@/lib/utils';

interface DialogWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  trigger?: React.ReactElement;
}

export function DialogWrapper({
  open,
  onOpenChange,
  title,
  description,
  children,
  trigger,
}: DialogWrapperProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger render={trigger} />}
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <Dialog.Viewport className="fixed inset-0 flex items-center justify-center">
          <Dialog.Popup className={cn('glass-l3 rounded-[var(--radius-card)] p-6 max-w-md w-full')}>
            <Dialog.Title className="text-lg font-semibold text-text-1 mb-2">{title}</Dialog.Title>
            {description && (
              <Dialog.Description className="text-sm text-text-2 mb-4">{description}</Dialog.Description>
            )}
            <div className="mt-4">{children}</div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
