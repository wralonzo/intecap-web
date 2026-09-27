import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts = signal<Toast[]>([]);

  readonly activeToasts = this.toasts.asReadonly();

  show(toast: Omit<Toast, 'id'>): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id, duration: toast.duration || 4000 };

    this.toasts.update((current) => [...current, newToast]);

    setTimeout(() => {
      this.remove(id);
    }, newToast.duration);
  }

  success(message: string, title: string = '¡Operación Exitosa!'): void {
    this.show({ type: 'success', title, message });
  }

  error(message: string, title: string = 'Ocurrió un error'): void {
    this.show({ type: 'error', title, message });
  }

  warning(message: string, title: string = 'Advertencia'): void {
    this.show({ type: 'warning', title, message });
  }

  info(message: string, title: string = 'Información'): void {
    this.show({ type: 'info', title, message });
  }

  remove(id: string): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
