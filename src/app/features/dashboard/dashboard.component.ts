import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { EmptyStateComponent } from '../../shared';
import { Reservacion, ReservacionesStats } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, EmptyStateComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private apiService = inject(ApiService);
  private ws = inject(WebSocketService);

  totalSalones = signal(0);
  totalTalleres = signal(0);
  totalEmpleados = signal(0);
  totalReservaciones = signal(0);
  reservacionesStats = signal<ReservacionesStats | null>(null);
  recentReservaciones = signal<Reservacion[]>([]);

  private subs: Subscription[] = [];

  // Fecha de hoy en formato YYYY-MM-DD
  todayStr = computed(() => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guatemala' }));
    return now.toISOString().split('T')[0];
  });

  // Eventos aprobados que ocurren hoy
  eventosHoy = computed(() => {
    const today = this.todayStr();
    return this.recentReservaciones().filter(
      (r) =>
        (r.status === 2 || r.estado === 2) &&
        (r.eventDate === today || r.fechaEvento === today),
    );
  });

  ngOnInit(): void {
    this.loadStats();

    // Sincronización en tiempo real vía WebSockets
    this.subs.push(
      this.ws.onDisponibilidadUpdate().subscribe(() => this.loadStats()),
      this.ws.onNuevaReservacion().subscribe(() => this.loadStats()),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  loadStats(): void {
    // Cargar Salones Teóricos
    this.apiService.getSalones(1, 100).subscribe({
      next: (res) => this.totalSalones.set(res.total || res.data?.length || 0),
    });

    // Cargar Talleres Prácticos
    this.apiService.getSalones(0, 100).subscribe({
      next: (res) => this.totalTalleres.set(res.total || res.data?.length || 0),
    });

    // Cargar Empleados / Docentes
    this.apiService.getEmpleados(100).subscribe({
      next: (res) => this.totalEmpleados.set(res.total || res.data?.length || 0),
    });

    // Cargar Estadísticas de Reservaciones
    this.apiService.getReservacionesStats().subscribe({
      next: (stats) => this.reservacionesStats.set(stats),
    });

    // Cargar Reservaciones Recientes
    this.apiService.getReservaciones(15).subscribe({
      next: (res) => {
        this.totalReservaciones.set(res.total || res.data?.length || 0);
        this.recentReservaciones.set(res.data || []);
      },
    });
  }
}
