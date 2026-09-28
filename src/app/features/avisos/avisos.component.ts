import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { Aviso } from '../../core/models';
import {
  ModalComponent,
  PageHeaderComponent,
  EmptyStateComponent,
  CustomSelectComponent,
  SelectOption,
} from '../../shared';

@Component({
  selector: 'app-avisos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ModalComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    CustomSelectComponent,
  ],
  templateUrl: './avisos.component.html',
  styleUrl: './avisos.component.scss',
})
export class AvisosComponent implements OnInit {
  tiposAvisoOptions: SelectOption[] = [
    {
      value: 'informativo',
      label: 'Informativo General',
      icon: '📢',
      badge: 'Info',
      badgeColor: 'blue',
    },
    {
      value: 'urgente',
      label: 'Urgente / Importante',
      icon: '🚨',
      badge: 'Alta',
      badgeColor: 'red',
    },
    {
      value: 'evento',
      label: 'Evento / Taller Especial',
      icon: '📅',
      badge: 'Evento',
      badgeColor: 'gold',
    },
    {
      value: 'mantenimiento',
      label: 'Mantenimiento / Infraestructura',
      icon: '🛠️',
      badge: 'Técnico',
      badgeColor: 'gray',
    },
    { value: 'general', label: 'General', icon: '📌' },
  ];

  prioridadesOptions: SelectOption[] = [
    {
      value: 1,
      label: 'Alta (Primer lugar en rotación)',
      icon: '⚡',
      badge: 'Prioridad 1',
      badgeColor: 'red',
    },
    { value: 2, label: 'Normal / Media', icon: '🔹', badge: 'Prioridad 2', badgeColor: 'blue' },
    { value: 3, label: 'Baja', icon: '▫️', badge: 'Prioridad 3', badgeColor: 'gray' },
  ];
  private readonly api = inject(ApiService);
  private readonly ws = inject(WebSocketService);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);

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
  avisosUrgentesCount = computed(
    () => this.avisos().filter((a) => a.tipo === 'urgente' || a.prioridad === 1).length,
  );
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
      this.toast.warning(
        'Campos requeridos',
        'Por favor completa el título y el contenido del aviso.',
      );
      return;
    }

    this.saving.set(true);

    if (this.isEditing() && this.currentAvisoId) {
      this.api.updateAviso(this.currentAvisoId, this.formData).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.toast.success(
            'Aviso actualizado',
            'El aviso informativo fue actualizado correctamente.',
          );
          this.loadAvisos(false);
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(
            'Error',
            err.error?.message || err.message || 'Error al actualizar aviso',
          );
        },
      });
    } else {
      this.api.createAviso(this.formData).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.toast.success('Aviso publicado', 'El comunicado ha sido difundido en el sistema.');
          this.loadAvisos(false);
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error('Error', err.error?.message || err.message || 'Error al publicar aviso');
        },
      });
    }
  }

  toggleTv(a: Aviso) {
    this.api.toggleAvisoTv(a.id).subscribe({
      next: (actualizado) => {
        this.avisos.update((list) =>
          list.map((item) =>
            item.id === a.id ? { ...item, mostrarEnTv: actualizado.mostrarEnTv } : item,
          ),
        );
        this.toast.info(
          'Pantalla TV',
          actualizado.mostrarEnTv
            ? 'Aviso activado para rotación en TV.'
            : 'Aviso ocultado de pantallas TV.',
        );
      },
      error: (err) =>
        this.toast.error(
          'Error',
          err.error?.message || err.message || 'Error al cambiar visualización en TV',
        ),
    });
  }

  async deleteAviso(a: Aviso): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: '¿Eliminar Aviso Informativo?',
      message: `¿Estás seguro de eliminar el aviso "${a.titulo}"? Dejará de rotar en las pantallas de TV y portal.`,
      confirmText: 'Sí, Eliminar',
      type: 'danger',
    });
    if (!confirmed) return;

    this.api.deleteAviso(a.id).subscribe({
      next: () => {
        this.toast.info('Aviso eliminado', `El aviso "${a.titulo}" ha sido removido.`);
        this.loadAvisos(false);
      },
      error: (err) =>
        this.toast.error('Error', err.error?.message || err.message || 'Error al eliminar aviso'),
    });
  }
}
