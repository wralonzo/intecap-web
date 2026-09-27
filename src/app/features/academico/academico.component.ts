import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Carrera, Curso, Jornada } from '../../core/models';

@Component({
  selector: 'app-academico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="academico-page">
      <div class="page-header">
        <div>
          <h1>Oferta Académica y Jornadas</h1>
          <p class="subtitle">Administración de programas de formación, carreras técnicas, cursos y jornadas de estudio.</p>
        </div>
      </div>

      <div class="sections-grid">
        <!-- Carreras Section -->
        <div class="card section-card">
          <div class="section-top">
            <h3>🎓 Carreras Técnicas</h3>
            <button (click)="openCarreraModal()" class="btn btn-primary btn-sm">+ Nueva Carrera</button>
          </div>
          <div class="items-list">
            @for (c of carreras(); track c.id) {
              <div class="item-row">
                <span class="item-title">{{ c.nombre }}</span>
                <span class="badge badge-primary">Activa</span>
              </div>
            } @empty {
              <p class="empty-text">No hay carreras registradas.</p>
            }
          </div>
        </div>

        <!-- Cursos Section -->
        <div class="card section-card">
          <div class="section-top">
            <h3>📖 Cursos Modulares</h3>
            <button (click)="openCursoModal()" class="btn btn-gold btn-sm">+ Nuevo Curso</button>
          </div>
          <div class="items-list">
            @for (cur of cursos(); track cur.id) {
              <div class="item-row">
                <div>
                  <div class="item-title">{{ cur.nombre }}</div>
                  @if (cur.carrera) {
                    <div class="item-subtitle">{{ cur.carrera.nombre }}</div>
                  }
                </div>
                <span class="badge badge-success">Disponible</span>
              </div>
            } @empty {
              <p class="empty-text">No hay cursos registrados.</p>
            }
          </div>
        </div>

        <!-- Jornadas Section -->
        <div class="card section-card">
          <div class="section-top">
            <h3>⏰ Jornadas y Horarios</h3>
            <button (click)="openJornadaModal()" class="btn btn-secondary btn-sm">+ Nueva Jornada</button>
          </div>
          <div class="items-list">
            @for (j of jornadas(); track j.id) {
              <div class="item-row">
                <span class="item-title">{{ j.nombre }}</span>
                <span class="chip">{{ j.horainicio || '07:30' }} - {{ j.horafin || '12:30' }}</span>
              </div>
            } @empty {
              <p class="empty-text">No hay jornadas registradas.</p>
            }
          </div>
        </div>
      </div>

      <!-- Modales -->
      @if (activeModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ modalTitle() }}</h3>
              <button (click)="closeModal()" class="close-btn">&times;</button>
            </div>

            @if (activeModal() === 'carrera') {
              <form (ngSubmit)="saveCarrera()">
                <div class="form-group">
                  <label>Nombre de la Carrera *</label>
                  <input type="text" class="form-control" placeholder="Ej: Técnico en Mecatrónica" [(ngModel)]="carreraName" name="carreraName" required />
                </div>
                <div class="modal-actions">
                  <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancelar</button>
                  <button type="submit" class="btn btn-gold">Guardar Carrera</button>
                </div>
              </form>
            }

            @if (activeModal() === 'curso') {
              <form (ngSubmit)="saveCurso()">
                <div class="form-group">
                  <label>Nombre del Curso *</label>
                  <input type="text" class="form-control" placeholder="Ej: Electrónica Industrial" [(ngModel)]="cursoName" name="cursoName" required />
                </div>
                <div class="form-group">
                  <label>Carrera Vinculada</label>
                  <select class="form-control" [(ngModel)]="selectedCarreraId" name="selectedCarreraId">
                    <option [ngValue]="null">Ninguna (Curso Libre)</option>
                    @for (c of carreras(); track c.id) {
                      <option [ngValue]="c.id">{{ c.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="modal-actions">
                  <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancelar</button>
                  <button type="submit" class="btn btn-gold">Guardar Curso</button>
                </div>
              </form>
            }

            @if (activeModal() === 'jornada') {
              <form (ngSubmit)="saveJornada()">
                <div class="form-group">
                  <label>Nombre de la Jornada *</label>
                  <input type="text" class="form-control" placeholder="Ej: Matutina" [(ngModel)]="jornadaName" name="jornadaName" required />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Hora Inicio</label>
                    <input type="time" class="form-control" [(ngModel)]="jornadaStart" name="jornadaStart" />
                  </div>
                  <div class="form-group">
                    <label>Hora Fin</label>
                    <input type="time" class="form-control" [(ngModel)]="jornadaEnd" name="jornadaEnd" />
                  </div>
                </div>
                <div class="modal-actions">
                  <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancelar</button>
                  <button type="submit" class="btn btn-gold">Guardar Jornada</button>
                </div>
              </form>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .academico-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header h1 { font-size: 1.5rem; color: var(--intecap-navy-dark); }
    .subtitle { font-size: 0.875rem; color: var(--text-secondary); }
    .sections-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; }
    .section-card { display: flex; flex-direction: column; gap: 1rem; }
    .section-top { display: flex; align-items: center; justify-content: space-between; h3 { font-size: 1.125rem; color: var(--intecap-navy-dark); } }
    .items-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 400px; overflow-y: auto; }
    .item-row { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0.875rem; background: var(--bg-main); border-radius: var(--radius-md); border: 1px solid var(--border-color); }
    .item-title { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
    .item-subtitle { font-size: 0.75rem; color: var(--text-muted); }
    .chip { font-size: 0.75rem; background-color: var(--intecap-blue-light); color: var(--intecap-navy); padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); font-weight: 600; }
    .empty-text { font-size: 0.8125rem; color: var(--text-muted); text-align: center; padding: 1.5rem; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 1.5rem; }
    .modal-content { width: 100%; max-width: 500px; background: #FFFFFF; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; h3 { font-size: 1.25rem; color: var(--intecap-navy-dark); } }
    .close-btn { background: transparent; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
  `],
})
export class AcademicoComponent implements OnInit {
  private apiService = inject(ApiService);

  carreras = signal<Carrera[]>([]);
  cursos = signal<Curso[]>([]);
  jornadas = signal<Jornada[]>([]);
  activeModal = signal<'carrera' | 'curso' | 'jornada' | null>(null);

  carreraName = '';
  cursoName = '';
  selectedCarreraId: number | null = null;
  jornadaName = '';
  jornadaStart = '07:30';
  jornadaEnd = '12:30';

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.apiService.getCarreras().subscribe((res) => this.carreras.set(res || []));
    this.apiService.getCursos().subscribe((res) => this.cursos.set(res.data || []));
    this.apiService.getJornadas().subscribe((res) => this.jornadas.set(res || []));
  }

  modalTitle(): string {
    if (this.activeModal() === 'carrera') return 'Registrar Nueva Carrera';
    if (this.activeModal() === 'curso') return 'Registrar Nuevo Curso';
    if (this.activeModal() === 'jornada') return 'Registrar Nueva Jornada';
    return '';
  }

  openCarreraModal(): void { this.carreraName = ''; this.activeModal.set('carrera'); }
  openCursoModal(): void { this.cursoName = ''; this.selectedCarreraId = null; this.activeModal.set('curso'); }
  openJornadaModal(): void { this.jornadaName = ''; this.activeModal.set('jornada'); }
  closeModal(): void { this.activeModal.set(null); }

  saveCarrera(): void {
    if (!this.carreraName) return;
    this.apiService.createCarrera(this.carreraName).subscribe(() => {
      this.closeModal();
      this.loadAll();
    });
  }

  saveCurso(): void {
    if (!this.cursoName) return;
    this.apiService.createCurso(this.cursoName, this.selectedCarreraId || undefined).subscribe(() => {
      this.closeModal();
      this.loadAll();
    });
  }

  saveJornada(): void {
    if (!this.jornadaName) return;
    this.apiService.createJornada({ nombre: this.jornadaName, horainicio: this.jornadaStart, horafin: this.jornadaEnd }).subscribe(() => {
      this.closeModal();
      this.loadAll();
    });
  }
}
