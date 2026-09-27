import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { ToastService } from '../../core/services/toast.service';
import { Reservacion, Salon, Empleado, Curso, Jornada, ReservacionesStats } from '../../core/models';
import { ModalComponent, PageHeaderComponent, EmptyStateComponent } from '../../shared';

@Component({
  selector: 'app-reservaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, PageHeaderComponent, EmptyStateComponent],
  templateUrl: './reservaciones.component.html',
  styleUrl: './reservaciones.component.scss',
})
export class ReservacionesComponent implements OnInit {
  private api = inject(ApiService);
  private ws = inject(WebSocketService);
  private toast = inject(ToastService);

  // State Signals
  reservaciones = signal<Reservacion[]>([]);
  salonesList = signal<Salon[]>([]);
  empleadosList = signal<Empleado[]>([]);
  cursosList = signal<Curso[]>([]);
  jornadasList = signal<Jornada[]>([]);
  
  stats = signal<ReservacionesStats>({
    total: 0,
    pendientes: 0,
    aprobadas: 0,
    rechazadas: 0,
    finalizadas: 0,
  });

  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  filterEstado = signal<number | null>(null);
  searchQuery = '';

  // Modals Signals
  showCreateModal = signal<boolean>(false);
  showDetailModal = signal<boolean>(false);
  showRechazoModal = signal<boolean>(false);
  selectedRes = signal<Reservacion | null>(null);
  motivoRechazoText = '';

  // Create Form Model
  formRes: {
    tipoEvento: string;
    salonId: number | null;
    empleadoId: number | null;
    cursoId: number | null;
    jornada: string;
    fechaEvento: string;
    horaInicio: string;
    horaFin: string;
    cantidadPersonas: number;
    descripcion: string;
    seguimiento: string;
    estado: number;
  } = {
    tipoEvento: 'Taller Especial',
    salonId: null,
    empleadoId: null,
    cursoId: null,
    jornada: 'Jornada Única',
    fechaEvento: new Date().toISOString().split('T')[0],
    horaInicio: '08:00',
    horaFin: '12:00',
    cantidadPersonas: 20,
    descripcion: '',
    seguimiento: '',
    estado: 1, // Por defecto Pendiente
  };

  ngOnInit() {
    this.loadStats();
    this.loadReservaciones();
    this.loadCatalogs();

    // Listen to realtime websocket updates
    this.ws.onDisponibilidadUpdate().subscribe(() => {
      this.loadStats();
      this.loadReservaciones(false);
    });

    this.ws.onNuevaReservacion().subscribe(() => {
      this.loadStats();
      this.loadReservaciones(false);
    });
  }

  loadStats() {
    this.api.getReservacionesStats().subscribe({
      next: (res) => this.stats.set(res),
      error: (err) => console.error('Error cargando estadísticas de reservaciones:', err),
    });
  }

  loadReservaciones(showSpinner = true) {
    if (showSpinner) this.loading.set(true);
    const estado = this.filterEstado() !== null ? this.filterEstado()! : undefined;

    this.api.getReservaciones(100, 0, estado, this.searchQuery).subscribe({
      next: (res) => {
        this.reservaciones.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando reservaciones:', err);
        this.loading.set(false);
      },
    });
  }

  loadCatalogs() {
    this.api.getSalones().subscribe({
      next: (res) => this.salonesList.set(res.data || []),
      error: (err) => console.error('Error cargando salones:', err),
    });

    this.api.getEmpleados(100).subscribe({
      next: (res) => this.empleadosList.set(res.data || []),
      error: (err) => console.error('Error cargando empleados:', err),
    });

    this.api.getCursos().subscribe({
      next: (res) => this.cursosList.set(res.data || []),
      error: (err) => console.error('Error cargando cursos:', err),
    });

    this.api.getJornadas().subscribe({
      next: (res) => this.jornadasList.set(res),
      error: (err) => console.error('Error cargando jornadas:', err),
    });
  }

  setFilterEstado(estado: number | null) {
    this.filterEstado.set(estado);
    this.loadReservaciones();
  }

  onSearchChange() {
    this.loadReservaciones(false);
  }

