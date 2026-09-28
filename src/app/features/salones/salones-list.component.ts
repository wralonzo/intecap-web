import { Component, inject, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { exportToCsv, printHtmlReport } from '../../core/utils/export.util';
import {
  Salon,
  SalonMatrizHorario,
  RealtimeResponse,
  Curso,
  Empleado,
  Jornada,
} from '../../core/models';
import { PageHeaderComponent, ModalComponent, EmptyStateComponent, CustomSelectComponent, SelectOption } from '../../shared';

@Component({
  selector: 'app-salones-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent, EmptyStateComponent, CustomSelectComponent],
  templateUrl: './salones-list.component.html',
  styleUrl: './salones-list.component.scss',
})
export class SalonesListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ws = inject(WebSocketService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);

  activeView = signal<'realtime' | 'matriz' | 'catalogo' | 'jornadas'>('realtime');
  loading = signal(true);
  saving = signal(false);

  // Catalogs
  cursosList = signal<Curso[]>([]);
  jornadasList = signal<Jornada[]>([]);
  empleadosList = signal<Empleado[]>([]);

  // Computed Options for Custom Selects
  diasSemanaOptions: SelectOption[] = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 7, label: 'Domingo' },
  ];

  tipoEspacioOptions: SelectOption[] = [
    { value: 1, label: 'Salón Teórico / Aula', icon: '🏛️', badge: 'Salón', badgeColor: 'blue' },
    { value: 0, label: 'Taller Práctico Técnico', icon: '⚡', badge: 'Taller', badgeColor: 'gold' },
  ];

  cursosHorarioOptions = computed<SelectOption[]>(() => [
    { value: '', label: '-- Libre / Disponible --' },
    ...this.cursosList().map((c) => ({
      value: c.nombre,
      label: c.nombre,
      icon: '📚',
    })),
  ]);

  jornadasOptions = computed<SelectOption[]>(() => [
    { value: undefined, label: '-- Seleccionar Jornada --' },
    ...this.jornadasList().map((j) => ({
      value: j.id,
      label: `${j.nombre} (${j.horaInicio || (j as any).horainicio || '07:30'} - ${j.horaFin || (j as any).horafin || '12:30'})`,
      icon: '⏰',
    })),
  ]);

  cursosIdOptions = computed<SelectOption[]>(() => [
    { value: undefined, label: '-- Ninguno / Sin Asignar --' },
    ...this.cursosList().map((c) => ({
      value: c.id,
      label: c.nombre,
      icon: '📚',
    })),
  ]);

  empleadosOptions = computed<SelectOption[]>(() => [
    { value: undefined, label: '-- Sin Instructor Asignado --' },
    ...this.empleadosList().map((e) => ({
      value: e.id,
      label: `${e.nombres} ${e.apellidos}`,
      subtitle: e.profesion || e.tipoEmpleado?.name || e.tipoEmpleado?.tipoEmpleado || 'Docente',
      icon: '👨‍🏫',
    })),
  ]);

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
    let diaParam = this.selectedDia();
    if (diaParam === 'Hoy') {
      const localDayIndex = new Date().getDay();
      const diasMap = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
      diaParam = diasMap[localDayIndex];
    }
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
      this.toast.warning('Campo requerido', 'Por favor ingresa el nombre del espacio.');
      return;
    }

    this.saving.set(true);
    if (this.isEditingSalon() && this.activeSalon.id) {
      this.api.updateSalon(this.activeSalon.id, this.activeSalon).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeSalonModal();
          this.toast.success('Espacio actualizado', 'Salón / Taller guardado correctamente.');
          this.loadSalones();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error('Error', err.error?.message || 'Error al actualizar espacio');
        },
      });
    } else {
      this.api.createSalon(this.activeSalon).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeSalonModal();
          this.toast.success('Espacio creado', 'Nuevo salón o taller registrado.');
          this.loadSalones();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error('Error', err.error?.message || 'Error al crear espacio');
        },
      });
    }
  }

  async deleteSalon(id: number): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: '¿Eliminar Espacio / Salón?',
      message: `¿Estás seguro de desactivar el espacio o salón #${id}? Se ocultará del catálogo general.`,
      confirmText: 'Sí, Desactivar',
      type: 'danger',
    });
    if (!confirmed) return;

    this.api.deleteSalon(id).subscribe({
      next: () => {
        this.toast.info('Espacio eliminado', `El salón #${id} ha sido desactivado.`);
        this.loadSalones();
      },
      error: (err) => this.toast.error('Error', err.error?.message || 'Error al eliminar salón'),
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

    // Consultar directamente el horario más fresco del backend
    this.api.getSalonHorario(salonId).subscribe({
      next: (res) => {
        this.currentEditingSalonHorario.set(res);
        this.loadHorarioForSelectedDia();
      },
      error: () => {
        // Fallback a matriz local si existe
        const foundRow = this.matrizData().find((r) => r.salon.id === salonId);
        if (foundRow) {
          this.currentEditingSalonHorario.set(foundRow);
        }
        this.loadHorarioForSelectedDia();
      },
    });
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
          this.toast.success('Horario actualizado', 'La asignación de cursos para este día fue guardada.');
          this.loadRealtime();
          this.loadMatriz();
          this.loadSalones();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error('Error', err.error?.message || 'Error al guardar horario');
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
      this.toast.warning('Campo requerido', 'Por favor ingresa el nombre de la jornada.');
      return;
    }

    this.saving.set(true);
    this.api.createJornada(this.newJornada).subscribe({
      next: () => {
        this.saving.set(false);
        this.showJornadaModal.set(false);
        this.toast.success('Jornada creada', 'Nueva jornada académica registrada con éxito.');
        this.loadCatalogs();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error('Error', err.error?.message || 'Error al crear jornada');
      },
    });
  }

  // ================= EXPORTS =================
  exportMatrizExcel(): void {
    const data = this.matrizData();
    if (!data.length) {
      this.toast.warning('Sin datos', 'No hay registros en la matriz para exportar.');
      return;
    }

    const rows = data.map((item) => {
      const getTurnos = (turnos: any) =>
        `M: ${turnos?.manana || '-'} | T: ${turnos?.tarde || '-'} | N: ${turnos?.noche || '-'}`;

      return {
        'Espacio / Salón': item.salon.title,
        'Tipo': item.salon.tipoSalon === 1 ? 'Salón Teórico' : 'Taller Práctico',
        'Capacidad': `${item.salon.cantidadPersonas || 0} personas`,
        'Lunes': getTurnos(item.dias.lunes),
        'Martes': getTurnos(item.dias.martes),
        'Miércoles': getTurnos(item.dias.miercoles),
        'Jueves': getTurnos(item.dias.jueves),
        'Viernes': getTurnos(item.dias.viernes),
        'Sábado': getTurnos(item.dias.sabado),
        'Domingo': getTurnos(item.dias.domingo),
      };
    });

    exportToCsv(rows, 'Matriz_Semanal_Salones_INTECAP');
    this.toast.success('Descarga exitosa', 'Matriz semanal exportada a Excel (.xlsx/csv).');
  }

  exportMatrizPdf(): void {
    const data = this.matrizData();
    if (!data.length) {
      this.toast.warning('Sin datos', 'No hay registros en la matriz para exportar.');
      return;
    }

    const getTurnoHtml = (t: any) => `
      <div style="font-size: 8px; line-height: 1.2;">
        <strong>M:</strong> ${t?.manana || '-'}<br/>
        <strong>T:</strong> ${t?.tarde || '-'}<br/>
        <strong>N:</strong> ${t?.noche || '-'}
      </div>
    `;

    let rowsHtml = '';
    data.forEach((item) => {
      rowsHtml += `
        <tr>
          <td><strong>${item.salon.title}</strong><br/><small>${item.salon.tipoSalon === 1 ? 'Salón' : 'Taller'} (${item.salon.cantidadPersonas} pers.)</small></td>
          <td>${getTurnoHtml(item.dias.lunes)}</td>
          <td>${getTurnoHtml(item.dias.martes)}</td>
          <td>${getTurnoHtml(item.dias.miercoles)}</td>
          <td>${getTurnoHtml(item.dias.jueves)}</td>
          <td>${getTurnoHtml(item.dias.viernes)}</td>
          <td>${getTurnoHtml(item.dias.sabado)}</td>
          <td>${getTurnoHtml(item.dias.domingo)}</td>
        </tr>
      `;
    });

    const bodyHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
        <thead>
          <tr style="background-color: #002f6c; color: white;">
            <th style="padding: 6px; border: 1px solid #ccc;">Espacio</th>
            <th style="padding: 6px; border: 1px solid #ccc;">Lunes</th>
            <th style="padding: 6px; border: 1px solid #ccc;">Martes</th>
            <th style="padding: 6px; border: 1px solid #ccc;">Miércoles</th>
            <th style="padding: 6px; border: 1px solid #ccc;">Jueves</th>
            <th style="padding: 6px; border: 1px solid #ccc;">Viernes</th>
            <th style="padding: 6px; border: 1px solid #ccc;">Sábado</th>
            <th style="padding: 6px; border: 1px solid #ccc;">Domingo</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

    printHtmlReport('MATRIZ SEMANAL DE SALONES Y HORARIOS', bodyHtml);
  }
}
