import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { exportToCsv, printHtmlReport } from '../../core/utils/export.util';
import { ControlCalidad, Empleado, CalidadEstadisticas } from '../../core/models';
import { PageHeaderComponent, EmptyStateComponent, CustomSelectComponent, SelectOption } from '../../shared';

@Component({
  selector: 'app-calidad',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, EmptyStateComponent, CustomSelectComponent],
  templateUrl: './calidad.component.html',
  styleUrl: './calidad.component.scss',
})
export class CalidadComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);

  currentView = signal<'list' | 'form' | 'report'>('list');
  evaluaciones = signal<ControlCalidad[]>([]);
  empleados = signal<Empleado[]>([]);
  estadisticas = signal<CalidadEstadisticas | null>(null);
  loading = signal(true);
  saving = signal(false);

  empleadosOptions = computed<SelectOption[]>(() => [
    { value: null, label: '-- Selecciona un docente --' },
    ...this.empleados().map((e) => ({
      value: e.id,
      label: `${e.nombres} ${e.apellidos}`,
      subtitle: e.profesion || e.tipoEmpleado?.name || e.tipoEmpleado?.tipoEmpleado || 'Docente / Instructor',
      icon: '👨‍🏫',
    })),
  ]);

  productoFormacionOptions: SelectOption[] = [
    { value: 'Guía Didáctica de Aprendizaje', label: 'Guía Didáctica de Aprendizaje', icon: '📄' },
    { value: 'Plan de Sesión Formativa', label: 'Plan de Sesión Formativa', icon: '📋' },
    { value: 'Evaluación Práctica de Taller', label: 'Evaluación Práctica de Taller', icon: '🔧' },
    { value: 'Manual de Procedimientos Técnicos', label: 'Manual de Procedimientos Técnicos', icon: '📘' },
  ];

  isEditing = signal(false);
  activeTab = 'general';
  searchTerm = '';
  filterStatus = 'all';

  viewingEval: ControlCalidad | null = null;

  activeEval: Partial<ControlCalidad> = {
    empleadoId: 0,
    nombreModulo: '',
    noPrograma: '',
    lugar: '',
    temaDesarrollo: '',
    resultadoAprendizaje: '',
    productoFormacion: 'Guía Didáctica de Aprendizaje',
    fechaInicio: '',
    fechaFin: '',

    planP1: 3,
    planP2: 6,
    planP3: 6,
    planP4: 5,
    planP5: 5,

    procesoP1: 2,
    procesoP2: 4,
    procesoP3: 4,

    desempenoP1: 3,
    desempenoP2: 3,
    desempenoP3: 4,
    desempenoP4: 4,
    desempenoP5: 5,
    desempenoP6: 5,
    desempenoP7: 4,
    desempenoP8: 4,
    desempenoP9: 4,
    desempenoP10: 4,
    desempenoP11: 5,

    aspectosP1: 4,
    aspectosP2: 2,
    aspectosP3: 3,
    aspectosP4: 2,
    aspectosP5: 4,

    observaciones: '',
    compromisosDocente: '',
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.api.getCalidad().subscribe({
      next: (res) => {
        this.evaluaciones.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.api.getEmpleados().subscribe({
      next: (res) => this.empleados.set(res.data),
    });

    this.api.getCalidadEstadisticas().subscribe({
      next: (stats) => this.estadisticas.set(stats),
    });
  }

  getItemPromedio(item: ControlCalidad): number {
    const val = Number(item.promedio);
    if (val > 0) return val;

    const sum =
      Number(item.totalPlanificacion || 25) +
      Number(item.totalProceso || 10) +
      Number(item.totalDesempeno || 50) +
      Number(item.totalAspectos || 15);

    return sum > 0 ? sum : 100;
  }

  // Computed Values
  filteredEvaluaciones = computed(() => {
    const term = this.searchTerm.toLowerCase().trim();
    return this.evaluaciones().filter((item) => {
      const docName = item.empleado
        ? `${item.empleado.nombres} ${item.empleado.apellidos}`.toLowerCase()
        : '';
      const modName = (item.nombreModulo || '').toLowerCase();
      const progName = (item.noPrograma || '').toLowerCase();
      const lugar = (item.lugar || '').toLowerCase();

      const matchesTerm =
        !term ||
        docName.includes(term) ||
        modName.includes(term) ||
        progName.includes(term) ||
        lugar.includes(term);

      if (!matchesTerm) return false;

      const prom = this.getItemPromedio(item);
      if (this.filterStatus === 'conforme') return prom >= 95;
      if (this.filterStatus === 'no_conforme') return prom < 95;

      return true;
    });
  });

  totalConformes = computed(() => {
    return this.evaluaciones().filter((e) => this.getItemPromedio(e) >= 95).length;
  });

  totalNoConformes = computed(() => {
    return this.evaluaciones().filter((e) => this.getItemPromedio(e) < 95).length;
  });

  porcentajeConformidad = computed(() => {
    const total = this.evaluaciones().length;
    return total > 0 ? Math.round((this.totalConformes() / total) * 100) : 0;
  });

  promedioGeneral = computed(() => {
    const list = this.evaluaciones();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, curr) => acc + this.getItemPromedio(curr), 0);
    return Number((sum / list.length).toFixed(1));
  });

  // Dynamic Rubric Totals
  calculatePlanificacionSubtotal(): number {
    return (
      Number(this.activeEval.planP1 || 0) +
      Number(this.activeEval.planP2 || 0) +
      Number(this.activeEval.planP3 || 0) +
      Number(this.activeEval.planP4 || 0) +
      Number(this.activeEval.planP5 || 0)
    );
  }

  calculateProcesoSubtotal(): number {
    return (
      Number(this.activeEval.procesoP1 || 0) +
      Number(this.activeEval.procesoP2 || 0) +
      Number(this.activeEval.procesoP3 || 0)
    );
  }

  calculateDesempenoSubtotal(): number {
    return (
      Number(this.activeEval.desempenoP1 || 0) +
      Number(this.activeEval.desempenoP2 || 0) +
      Number(this.activeEval.desempenoP3 || 0) +
      Number(this.activeEval.desempenoP4 || 0) +
      Number(this.activeEval.desempenoP5 || 0) +
      Number(this.activeEval.desempenoP6 || 0) +
      Number(this.activeEval.desempenoP7 || 0) +
      Number(this.activeEval.desempenoP8 || 0) +
      Number(this.activeEval.desempenoP9 || 0) +
      Number(this.activeEval.desempenoP10 || 0) +
      Number(this.activeEval.desempenoP11 || 0)
    );
  }

  calculateTransversalesSubtotal(): number {
    return (
      Number(this.activeEval.aspectosP1 || 0) +
      Number(this.activeEval.aspectosP2 || 0) +
      Number(this.activeEval.aspectosP3 || 0) +
      Number(this.activeEval.aspectosP4 || 0) +
      Number(this.activeEval.aspectosP5 || 0)
    );
  }

  calculateGrandTotal(): number {
    return (
      this.calculatePlanificacionSubtotal() +
      this.calculateProcesoSubtotal() +
      this.calculateDesempenoSubtotal() +
      this.calculateTransversalesSubtotal()
    );
  }

  openCreateForm() {
    this.isEditing.set(false);
    this.activeTab = 'general';
    this.activeEval = {
      empleadoId: this.empleados().length > 0 ? this.empleados()[0].id : 0,
      nombreModulo: '',
      noPrograma: '',
      lugar: '',
      temaDesarrollo: '',
      resultadoAprendizaje: '',
      productoFormacion: 'Guía Didáctica de Aprendizaje',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: new Date().toISOString().split('T')[0],

      planP1: 3,
      planP2: 6,
      planP3: 6,
      planP4: 5,
      planP5: 5,

      procesoP1: 2,
      procesoP2: 4,
      procesoP3: 4,

      desempenoP1: 3,
      desempenoP2: 3,
      desempenoP3: 4,
      desempenoP4: 4,
      desempenoP5: 3,
      desempenoP6: 4,
      desempenoP7: 6,
      desempenoP8: 4,
      desempenoP9: 4,
      desempenoP10: 7,
      desempenoP11: 8,

      aspectosP1: 4,
      aspectosP2: 2,
      aspectosP3: 3,
      aspectosP4: 2,
      aspectosP5: 4,
    };
    this.currentView.set('form');
  }

  openEditForm(item: ControlCalidad) {
    this.isEditing.set(true);
    this.activeTab = 'general';
    this.activeEval = { ...item };
    this.currentView.set('form');
  }

  openViewReport(item: ControlCalidad) {
    this.viewingEval = item;
    this.currentView.set('report');
  }

  backToList() {
    this.currentView.set('list');
    this.viewingEval = null;
  }

  saveEvaluacion() {
    if (!this.activeEval.empleadoId) {
      this.toast.warning('Docente requerido', 'Por favor selecciona un docente para la evaluación.');
      return;
    }

    this.saving.set(true);

    if (this.isEditing() && this.activeEval.id) {
      this.api.updateCalidad(this.activeEval.id, this.activeEval).subscribe({
        next: () => {
          this.saving.set(false);
          this.backToList();
          this.toast.success('Evaluación actualizada', 'La evaluación de calidad ha sido modificada con éxito.');
          this.loadData();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error('Error', err.error?.message || 'Error al actualizar evaluación');
        },
      });
    } else {
      this.api.createCalidad(this.activeEval).subscribe({
        next: () => {
          this.saving.set(false);
          this.backToList();
          this.toast.success('Evaluación registrada', 'Nueva evaluación de calidad guardada con éxito.');
          this.loadData();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error('Error', err.error?.message || 'Error al crear evaluación');
        },
      });
    }
  }

  async deleteEvaluacion(id: number): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: '¿Eliminar Evaluación de Calidad?',
      message: `¿Estás seguro de eliminar el registro de evaluación #${id}? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, Eliminar',
      type: 'danger',
    });
    if (!confirmed) return;

    this.api.deleteCalidad(id).subscribe({
      next: () => {
        this.toast.info('Evaluación eliminada', `La evaluación #${id} fue eliminada.`);
        this.loadData();
      },
      error: (err) => this.toast.error('Error', err.error?.message || 'Error al eliminar evaluación'),
    });
  }

  setAllMaxScores() {
    this.activeEval = {
      ...this.activeEval,
      planP1: 3,
      planP2: 6,
      planP3: 6,
      planP4: 5,
      planP5: 5,

      procesoP1: 2,
      procesoP2: 4,
      procesoP3: 4,

      desempenoP1: 3,
      desempenoP2: 3,
      desempenoP3: 4,
      desempenoP4: 4,
      desempenoP5: 3,
      desempenoP6: 4,
      desempenoP7: 6,
      desempenoP8: 4,
      desempenoP9: 4,
      desempenoP10: 7,
      desempenoP11: 8,

      aspectosP1: 4,
      aspectosP2: 2,
      aspectosP3: 3,
      aspectosP4: 2,
      aspectosP5: 4,
    };
  }

  printFicha() {
    window.print();
  }

  exportExcel(): void {
    const data = this.evaluaciones();
    if (!data.length) {
      this.toast.warning('Sin datos', 'No hay evaluaciones de calidad para exportar.');
      return;
    }

    const rows = data.map((ev) => {
      const docente = ev.empleado ? `${ev.empleado.nombres} ${ev.empleado.apellidos}` : 'No especificado';
      const puesto = ev.empleado?.tipoEmpleado?.tipoEmpleado || ev.empleado?.tipoEmpleado?.name || '-';
      const score = Number(ev.punteoTotal || 0);
      let status = 'Excelente';
      if (score < 60) status = 'Necesita Mejora';
      else if (score < 80) status = 'Aceptable';
      else if (score < 90) status = 'Muy Bueno';

      return {
        'ID': ev.id,
        'Docente / Instructor': docente,
        'Puesto / Especialidad': puesto,
        'Módulo': ev.nombreModulo || '-',
        'No. Programa': ev.noPrograma || '-',
        'Lugar / Aula': ev.lugar || '-',
        'Punteo Total': `${score} / 100`,
        'Dictamen': status,
        'Fecha Inicio': ev.fechaInicio || '-',
        'Fecha Fin': ev.fechaFin || '-',
      };
    });

    exportToCsv(rows, 'Evaluaciones_Control_Calidad_INTECAP');
    this.toast.success('Descarga exitosa', 'Reporte de evaluaciones exportado a Excel.');
  }

  exportPdf(): void {
    const data = this.evaluaciones();
    if (!data.length) {
      this.toast.warning('Sin datos', 'No hay evaluaciones de calidad para exportar.');
      return;
    }

    let rowsHtml = '';
    data.forEach((ev) => {
      const docente = ev.empleado ? `${ev.empleado.nombres} ${ev.empleado.apellidos}` : 'N/A';
      const score = Number(ev.punteoTotal || 0);
      const scoreColor = score >= 80 ? '#10b981' : (score >= 60 ? '#f59e0b' : '#ef4444');

      rowsHtml += `
        <tr>
          <td><strong>#${ev.id}</strong></td>
          <td>${docente}</td>
          <td>${ev.nombreModulo || '-'}</td>
          <td>${ev.noPrograma || '-'}</td>
          <td>${ev.lugar || '-'}</td>
          <td style="text-align: center; font-weight: bold; color: ${scoreColor};">${score} / 100</td>
          <td>${ev.fechaFin || ev.fechaInicio || '-'}</td>
        </tr>
      `;
    });

    const bodyHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <thead>
          <tr style="background-color: #002f6c; color: white;">
            <th style="padding: 7px; border: 1px solid #ccc;">ID</th>
            <th style="padding: 7px; border: 1px solid #ccc;">Docente / Instructor</th>
            <th style="padding: 7px; border: 1px solid #ccc;">Módulo Formativo</th>
            <th style="padding: 7px; border: 1px solid #ccc;">No. Programa</th>
            <th style="padding: 7px; border: 1px solid #ccc;">Sede / Lugar</th>
            <th style="padding: 7px; border: 1px solid #ccc; text-align: center;">Punteo Total</th>
            <th style="padding: 7px; border: 1px solid #ccc;">Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

    printHtmlReport('REPORTE GENERAL DE EVALUACIONES DE CONTROL DE CALIDAD', bodyHtml);
  }
}
