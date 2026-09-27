import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Empleado, TipoEmpleado } from '../../core/models';
import { PageHeaderComponent, ModalComponent, EmptyStateComponent, CustomSelectComponent, SelectOption } from '../../shared';
import { computed } from '@angular/core';

@Component({
  selector: 'app-empleados-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent, EmptyStateComponent, CustomSelectComponent],
  templateUrl: './empleados-list.component.html',
  styleUrl: './empleados-list.component.scss',
})
export class EmpleadosListComponent implements OnInit {
  private apiService = inject(ApiService);
  private toast = inject(ToastService);

  activeTab = signal<'empleados' | 'puestos'>('empleados');
  empleados = signal<Empleado[]>([]);
  puestos = signal<TipoEmpleado[]>([]);
  loading = signal(true);

  puestosOptions = computed<SelectOption[]>(() =>
    this.puestos().map((t) => ({
      value: t.id,
      label: t.name || t.tipoEmpleado || 'Puesto #' + t.id,
      icon: '💼',
    }))
  );

  staffOptions: SelectOption[] = [
    { value: 0, label: 'Docente / Empleado Estándar (Acceso a sus cursos, horario y perfil)', badge: 'Docente', badgeColor: 'blue' },
    { value: 1, label: 'Administrador Staff (Acceso completo a gestión del sistema)', badge: 'Staff', badgeColor: 'gold' },
  ];
  
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
      crearUsuario: true,
      username: '',
      password: '',
      staff: 0,
      usernameManuallyEdited: false,
    };
    this.showEmpModal.set(true);
  }

  editEmpleado(emp: Empleado): void {
    this.isEditingEmp.set(true);
    this.activeEmp = {
      ...emp,
      crearUsuario: false,
      username: emp.user?.username || '',
      password: '',
      staff: emp.user?.staff ?? 0,
      usernameManuallyEdited: false,
    };
    this.showEmpModal.set(true);
  }

  closeEmpleadoModal(): void {
    this.showEmpModal.set(false);
  }

  onNombreEmailChange(): void {
    if (this.activeEmp.crearUsuario && !this.activeEmp.usernameManuallyEdited) {
      if (this.activeEmp.email && this.activeEmp.email.includes('@')) {
        this.activeEmp.username = this.activeEmp.email.split('@')[0].toLowerCase();
      } else if (this.activeEmp.nombres || this.activeEmp.apellidos) {
        const first = (this.activeEmp.nombres || '').trim().split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const last = (this.activeEmp.apellidos || '').trim().split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        this.activeEmp.username = first && last ? `${first}.${last}` : (first || last || '');
      }
    }
  }

  generateRandomPassword(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'Intecap!';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.activeEmp.password = pass;
  }

  isSaving = signal(false);

  saveEmpleado(): void {
    if (this.isSaving()) return;
    if (!this.activeEmp.nombres || !this.activeEmp.apellidos) {
      this.toast.warning('Campos requeridos', 'Por favor completa los nombres y apellidos del empleado.');
      return;
    }

    this.isSaving.set(true);
    if (this.isEditingEmp() && this.activeEmp.id) {
      this.apiService.updateEmpleado(this.activeEmp.id, this.activeEmp).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeEmpleadoModal();
          this.toast.success('Empleado actualizado', 'Información del colaborador guardada exitosamente.');
          this.loadEmpleados();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toast.error('Error', err.error?.message || 'Error al actualizar colaborador');
        },
      });
    } else {
      this.apiService.createEmpleado(this.activeEmp).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeEmpleadoModal();
          this.toast.success('Empleado registrado', 'Nuevo colaborador registrado exitosamente.');
          this.loadEmpleados();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toast.error('Error', err.error?.message || 'Error al registrar colaborador');
        },
      });
    }
  }

  deleteEmpleado(id: number): void {
    if (!confirm(`¿Estás seguro de desactivar al empleado #${id}?`)) return;
    this.apiService.deleteEmpleado(id).subscribe({
      next: () => {
        this.toast.info('Empleado desactivado', `El colaborador #${id} fue desactivado.`);
        this.loadEmpleados();
      },
      error: (err) => this.toast.error('Error', err.error?.message || 'Error al desactivar empleado'),
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
      this.toast.warning('Campo requerido', 'Por favor ingresa el nombre del puesto del empleado.');
      return;
    }

    if (this.isEditingPuesto() && this.activePuesto.id) {
      this.apiService.updatePuesto(this.activePuesto.id, { name: this.activePuesto.name }).subscribe({
        next: () => {
          this.closePuestoModal();
          this.toast.success('Puesto actualizado', 'Puesto modificado con éxito.');
          this.loadData();
        },
        error: (err) => this.toast.error('Error', err.error?.message || 'Error al modificar puesto'),
      });
    } else {
      this.apiService.createPuesto({ name: this.activePuesto.name }).subscribe({
        next: () => {
          this.closePuestoModal();
          this.toast.success('Puesto creado', 'Nuevo puesto registrado con éxito.');
          this.loadData();
        },
        error: (err) => this.toast.error('Error', err.error?.message || 'Error al registrar puesto'),
      });
    }
  }

  deletePuesto(id: number): void {
    if (!confirm(`¿Estás seguro de desactivar este puesto del empleado?`)) return;
    this.apiService.deletePuesto(id).subscribe({
      next: () => {
        this.toast.info('Puesto desactivado', `El puesto #${id} fue desactivado.`);
        this.loadData();
      },
      error: (err) => this.toast.error('Error', err.error?.message || 'Error al desactivar puesto'),
    });
  }
}
