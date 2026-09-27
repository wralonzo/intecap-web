import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { Aviso } from '../../core/models';
import { ModalComponent, PageHeaderComponent, EmptyStateComponent } from '../../shared';

@Component({
  selector: 'app-avisos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent, PageHeaderComponent, EmptyStateComponent],
  templateUrl: './avisos.component.html',
  styleUrl: './avisos.component.scss',
})
export class AvisosComponent implements OnInit {
  private api = inject(ApiService);
  private ws = inject(WebSocketService);

  avisos = signal<Aviso[]>([]);
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);

  // Filters
  filterTipo = signal<string>('todos');
  filterSoloTv = signal<boolean>(false);
  searchQuery = '';

  // Modal State
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  currentAvisoId: number | null = null;

  formData: {
    titulo: string;
    contenido: string;
    tipo: string;
    mostrarEnTv: boolean;
    prioridad: number;
    fechaInicio?: string;
    fechaFin?: string;
  } = {
    titulo: '',
    contenido: '',
    tipo: 'informativo',
    mostrarEnTv: true,
    prioridad: 1,
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: '',
  };

  // Computed Values
  totalAvisos = computed(() => this.avisos().length);
  avisosTvCount = computed(() => this.avisos().filter((a) => a.mostrarEnTv).length);
  avisosUrgentesCount = computed(() => this.avisos().filter((a) => a.tipo === 'urgente' || a.prioridad === 1).length);
  avisosEventosCount = computed(() => this.avisos().filter((a) => a.tipo === 'evento').length);

  filteredAvisos = computed(() => {
    const term = this.searchQuery.toLowerCase().trim();
    const tipo = this.filterTipo();
    const soloTv = this.filterSoloTv();

    return this.avisos().filter((a) => {
      if (soloTv && !a.mostrarEnTv) return false;
      if (tipo !== 'todos' && a.tipo !== tipo) return false;

      if (term) {
        const matchesTitle = a.titulo.toLowerCase().includes(term);
        const matchesContent = a.contenido.toLowerCase().includes(term);
        const matchesTipo = a.tipo.toLowerCase().includes(term);
        if (!matchesTitle && !matchesContent && !matchesTipo) return false;
      }

      return true;
    });
  });

  ngOnInit() {
    this.loadAvisos();

    // Sincronización en tiempo real vía WebSocket
    this.ws.onAvisosUpdate().subscribe(() => {
      this.loadAvisos(false);
    });
  }

  loadAvisos(showSpinner = true) {
    if (showSpinner) this.loading.set(true);
    this.api.getAvisos().subscribe({
      next: (res) => {
        this.avisos.set(res || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando avisos:', err);
        this.loading.set(false);
      },
    });
  }

  setFilter(tipo: string, soloTv: boolean) {
    this.filterTipo.set(tipo);
    this.filterSoloTv.set(soloTv);
  }

  onSearchChange() {
    // Computed signal updates automatically
  }

  getTipoIcon(tipo?: string): string {
    switch (tipo) {
      case 'urgente':
        return '🚨';
      case 'evento':
        return '📅';
      case 'mantenimiento':
        return '🛠️';
      case 'general':
        return '📌';
      default:
        return '📢';
    }
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.currentAvisoId = null;
    this.formData = {
      titulo: '',
      contenido: '',
      tipo: 'informativo',
      mostrarEnTv: true,
      prioridad: 1,
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: '',
    };
    this.showModal.set(true);
  }

  openEditModal(a: Aviso) {
    this.isEditing.set(true);
    this.currentAvisoId = a.id;
    this.formData = {
      titulo: a.titulo,
      contenido: a.contenido,
      tipo: a.tipo || 'informativo',
      mostrarEnTv: a.mostrarEnTv,
      prioridad: a.prioridad || 1,
      fechaInicio: a.fechaInicio || '',
      fechaFin: a.fechaFin || '',
    };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveAviso() {
    if (!this.formData.titulo.trim() || !this.formData.contenido.trim()) {
      alert('Por favor completa el título y el contenido del aviso.');
      return;
    }

    this.saving.set(true);

    if (this.isEditing() && this.currentAvisoId) {
      this.api.updateAviso(this.currentAvisoId, this.formData).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadAvisos(false);
        },
        error: (err) => {
          this.saving.set(false);
          alert('Error al actualizar aviso: ' + (err.error?.message || err.message));
        },
      });
    } else {
      this.api.createAviso(this.formData).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.loadAvisos(false);
        },
        error: (err) => {
          this.saving.set(false);
          alert('Error al publicar aviso: ' + (err.error?.message || err.message));
        },
      });
    }
  }

  toggleTv(a: Aviso) {
    this.api.toggleAvisoTv(a.id).subscribe({
      next: (actualizado) => {
        this.avisos.update((list) =>
          list.map((item) => (item.id === a.id ? { ...item, mostrarEnTv: actualizado.mostrarEnTv } : item))
        );
      },
      error: (err) => alert('Error al cambiar visualización en TV: ' + (err.error?.message || err.message)),
    });
  }

  deleteAviso(a: Aviso) {
    if (confirm(`¿Estás seguro de eliminar el aviso "${a.titulo}"?`)) {
      this.api.deleteAviso(a.id).subscribe({
        next: () => {
          this.loadAvisos(false);
        },
        error: (err) => alert('Error al eliminar aviso: ' + (err.error?.message || err.message)),
      });
    }
  }
}
