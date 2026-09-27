import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SalonesListComponent } from './features/salones/salones-list.component';
import { ReservacionesComponent } from './features/reservaciones/reservaciones.component';
import { EmpleadosListComponent } from './features/empleados/empleados-list.component';
import { AcademicoComponent } from './features/academico/academico.component';
import { InventarioComponent } from './features/inventario/inventario.component';
import { CalidadComponent } from './features/calidad/calidad.component';
import { UsersListComponent } from './features/users/users-list.component';
import { TvDisplayComponent } from './features/tv-display/tv-display.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'tv',
    component: TvDisplayComponent,
    title: 'INTECAP - Panel Informativo de Salones en Vivo',
  },
  {
    path: 'pantalla',
    component: TvDisplayComponent,
    title: 'INTECAP - Panel Informativo de Salones en Vivo',
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'salones',
        component: SalonesListComponent,
      },
      {
        path: 'reservaciones',
        component: ReservacionesComponent,
      },
      {
        path: 'empleados',
        component: EmpleadosListComponent,
      },
      {
        path: 'academico',
        component: AcademicoComponent,
      },
      {
        path: 'usuarios',
        component: UsersListComponent,
      },
      {
        path: 'inventario',
        component: InventarioComponent,
      },
      {
        path: 'calidad',
        component: CalidadComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];

