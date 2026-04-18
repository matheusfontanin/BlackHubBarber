import { toast } from 'sonner';

export function handleError(err: unknown, userMessage: string): void {
  if (import.meta.env.DEV) {
    console.error(userMessage, err);
  }
  toast.error(userMessage);
}

export function handleSuccess(message: string): void {
  toast.success(message);
}
