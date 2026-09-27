import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Carrera, Curso, Jornada, Empleado } from '../../core/models';
import { PageHeaderComponent, ModalComponent, EmptyStateComponent } from '../../shared';

@Component({
  selector: 'app-academico',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent, EmptyStateComponent],
  templateUrl: './academico.component.html',
  styleUrl: './academico.component.scss',
})
export class AcademicoComponent implements OnInit {
  private apiService = inject(ApiService);

  carreras = signal<Carrera[]>([]);
  cursos = signal<Curso[]>([]);
  jornadas = signal<Jornada[]>([]);
  empleados = signal<Empleado[]>([]);
  activeModal = signal<'carrera' | 'curso' | 'jornada' | null>(null);

  // Carrera Form
  editingCarreraId: number | null = null;
  carreraName = '';
  carreraDescripcion = '';
  carreraCodigo = '';

  // Curso Form
  editingCursoId: number | null = null;
  cursoName = '';
  cursoDescripcion = '';
  selectedCarreraId: number | null = null;
  selectedEmpleadoId: number | null = null;
  cursoEsEnLinea = false;

  // Jornada Form
  editingJornadaId: number | null = null;
  jornadaName = '';
  jornadaStart = '07:30';
  jornadaEnd = '12:30';

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.apiService.getCarreras().subscribe((res) => this.carreras.set(res || []));
    this.apiService.getCursos(100, 0).subscribe((res) => this.cursos.set(res.data || []));
    this.apiService.getJornadas().subscribe((res) => this.jornadas.set(res || []));
    this.apiService.getEmpleados(100, 0).subscribe((res) => this.empleados.set(res.data || []));
  }

  modalTitle(): string {
    if (this.activeModal() === 'carrera') return this.editingCarreraId ? 'Modificar Carrera' : 'Registrar Nueva Carrera';
    if (this.activeModal() === 'curso') return this.editingCursoId ? 'Modificar Curso' : 'Registrar Nuevo Curso';
    if (this.activeModal() === 'jornada') return this.editingJornadaId ? 'Modificar Jornada' : 'Registrar Nueva Jornada';
    return '';
  }

  openCarreraModal(carrera?: Carrera): void { 
    if (carrera) {
      this.editingCarreraId = carrera.id;
      this.carreraName = carrera.nombre;
      this.carreraDescripcion = carrera.descripcion || '';
      this.carreraCodigo = carrera.codigo || '';
    } else {
      this.editingCarreraId = null;
      this.carreraName = '';
      this.carreraDescripcion = '';
      this.carreraCodigo = '';
    }
    this.activeModal.set('carrera'); 
  }

  openCursoModal(curso?: Curso): void {
    if (curso) {
      this.editingCursoId = curso.id;
      this.cursoName = curso.nombre;
      this.cursoDescripcion = curso.descripcion || '';
      this.selectedCarreraId = curso.carreraId || (curso.carrera ? curso.carrera.id : null);
      this.selectedEmpleadoId = curso.empleadoId || (curso.empleado ? curso.empleado.id : null);
      this.cursoEsEnLinea = !!curso.esEnLinea;
    } else {
      this.editingCursoId = null;
      this.cursoName = '';
      this.cursoDescripcion = '';
      this.selectedCarreraId = null;
      this.selectedEmpleadoId = null;
      this.cursoEsEnLinea = false;
    }
    this.activeModal.set('curso');
  }

  openJornadaModal(jornada?: Jornada): void { 
    if (jornada) {
      this.editingJornadaId = jornada.id;
      this.jornadaName = jornada.nombre;
      this.jornadaStart = jornada.horainicio || jornada.horaInicio || '07:30';
      this.jornadaEnd = jornada.horafin || jornada.horaFin || '12:30';
    } else {
      this.editingJornadaId = null;
      this.jornadaName = '';
      this.jornadaStart = '07:30';
      this.jornadaEnd = '12:30';
    }
    this.activeModal.set('jornada'); 
  }

  closeModal(): void { 
    this.activeModal.set(null); 
    this.editingCarreraId = null;
    this.editingCursoId = null;
    this.editingJornadaId = null;
  }

  saveCarrera(): void {
    if (!this.carreraName) return;
    const payload: Partial<Carrera> = {
      nombre: this.carreraName,
      descripcion: this.carreraDescripcion || undefined,
      codigo: this.carreraCodigo || undefined,
    };

    if (this.editingCarreraId) {
      this.apiService.updateCarrera(this.editingCarreraId, payload).subscribe(() => {
        this.closeModal();
        this.loadAll();
      });
    } else {
      this.apiService.createCarrera(payload).subscribe(() => {
        this.closeModal();
        this.loadAll();
      });
    }
  }

  deleteCarrera(carrera: Carrera): void {
    if (confirm(`¿Está seguro de eliminar la carrera técnica "${carrera.nombre}"?`)) {
      this.apiService.deleteCarrera(carrera.id).subscribe(() => {
        this.loadAll();
      });
    }
  }

  saveCurso(): void {
    if (!this.cursoName) return;
    const payload: Partial<Curso> = {
      nombre: this.cursoName,
      descripcion: this.cursoDescripcion || undefined,
      carreraId: this.selectedCarreraId || undefined,
      empleadoId: this.selectedEmpleadoId || undefined,
      esEnLinea: this.cursoEsEnLinea,
    };

    if (this.editingCursoId) {
      this.apiService.updateCurso(this.editingCursoId, payload).subscribe(() => {
        this.closeModal();
        this.loadAll();
      });
    } else {
      this.apiService.createCurso(payload).subscribe(() => {
        this.closeModal();
        this.loadAll();
      });
    }
  }

  deleteCurso(cur: Curso): void {
    if (confirm(`¿Está seguro de eliminar el curso "${cur.nombre}"?`)) {
      this.apiService.deleteCurso(cur.id).subscribe(() => {
        this.loadAll();
      });
    }
  }

  saveJornada(): void {
    if (!this.jornadaName) return;
    const payload: Partial<Jornada> = {
      nombre: this.jornadaName,
      horainicio: this.jornadaStart,
      horafin: this.jornadaEnd,
      horaInicio: this.jornadaStart,
      horaFin: this.jornadaEnd,
    };

    if (this.editingJornadaId) {
      this.apiService.updateJornada(this.editingJornadaId, payload).subscribe(() => {
        this.closeModal();
        this.loadAll();
      });
    } else {
      this.apiService.createJornada(payload).subscribe(() => {
        this.closeModal();
        this.loadAll();
      });
    }
  }

  deleteJornada(jornada: Jornada): void {
    if (confirm(`¿Está seguro de eliminar la jornada "${jornada.nombre}"?`)) {
      this.apiService.deleteJornada(jornada.id).subscribe(() => {
        this.loadAll();
      });
    }
  }
}
