import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      richColors
      position="top-center"
      theme="light"
      toastOptions={{
        classNames: {
          toast: 'glass-l2 rounded-[var(--radius-input)]',
        },
      }}
    />
  );
}
