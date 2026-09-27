import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { User, Empleado } from '../../core/models';
import { PageHeaderComponent, ModalComponent, EmptyStateComponent } from '../../shared';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent, EmptyStateComponent],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
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
