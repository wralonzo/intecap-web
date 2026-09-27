import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { User, Empleado } from '../../core/models';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <span class="badge-tag">ADMINISTRACIÓN & SEGURIDAD</span>
          <h1>Control de Cuentas y Usuarios</h1>
          <p class="subtitle">Gestión de credenciales, roles de acceso y vinculación con el personal institucional.</p>
        </div>

        <button (click)="openCreateModal()" class="btn btn-primary">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Nuevo Usuario
        </button>
      </div>

      <!-- Quick Metrics Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon bg-blue">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <div class="stat-value">{{ users().length }}</div>
            <div class="stat-label">Usuarios Totales</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-gold">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <div class="stat-value">{{ adminCount() }}</div>
            <div class="stat-label">Administradores (Staff)</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-green">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div class="stat-value">{{ activeCount() }}</div>
            <div class="stat-label">Cuentas Activas</div>
          </div>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="search-bar card">
        <svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          class="form-control search-input"
          placeholder="Buscar por usuario, nombre de empleado o correo..."
          [(ngModel)]="searchTerm"
        />
      </div>

      <!-- Users Table Card -->
      <div class="card table-card">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando lista de usuarios...</p>
          </div>
        } @else if (filteredUsers().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>No se encontraron usuarios</h3>
            <p>Registra cuentas para que los colaboradores y docentes puedan acceder a la plataforma.</p>
            <button (click)="openCreateModal()" class="btn btn-primary btn-sm">Crear Primer Usuario</button>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 80px;">ID</th>
                  <th>Cuenta de Usuario</th>
                  <th>Empleado Vinculado</th>
                  <th>Puesto / Cargo</th>
                  <th>Nivel de Acceso</th>
                  <th>Estado</th>
                  <th class="text-right" style="width: 140px;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (u of filteredUsers(); track u.id) {
                  <tr>
                    <td class="font-mono text-muted">#{{ u.id }}</td>
                    <td>
                      <div class="user-meta">
                        <div class="avatar-circle" [class.avatar-admin]="u.staff === 1">
                          {{ u.username.charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <div class="font-bold text-navy">&#64;{{ u.username }}</div>
                          <div class="text-xs text-muted">{{ u.empleado?.email || 'Sin correo asociado' }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      @if (u.empleado) {
                        <div class="font-semibold text-primary">
                          {{ u.empleado.nombres }} {{ u.empleado.apellidos }}
                        </div>
                        <div class="text-xs text-muted">ID Empleado: #{{ u.empleado.id }}</div>
                      } @else {
                        <span class="text-muted italic">Cuenta de Sistema (Sin vincular)</span>
                      }
                    </td>
                    <td>
                      <span class="puesto-tag">
                        💼 {{ u.empleado?.tipoEmpleado?.name || u.empleado?.tipoEmpleado?.tipoEmpleado || (u.staff === 1 ? 'Administrador' : 'Usuario Estándar') }}
                      </span>
                    </td>
                    <td>
                      @if (u.staff === 1) {
                        <span class="badge badge-staff">🛡️ Administrador (Staff)</span>
                      } @else {
                        <span class="badge badge-normal">Docente / Usuario</span>
                      }
                    </td>
                    <td>
                      <span class="badge" [class.badge-success]="u.estado !== 0" [class.badge-danger]="u.estado === 0">
                        {{ u.estado !== 0 ? '✓ Activo' : '✗ Inactivo' }}
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="action-btns">
                        <button (click)="openEditModal(u)" class="action-btn btn-edit" title="Editar Usuario">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button (click)="deleteUser(u.id)" class="action-btn btn-delete" title="Desactivar Usuario">
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

      <!-- MODAL CREAR / EDITAR USUARIO -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">{{ isEditing() ? 'Modificar Cuenta de Usuario' : 'Crear Nueva Cuenta de Usuario' }}</h3>
                <span class="text-xs text-muted">Configuración de acceso para la intranet INTECAP</span>
              </div>
              <button (click)="closeModal()" class="close-btn">&times;</button>
            </div>

            <form (ngSubmit)="saveUser()">
              <div class="form-group">
                <label>Nombre de Usuario (Username) *</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Ej: jcperez"
                  [(ngModel)]="activeUser.username"
                  name="username"
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ isEditing() ? 'Nueva Contraseña (Opcional - dejar en blanco para conservar)' : 'Contraseña de Acceso *' }}</label>
                <input
                  type="password"
                  class="form-control"
                  [placeholder]="isEditing() ? '••••••••' : 'Ingresa contraseña segura'"
                  [(ngModel)]="activeUser.password"
                  name="password"
                  [required]="!isEditing()"
                />
              </div>

              <div class="form-group">
                <label>Vincular a Empleado / Docente</label>
                <select class="form-control" [(ngModel)]="activeUser.empleadoId" name="empleadoId">
                  <option [ngValue]="null">-- Sin vincular (Cuenta administrativa general) --</option>
                  @for (emp of empleados(); track emp.id) {
                    <option [ngValue]="emp.id">
                      {{ emp.nombres }} {{ emp.apellidos }} ({{ emp.tipoEmpleado?.name || emp.tipoEmpleado?.tipoEmpleado || 'Docente' }})
                    </option>
                  }
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Nivel de Permisos</label>
                  <select class="form-control" [(ngModel)]="activeUser.staff" name="staff">
                    <option [value]="0">Usuario Estándar (Docente / Instructor)</option>
                    <option [value]="1">Administrador (Acceso total Staff)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Estado de la Cuenta</label>
                  <select class="form-control" [(ngModel)]="activeUser.estado" name="estado">
                    <option [value]="1">Activo</option>
                    <option [value]="0">Inactivo / Bloqueado</option>
                  </select>
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving()">
                  {{ saving() ? 'Guardando...' : (isEditing() ? 'Guardar Cambios' : 'Crear Usuario') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .users-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .badge-tag { font-size: 0.75rem; font-weight: 700; color: #e5a823; letter-spacing: 1px; margin-bottom: 0.25rem; display: block; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; h1 { font-size: 1.75rem; font-weight: 800; color: #0d2d5e; margin: 0; } .subtitle { font-size: 0.9rem; color: #64748b; margin-top: 0.25rem; } }
    
    /* Stats Grid */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
    .stat-card { background: #ffffff; border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .stat-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; svg { width: 24px; height: 24px; } }
    .bg-blue { background: #eff6ff; color: #2563eb; }
    .bg-gold { background: #fefce8; color: #ca8a04; }
    .bg-green { background: #f0fdf4; color: #16a34a; }
    .stat-value { font-size: 1.5rem; font-weight: 800; color: #0f172a; line-height: 1.2; }
    .stat-label { font-size: 0.8rem; color: #64748b; font-weight: 600; }

    /* Search Bar */
    .search-bar { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.25rem; background: #ffffff; }
    .search-icon { width: 20px; height: 20px; color: #94a3b8; flex-shrink: 0; }
    .search-input { border-color: transparent; font-size: 0.95rem; width: 100%; &:focus { box-shadow: none; border-color: transparent; } }

    /* Table */
    .table-card { padding: 0; overflow: hidden; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; }
    .table-responsive { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; th { background-color: #F8FAFC; text-align: left; padding: 0.875rem 1rem; font-size: 0.75rem; font-weight: 700; color: #64748b; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.05em; } td { padding: 0.875rem 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; } }
    
    .user-meta { display: flex; align-items: center; gap: 0.75rem; }
    .avatar-circle { width: 36px; height: 36px; border-radius: 50%; background: #0d2d5e; color: #ffffff; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; &.avatar-admin { background: #b45309; } }
    .font-bold { font-weight: 700; }
    .text-navy { color: #0d2d5e; }
    .text-muted { color: #64748b; }
    .text-right { text-align: right; }
    .italic { font-style: italic; }

    .puesto-tag { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; font-size: 0.8rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 6px; }
    .badge-staff { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-weight: 700; }
    .badge-normal { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; font-weight: 600; }

    .action-btns { display: flex; justify-content: flex-end; gap: 0.4rem; }
    .action-btn { width: 32px; height: 32px; border-radius: 6px; border: 1px solid transparent; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; svg { width: 16px; height: 16px; } }
    .btn-edit { color: #0284c7; &:hover { background: #e0f2fe; border-color: #bae6fd; } }
    .btn-delete { color: #dc2626; &:hover { background: #fee2e2; border-color: #fecaca; } }

    .empty-state { text-align: center; padding: 3rem 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; color: #64748b; .empty-icon { font-size: 2.5rem; } }
    .loading-state { text-align: center; padding: 3rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; color: #64748b; }
    .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #0d2d5e; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 1.5rem; }
    .modal-content { width: 100%; max-width: 520px; background: #FFFFFF; border-radius: 12px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem; }
    .modal-title { font-size: 1.25rem; font-weight: 800; color: #0d2d5e; margin: 0; }
    .close-btn { background: transparent; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; &:hover { color: #0f172a; } }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; border-top: 1px solid #f1f5f9; padding-top: 1rem; }
  `],
})
export class UsersListComponent implements OnInit {
  private api = inject(ApiService);

  users = signal<User[]>([]);
  empleados = signal<Empleado[]>([]);
  loading = signal(true);
  saving = signal(false);

  searchTerm = '';
  showModal = signal(false);
  isEditing = signal(false);

  activeUser: any = {
    id: null,
    username: '',
    password: '',
    empleadoId: null,
    staff: 0,
    estado: 1,
  };

  filteredUsers = computed(() => {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.users();

    return this.users().filter((u) => {
      const uName = (u.username || '').toLowerCase();
      const empName = u.empleado ? `${u.empleado.nombres} ${u.empleado.apellidos}`.toLowerCase() : '';
      const email = (u.empleado?.email || '').toLowerCase();
      return uName.includes(term) || empName.includes(term) || email.includes(term);
    });
  });

  adminCount = computed(() => this.users().filter((u) => u.staff === 1).length);
  activeCount = computed(() => this.users().filter((u) => u.estado !== 0).length);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getUsers().subscribe({
      next: (res) => {
        this.users.set(res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.api.getEmpleados().subscribe({
      next: (res) => this.empleados.set(res.data || []),
    });
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.activeUser = {
      id: null,
      username: '',
      password: '',
      empleadoId: null,
      staff: 0,
      estado: 1,
    };
    this.showModal.set(true);
  }

  openEditModal(user: User): void {
    this.isEditing.set(true);
    this.activeUser = {
      id: user.id,
      username: user.username,
      password: '',
      empleadoId: user.empleado?.id || user.empleadoId || null,
      staff: user.staff || 0,
      estado: user.estado ?? 1,
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveUser(): void {
    if (!this.activeUser.username.trim()) {
      alert('Por favor introduce un nombre de usuario.');
      return;
    }

    if (!this.isEditing() && !this.activeUser.password.trim()) {
      alert('Por favor ingresa una contraseña para el nuevo usuario.');
      return;
    }

    this.saving.set(true);

    if (this.isEditing() && this.activeUser.id) {
      const payload: any = {
        username: this.activeUser.username,
        empleadoId: this.activeUser.empleadoId,
        staff: Number(this.activeUser.staff),
        estado: Number(this.activeUser.estado),
      };
      if (this.activeUser.password && this.activeUser.password.trim()) {
        payload.password = this.activeUser.password;
      }

      this.api.updateUser(this.activeUser.id, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          this.saving.set(false);
          alert(err.error?.message || 'Error al actualizar usuario');
        },
      });
    } else {
      const payload: any = {
        username: this.activeUser.username,
        password: this.activeUser.password,
        empleadoId: this.activeUser.empleadoId,
        staff: Number(this.activeUser.staff),
        estado: Number(this.activeUser.estado),
      };

      this.api.createUser(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          this.saving.set(false);
          alert(err.error?.message || 'Error al crear usuario');
        },
      });
    }
  }

  deleteUser(id: number): void {
    if (!confirm(`¿Estás seguro de desactivar la cuenta de usuario #${id}?`)) return;
    this.api.deleteUser(id).subscribe({
      next: () => this.loadData(),
      error: (err) => alert(err.error?.message || 'Error al desactivar usuario'),
    });
  }
}
