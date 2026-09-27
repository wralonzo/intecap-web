import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page">
      <!-- Welcome Hero Banner -->
      <div class="hero-banner">
        <div class="hero-content">
          <div class="hero-badge">PORTAL ADMINISTRATIVO</div>
          <h1>Bienvenido, {{ authService.currentUser()?.username }}</h1>
          <p>Supervisa salones, ocupación, reservaciones activas y personal docente en tiempo real.</p>
        </div>
        <div class="hero-actions">
          <a routerLink="/reservaciones" class="btn btn-gold">
            <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Reservación
          </a>
          <a routerLink="/salones" class="btn btn-secondary">Ver Salones</a>
        </div>
      </div>

      <!-- Stat KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-wrapper bg-blue">
            <svg class="kpi-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">Salones de Clase</div>
            <div class="kpi-value">{{ totalSalones() }}</div>
            <div class="kpi-subtext">Espacios teóricos</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrapper bg-gold">
            <svg class="kpi-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">Talleres Prácticos</div>
            <div class="kpi-value">{{ totalTalleres() }}</div>
            <div class="kpi-subtext">Laboratorios técnicos</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrapper bg-navy">
            <svg class="kpi-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">Docentes / Personal</div>
            <div class="kpi-value">{{ totalEmpleados() }}</div>
            <div class="kpi-subtext">Instructores activos</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrapper bg-green">
            <svg class="kpi-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="kpi-info">
            <div class="kpi-label">Reservaciones</div>
            <div class="kpi-value">{{ totalReservaciones() }}</div>
            <div class="kpi-subtext">Eventos registrados</div>
          </div>
        </div>
      </div>

      <!-- Quick Action Panels Grid -->
      <div class="dashboard-grid">
        <!-- Recent Reservations -->
        <div class="card panel-card">
          <div class="panel-header">
            <h3>Reservaciones Recientes</h3>
            <a routerLink="/reservaciones" class="view-all">Ver todas →</a>
          </div>

          @if (recentReservaciones().length === 0) {
            <div class="empty-state">
              <p>No hay reservaciones recientes registradas.</p>
              <a routerLink="/reservaciones" class="btn btn-primary btn-sm">Crear primera reservación</a>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Salón / Taller</th>
                    <th>Docente</th>
                    <th>Curso</th>
                    <th>Jornada</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of recentReservaciones(); track r.id) {
                    <tr>
                      <td class="font-medium text-navy">{{ r.salon?.title || 'Salón #' + r.salonId }}</td>
                      <td>{{ r.empleado ? r.empleado.nombres + ' ' + r.empleado.apellidos : '-' }}</td>
                      <td>{{ r.curso?.nombre || '-' }}</td>
                      <td>{{ r.jornada || 'General' }}</td>
                      <td>
                        <span class="badge badge-success">Confirmada</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- System & Shortcuts -->
        <div class="card panel-card">
          <div class="panel-header">
            <h3>Acceso Rápido</h3>
          </div>
          <div class="quick-links-grid">
            <a routerLink="/salones" class="quick-link-box">
              <div class="box-icon">🏛️</div>
              <div class="box-title">Gestión de Salones</div>
              <div class="box-desc">Distribución por días y mobiliario</div>
            </a>

            <a routerLink="/empleados" class="quick-link-box">
              <div class="box-icon">👨‍🏫</div>
              <div class="box-title">Directorio Docente</div>
              <div class="box-desc">Instructores y roles asignados</div>
            </a>

            <a routerLink="/academico" class="quick-link-box">
              <div class="box-icon">📚</div>
              <div class="box-title">Cursos y Carreras</div>
              <div class="box-desc">Oferta académica y jornadas</div>
            </a>

            <a routerLink="/calidad" class="quick-link-box">
              <div class="box-icon">⭐</div>
              <div class="box-title">Control de Calidad</div>
              <div class="box-desc">Evaluación y seguimiento docente</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .hero-banner {
      background: linear-gradient(135deg, var(--intecap-navy-dark) 0%, var(--intecap-navy) 100%);
      color: #FFFFFF;
      border-radius: var(--radius-lg);
      padding: 2rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      box-shadow: var(--shadow-md);
      position: relative;
      overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, rgba(253, 184, 19, 0.15) 0%, transparent 70%);
        right: -50px;
        top: -50px;
        pointer-events: none;
      }
    }

    .hero-badge {
      display: inline-block;
      background: var(--intecap-gold);
      color: var(--intecap-navy-dark);
      font-size: 0.6875rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-sm);
      margin-bottom: 0.5rem;
    }

    .hero-content {
      h1 {
        color: #FFFFFF;
        font-size: 1.75rem;
        margin-bottom: 0.35rem;
      }

      p {
        color: #CBD5E1;
        font-size: 0.9375rem;
      }
    }

    .hero-actions {
      display: flex;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .btn-icon {
      width: 1.125rem;
      height: 1.125rem;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .kpi-card {
      background: #FFFFFF;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }
    }

    .kpi-icon-wrapper {
      width: 3rem;
      height: 3rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.bg-blue {
        background-color: var(--intecap-blue-light);
        color: var(--intecap-navy);
      }

      &.bg-gold {
        background-color: var(--intecap-gold-light);
        color: #B45309;
      }

      &.bg-navy {
        background-color: #E2E8F0;
        color: var(--intecap-navy-dark);
      }

      &.bg-green {
        background-color: var(--status-success-bg);
        color: var(--status-success);
      }
    }

    .kpi-icon {
      width: 1.5rem;
      height: 1.5rem;
    }

    .kpi-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .kpi-value {
      font-size: 1.625rem;
      font-weight: 800;
      color: var(--intecap-navy-dark);
      font-family: var(--font-heading);
      line-height: 1.2;
    }

    .kpi-subtext {
      font-size: 0.6875rem;
      color: var(--text-muted);
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;

      @media (max-width: 960px) {
        grid-template-columns: 1fr;
      }
    }

    .panel-card {
      display: flex;
      flex-direction: column;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      h3 {
        font-size: 1.125rem;
        color: var(--intecap-navy-dark);
      }

      .view-all {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--intecap-blue);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      th {
        text-align: left;
        padding: 0.625rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--text-secondary);
        border-bottom: 2px solid var(--border-color);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      td {
        padding: 0.75rem;
        border-bottom: 1px solid var(--border-subtle);
        color: var(--text-primary);
      }
    }

    .text-navy {
      color: var(--intecap-navy);
    }

    .font-medium {
      font-weight: 600;
    }

    .empty-state {
      text-align: center;
      padding: 2.5rem 1rem;
      color: var(--text-muted);
      font-size: 0.875rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .quick-links-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .quick-link-box {
      display: flex;
      flex-direction: column;
      padding: 0.875rem 1rem;
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      text-decoration: none;
      transition: all 0.2s ease;

      &:hover {
        background-color: #FFFFFF;
        border-color: var(--intecap-navy);
        box-shadow: var(--shadow-sm);
        transform: translateX(2px);
      }

      .box-icon {
        font-size: 1.25rem;
        margin-bottom: 0.25rem;
      }

      .box-title {
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--intecap-navy-dark);
      }

      .box-desc {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }
  `],
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
