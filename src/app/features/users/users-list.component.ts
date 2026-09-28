import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { User, Empleado } from '../../core/models';
import { PageHeaderComponent, ModalComponent, EmptyStateComponent, CustomSelectComponent, SelectOption } from '../../shared';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent, EmptyStateComponent, CustomSelectComponent],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmService);

  users = signal<User[]>([]);
  empleados = signal<Empleado[]>([]);
  loading = signal(true);
  saving = signal(false);

  searchTerm = '';
  showModal = signal(false);
  isEditing = signal(false);

  empleadosOptions = computed<SelectOption[]>(() => [
    { value: null, label: '-- Sin vincular (Cuenta administrativa general) --' },
    ...this.empleados().map((emp) => ({
      value: emp.id,
      label: `${emp.nombres} ${emp.apellidos}`,
      subtitle: emp.tipoEmpleado?.name || emp.tipoEmpleado?.tipoEmpleado || 'Docente / Personal',
      icon: '👤',
    })),
  ]);

  staffOptions: SelectOption[] = [
    { value: 0, label: 'Usuario Estándar (Docente / Instructor)', badge: 'Docente', badgeColor: 'blue' },
    { value: 1, label: 'Administrador (Acceso total Staff)', badge: 'Staff', badgeColor: 'gold' },
  ];

  estadoOptions: SelectOption[] = [
    { value: 1, label: 'Activo', badge: 'Activo', badgeColor: 'green' },
    { value: 0, label: 'Inactivo / Bloqueado', badge: 'Inactivo', badgeColor: 'red' },
  ];

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
      this.toast.warning('Campo requerido', 'Por favor introduce un nombre de usuario.');
      return;
    }

    if (!this.isEditing() && !this.activeUser.password.trim()) {
      this.toast.warning('Campo requerido', 'Por favor ingresa una contraseña para el nuevo usuario.');
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
          this.toast.success('Usuario actualizado', 'Los datos del usuario fueron actualizados exitosamente.');
          this.loadData();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error('Error', err.error?.message || 'Error al actualizar usuario');
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
          this.toast.success('Usuario creado', 'El nuevo usuario fue registrado con éxito.');
          this.loadData();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error('Error', err.error?.message || 'Error al crear usuario');
        },
      });
    }
  }

  async deleteUser(id: number): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: '¿Desactivar Cuenta de Usuario?',
      message: `¿Estás seguro de desactivar la cuenta de acceso del usuario #${id}? El usuario no podrá iniciar sesión.`,
      confirmText: 'Sí, Desactivar',
      type: 'danger',
    });
    if (!confirmed) return;

    this.api.deleteUser(id).subscribe({
      next: () => {
        this.toast.info('Usuario desactivado', `La cuenta #${id} ha sido desactivada.`);
        this.loadData();
      },
      error: (err) => this.toast.error('Error', err.error?.message || 'Error al desactivar usuario'),
    });
  }
}
