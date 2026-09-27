import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Mobiliario, Item } from '../../core/models';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inventario-page">
      <div class="page-header">
        <div>
          <h1>Control de Inventario y Mobiliario</h1>
          <p class="subtitle">Seguimiento de equipamiento audiovisual, mobiliario pedagógico y suministros en aulas.</p>
        </div>
      </div>

      <div class="sections-grid">
        <!-- Mobiliario -->
        <div class="card section-card">
          <div class="section-top">
            <h3>🪑 Mobiliario y Equipamiento</h3>
            <button (click)="openMobModal()" class="btn btn-primary btn-sm">+ Registrar Mobiliario</button>
          </div>

          <div class="items-list">
            @for (m of mobiliario(); track m.id) {
              <div class="item-card">
                <div class="item-main">
                  <div class="item-name">{{ m.nombre }}</div>
                  <div class="item-desc">{{ m.descripcion || 'Sin descripción adicional' }}</div>
                </div>
                <div class="qty-badge">{{ m.cantidad }} u.</div>
              </div>
            } @empty {
              <p class="empty-text">No hay mobiliario registrado.</p>
            }
          </div>
        </div>

        <!-- Items y Suministros -->
        <div class="card section-card">
          <div class="section-top">
            <h3>📦 Suministros y Artículos</h3>
            <button (click)="openItemModal()" class="btn btn-gold btn-sm">+ Registrar Suministro</button>
          </div>

          <div class="items-list">
            @for (item of items(); track item.id) {
              <div class="item-card">
                <div class="item-main">
                  <div class="item-name">{{ item.nombre }}</div>
                  <div class="item-desc">{{ item.descripcion || 'Sin descripción adicional' }}</div>
                </div>
                <div class="qty-badge bg-gold">{{ item.cantidad }} u.</div>
              </div>
            } @empty {
              <p class="empty-text">No hay suministros registrados.</p>
            }
          </div>
        </div>
      </div>

      <!-- Modales -->
      @if (activeModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ activeModal() === 'mob' ? 'Nuevo Mobiliario / Equipo' : 'Nuevo Suministro / Item' }}</h3>
              <button (click)="closeModal()" class="close-btn">&times;</button>
            </div>

            <form (ngSubmit)="saveItem()">
              <div class="form-group">
                <label>Nombre del Artículo *</label>
                <input type="text" class="form-control" placeholder="Ej: Proyector Epson HDMI" [(ngModel)]="name" name="name" required />
              </div>

              <div class="form-group">
                <label>Cantidad *</label>
                <input type="number" class="form-control" placeholder="10" [(ngModel)]="quantity" name="quantity" required />
              </div>

              <div class="form-group">
                <label>Descripción / Observación</label>
                <textarea class="form-control" rows="2" [(ngModel)]="desc" name="desc"></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancelar</button>
                <button type="submit" class="btn btn-gold">Guardar en Inventario</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .inventario-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header h1 { font-size: 1.5rem; color: var(--intecap-navy-dark); }
    .subtitle { font-size: 0.875rem; color: var(--text-secondary); }
    .sections-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; @media (max-width: 860px) { grid-template-columns: 1fr; } }
    .section-card { display: flex; flex-direction: column; gap: 1rem; }
    .section-top { display: flex; align-items: center; justify-content: space-between; h3 { font-size: 1.125rem; color: var(--intecap-navy-dark); } }
    .items-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .item-card { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1rem; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: var(--radius-md); }
    .item-name { font-size: 0.9375rem; font-weight: 700; color: var(--intecap-navy-dark); }
    .item-desc { font-size: 0.75rem; color: var(--text-secondary); }
    .qty-badge { font-size: 0.8125rem; font-weight: 700; background-color: var(--intecap-blue-light); color: var(--intecap-navy); padding: 0.25rem 0.625rem; border-radius: var(--radius-full); }
    .qty-badge.bg-gold { background-color: var(--intecap-gold-light); color: #B45309; }
    .empty-text { font-size: 0.8125rem; color: var(--text-muted); text-align: center; padding: 2rem; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 1.5rem; }
    .modal-content { width: 100%; max-width: 500px; background: #FFFFFF; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; h3 { font-size: 1.25rem; color: var(--intecap-navy-dark); } }
    .close-btn { background: transparent; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
  `],
})
export class InventarioComponent implements OnInit {
  private apiService = inject(ApiService);

  mobiliario = signal<Mobiliario[]>([]);
  items = signal<Item[]>([]);
  activeModal = signal<'mob' | 'item' | null>(null);

  name = '';
  quantity = 1;
  desc = '';

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.apiService.getMobiliario().subscribe((res) => this.mobiliario.set(res.data || []));
    this.apiService.getItems().subscribe((res) => this.items.set(res.data || []));
  }

  openMobModal(): void { this.name = ''; this.quantity = 1; this.desc = ''; this.activeModal.set('mob'); }
  openItemModal(): void { this.name = ''; this.quantity = 1; this.desc = ''; this.activeModal.set('item'); }
  closeModal(): void { this.activeModal.set(null); }

  saveItem(): void {
    if (!this.name) return;

    if (this.activeModal() === 'mob') {
      this.apiService.createMobiliario({ nombre: this.name, cantidad: this.quantity, descripcion: this.desc }).subscribe(() => {
        this.closeModal();
        this.loadAll();
      });
    } else {
      this.apiService.createItem({ nombre: this.name, cantidad: this.quantity, descripcion: this.desc }).subscribe(() => {
        this.closeModal();
        this.loadAll();
      });
    }
  }
}
