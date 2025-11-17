import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToastState } from '@/hooks/useToast';

export function Toaster() {
  const { toasts, removeToast } = useToastState();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant, ...props }) => {
        return (
          <Toast
            key={id}
            variant={variant}
            onOpenChange={(open) => {
              if (!open) {
                removeToast(id);
              }
            }}
            {...props}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
