import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ControlCalidad, Empleado, CalidadEstadisticas } from '../../core/models';
import { PageHeaderComponent, EmptyStateComponent } from '../../shared';

@Component({
  selector: 'app-calidad',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, EmptyStateComponent],
  templateUrl: './calidad.component.html',
  styleUrl: './calidad.component.scss',
})
export class CalidadComponent implements OnInit {
  private readonly api = inject(ApiService);

  currentView = signal<'list' | 'form' | 'report'>('list');
  evaluaciones = signal<ControlCalidad[]>([]);
  empleados = signal<Empleado[]>([]);
  estadisticas = signal<CalidadEstadisticas | null>(null);
  loading = signal(true);
  saving = signal(false);

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
      alert('Por favor selecciona un docente.');
      return;
    }

    this.saving.set(true);

    if (this.isEditing() && this.activeEval.id) {
      this.api.updateCalidad(this.activeEval.id, this.activeEval).subscribe({
        next: () => {
          this.saving.set(false);
          this.backToList();
          this.loadData();
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.api.createCalidad(this.activeEval).subscribe({
        next: () => {
          this.saving.set(false);
          this.backToList();
          this.loadData();
        },
        error: () => this.saving.set(false),
      });
    }
  }

  deleteEvaluacion(id: number) {
    if (!confirm(`¿Estás seguro de eliminar la evaluación #${id}?`)) return;

    this.api.deleteCalidad(id).subscribe({
      next: () => this.loadData(),
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
}
