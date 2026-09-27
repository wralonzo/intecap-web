import { HttpInterceptorFn, HttpRequest, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

// Registro de peticiones mutantes en vuelo y throttling anti doble-click
const pendingMutations = new Map<string, number>();

function getRequestSignature(req: HttpRequest<unknown>): string {
  const bodyString = req.body ? JSON.stringify(req.body) : '';
  return `${req.method}:${req.urlWithParams}:${bodyString}`;
}

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  const isMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method.toUpperCase());

  // Protección anti-duplicado para peticiones mutantes
  if (isMutating) {
    const signature = getRequestSignature(req);
    const now = Date.now();
    const lastExecuted = pendingMutations.get(signature);

    // Si la misma petición exacta fue enviada hace menos de 800ms, bloquear duplicado
    if (lastExecuted && now - lastExecuted < 800) {
      console.warn(`[Anti-Duplicate] Petición ${req.method} a ${req.url} bloqueada para evitar registro duplicado.`);
      return EMPTY;
    }

    pendingMutations.set(signature, now);
  }

  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      loadingService.hide();
      if (isMutating) {
        const signature = getRequestSignature(req);
        setTimeout(() => {
          pendingMutations.delete(signature);
        }, 1000);
      }
    }),
  );
};
