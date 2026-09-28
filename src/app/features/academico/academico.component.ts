import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { Carrera, Curso, Jornada, Empleado } from '../../core/models';
import { PageHeaderComponent, ModalComponent, EmptyStateComponent, CustomSelectComponent, SelectOption } from '../../shared';

@Component({
  selector: 'app-academico',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ModalComponent, EmptyStateComponent, CustomSelectComponent],
  templateUrl: './academico.component.html',
  styleUrl: './academico.component.scss',
})
export class AcademicoComponent implements OnInit {
  private apiService = inject(ApiService);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmService);

  carreras = signal<Carrera[]>([]);
  cursos = signal<Curso[]>([]);
  jornadas = signal<Jornada[]>([]);
  empleados = signal<Empleado[]>([]);
  activeModal = signal<'carrera' | 'curso' | 'jornada' | null>(null);

  carrerasOptions = computed<SelectOption[]>(() => [
    { value: null, label: 'Ninguna (Curso Libre)', icon: '📚' },
    ...this.carreras().map((c) => ({
      value: c.id,
      label: c.nombre,
      subtitle: c.codigo ? `Código: ${c.codigo}` : undefined,
      icon: '🎓'
    }))
  ]);

  empleadosOptions = computed<SelectOption[]>(() => [
    { value: null, label: 'Sin Catedrático Asignado', icon: '👤' },
    ...this.empleados().map((emp) => ({
      value: emp.id,
      label: `${emp.nombres} ${emp.apellidos}`,
      subtitle: emp.profesion || 'Docente / Instructor',
      icon: '👨‍🏫',
      badge: emp.staff ? 'Personal' : undefined,
      badgeColor: 'blue' as const
    }))
  ]);

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

  async deleteCarrera(carrera: Carrera): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: '¿Eliminar Carrera Técnica?',
      message: `¿Está seguro de eliminar la carrera técnica "${carrera.nombre}"?`,
      confirmText: 'Sí, Eliminar',
      type: 'danger',
    });
    if (!confirmed) return;

    this.apiService.deleteCarrera(carrera.id).subscribe({
      next: () => {
        this.toast.info('Carrera eliminada', `La carrera "${carrera.nombre}" fue eliminada.`);
        this.loadAll();
      },
      error: (err) => this.toast.error('Error', err.error?.message || 'Error al eliminar carrera'),
    });
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
      this.apiService.updateCurso(this.editingCursoId, payload).subscribe({
        next: () => {
          this.closeModal();
          this.toast.success('Curso actualizado', 'Información del curso modificada con éxito.');
          this.loadAll();
        },
        error: (err) => this.toast.error('Error', err.error?.message || 'Error al actualizar curso'),
      });
    } else {
      this.apiService.createCurso(payload).subscribe({
        next: () => {
          this.closeModal();
          this.toast.success('Curso creado', 'Nuevo curso registrado con éxito.');
          this.loadAll();
        },
        error: (err) => this.toast.error('Error', err.error?.message || 'Error al registrar curso'),
      });
    }
  }

  async deleteCurso(cur: Curso): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: '¿Eliminar Curso / Especialidad?',
      message: `¿Está seguro de eliminar el curso "${cur.nombre}"?`,
      confirmText: 'Sí, Eliminar',
      type: 'danger',
    });
    if (!confirmed) return;

    this.apiService.deleteCurso(cur.id).subscribe({
      next: () => {
        this.toast.info('Curso eliminado', `El curso "${cur.nombre}" fue eliminado.`);
        this.loadAll();
      },
      error: (err) => this.toast.error('Error', err.error?.message || 'Error al eliminar curso'),
    });
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
      this.apiService.updateJornada(this.editingJornadaId, payload).subscribe({
        next: () => {
          this.closeModal();
          this.toast.success('Jornada actualizada', 'Horario de jornada modificado.');
          this.loadAll();
        },
        error: (err) => this.toast.error('Error', err.error?.message || 'Error al actualizar jornada'),
      });
    } else {
      this.apiService.createJornada(payload).subscribe({
        next: () => {
          this.closeModal();
          this.toast.success('Jornada creada', 'Nueva jornada registrada con éxito.');
          this.loadAll();
        },
        error: (err) => this.toast.error('Error', err.error?.message || 'Error al registrar jornada'),
      });
    }
  }

  async deleteJornada(jornada: Jornada): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: '¿Eliminar Jornada de Horario?',
      message: `¿Está seguro de eliminar la jornada "${jornada.nombre}"?`,
      confirmText: 'Sí, Eliminar',
      type: 'danger',
    });
    if (!confirmed) return;

    this.apiService.deleteJornada(jornada.id).subscribe({
      next: () => {
        this.toast.info('Jornada eliminada', `La jornada "${jornada.nombre}" fue eliminada.`);
        this.loadAll();
      },
      error: (err) => this.toast.error('Error', err.error?.message || 'Error al eliminar jornada'),
    });
  }
}
