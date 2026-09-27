import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { UserRole } from '../models';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const allowedRoles = (route.data?.['roles'] as UserRole[]) || [];
  if (allowedRoles.length === 0) {
    return true;
  }

  const userRole = authService.role();
  if (userRole === 'ADMIN' || allowedRoles.includes(userRole)) {
    return true;
  }

  toastService.warning('Acceso Restringido', 'No tienes permisos suficientes para acceder a este módulo.');

  if (userRole === 'BODEGA') {
    return router.createUrlTree(['/inventario']);
  }

  return router.createUrlTree(['/salones']);
};
