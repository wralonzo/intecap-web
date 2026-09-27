import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Mobiliario, Item } from '../../core/models';
import { PageHeaderComponent, ModalComponent, EmptyStateComponent } from '../../shared';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent, EmptyStateComponent],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss',
})
export class InventarioComponent implements OnInit {
  private apiService = inject(ApiService);

  mobiliario = signal<Mobiliario[]>([]);
  items = signal<Item[]>([]);
  activeModal = signal<'mob' | 'item' | null>(null);

  editingId: number | null = null;
  name = '';
  quantity = 1;
  desc = '';

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

  openItemModal(item?: Item): void { 
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
    if (!this.name) return;

    if (this.activeModal() === 'mob') {
      const payload: Partial<Mobiliario> = {
        nombre: this.name,
        cantidad: this.quantity,
        descripcion: this.desc || undefined,
      };

      if (this.editingId) {
        this.apiService.updateMobiliario(this.editingId, payload).subscribe(() => {
          this.closeModal();
          this.loadAll();
        });
      } else {
        this.apiService.createMobiliario(payload).subscribe(() => {
          this.closeModal();
          this.loadAll();
        });
      }
    } else if (this.activeModal() === 'item') {
      const payload: Partial<Item> = {
        nombre: this.name,
        cantidad: this.quantity,
        descripcion: this.desc || undefined,
      };

      if (this.editingId) {
        this.apiService.updateItem(this.editingId, payload).subscribe(() => {
          this.closeModal();
          this.loadAll();
        });
      } else {
        this.apiService.createItem(payload).subscribe(() => {
          this.closeModal();
          this.loadAll();
        });
      }
    }
  }

  deleteMobiliario(mob: Mobiliario): void {
    if (confirm(`¿Está seguro de eliminar el mobiliario "${mob.nombre}"?`)) {
      this.apiService.deleteMobiliario(mob.id).subscribe(() => {
        this.loadAll();
      });
    }
  }

  deleteItem(item: Item): void {
    if (confirm(`¿Está seguro de eliminar el artículo "${item.nombre}"?`)) {
      this.apiService.deleteItem(item.id).subscribe(() => {
        this.loadAll();
      });
    }
  }
}
