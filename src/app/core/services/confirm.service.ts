import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'primary' | 'success';
  icon?: string;
  detail?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmService {
  private dialogState = signal<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  readonly state = this.dialogState.asReadonly();

  /**
   * Abre una modal de confirmación moderna y retorna una Promesa booleana.
   * Reemplazo 100% libre de confirm() y alert() nativos del navegador.
   */
  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialogState.set({
        isOpen: true,
        options: {
          confirmText: 'Confirmar',
          cancelText: 'Cancelar',
          type: 'danger',
          ...options,
        },
        resolve,
      });
    });
  }

  /**
   * Resuelve la acción del usuario (Aceptar o Cancelar)
   */
  handleAction(confirmed: boolean): void {
    const current = this.dialogState();
    if (current) {
      current.resolve(confirmed);
      this.dialogState.set(null);
    }
  }
}