  clearSearch() {
    this.searchQuery = '';
    this.loadReservaciones();
  }

  // --- Actions ---
  aprobarReservacion(r: Reservacion) {
    if (confirm(`¿Aprobar la solicitud #${r.id} para el espacio "${r.salon?.title}"?`)) {
      this.api.cambiarEstadoReservacion(r.id, 2).subscribe({
        next: () => {
          this.toast.success('Solicitud aprobada', `La reservación #${r.id} ha sido confirmada.`);
          this.loadStats();
          this.loadReservaciones(false);
        },
        error: (err) => this.toast.error('Error', err.error?.message || err.message || 'Error al aprobar solicitud'),
      });
    }
  }

  aprobarDesdeModal() {
    if (this.selectedRes()) {
      this.aprobarReservacion(this.selectedRes()!);
      this.closeDetailModal();
    }
  }

  finalizarReservacion(r: Reservacion) {
    if (confirm(`¿Marcar como Concluido/Finalizado el evento #${r.id}?`)) {
      this.api.cambiarEstadoReservacion(r.id, 4).subscribe({
        next: () => {
          this.toast.info('Evento concluido', `El evento #${r.id} fue finalizado.`);
          this.loadStats();
          this.loadReservaciones(false);
        },
        error: (err) => this.toast.error('Error', err.error?.message || err.message || 'Error al finalizar evento'),
      });
    }
  }

  openRechazoModal(r: Reservacion) {
    this.selectedRes.set(r);
    this.motivoRechazoText = '';
    this.showRechazoModal.set(true);
  }

  closeRechazoModal() {
    this.showRechazoModal.set(false);
    this.selectedRes.set(null);
  }

  confirmarRechazo() {
    if (!this.selectedRes()) return;
    const r = this.selectedRes()!;
    this.api.cambiarEstadoReservacion(r.id, 3, this.motivoRechazoText).subscribe({
      next: () => {
        this.closeRechazoModal();
        this.toast.warning('Solicitud rechazada', `La reservación #${r.id} fue declinada.`);
        this.loadStats();
        this.loadReservaciones(false);
      },
      error: (err) => this.toast.error('Error', err.error?.message || err.message || 'Error al rechazar solicitud'),
    });
  }

  deleteReservacion(r: Reservacion) {
    if (confirm(`¿Estás seguro de eliminar el registro de reservación #${r.id}?`)) {
      this.api.deleteReservacion(r.id).subscribe({
        next: () => {
          this.toast.info('Reservación eliminada', `El registro #${r.id} ha sido eliminado.`);
          this.loadStats();
          this.loadReservaciones(false);
        },
        error: (err) => this.toast.error('Error', err.error?.message || err.message || 'Error al eliminar reservación'),
      });
    }
  }

  // --- Modals ---
  openCreateModal() {
    this.formRes = {
      tipoEvento: 'Taller Especial',
      salonId: this.salonesList().length > 0 ? this.salonesList()[0].id : null,
      empleadoId: this.empleadosList().length > 0 ? this.empleadosList()[0].id : null,
      cursoId: this.cursosList().length > 0 ? this.cursosList()[0].id : null,
      jornada: 'Jornada Única',
      fechaEvento: new Date().toISOString().split('T')[0],
      horaInicio: '08:00',
      horaFin: '12:00',
      cantidadPersonas: 20,
      descripcion: '',
      seguimiento: '',
      estado: 1,
    };
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  openDetailModal(r: Reservacion) {
    this.selectedRes.set(r);
    this.showDetailModal.set(true);
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
    this.selectedRes.set(null);
  }

  saveReservacion() {
    if (!this.formRes.salonId || !this.formRes.empleadoId || !this.formRes.cursoId) {
      this.toast.warning('Campos requeridos', 'Por favor completa los campos requeridos (Salón, Instructor y Curso).');
      return;
    }

    this.saving.set(true);
    this.api.createReservacion(this.formRes).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeCreateModal();
        this.toast.success('Reservación registrada', 'La solicitud de reservación ha sido guardada.');
        this.loadStats();
        this.loadReservaciones(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error('Error', err.error?.message || err.message || 'Error al guardar solicitud');
      },
    });
  }
}
