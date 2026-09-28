import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { Mobiliario, Suministro } from '../../core/models';
import { PageHeaderComponent, ModalComponent, EmptyStateComponent } from '../../shared';
import { exportToCsv, printHtmlReport } from '../../core/utils/export.util';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent, EmptyStateComponent],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss',
})
export class InventarioComponent implements OnInit {
  private apiService = inject(ApiService);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmService);

  mobiliario = signal<Mobiliario[]>([]);
  items = signal<Suministro[]>([]);
  activeModal = signal<'mob' | 'item' | null>(null);

  editingId: number | null = null;
  name = '';
  quantity = 1;
  desc = '';
  isSaving = signal(false);

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.apiService.getMobiliario(100, 0).subscribe((res) => this.mobiliario.set(res.data || []));
    this.apiService.getItems(100, 0).subscribe((res) => this.items.set(res.data || []));
  }

  modalTitle(): string {
    if (this.activeModal() === 'mob') {
      return this.editingId ? 'Modificar Mobiliario / Equipo' : 'Nuevo Mobiliario / Equipo';
    }
    if (this.activeModal() === 'item') {
      return this.editingId ? 'Modificar Suministro / Artículo' : 'Nuevo Suministro / Artículo';
    }
    return '';
  }

  openMobModal(mob?: Mobiliario): void { 
    if (mob) {
      this.editingId = mob.id;
      this.name = mob.nombre;
      this.quantity = mob.cantidad;
      this.desc = mob.descripcion || '';
    } else {
      this.editingId = null;
      this.name = '';
      this.quantity = 1;
      this.desc = '';
    }
    this.activeModal.set('mob'); 
  }

  openItemModal(item?: Suministro): void { 
    if (item) {
      this.editingId = item.id;
      this.name = item.nombre;
      this.quantity = item.cantidad;
      this.desc = item.descripcion || '';
    } else {
      this.editingId = null;
      this.name = '';
      this.quantity = 1;
      this.desc = '';
    }
    this.activeModal.set('item'); 
  }

  closeModal(): void { 
    this.activeModal.set(null); 
    this.editingId = null;
  }

  saveItem(): void {
    if (this.isSaving()) return;
    if (!this.name.trim()) {
      this.toast.warning('Por favor ingrese el nombre del artículo.');
      return;
    }

    this.isSaving.set(true);
    if (this.activeModal() === 'mob') {
      const payload: Partial<Mobiliario> = {
        nombre: this.name.trim(),
        cantidad: this.quantity,
        descripcion: this.desc || undefined,
      };

      if (this.editingId) {
        this.apiService.updateMobiliario(this.editingId, payload).subscribe({
          next: () => {
            this.isSaving.set(false);
            this.toast.success(`Mobiliario "${payload.nombre}" actualizado correctamente.`);
            this.closeModal();
            this.loadAll();
          },
          error: (err) => {
            this.isSaving.set(false);
            this.toast.error('Error al actualizar mobiliario: ' + (err.error?.message || err.message));
          },
        });
      } else {
        this.apiService.createMobiliario(payload).subscribe({
          next: () => {
            this.isSaving.set(false);
            this.toast.success(`Mobiliario "${payload.nombre}" registrado exitosamente.`);
            this.closeModal();
            this.loadAll();
          },
          error: (err) => {
            this.isSaving.set(false);
            this.toast.error('Error al registrar mobiliario: ' + (err.error?.message || err.message));
          },
        });
      }
    } else if (this.activeModal() === 'item') {
      const payload: Partial<Suministro> = {
        nombre: this.name.trim(),
        cantidad: this.quantity,
        descripcion: this.desc || undefined,
      };

      if (this.editingId) {
        this.apiService.updateItem(this.editingId, payload).subscribe({
          next: () => {
            this.isSaving.set(false);
            this.toast.success(`Suministro "${payload.nombre}" actualizado correctamente.`);
            this.closeModal();
            this.loadAll();
          },
          error: (err) => {
            this.isSaving.set(false);
            this.toast.error('Error al actualizar suministro: ' + (err.error?.message || err.message));
          },
        });
      } else {
        this.apiService.createItem(payload).subscribe({
          next: () => {
            this.isSaving.set(false);
            this.toast.success(`Suministro "${payload.nombre}" registrado exitosamente.`);
            this.closeModal();
            this.loadAll();
          },
          error: (err) => {
            this.isSaving.set(false);
            this.toast.error('Error al registrar suministro: ' + (err.error?.message || err.message));
          },
        });
      }
    }
  }

  async deleteMobiliario(mob: Mobiliario): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: '¿Eliminar Mobiliario / Equipo?',
      message: `¿Está seguro de eliminar el registro de mobiliario "${mob.nombre}"?`,
      confirmText: 'Sí, Eliminar',
      type: 'danger',
    });
    if (!confirmed) return;

    this.apiService.deleteMobiliario(mob.id).subscribe({
      next: () => {
        this.toast.success(`Mobiliario "${mob.nombre}" eliminado.`);
        this.loadAll();
      },
      error: () => this.toast.error('Error al eliminar mobiliario.'),
    });
  }

  async deleteItem(item: Suministro): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: '¿Eliminar Suministro / Artículo?',
      message: `¿Está seguro de eliminar el suministro "${item.nombre}"?`,
      confirmText: 'Sí, Eliminar',
      type: 'danger',
    });
    if (!confirmed) return;

    this.apiService.deleteItem(item.id).subscribe({
      next: () => {
        this.toast.success(`Suministro "${item.nombre}" eliminado.`);
        this.loadAll();
      },
      error: () => this.toast.error('Error al eliminar suministro.'),
    });
  }

  // Exportar Inventario Completo a Excel
  exportExcel(): void {
    const rows: any[][] = [];

    // Header section mobiliario
    rows.push(['TIPO', 'ID', 'NOMBRE', 'CANTIDAD', 'DESCRIPCION']);
    for (const m of this.mobiliario()) {
      rows.push(['Mobiliario/Equipo', m.id, m.nombre, m.cantidad, m.descripcion || '']);
    }

    // Section suministros
    for (const s of this.items()) {
      rows.push(['Suministro/Articulo', s.id, s.nombre, s.cantidad, s.descripcion || '']);
    }

    exportToCsv('Reporte_Inventario_INTECAP', rows, ['Categoría', 'ID', 'Artículo / Equipo', 'Cantidad Disponible', 'Descripción']);
    this.toast.success('Archivo Excel (.csv) descargado correctamente.');
  }

  // Exportar Reporte Impreso/PDF
  exportPdf(): void {
    let table = `
      <h3>1. Mobiliario y Equipamiento Pedagógico</h3>
      <table>
        <thead>
          <tr><th>ID</th><th>Nombre</th><th>Cantidad</th><th>Descripción</th></tr>
        </thead>
        <tbody>
          ${this.mobiliario().map(m => `<tr><td>#${m.id}</td><td><strong>${m.nombre}</strong></td><td>${m.cantidad} u.</td><td>${m.descripcion || '-'}</td></tr>`).join('')}
        </tbody>
      </table>

      <h3 style="margin-top: 1.5rem;">2. Suministros y Artículos de Bodega</h3>
      <table>
        <thead>
          <tr><th>ID</th><th>Nombre</th><th>Cantidad</th><th>Descripción</th></tr>
        </thead>
        <tbody>
          ${this.items().map(s => `<tr><td>#${s.id}</td><td><strong>${s.nombre}</strong></td><td>${s.cantidad} u.</td><td>${s.descripcion || '-'}</td></tr>`).join('')}
        </tbody>
      </table>
    `;

    printHtmlReport('Reporte General de Inventario y Mobiliario', table, 'Mobiliario asignado y existencias en bodega');
  }
}
