import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { ToastService } from '../../core/services/toast.service';
import { Reservacion, Salon, Empleado, Curso, Jornada, ReservacionesStats } from '../../core/models';
import { ModalComponent, PageHeaderComponent, EmptyStateComponent, CustomSelectComponent, SelectOption } from '../../shared';
import { computed } from '@angular/core';

@Component({
  selector: 'app-reservaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, PageHeaderComponent, EmptyStateComponent, CustomSelectComponent],
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

  // Computed Options for Custom Selects
  tipoEventoOptions: SelectOption[] = [
    { value: 'Taller Especial', label: 'Taller Técnico Especial', icon: '🔧', badge: 'Taller', badgeColor: 'gold' },
    { value: 'Seminario', label: 'Seminario / Conferencia', icon: '🎓', badge: 'Seminario', badgeColor: 'blue' },
    { value: 'Capacitación Empresarial', label: 'Capacitación Empresarial', icon: '💼', badge: 'Empresas', badgeColor: 'green' },
    { value: 'Examen / Certificación', label: 'Evaluación / Certificación', icon: '📝', badge: 'Evaluación', badgeColor: 'red' },
    { value: 'Práctica de Laboratorio', label: 'Práctica de Laboratorio', icon: '🔬' },
    { value: 'Reunión Institucional', label: 'Reunión Institucional / Evento', icon: '🤝' },
    { value: 'Otro Evento', label: 'Otro Evento Específico', icon: '✨' },
  ];

  salonesOptions = computed<SelectOption[]>(() =>
    this.salonesList().map((s) => ({
      value: s.id,
      label: s.title,
      subtitle: `${s.tipoSalon === 0 ? 'Taller Técnico' : 'Salón Teórico'} • Capacidad: ${s.cantidadPersonas || 25} personas`,
      icon: s.tipoSalon === 0 ? '⚡' : '🏛️',
    }))
  );

  empleadosOptions = computed<SelectOption[]>(() =>
    this.empleadosList().map((e) => ({
      value: e.id,
      label: `${e.nombres} ${e.apellidos}`,
      subtitle: e.profesion || e.tipoEmpleado?.tipoEmpleado || e.tipoEmpleado?.name || 'Docente',
      icon: '👨‍🏫',
    }))
  );

  cursosOptions = computed<SelectOption[]>(() =>
    this.cursosList().map((c) => ({
      value: c.id,
      label: c.nombre,
      icon: '📚',
    }))
  );

  jornadasOptions = computed<SelectOption[]>(() => [
    { value: 'Jornada Única', label: 'Jornada Única / Específica', icon: '⏰' },
    ...this.jornadasList().map((j) => ({
      value: j.nombre,
      label: `${j.nombre} (${j.horaInicio || (j as any).horainicio || '07:30'} - ${j.horaFin || (j as any).horafin || '12:30'})`,
      icon: '⏰',
    })),
  ]);
  
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
  showConfirmActionModal = signal<boolean>(false);
  confirmActionType = signal<'approve' | 'finish' | 'delete'>('approve');
  actionTargetRes = signal<Reservacion | null>(null);
  actionInProgress = signal<boolean>(false);
  
  // Smart Availability Signals
  checkingDisponibilidad = signal<boolean>(false);
  disponibilidadData = signal<any>(null);
  selectedAlternativeSalonId = signal<number | null>(null);
  modoEstrategia = signal<'overlay' | 'reubicar_evento' | 'reubicar_curso'>('overlay');

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

  // --- Actions & Modern Modals ---
  openAprobarModal(r: Reservacion) {
    this.actionTargetRes.set(r);
    this.confirmActionType.set('approve');
    this.selectedAlternativeSalonId.set(null);
    this.modoEstrategia.set('overlay');
    this.disponibilidadData.set(null);
    this.showConfirmActionModal.set(true);
    this.checkAvailability(r.id);
  }

  checkAvailability(reservacionId: number) {
    this.checkingDisponibilidad.set(true);
    this.api.verificarDisponibilidadReservacion(reservacionId).subscribe({
      next: (data) => {
        this.disponibilidadData.set(data);
        this.checkingDisponibilidad.set(false);
      },
      error: (err) => {
        console.error('Error verificando disponibilidad:', err);
        this.checkingDisponibilidad.set(false);
      },
    });
  }

  setEstrategia(modo: 'overlay' | 'reubicar_evento' | 'reubicar_curso') {
    this.modoEstrategia.set(modo);
    if (modo === 'overlay') {
      this.selectedAlternativeSalonId.set(null);
    } else if (!this.selectedAlternativeSalonId() && this.disponibilidadData()?.alternativas?.length > 0) {
      // Auto-select first available room if none selected
      this.selectedAlternativeSalonId.set(this.disponibilidadData().alternativas[0].id);
    }
  }

  seleccionarAlternativa(salonId: number) {
    this.selectedAlternativeSalonId.set(salonId);
  }

  getSelectedAlternativeSalon(): any {
    const id = this.selectedAlternativeSalonId();
    if (!id || !this.disponibilidadData()?.alternativas) return null;
    return this.disponibilidadData().alternativas.find((a: any) => a.id === id);
  }

  openFinalizarModal(r: Reservacion) {
    this.actionTargetRes.set(r);
    this.confirmActionType.set('finish');
    this.showConfirmActionModal.set(true);
  }

  openDeleteModal(r: Reservacion) {
    this.actionTargetRes.set(r);
    this.confirmActionType.set('delete');
    this.showConfirmActionModal.set(true);
  }

  closeConfirmActionModal() {
    this.showConfirmActionModal.set(false);
    this.actionTargetRes.set(null);
    this.actionInProgress.set(false);
    this.disponibilidadData.set(null);
    this.selectedAlternativeSalonId.set(null);
    this.modoEstrategia.set('overlay');
  }

  executeConfirmedAction() {
    const r = this.actionTargetRes();
    if (!r) return;

    this.actionInProgress.set(true);
    const action = this.confirmActionType();

    if (action === 'approve') {
      const estrategia = this.modoEstrategia();
      const altSalon = this.getSelectedAlternativeSalon();
      const nuevoSalonId = estrategia === 'reubicar_evento' ? (this.selectedAlternativeSalonId() || undefined) : undefined;
      const reubicacionCursoSalonId = estrategia === 'reubicar_curso' ? (this.selectedAlternativeSalonId() || undefined) : undefined;

      this.api.cambiarEstadoReservacion(r.id, 2, undefined, nuevoSalonId, reubicacionCursoSalonId).subscribe({
        next: () => {
          this.actionInProgress.set(false);
          this.closeConfirmActionModal();

          if (estrategia === 'reubicar_evento' && altSalon) {
            this.toast.success(
              'Evento reubicado y aprobado',
              `La reservación #${r.id} fue confirmada en "${altSalon.title}". Los cursos del salón original no fueron alterados.`
            );
          } else if (estrategia === 'reubicar_curso' && altSalon) {
            this.toast.success(
              'Evento aprobado y curso reubicado',
              `El evento se realizará en "${r.salon?.title || 'el salón original'}" y el curso regular se trasladó temporalmente a "${altSalon.title}".`
            );
          } else {
            this.toast.success(
              'Solicitud aprobada con éxito',
              `La reservación #${r.id} fue confirmada con superposición temporal automática de 1 día.`
            );
          }
          this.loadStats();
          this.loadReservaciones(false);
        },
        error: (err) => {
          this.actionInProgress.set(false);
          this.toast.error('Error', err.error?.message || err.message || 'Error al aprobar solicitud');
        },
      });
    } else if (action === 'finish') {
      this.api.cambiarEstadoReservacion(r.id, 4).subscribe({
        next: () => {
          this.actionInProgress.set(false);
          this.closeConfirmActionModal();
          this.toast.info('Evento concluido', `El evento #${r.id} fue finalizado y la programación regular fue restaurada automáticamente.`);
          this.loadStats();
          this.loadReservaciones(false);
        },
        error: (err) => {
          this.actionInProgress.set(false);
          this.toast.error('Error', err.error?.message || err.message || 'Error al finalizar evento');
        },
      });
    } else if (action === 'delete') {
      this.api.deleteReservacion(r.id).subscribe({
        next: () => {
          this.actionInProgress.set(false);
          this.closeConfirmActionModal();
          this.toast.info('Reservación eliminada', `El registro #${r.id} ha sido eliminado.`);
          this.loadStats();
          this.loadReservaciones(false);
        },
        error: (err) => {
          this.actionInProgress.set(false);
          this.toast.error('Error', err.error?.message || err.message || 'Error al eliminar reservación');
        },
      });
    }
  }

  aprobarDesdeModal() {
    const r = this.selectedRes();
    if (r) {
      this.closeDetailModal();
      this.openAprobarModal(r);
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
