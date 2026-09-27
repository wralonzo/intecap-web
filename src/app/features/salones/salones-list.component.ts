import { Component, inject, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { WebSocketService } from '../../core/services/websocket.service';
import {
  Salon,
  SalonMatrizHorario,
  RealtimeResponse,
  Curso,
  Empleado,
  Jornada,
} from '../../core/models';
import { PageHeaderComponent, ModalComponent, EmptyStateComponent } from '../../shared';

@Component({
  selector: 'app-salones-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent, EmptyStateComponent],
  templateUrl: './salones-list.component.html',
  styleUrl: './salones-list.component.scss',
})
export class SalonesListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ws = inject(WebSocketService);
  private readonly cdr = inject(ChangeDetectorRef);

  activeView = signal<'realtime' | 'matriz' | 'catalogo' | 'jornadas'>('realtime');
  loading = signal(true);
  saving = signal(false);

  // Catalogs
  cursosList = signal<Curso[]>([]);
  jornadasList = signal<Jornada[]>([]);
  empleadosList = signal<Empleado[]>([]);

  // RealTime Data
  diasSemana = ['Hoy', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
  selectedDia = signal<string>('Hoy');
  realtimeTipo = signal<number | undefined>(undefined);
  realtimeData = signal<RealtimeResponse | null>(null);

  // Matrix Data
  matrizTipo = signal<number | undefined>(0);
  matrizSearch = '';
  matrizData = signal<SalonMatrizHorario[]>([]);

  // Catalogo Salones
  salones = signal<Salon[]>([]);
  catalogoFilter = signal<'all' | 'salones' | 'talleres'>('all');

  // Modals
  showSalonModal = signal(false);
  isEditingSalon = signal(false);
  activeSalon: Partial<Salon> = {
    title: '',
    tipoSalon: 1,
    cantidadPersonas: 25,
    jornadaId: undefined,
    cursoId: undefined,
    empleadoId: undefined,
    start: '07:30',
    end: '12:30',
  };

  showHorarioModal = signal(false);
  currentEditingSalonHorario = signal<SalonMatrizHorario | null>(null);
  activeHorarioEdit: {
    salonId: number;
    salonTitle: string;
    diaId: number;
    cursoManana: string;
    cursoTarde: string;
    cursoNoche: string;
  } = {
    salonId: 0,
    salonTitle: '',
    diaId: 1,
    cursoManana: '',
    cursoTarde: '',
    cursoNoche: '',
  };

  showJornadaModal = signal(false);
  newJornada: { nombre: string; horaInicio: string; horaFin: string } = {
    nombre: '',
    horaInicio: '07:30',
    horaFin: '12:30',
  };

  filteredSalones = computed(() => {
    const filter = this.catalogoFilter();
    if (filter === 'salones') return this.salones().filter((s) => s.tipoSalon === 1);
    if (filter === 'talleres') return this.salones().filter((s) => s.tipoSalon === 0);
    return this.salones();
  });

  ngOnInit() {
    this.loadCatalogs();
    this.loadRealtime();
    this.loadMatriz();
    this.loadSalones();

    // Escucha de WebSockets en tiempo real
    this.ws.onDisponibilidadUpdate().subscribe(() => {
      if (this.activeView() === 'realtime') {
        this.loadRealtime();
      } else if (this.activeView() === 'matriz') {
        this.loadMatriz();
      } else if (this.activeView() === 'catalogo') {
        this.loadSalones();
      }
    });
  }

  loadCatalogs() {
    this.api.getCursos(100).subscribe({
      next: (res) => {
        this.cursosList.set(res.data);
        this.cdr.markForCheck();
      },
    });

    this.api.getJornadas().subscribe({
      next: (data) => {
        this.jornadasList.set(data);
        this.cdr.markForCheck();
      },
    });

    this.api.getEmpleados(100).subscribe({
      next: (res) => {
        this.empleadosList.set(res.data);
        this.cdr.markForCheck();
      },
    });
  }

  switchView(view: 'realtime' | 'matriz' | 'catalogo' | 'jornadas') {
    this.activeView.set(view);
    if (view === 'realtime') this.loadRealtime();
    else if (view === 'matriz') this.loadMatriz();
    else if (view === 'catalogo') this.loadSalones();
    else if (view === 'jornadas') this.loadCatalogs();
  }

  // RealTime Methods
  loadRealtime() {
    this.loading.set(true);
    const diaParam = this.selectedDia() === 'Hoy' ? undefined : this.selectedDia();
    this.api.getRealtimeDisponibilidad(this.realtimeTipo(), diaParam).subscribe({
      next: (res) => {
        this.realtimeData.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  changeRealtimeDia(dia: string) {
    this.selectedDia.set(dia);
    this.loadRealtime();
  }

  changeRealtimeTipo(tipo?: number) {
    this.realtimeTipo.set(tipo);
    this.loadRealtime();
  }

  // Matrix Methods
  loadMatriz() {
    this.loading.set(true);
    this.api.getReporteMatriz(this.matrizTipo(), this.matrizSearch).subscribe({
      next: (res) => {
        this.matrizData.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  changeMatrizTipo(tipo?: number) {
    this.matrizTipo.set(tipo);
    this.loadMatriz();
  }

  printMatriz() {
    window.print();
  }

  // Catalogo Salones Methods
  loadSalones() {
    this.loading.set(true);
    this.api.getSalones().subscribe({
      next: (res) => {
        this.salones.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreateModal() {
    this.isEditingSalon.set(false);
    this.activeSalon = {
      title: '',
      tipoSalon: 1,
      cantidadPersonas: 25,
      jornadaId: this.jornadasList().length > 0 ? this.jornadasList()[0].id : undefined,
      cursoId: undefined,
      empleadoId: undefined,
      start: '07:30',
      end: '12:30',
    };
    this.showSalonModal.set(true);
  }

  openEditModal(salon: Salon) {
    this.isEditingSalon.set(true);
    this.activeSalon = { ...salon };
    this.showSalonModal.set(true);
  }

  closeSalonModal() {
    this.showSalonModal.set(false);
  }

  saveSalon() {
    if (!this.activeSalon.title) {
      alert('Por favor ingresa el nombre del espacio.');
      return;
    }

    this.saving.set(true);
    if (this.isEditingSalon() && this.activeSalon.id) {
      this.api.updateSalon(this.activeSalon.id, this.activeSalon).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeSalonModal();
          this.loadSalones();
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.api.createSalon(this.activeSalon).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeSalonModal();
          this.loadSalones();
        },
        error: () => this.saving.set(false),
      });
    }
  }

  deleteSalon(id: number) {
    if (!confirm(`¿Estás seguro de eliminar el espacio #${id}?`)) return;
    this.api.deleteSalon(id).subscribe({
      next: () => this.loadSalones(),
    });
  }

  // Quick Horario Assignment Modal
  private getDiaKey(diaId: number): 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo' {
    const keys: Record<number, 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'> = {
      1: 'lunes',
      2: 'martes',
      3: 'miercoles',
      4: 'jueves',
      5: 'viernes',
      6: 'sabado',
      7: 'domingo',
    };
    return keys[diaId] || 'lunes';
  }

  openQuickEditHorario(salonId: number, salonTitle: string, diaId?: number) {
    const dayOfWeek = new Date().getDay();
    const initialDiaId = diaId !== undefined ? Number(diaId) : (dayOfWeek === 0 ? 7 : dayOfWeek);

    this.activeHorarioEdit = {
      salonId,
      salonTitle,
      diaId: initialDiaId,
      cursoManana: '',
      cursoTarde: '',
      cursoNoche: '',
    };

    this.showHorarioModal.set(true);
    this.cdr.markForCheck();

    const foundRow = this.matrizData().find((r) => r.salon.id === salonId);
    if (foundRow && foundRow.dias) {
      this.currentEditingSalonHorario.set(foundRow);
      this.loadHorarioForSelectedDia();
    } else {
      this.api.getSalonHorario(salonId).subscribe({
        next: (res) => {
          this.currentEditingSalonHorario.set(res);
          this.loadHorarioForSelectedDia();
        },
        error: () => {
          this.loadHorarioForSelectedDia();
        },
      });
    }
  }

  onDiaChange(newDiaId: number) {
    this.activeHorarioEdit.diaId = Number(newDiaId);
    this.loadHorarioForSelectedDia();
  }

  loadHorarioForSelectedDia() {
    const diaKey = this.getDiaKey(Number(this.activeHorarioEdit.diaId));
    const horario = this.currentEditingSalonHorario();

    if (horario && horario.dias && horario.dias[diaKey]) {
      const turnos = horario.dias[diaKey];
      this.activeHorarioEdit = {
        ...this.activeHorarioEdit,
        cursoManana: turnos.manana || '',
        cursoTarde: turnos.tarde || '',
        cursoNoche: turnos.noche || '',
      };
    } else {
      const matriz = this.matrizData();
      const foundRow = matriz.find((r) => r.salon.id === this.activeHorarioEdit.salonId);

      if (foundRow && foundRow.dias && foundRow.dias[diaKey]) {
        const turnos = foundRow.dias[diaKey];
        this.activeHorarioEdit = {
          ...this.activeHorarioEdit,
          cursoManana: turnos.manana || '',
          cursoTarde: turnos.tarde || '',
          cursoNoche: turnos.noche || '',
        };
      } else {
        this.activeHorarioEdit = {
          ...this.activeHorarioEdit,
          cursoManana: '',
          cursoTarde: '',
          cursoNoche: '',
        };
      }
    }
    this.cdr.markForCheck();
  }

  closeHorarioModal() {
    this.showHorarioModal.set(false);
    this.currentEditingSalonHorario.set(null);
    this.cdr.markForCheck();
  }

  saveHorarioAssignment() {
    this.saving.set(true);
    const { salonId, diaId, cursoManana, cursoTarde, cursoNoche } = this.activeHorarioEdit;
    this.api
      .updateSalonHorario(salonId, {
        diaId: Number(diaId),
        cursoManana,
        cursoTarde,
        cursoNoche,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.closeHorarioModal();
          this.loadRealtime();
          this.loadMatriz();
          this.loadSalones();
          this.cdr.markForCheck();
        },
        error: () => {
          this.saving.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  // Jornadas Methods
  openCreateJornadaModal() {
    this.newJornada = {
      nombre: '',
      horaInicio: '07:30',
      horaFin: '12:30',
    };
    this.showJornadaModal.set(true);
  }

  saveJornada() {
    if (!this.newJornada.nombre) {
      alert('Por favor ingresa el nombre de la jornada.');
      return;
    }

    this.saving.set(true);
    this.api.createJornada(this.newJornada).subscribe({
      next: () => {
        this.saving.set(false);
        this.showJornadaModal.set(false);
        this.loadCatalogs();
      },
      error: () => this.saving.set(false),
    });
  }
}
