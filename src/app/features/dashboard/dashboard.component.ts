import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { EmptyStateComponent } from '../../shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, EmptyStateComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private apiService = inject(ApiService);

  totalSalones = signal(0);
  totalTalleres = signal(0);
  totalEmpleados = signal(0);
  totalReservaciones = signal(0);
  recentReservaciones = signal<any[]>([]);

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    // Load Salones
    this.apiService.getSalones(1).subscribe({
      next: (res) => this.totalSalones.set(res.total || res.data?.length || 0),
    });

    // Load Talleres
    this.apiService.getSalones(0).subscribe({
      next: (res) => this.totalTalleres.set(res.total || res.data?.length || 0),
    });

    // Load Empleados
    this.apiService.getEmpleados(5).subscribe({
      next: (res) => this.totalEmpleados.set(res.total || res.data?.length || 0),
    });

    // Load Reservaciones
    this.apiService.getReservaciones(5).subscribe({
      next: (res) => {
        this.totalReservaciones.set(res.total || res.data?.length || 0);
        this.recentReservaciones.set(res.data || []);
      },
    });
  }
}
