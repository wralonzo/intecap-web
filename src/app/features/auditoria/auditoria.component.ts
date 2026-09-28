import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AuditLog, AuditLogStats, AuditFilter } from '../../core/models';
import { exportToCsv, printHtmlReport } from '../../core/utils/export.util';
import {
  PageHeaderComponent,
  ModalComponent,
  EmptyStateComponent,
  CustomSelectComponent,
  SelectOption,
} from '../../shared';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    ModalComponent,
    EmptyStateComponent,
    CustomSelectComponent,
  ],
  templateUrl: './auditoria.component.html',
  styleUrl: './auditoria.component.scss',
})
export class AuditoriaComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  logs = signal<AuditLog[]>([]);
  totalLogs = signal<number>(0);
  loading = signal<boolean>(true);
  stats = signal<AuditLogStats>({
    total: 0,
    totalHoy: 0,
    porAccion: [],
    porModulo: [],
    porUsuario: [],
  });

  // Modal Detail State
  selectedLog = signal<AuditLog | null>(null);
  showDetailModal = signal<boolean>(false);

  // Filters State
  searchQuery = signal<string>('');
  selectedModule = signal<string>('TODOS');
  selectedAction = signal<string>('TODAS');
  startDate = signal<string>('');
  endDate = signal<string>('');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = 25;

  // Options for Custom Selects
  moduloOptions: SelectOption[] = [
    { value: 'TODOS', label: 'Todos los Módulos', icon: '🏛️' },
    { value: 'RESERVACIONES', label: 'Reservaciones y Eventos', icon: '📅', badge: 'Eventos', badgeColor: 'blue' },
    { value: 'SALONES', label: 'Salones y Talleres', icon: '🏛️', badge: 'Infraestructura', badgeColor: 'gold' },
    { value: 'USUARIOS', label: 'Usuarios y Seguridad', icon: '👤', badge: 'Seguridad', badgeColor: 'red' },
    { value: 'EMPLEADOS', label: 'Directorio de Personal', icon: '👨‍🏫', badge: 'Personal', badgeColor: 'blue' },
    { value: 'CALIDAD', label: 'Control de Calidad Docente', icon: '⭐', badge: 'Auditoría', badgeColor: 'gold' },
    { value: 'AVISOS', label: 'Avisos y Pantalla TV', icon: '📢', badge: 'Comunicación', badgeColor: 'green' },
    { value: 'ACADEMICO', label: 'Académico (Cursos/Carreras)', icon: '📚', badge: 'Académico', badgeColor: 'blue' },
    { value: 'INVENTARIO', label: 'Inventario y Mobiliario', icon: '📦', badge: 'Logística', badgeColor: 'gray' },
    { value: 'AUTH', label: 'Acceso y Autenticación', icon: '🔑', badge: 'Accesos', badgeColor: 'blue' },
  ];

  accionOptions: SelectOption[] = [
    { value: 'TODAS', label: 'Todas las Operaciones', icon: '⚡' },
    { value: 'CREATE', label: 'Creación (CREATE)', icon: '➕', badge: 'Nuevo', badgeColor: 'green' },
    { value: 'UPDATE', label: 'Modificación (UPDATE)', icon: '✏️', badge: 'Edición', badgeColor: 'blue' },
    { value: 'DELETE', label: 'Eliminación (DELETE)', icon: '🗑️', badge: 'Baja', badgeColor: 'red' },
    { value: 'APPROVE', label: 'Aprobación (APPROVE)', icon: '✅', badge: 'Aprobado', badgeColor: 'green' },
    { value: 'REJECT', label: 'Rechazo (REJECT)', icon: '❌', badge: 'Rechazado', badgeColor: 'red' },
    { value: 'LOGIN', label: 'Inicio de Sesión (LOGIN)', icon: '🔓', badge: 'Sesión', badgeColor: 'blue' },
    { value: 'STATUS_CHANGE', label: 'Cambio de Estado', icon: '🔄', badge: 'Estado', badgeColor: 'gold' },
  ];

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalLogs() / this.pageSize)));

  topModulo = computed(() => {
    const list = this.stats().porModulo;
    return list && list.length > 0 ? `${list[0].module} (${list[0].count})` : 'N/A';
  });

  accionesCriticasCount = computed(() => {
    const acciones = this.stats().porAccion;
    const deletes = acciones.find((a) => a.action === 'DELETE')?.count || 0;
    const rejects = acciones.find((a) => a.action === 'REJECT')?.count || 0;
    return deletes + rejects;
  });

  ngOnInit(): void {
    this.loadStats();
    this.loadLogs();
  }

  loadStats(): void {
    this.api.getAuditStats().subscribe({
      next: (res) => this.stats.set(res),
      error: (err) => console.error('Error cargando estadísticas de auditoría:', err),
    });
  }

  loadLogs(resetPage = false): void {
    if (resetPage) this.currentPage.set(1);
    this.loading.set(true);

    const filter: AuditFilter = {
      module: this.selectedModule(),
      action: this.selectedAction(),
      search: this.searchQuery(),
      startDate: this.startDate() || undefined,
      endDate: this.endDate() || undefined,
    };

    const offset = (this.currentPage() - 1) * this.pageSize;

    this.api.getAuditLogs(this.pageSize, offset, filter).subscribe({
      next: (res) => {
        this.logs.set(res.data || []);
        this.totalLogs.set(res.total || 0);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando logs de auditoría:', err);
        this.toast.error('Error al cargar la bitácora de auditoría');
        this.loading.set(false);
      },
    });
  }

  onFilterChange(): void {
    this.loadLogs(true);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedModule.set('TODOS');
    this.selectedAction.set('TODAS');
    this.startDate.set('');
    this.endDate.set('');
    this.loadLogs(true);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadLogs(false);
    }
  }

  openDetail(log: AuditLog): void {
    this.selectedLog.set(log);
    this.showDetailModal.set(true);
  }

  closeDetail(): void {
    this.showDetailModal.set(false);
    this.selectedLog.set(null);
  }

  getActionBadgeClass(action: string): string {
    switch (action?.toUpperCase()) {
      case 'CREATE':
        return 'badge-create';
      case 'UPDATE':
        return 'badge-update';
      case 'DELETE':
        return 'badge-delete';
      case 'APPROVE':
        return 'badge-approve';
      case 'REJECT':
        return 'badge-reject';
      case 'LOGIN':
        return 'badge-login';
      case 'STATUS_CHANGE':
        return 'badge-status';
      default:
        return 'badge-default';
    }
  }

  getActionIcon(action: string): string {
    switch (action?.toUpperCase()) {
      case 'CREATE':
        return '➕';
      case 'UPDATE':
        return '✏️';
      case 'DELETE':
        return '🗑️';
      case 'APPROVE':
        return '✅';
      case 'REJECT':
        return '❌';
      case 'LOGIN':
        return '🔑';
      case 'STATUS_CHANGE':
        return '🔄';
      default:
        return '📌';
    }
  }

  exportExcel(): void {
    const dataToExport = this.logs().map((l) => ({
      'ID Evento': l.id,
      'Fecha y Hora': new Date(l.createdAt).toLocaleString('es-GT'),
      'Usuario / Operador': l.username || (l.user ? `@${l.user.username}` : 'Sistema'),
      'Módulo': l.module,
      'Acción': l.action,
      'Descripción': l.description,
      'ID Recurso': l.resourceId || '-',
      'Dirección IP': l.ipAddress || '-',
    }));

    exportToCsv(
      dataToExport,
      `Bitacora_Auditoria_INTECAP_${new Date().toISOString().split('T')[0]}`
    );
    this.toast.success('Bitácora exportada exitosamente');
  }

  exportPdf(): void {
    const tableRows = this.logs()
      .map(
        (l) => `
        <tr>
          <td>#${l.id}</td>
          <td>${new Date(l.createdAt).toLocaleString('es-GT')}</td>
          <td><strong>${l.username || (l.user ? '@' + l.user.username : 'Sistema')}</strong></td>
          <td><span class="module-tag">${l.module}</span></td>
          <td><span class="action-tag">${l.action}</span></td>
          <td>${l.description}</td>
          <td>${l.ipAddress || '-'}</td>
        </tr>
      `,
      )
      .join('');

    const html = `
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: #003865; margin: 0 0 0.5rem 0;">Informe Oficial de Auditoría y Trazabilidad</h3>
        <p style="color: #64748b; font-size: 13px; margin: 0;">
          Generado el ${new Date().toLocaleString('es-GT')} • Total registros mostrados: ${this.logs().length}
        </p>
      </div>
      <table class="report-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha / Hora</th>
            <th>Usuario</th>
            <th>Módulo</th>
            <th>Acción</th>
            <th>Descripción de la Operación</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;

    printHtmlReport('Bitácora de Auditoría y Control de Calidad', html);
  }
}
