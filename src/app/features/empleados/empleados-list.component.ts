import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Empleado, TipoEmpleado } from '../../core/models';
import { PageHeaderComponent, ModalComponent, EmptyStateComponent } from '../../shared';

@Component({
  selector: 'app-empleados-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent, EmptyStateComponent],
  templateUrl: './empleados-list.component.html',
  styleUrl: './empleados-list.component.scss',
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
