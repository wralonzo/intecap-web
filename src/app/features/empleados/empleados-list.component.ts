import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Empleado, TipoEmpleado } from '../../core/models';

@Component({
  selector: 'app-empleados-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="empleados-page">
      <div class="page-header">
        <div>
          <span class="badge-tag">RECURSOS HUMANOS & DOCENCIA</span>
          <h1>Personal y Puestos de Trabajo</h1>
          <p class="subtitle">Administración de instructores, catedráticos y catálogo oficial de puestos del empleado.</p>
        </div>

        <div class="header-actions">
          @if (activeTab() === 'empleados') {
            <button (click)="openEmpleadoModal()" class="btn btn-primary">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Nuevo Empleado
            </button>
          } @else {
            <button (click)="openPuestoModal()" class="btn btn-primary">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Puesto
            </button>
          }
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="nav-tabs-wrapper">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'empleados'"
          (click)="activeTab.set('empleados')"
        >
          <span class="tab-icon">👨‍🏫</span>
          Directorio de Empleados ({{ empleados().length }})
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'puestos'"
          (click)="activeTab.set('puestos')"
        >
          <span class="tab-icon">💼</span>
          Catálogo de Puestos del Empleado ({{ puestos().length }})
        </button>
      </div>

      <!-- ========================================== -->
      <!-- TAB 1: EMPLEADOS DIRECTORY -->
      <!-- ========================================== -->
      @if (activeTab() === 'empleados') {
        <div class="search-bar card">
          <svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            class="form-control search-input"
            placeholder="Buscar por nombre, apellido, correo o profesión..."
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
          />
        </div>

        <div class="card table-card">
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Cargando lista de personal...</p>
            </div>
          } @else if (empleados().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">👨‍🏫</div>
              <h3>No se encontraron empleados</h3>
              <p>Registra instructores y colaboradores para poder asignarlos a salones, cursos y evaluaciones.</p>
              <button (click)="openEmpleadoModal()" class="btn btn-primary btn-sm">Registrar Nuevo Empleado</button>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre Completo</th>
                    <th>Puesto del Empleado</th>
                    <th>Correo Electrónico</th>
                    <th>Teléfono</th>
                    <th>Estado</th>
                    <th class="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (e of empleados(); track e.id) {
                    <tr>
                      <td class="font-mono text-muted">#{{ e.id }}</td>
                      <td>
                        <div class="user-meta">
                          <div class="avatar-circle">{{ e.nombres.charAt(0) }}</div>
                          <div>
                            <div class="font-bold text-navy">{{ e.nombres }} {{ e.apellidos }}</div>
                            <div class="text-xs text-muted">{{ e.profesion || 'Personal Docente' }}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="puesto-tag">
                          💼 {{ getPuestoName(e.tipoEmpleadoId) }}
                        </span>
                      </td>
                      <td>{{ e.email || '-' }}</td>
                      <td>{{ e.telefono || '-' }}</td>
                      <td><span class="badge badge-success">Activo</span></td>
                      <td class="text-right">
                        <div class="action-btns">
                          <button (click)="editEmpleado(e)" class="action-btn btn-edit" title="Editar Empleado">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button (click)="deleteEmpleado(e.id)" class="action-btn btn-delete" title="Desactivar Empleado">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- ========================================== -->
      <!-- TAB 2: CATÁLOGO DE PUESTOS DEL EMPLEADO -->
      <!-- ========================================== -->
      @if (activeTab() === 'puestos') {
        <div class="card table-card">
          <div class="card-header-bar">
            <div>
              <h3>Puestos y Cargos de la Institución</h3>
              <p class="text-xs text-muted">Configuración de perfiles laborales para el personal y docentes INTECAP.</p>
            </div>
            <button (click)="openPuestoModal()" class="btn btn-outline btn-sm">
              + Agregar Nuevo Puesto
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 80px;">ID</th>
                  <th>Nombre del Puesto del Empleado</th>
                  <th>Estado</th>
                  <th class="text-right" style="width: 140px;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (p of puestos(); track p.id) {
                  <tr>
                    <td class="font-mono text-muted">#{{ p.id }}</td>
                    <td>
                      <div class="font-bold text-navy">
                        💼 {{ p.name || p.tipoEmpleado }}
                      </div>
                    </td>
                    <td>
                      <span class="badge" [class.badge-success]="p.estado === 1" [class.badge-danger]="p.estado === 0">
                        {{ p.estado === 1 ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="action-btns">
                        <button (click)="editPuesto(p)" class="action-btn btn-edit" title="Editar Puesto">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button (click)="deletePuesto(p.id)" class="action-btn btn-delete" title="Desactivar Puesto">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- MODAL EMPLEADO -->
      @if (showEmpModal()) {
        <div class="modal-overlay" (click)="closeEmpleadoModal()">
          <div class="modal-content card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditingEmp() ? 'Editar Empleado' : 'Registrar Empleado' }}</h3>
              <button (click)="closeEmpleadoModal()" class="close-btn">&times;</button>
            </div>

            <form (ngSubmit)="saveEmpleado()">
              <div class="form-row">
                <div class="form-group">
                  <label>Nombres *</label>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Ej: Juan Carlos"
                    [(ngModel)]="activeEmp.nombres"
                    name="nombres"
                    required
                  />
                </div>
                <div class="form-group">
                  <label>Apellidos *</label>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Ej: Pérez Gómez"
                    [(ngModel)]="activeEmp.apellidos"
                    name="apellidos"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Puesto del Empleado *</label>
                <select class="form-control" [(ngModel)]="activeEmp.tipoEmpleadoId" name="tipoEmpleadoId" required>
                  @for (t of puestos(); track t.id) {
                    <option [value]="t.id">{{ t.name || t.tipoEmpleado }}</option>
                  }
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Correo Electrónico</label>
                  <input
                    type="email"
                    class="form-control"
                    placeholder="ejemplo@intecap.edu.gt"
                    [(ngModel)]="activeEmp.email"
                    name="email"
                  />
                </div>
                <div class="form-group">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="5555-4444"
                    [(ngModel)]="activeEmp.telefono"
                    name="telefono"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Dirección</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Zona, Ciudad o Municipio"
                  [(ngModel)]="activeEmp.direccion"
                  name="direccion"
                />
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closeEmpleadoModal()" class="btn btn-secondary">Cancelar</button>
                <button type="submit" class="btn btn-primary">
                  {{ isEditingEmp() ? 'Guardar Cambios' : 'Crear Empleado' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL PUESTO DEL EMPLEADO -->
      @if (showPuestoModal()) {
        <div class="modal-overlay" (click)="closePuestoModal()">
          <div class="modal-content card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditingPuesto() ? 'Editar Puesto del Empleado' : 'Nuevo Puesto del Empleado' }}</h3>
              <button (click)="closePuestoModal()" class="close-btn">&times;</button>
            </div>

            <form (ngSubmit)="savePuesto()">
              <div class="form-group">
                <label>Nombre del Puesto *</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Ej: Instructor de Tecnologías Web"
                  [(ngModel)]="activePuesto.name"
                  name="puestoName"
                  required
                />
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closePuestoModal()" class="btn btn-secondary">Cancelar</button>
                <button type="submit" class="btn btn-primary">
                  {{ isEditingPuesto() ? 'Actualizar Puesto' : 'Crear Puesto' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .empleados-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .badge-tag { font-size: 0.75rem; font-weight: 700; color: #e5a823; letter-spacing: 1px; margin-bottom: 0.25rem; display: block; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; h1 { font-size: 1.75rem; font-weight: 800; color: #0d2d5e; margin: 0; } .subtitle { font-size: 0.9rem; color: #64748b; margin-top: 0.25rem; } }
    .header-actions { display: flex; gap: 0.75rem; align-items: center; }
    
    .nav-tabs-wrapper { display: flex; gap: 0.5rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
    .tab-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.25rem; border: none; background: transparent; border-radius: 8px; font-weight: 700; font-size: 0.9rem; color: #64748b; cursor: pointer; transition: all 0.2s; &:hover { background: #f1f5f9; color: #0d2d5e; } &.active { background: #0d2d5e; color: #ffffff; box-shadow: 0 4px 10px rgba(13, 45, 94, 0.2); } }
    .tab-icon { font-size: 1.1rem; }

    .search-bar { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.25rem; background: #ffffff; }
    .search-icon { width: 20px; height: 20px; color: #94a3b8; flex-shrink: 0; }
    .search-input { border-color: transparent; font-size: 0.95rem; width: 100%; &:focus { box-shadow: none; border-color: transparent; } }

    .table-card { padding: 0; overflow: hidden; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; }
    .card-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; h3 { font-size: 1.1rem; font-weight: 800; color: #0d2d5e; margin: 0; } }
    .table-responsive { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; th { background-color: #F8FAFC; text-align: left; padding: 0.875rem 1rem; font-size: 0.75rem; font-weight: 700; color: #64748b; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.05em; } td { padding: 0.875rem 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; } }
    
    .user-meta { display: flex; align-items: center; gap: 0.75rem; }
    .avatar-circle { width: 36px; height: 36px; border-radius: 50%; background: #0d2d5e; color: #ffffff; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; }
    .font-bold { font-weight: 700; }
    .text-navy { color: #0d2d5e; }
    .text-muted { color: #64748b; }
    .text-right { text-align: right; }
    .puesto-tag { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; font-size: 0.8rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 6px; }

    .action-btns { display: flex; justify-content: flex-end; gap: 0.4rem; }
    .action-btn { width: 32px; height: 32px; border-radius: 6px; border: 1px solid transparent; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; svg { width: 16px; height: 16px; } }
    .btn-edit { color: #0284c7; &:hover { background: #e0f2fe; border-color: #bae6fd; } }
    .btn-delete { color: #dc2626; &:hover { background: #fee2e2; border-color: #fecaca; } }

    .empty-state { text-align: center; padding: 3rem 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; color: #64748b; .empty-icon { font-size: 2.5rem; } }
    .loading-state { text-align: center; padding: 3rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; color: #64748b; }
    .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #0d2d5e; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 1.5rem; }
    .modal-content { width: 100%; max-width: 520px; background: #FFFFFF; border-radius: 12px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem; h3 { font-size: 1.25rem; font-weight: 800; color: #0d2d5e; margin: 0; } }
    .close-btn { background: transparent; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; &:hover { color: #0f172a; } }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; border-top: 1px solid #f1f5f9; padding-top: 1rem; }
  `],
})
export class EmpleadosListComponent implements OnInit {
  private apiService = inject(ApiService);

  activeTab = signal<'empleados' | 'puestos'>('empleados');
  empleados = signal<Empleado[]>([]);
  puestos = signal<TipoEmpleado[]>([]);
  loading = signal(true);
  
  showEmpModal = signal(false);
  isEditingEmp = signal(false);
  activeEmp: any = {
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    direccion: '',
    tipoEmpleadoId: 1,
  };

  showPuestoModal = signal(false);
  isEditingPuesto = signal(false);
  activePuesto: any = {
    id: null,
    name: '',
  };

  searchQuery = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.apiService.getPuestos().subscribe({
      next: (res) => {
        this.puestos.set(res || []);
      },
      error: () => {
        this.apiService.getTiposEmpleado().subscribe({
          next: (res) => this.puestos.set(res || []),
        });
      },
    });

    this.loadEmpleados();
  }

  loadEmpleados(): void {
    this.loading.set(true);
    this.apiService.getEmpleados().subscribe({
      next: (res) => {
        this.empleados.set(res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getPuestoName(id: number): string {
    const found = this.puestos().find((p) => p.id === id);
    return found ? (found.name || found.tipoEmpleado || 'Docente') : 'Docente';
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.loadEmpleados();
      return;
    }
    this.apiService.searchEmpleados(this.searchQuery).subscribe({
      next: (res) => this.empleados.set(res || []),
    });
  }

  // Empleados Modal Actions
  openEmpleadoModal(): void {
    this.isEditingEmp.set(false);
    this.activeEmp = {
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      direccion: '',
      tipoEmpleadoId: this.puestos()[0]?.id || 1,
    };
    this.showEmpModal.set(true);
  }

  editEmpleado(emp: Empleado): void {
    this.isEditingEmp.set(true);
    this.activeEmp = { ...emp };
    this.showEmpModal.set(true);
  }

  closeEmpleadoModal(): void {
    this.showEmpModal.set(false);
  }

  saveEmpleado(): void {
    if (!this.activeEmp.nombres || !this.activeEmp.apellidos) {
      alert('Por favor completa los nombres y apellidos del empleado.');
      return;
    }

    if (this.isEditingEmp() && this.activeEmp.id) {
      this.apiService.updateEmpleado(this.activeEmp.id, this.activeEmp).subscribe({
        next: () => {
          this.closeEmpleadoModal();
          this.loadEmpleados();
        },
      });
    } else {
      this.apiService.createEmpleado(this.activeEmp).subscribe({
        next: () => {
          this.closeEmpleadoModal();
          this.loadEmpleados();
        },
      });
    }
  }

  deleteEmpleado(id: number): void {
    if (!confirm(`¿Estás seguro de desactivar al empleado #${id}?`)) return;
    this.apiService.deleteEmpleado(id).subscribe({
      next: () => this.loadEmpleados(),
    });
  }

  // Puestos Modal Actions
  openPuestoModal(): void {
    this.isEditingPuesto.set(false);
    this.activePuesto = { id: null, name: '' };
    this.showPuestoModal.set(true);
  }

  editPuesto(p: TipoEmpleado): void {
    this.isEditingPuesto.set(true);
    this.activePuesto = { id: p.id, name: p.name || p.tipoEmpleado || '' };
    this.showPuestoModal.set(true);
  }

  closePuestoModal(): void {
    this.showPuestoModal.set(false);
  }

  savePuesto(): void {
    if (!this.activePuesto.name.trim()) {
      alert('Por favor ingresa el nombre del puesto del empleado.');
      return;
    }

    if (this.isEditingPuesto() && this.activePuesto.id) {
      this.apiService.updatePuesto(this.activePuesto.id, { name: this.activePuesto.name }).subscribe({
        next: () => {
          this.closePuestoModal();
          this.loadData();
        },
      });
    } else {
      this.apiService.createPuesto({ name: this.activePuesto.name }).subscribe({
        next: () => {
          this.closePuestoModal();
          this.loadData();
        },
      });
    }
  }

  deletePuesto(id: number): void {
    if (!confirm(`¿Estás seguro de desactivar este puesto del empleado?`)) return;
    this.apiService.deletePuesto(id).subscribe({
      next: () => this.loadData(),
    });
  }
}
