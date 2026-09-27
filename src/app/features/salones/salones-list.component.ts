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

@Component({
  selector: 'app-salones-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="salones-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="badge-tag">SISTEMA INTEGRAL DE ESPACIOS, JORNADAS Y HORARIOS</div>
          <h1>Gestión de Salones, Talleres y Jornadas</h1>
          <p class="subtitle">
            Supervisión en tiempo real, matriz semanal de horarios (AdminSalones), asignación de cursos y catálogo de jornadas.
          </p>
        </div>
        <div class="header-actions">
          @if (activeView() === 'catalogo') {
            <button (click)="openCreateModal()" class="btn btn-gold">
              <svg class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Espacio
            </button>
          } @else if (activeView() === 'jornadas') {
            <button (click)="openCreateJornadaModal()" class="btn btn-gold">
              <svg class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Nueva Jornada
            </button>
          } @else if (activeView() === 'matriz') {
            <button (click)="printMatriz()" class="btn btn-primary">
              <svg class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              🖨️ Imprimir Reporte
            </button>
          }
        </div>
      </div>

      <!-- Navigation Modes (Tabs) -->
      <div class="view-tabs">
        <button
          class="view-tab-btn"
          [class.active]="activeView() === 'realtime'"
          (click)="switchView('realtime')"
        >
          <span class="live-dot"></span>
          ⚡ Disponibilidad en Tiempo Real
        </button>
        <button
          class="view-tab-btn"
          [class.active]="activeView() === 'matriz'"
          (click)="switchView('matriz')"
        >
          📊 Reporte Matriz Semanal (AdminSalones)
        </button>
        <button
          class="view-tab-btn"
          [class.active]="activeView() === 'catalogo'"
          (click)="switchView('catalogo')"
        >
          🏛️ Catálogo de Salones y Talleres ({{ salones().length }})
        </button>
        <button
          class="view-tab-btn"
          [class.active]="activeView() === 'jornadas'"
          (click)="switchView('jornadas')"
        >
          ⏰ Catálogo de Jornadas ({{ jornadasList().length }})
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- VISTA 1: DISPONIBILIDAD EN TIEMPO REAL (RealTime/reporte & reporte_talleres) -->
      <!-- ========================================================================= -->
      @if (activeView() === 'realtime') {
        <div class="realtime-section">
          <!-- Realtime Toolbar & Day Selector -->
          <div class="card toolbar-card">
            <div class="realtime-toolbar">
              <div class="day-selector-group">
                <span class="toolbar-label">📅 Día Consultado:</span>
                <div class="day-chips">
                  @for (d of diasSemana; track d) {
                    <button
                      class="day-chip"
                      [class.active]="selectedDia() === d"
                      (click)="changeRealtimeDia(d)"
                    >
                      {{ d }}
                    </button>
                  }
                </div>
              </div>

              <div class="type-filter-group">
                <span class="toolbar-label">Filtrar:</span>
                <button
                  class="filter-chip"
                  [class.active]="realtimeTipo() === undefined"
                  (click)="changeRealtimeTipo(undefined)"
                >
                  Todos
                </button>
                <button
                  class="filter-chip chip-talleres"
                  [class.active]="realtimeTipo() === 0"
                  (click)="changeRealtimeTipo(0)"
                >
                  ⚡ Solo Talleres
                </button>
                <button
                  class="filter-chip chip-salones"
                  [class.active]="realtimeTipo() === 1"
                  (click)="changeRealtimeTipo(1)"
                >
                  🏛️ Solo Salones
                </button>
              </div>
            </div>
          </div>

          <!-- Realtime KPI Summary -->
          @if (realtimeData()) {
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon bg-blue">🏛️</div>
                <div class="stat-info">
                  <span class="stat-label">Total de Espacios</span>
                  <span class="stat-value">{{ realtimeData()?.estadisticas?.total || 0 }}</span>
                  <span class="stat-sub">{{ selectedDia() }}</span>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon bg-green">✓</div>
                <div class="stat-info">
                  <span class="stat-label">Disponibles Ahora</span>
                  <span class="stat-value text-green">{{ realtimeData()?.estadisticas?.disponiblesAhora || 0 }}</span>
                  <span class="stat-sub">Listos para asignación</span>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon bg-amber">⚡</div>
                <div class="stat-info">
                  <span class="stat-label">Ocupados / Con Curso</span>
                  <span class="stat-value text-amber">{{ realtimeData()?.estadisticas?.ocupadosAhora || 0 }}</span>
                  <span class="stat-sub">En sesión académica</span>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon bg-gold">📊</div>
                <div class="stat-info">
                  <span class="stat-label">% Ocupación</span>
                  <span class="stat-value text-gold">{{ realtimeData()?.estadisticas?.porcentajeOcupacion || 0 }}%</span>
                  <span class="stat-sub">Capacidad del día</span>
                </div>
              </div>
            </div>
          }

          <!-- Realtime Cards Grid -->
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Consultando disponibilidad en tiempo real vía WebSockets...</p>
            </div>
          } @else if (!realtimeData() || realtimeData()?.data?.length === 0) {
            <div class="card empty-card">
              <div class="empty-icon">🏛️</div>
              <h3>No se encontraron registros de disponibilidad</h3>
              <p>No hay espacios registrados para el filtro seleccionado.</p>
            </div>
          } @else {
            <div class="realtime-cards-grid">
              @for (item of realtimeData()?.data; track item.id) {
                <div class="card realtime-card">
                  <div class="card-header-row">
                    <div class="room-icon-box" [style.background-color]="item.tipoSalon === 1 ? '#002F6C' : '#E5A50B'">
                      {{ item.tipoSalon === 1 ? '🏛️' : '⚡' }}
                    </div>
                    <div>
                      <h3 class="room-title">{{ item.title }}</h3>
                      <span class="room-type-tag" [class.is-taller]="item.tipoSalon === 0">
                        {{ item.tipoSalon === 1 ? 'Salón Teórico' : 'Taller Técnico' }} • {{ item.cantidadPersonas }} personas
                      </span>
                    </div>
                  </div>

                  <!-- Shifts Breakdown -->
                  <div class="shifts-list">
                    <div class="shift-item" [class.is-occupied]="item.turnos.manana.ocupado">
                      <div class="shift-header">
                        <span class="shift-name">🌅 Mañana (07:30 - 12:30)</span>
                        <span class="shift-status-badge" [class.badge-occ]="item.turnos.manana.ocupado">
                          {{ item.turnos.manana.ocupado ? 'Ocupado' : 'Disponible' }}
                        </span>
                      </div>
                      <div class="shift-course">
                        {{ item.turnos.manana.curso || 'Espacio libre' }}
                      </div>
                    </div>

                    <div class="shift-item" [class.is-occupied]="item.turnos.tarde.ocupado">
                      <div class="shift-header">
                        <span class="shift-name">☀️ Tarde (13:00 - 17:30)</span>
                        <span class="shift-status-badge" [class.badge-occ]="item.turnos.tarde.ocupado">
                          {{ item.turnos.tarde.ocupado ? 'Ocupado' : 'Disponible' }}
                        </span>
                      </div>
                      <div class="shift-course">
                        {{ item.turnos.tarde.curso || 'Espacio libre' }}
                      </div>
                    </div>

                    <div class="shift-item" [class.is-occupied]="item.turnos.noche.ocupado">
                      <div class="shift-header">
                        <span class="shift-name">🌙 Noche (18:00 - 21:30)</span>
                        <span class="shift-status-badge" [class.badge-occ]="item.turnos.noche.ocupado">
                          {{ item.turnos.noche.ocupado ? 'Ocupado' : 'Disponible' }}
                        </span>
                      </div>
                      <div class="shift-course">
                        {{ item.turnos.noche.curso || 'Espacio libre' }}
                      </div>
                    </div>
                  </div>

                  <div class="card-footer-action">
                    <button (click)="openQuickEditHorario(item.id, item.title)" class="btn btn-secondary btn-sm w-100">
                      ✏️ Asignar Cursos por Día
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ========================================================================= -->
      <!-- VISTA 2: MATRIZ SEMANAL DE HORARIOS (AdminSalones/reporte & reporteTalleres) -->
      <!-- ========================================================================= -->
      @if (activeView() === 'matriz') {
        <div class="matriz-section">
          <div class="card main-table-card">
            <div class="toolbar">
              <div class="search-box">
                <svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  class="form-control search-input"
                  placeholder="Buscar taller o salón por nombre..."
                  [(ngModel)]="matrizSearch"
                  (ngModelChange)="loadMatriz()"
                />
              </div>

              <div class="filter-group">
                <button
                  class="filter-chip chip-talleres"
                  [class.active]="matrizTipo() === 0"
                  (click)="changeMatrizTipo(0)"
                >
                  ⚡ Talleres de INTECAP
                </button>
                <button
                  class="filter-chip chip-salones"
                  [class.active]="matrizTipo() === 1"
                  (click)="changeMatrizTipo(1)"
                >
                  🏛️ Salones Teóricos
                </button>
                <button
                  class="filter-chip"
                  [class.active]="matrizTipo() === undefined"
                  (click)="changeMatrizTipo(undefined)"
                >
                  Todos los Espacios
                </button>
              </div>
            </div>

            @if (loading()) {
              <div class="loading-state">
                <div class="spinner"></div>
                <p>Cargando matriz semanal de horarios...</p>
              </div>
            } @else if (matrizData().length === 0) {
              <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>No se encontraron espacios en la matriz</h3>
                <p>Intenta con otro término de búsqueda o registra nuevos espacios.</p>
              </div>
            } @else {
              <div class="table-responsive" id="print-area">
                <table class="matrix-table">
                  <thead>
                    <tr>
                      <th class="th-room">Salón / Taller</th>
                      <th class="th-shift">Jornada</th>
                      <th class="th-day">Lunes</th>
                      <th class="th-day">Martes</th>
                      <th class="th-day">Miércoles</th>
                      <th class="th-day">Jueves</th>
                      <th class="th-day">Viernes</th>
                      <th class="th-day">Sábado</th>
                      <th class="th-day">Domingo</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of matrizData(); track row.salon.id) {
                      <tr class="row-manana">
                        <td rowspan="3" class="room-title-cell">
                          <div class="matrix-room-title">{{ row.salon.title }}</div>
                          <span class="matrix-room-badge" [class.is-taller]="row.salon.tipoSalon === 0">
                            {{ row.salon.tipoSalon === 1 ? 'Salón' : 'Taller' }} ({{ row.salon.cantidadPersonas }} p.)
                          </span>
                          <button (click)="openQuickEditHorario(row.salon.id, row.salon.title)" class="btn-assign-row" title="Gestionar Horario">
                            ✏️ Asignar Cursos
                          </button>
                        </td>
                        <td class="shift-label-cell shift-m">🌅 Mañana</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.lunes.manana" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 1)" title="Editar Lunes">{{ row.dias.lunes.manana || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.martes.manana" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 2)" title="Editar Martes">{{ row.dias.martes.manana || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.miercoles.manana" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 3)" title="Editar Miércoles">{{ row.dias.miercoles.manana || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.jueves.manana" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 4)" title="Editar Jueves">{{ row.dias.jueves.manana || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.viernes.manana" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 5)" title="Editar Viernes">{{ row.dias.viernes.manana || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.sabado.manana" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 6)" title="Editar Sábado">{{ row.dias.sabado.manana || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.domingo.manana" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 7)" title="Editar Domingo">{{ row.dias.domingo.manana || '-' }}</td>
                      </tr>

                      <tr class="row-tarde">
                        <td class="shift-label-cell shift-t">☀️ Tarde</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.lunes.tarde" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 1)" title="Editar Lunes">{{ row.dias.lunes.tarde || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.martes.tarde" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 2)" title="Editar Martes">{{ row.dias.martes.tarde || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.miercoles.tarde" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 3)" title="Editar Miércoles">{{ row.dias.miercoles.tarde || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.jueves.tarde" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 4)" title="Editar Jueves">{{ row.dias.jueves.tarde || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.viernes.tarde" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 5)" title="Editar Viernes">{{ row.dias.viernes.tarde || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.sabado.tarde" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 6)" title="Editar Sábado">{{ row.dias.sabado.tarde || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.domingo.tarde" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 7)" title="Editar Domingo">{{ row.dias.domingo.tarde || '-' }}</td>
                      </tr>

                      <tr class="row-noche">
                        <td class="shift-label-cell shift-n">🌙 Noche</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.lunes.noche" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 1)" title="Editar Lunes">{{ row.dias.lunes.noche || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.martes.noche" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 2)" title="Editar Martes">{{ row.dias.martes.noche || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.miercoles.noche" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 3)" title="Editar Miércoles">{{ row.dias.miercoles.noche || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.jueves.noche" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 4)" title="Editar Jueves">{{ row.dias.jueves.noche || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.viernes.noche" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 5)" title="Editar Viernes">{{ row.dias.viernes.noche || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.sabado.noche" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 6)" title="Editar Sábado">{{ row.dias.sabado.noche || '-' }}</td>
                        <td class="course-cell clickable" [class.occupied]="row.dias.domingo.noche" (click)="openQuickEditHorario(row.salon.id, row.salon.title, 7)" title="Editar Domingo">{{ row.dias.domingo.noche || '-' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- VISTA 3: CATÁLOGO DE SALONES Y TALLERES -->
      <!-- ========================================================================= -->
      @if (activeView() === 'catalogo') {
        <div class="catalogo-section">
          <div class="filter-tabs">
            <button [class.active]="catalogoFilter() === 'all'" (click)="catalogoFilter.set('all')" class="tab-btn">
              Todos los Espacios ({{ salones().length }})
            </button>
            <button [class.active]="catalogoFilter() === 'salones'" (click)="catalogoFilter.set('salones')" class="tab-btn">
              🏛️ Salones Teóricos
            </button>
            <button [class.active]="catalogoFilter() === 'talleres'" (click)="catalogoFilter.set('talleres')" class="tab-btn">
              ⚡ Talleres Prácticos
            </button>
          </div>

          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Cargando catálogo de espacios...</p>
            </div>
          } @else if (filteredSalones().length === 0) {
            <div class="card empty-card">
              <div class="empty-icon">🏛️</div>
              <h3>No se encontraron salones ni talleres</h3>
              <p>Comienza registrando el primer espacio con el botón superior.</p>
              <button (click)="openCreateModal()" class="btn btn-primary btn-sm">Registrar Espacio</button>
            </div>
          } @else {
            <div class="salones-grid">
              @for (s of filteredSalones(); track s.id) {
                <div class="card salon-card">
                  <div class="card-top">
                    <span class="badge" [class.badge-primary]="s.tipoSalon === 1" [class.badge-gold]="s.tipoSalon === 0">
                      {{ s.tipoSalon === 1 ? 'Salón Teórico' : 'Taller Técnico' }}
                    </span>
                    <span class="badge" [class.badge-success]="s.disponibilidad === 1" [class.badge-danger]="s.disponibilidad === 0">
                      {{ s.disponibilidad === 1 ? '● Habilitado' : '● Inactivo' }}
                    </span>
                  </div>

                  <h3 class="salon-title">{{ s.title }}</h3>

                  <div class="meta-row">
                    <span class="meta-item">
                      👥 Capacidad: <strong>{{ s.cantidadPersonas || 25 }} alumnos</strong>
                    </span>
                    <span class="meta-item">
                      ⏰ Jornada: <strong>{{ s.jornada?.nombre || 'Matutina' }}</strong>
                    </span>
                    @if (s.curso) {
                      <span class="meta-item">
                        📚 Curso: <strong>{{ s.curso.nombre }}</strong>
                      </span>
                    }
                    @if (s.empleado) {
                      <span class="meta-item">
                        👨‍🏫 Instructor: <strong>{{ s.empleado.nombres }} {{ s.empleado.apellidos }}</strong>
                      </span>
                    }
                  </div>

                  <div class="card-actions-row">
                    <button (click)="openQuickEditHorario(s.id, s.title)" class="btn btn-primary btn-sm">
                      📅 Matriz Semanal
                    </button>
                    <button (click)="openEditModal(s)" class="btn btn-secondary btn-sm">
                      ✏️ Editar
                    </button>
                    <button (click)="deleteSalon(s.id)" class="btn btn-danger btn-sm">
                      🗑️
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ========================================================================= -->
      <!-- VISTA 4: CATÁLOGO DE JORNADAS -->
      <!-- ========================================================================= -->
      @if (activeView() === 'jornadas') {
        <div class="jornadas-section">
          <div class="jornadas-grid">
            @for (j of jornadasList(); track j.id) {
              <div class="card jornada-card">
                <div class="jornada-icon-box">⏰</div>
                <div class="jornada-info">
                  <h3 class="jornada-name">{{ j.nombre }}</h3>
                  <p class="jornada-time">
                    Horario Oficial: <strong>{{ j.horaInicio || j.horainicio || '07:30' }} - {{ j.horaFin || j.horafin || '12:30' }}</strong>
                  </p>
                  <span class="badge badge-success">Activa</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL ASIGNAR HORARIO CON CATÁLOGO DE CURSOS -->
      <!-- ========================================================================= -->
      @if (showHorarioModal()) {
        <div class="modal-overlay" (click)="closeHorarioModal()">
          <div class="modal-dialog modal-md" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <span class="badge badge-gold">Asignación de Cursos por Turno</span>
                <h2>{{ activeHorarioEdit.salonTitle }}</h2>
              </div>
              <button (click)="closeHorarioModal()" class="close-btn">&times;</button>
            </div>

            <form (ngSubmit)="saveHorarioAssignment()" class="modal-body">
              <div class="form-group">
                <label>Día de la Semana *</label>
                <select
                  class="form-control"
                  [(ngModel)]="activeHorarioEdit.diaId"
                  (ngModelChange)="onDiaChange($event)"
                  name="diaId"
                  required
                >
                  <option [ngValue]="1">Lunes</option>
                  <option [ngValue]="2">Martes</option>
                  <option [ngValue]="3">Miércoles</option>
                  <option [ngValue]="4">Jueves</option>
                  <option [ngValue]="5">Viernes</option>
                  <option [ngValue]="6">Sábado</option>
                  <option [ngValue]="7">Domingo</option>
                </select>
              </div>

              <!-- Selector de Cursos para Mañana -->
              <div class="form-group">
                <label>🌅 Turno Mañana (07:30 - 12:30) - Seleccionar Curso</label>
                <select class="form-control" [(ngModel)]="activeHorarioEdit.cursoManana" name="cursoManana">
                  <option value="">-- Libre / Disponible --</option>
                  @for (c of cursosList(); track c.id) {
                    <option [value]="c.nombre">{{ c.nombre }}</option>
                  }
                </select>
              </div>

              <!-- Selector de Cursos para Tarde -->
              <div class="form-group">
                <label>☀️ Turno Tarde (13:00 - 17:30) - Seleccionar Curso</label>
                <select class="form-control" [(ngModel)]="activeHorarioEdit.cursoTarde" name="cursoTarde">
                  <option value="">-- Libre / Disponible --</option>
                  @for (c of cursosList(); track c.id) {
                    <option [value]="c.nombre">{{ c.nombre }}</option>
                  }
                </select>
              </div>

              <!-- Selector de Cursos para Noche -->
              <div class="form-group">
                <label>🌙 Turno Noche (18:00 - 21:30) - Seleccionar Curso</label>
                <select class="form-control" [(ngModel)]="activeHorarioEdit.cursoNoche" name="cursoNoche">
                  <option value="">-- Libre / Disponible --</option>
                  @for (c of cursosList(); track c.id) {
                    <option [value]="c.nombre">{{ c.nombre }}</option>
                  }
                </select>
              </div>

              <div class="modal-footer">
                <button type="button" (click)="closeHorarioModal()" class="btn btn-secondary">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving()">
                  {{ saving() ? 'Guardando...' : 'Guardar Asignación' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL CREAR / EDITAR ESPACIO CON CATÁLOGOS INTEGRADOS -->
      <!-- ========================================================================= -->
      @if (showSalonModal()) {
        <div class="modal-overlay" (click)="closeSalonModal()">
          <div class="modal-dialog modal-md" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <span class="badge badge-primary">{{ isEditingSalon() ? 'Modificar' : 'Nuevo' }}</span>
                <h2>{{ isEditingSalon() ? 'Editar Espacio #' + activeSalon.id : 'Registrar Nuevo Salón o Taller' }}</h2>
              </div>
              <button (click)="closeSalonModal()" class="close-btn">&times;</button>
            </div>

            <form (ngSubmit)="saveSalon()" class="modal-body">
              <div class="form-group">
                <label>Nombre del Salón o Taller *</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Ej: Taller de Electricidad Industrial T-1"
                  [(ngModel)]="activeSalon.title"
                  name="title"
                  required
                />
              </div>

              <div class="form-row">
                <div class="form-group col-6">
                  <label>Tipo de Espacio *</label>
                  <select class="form-control" [(ngModel)]="activeSalon.tipoSalon" name="tipoSalon" required>
                    <option [ngValue]="1">🏛️ Salón Teórico / Aula</option>
                    <option [ngValue]="0">⚡ Taller Práctico Técnico</option>
                  </select>
                </div>
                <div class="form-group col-6">
                  <label>Capacidad (Personas) *</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="activeSalon.cantidadPersonas"
                    name="cantidadPersonas"
                    min="1"
                    max="100"
                    required
                  />
                </div>
              </div>

              <!-- Catálogo de Jornadas -->
              <div class="form-group">
                <label>Jornada Principal *</label>
                <select class="form-control" [(ngModel)]="activeSalon.jornadaId" name="jornadaId">
                  <option [ngValue]="undefined">-- Seleccionar Jornada --</option>
                  @for (j of jornadasList(); track j.id) {
                    <option [ngValue]="j.id">{{ j.nombre }} ({{ j.horaInicio || j.horainicio || '07:30' }} - {{ j.horaFin || j.horafin || '12:30' }})</option>
                  }
                </select>
              </div>

              <!-- Catálogo de Cursos -->
              <div class="form-group">
                <label>Curso Asignado por Defecto</label>
                <select class="form-control" [(ngModel)]="activeSalon.cursoId" name="cursoId">
                  <option [ngValue]="undefined">-- Ninguno / Sin Asignar --</option>
                  @for (c of cursosList(); track c.id) {
                    <option [ngValue]="c.id">{{ c.nombre }}</option>
                  }
                </select>
              </div>

              <!-- Catálogo de Docentes / Instructores -->
              <div class="form-group">
                <label>Docente / Instructor Responsable</label>
                <select class="form-control" [(ngModel)]="activeSalon.empleadoId" name="empleadoId">
                  <option [ngValue]="undefined">-- Sin Instructor Asignado --</option>
                  @for (e of empleadosList(); track e.id) {
                    <option [ngValue]="e.id">{{ e.nombres }} {{ e.apellidos }} ({{ e.profesion || 'Docente' }})</option>
                  }
                </select>
              </div>

              <div class="modal-footer">
                <button type="button" (click)="closeSalonModal()" class="btn btn-secondary">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving()">
                  {{ saving() ? 'Guardando...' : 'Guardar Espacio' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL CREAR JORNADA -->
      <!-- ========================================================================= -->
      @if (showJornadaModal()) {
        <div class="modal-overlay" (click)="showJornadaModal.set(false)">
          <div class="modal-dialog modal-md" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <span class="badge badge-primary">Nueva Jornada</span>
                <h2>Registrar Horario / Jornada</h2>
              </div>
              <button (click)="showJornadaModal.set(false)" class="close-btn">&times;</button>
            </div>

            <form (ngSubmit)="saveJornada()" class="modal-body">
              <div class="form-group">
                <label>Nombre de la Jornada *</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Ej: Matutina, Vespertina, Fin de Semana"
                  [(ngModel)]="newJornada.nombre"
                  name="nombre"
                  required
                />
              </div>

              <div class="form-row">
                <div class="form-group col-6">
                  <label>Hora Inicio *</label>
                  <input
                    type="time"
                    class="form-control"
                    [(ngModel)]="newJornada.horaInicio"
                    name="horaInicio"
                    required
                  />
                </div>
                <div class="form-group col-6">
                  <label>Hora Fin *</label>
                  <input
                    type="time"
                    class="form-control"
                    [(ngModel)]="newJornada.horaFin"
                    name="horaFin"
                    required
                  />
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" (click)="showJornadaModal.set(false)" class="btn btn-secondary">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving()">
                  {{ saving() ? 'Guardando...' : 'Guardar Jornada' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .salones-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .badge-tag {
      font-size: 0.75rem;
      font-weight: 700;
      color: #e5a823;
      letter-spacing: 1px;
      margin-bottom: 0.25rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .page-header h1 {
      font-size: 1.875rem;
      font-weight: 800;
      color: #0d2d5e;
      margin: 0;
    }

    .subtitle {
      color: #64748b;
      margin-top: 0.25rem;
      font-size: 0.95rem;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .view-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.5rem;
      overflow-x: auto;
    }

    .view-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      border: 1px solid transparent;
      background: none;
      font-size: 0.9rem;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      &:hover {
        background: #f1f5f9;
        color: #0f172a;
      }

      &.active {
        background: #0d2d5e;
        color: #ffffff;
      }
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #22c55e;
      box-shadow: 0 0 8px #22c55e;
    }

    .toolbar-card {
      background: #ffffff;
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 1rem;
    }

    .realtime-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .toolbar-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #334155;
      margin-right: 0.5rem;
    }

    .day-selector-group, .type-filter-group {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    .day-chip, .filter-chip {
      padding: 0.45rem 0.9rem;
      border-radius: 20px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      font-size: 0.82rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;

      &:hover { background: #e2e8f0; }
      &.active {
        background: #0d2d5e;
        color: #ffffff;
        border-color: #0d2d5e;
      }
    }

    .filter-chip.chip-talleres.active { background: #d97706; border-color: #d97706; }
    .filter-chip.chip-salones.active { background: #0284c7; border-color: #0284c7; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .bg-blue { background: #e0f2fe; color: #0284c7; }
    .bg-green { background: #dcfce7; color: #16a34a; }
    .bg-amber { background: #fef3c7; color: #d97706; }
    .bg-gold { background: #fef9c3; color: #ca8a04; }

    .stat-info { display: flex; flex-direction: column; }
    .stat-label { font-size: 0.8rem; font-weight: 600; color: #64748b; }
    .stat-value { font-size: 1.5rem; font-weight: 800; color: #0f172a; }
    .stat-sub { font-size: 0.75rem; color: #94a3b8; }
    .text-green { color: #16a34a; }
    .text-amber { color: #d97706; }
    .text-gold { color: #ca8a04; }

    .realtime-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }

    .realtime-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1rem;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.06);
      }
    }

    .card-header-row {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .room-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: #ffffff;
      flex-shrink: 0;
    }

    .room-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0d2d5e;
      margin: 0;
    }

    .room-type-tag {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      &.is-taller { color: #d97706; }
    }

    .shifts-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .shift-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.6rem 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      &.is-occupied {
        background: #fffbeb;
        border-color: #fde68a;
      }
    }

    .shift-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .shift-name {
      font-size: 0.78rem;
      font-weight: 700;
      color: #475569;
    }

    .shift-status-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      background: #dcfce7;
      color: #15803d;

      &.badge-occ {
        background: #fee2e2;
        color: #b91c1c;
      }
    }

    .shift-course {
      font-size: 0.82rem;
      font-weight: 600;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .matrix-table {
      width: 100%;
      min-width: 1200px;
      border-collapse: collapse;
      font-size: 0.82rem;

      th, td {
        border: 1px solid #cbd5e1;
        padding: 0.6rem 0.75rem;
        vertical-align: middle;
      }

      th {
        background: #0d2d5e;
        color: #ffffff;
        font-weight: 700;
        text-align: center;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.5px;
      }

      .th-room { width: 220px; text-align: left; }
      .th-shift { width: 100px; }
      .th-day { min-width: 130px; }
    }

    .room-title-cell {
      background: #f8fafc;
      font-weight: 800;
      color: #0d2d5e;
      vertical-align: top;
      padding: 0.85rem;
    }

    .matrix-room-title {
      font-size: 0.95rem;
      font-weight: 800;
      margin-bottom: 0.25rem;
    }

    .matrix-room-badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      background: #e0f2fe;
      color: #0284c7;
      margin-bottom: 0.5rem;

      &.is-taller { background: #fef3c7; color: #92400e; }
    }

    .btn-assign-row {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
      cursor: pointer;
      margin-top: 0.5rem;

      &:hover { background: #0d2d5e; color: #ffffff; }
    }

    .shift-label-cell {
      font-weight: 700;
      font-size: 0.78rem;
      text-align: center;
      background: #f1f5f9;
      white-space: nowrap;
    }

    .course-cell {
      text-align: center;
      font-weight: 500;
      color: #64748b;
      background: #ffffff;

      &.occupied {
        font-weight: 700;
        color: #0d2d5e;
        background: #f0fdf4;
      }
    }

    .filter-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .tab-btn {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;

      &.active {
        background: #0d2d5e;
        color: #ffffff;
        border-color: #0d2d5e;
      }
    }

    .salones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    .salon-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .salon-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0d2d5e;
      margin: 0;
    }

    .meta-row {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.82rem;
      color: #64748b;
    }

    .card-actions-row {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    /* Jornadas Section */
    .jornadas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.25rem;
    }

    .jornada-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }

    .jornada-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      background: #eff6ff;
      color: #1d4ed8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .jornada-name {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0d2d5e;
      margin: 0;
    }

    .jornada-time {
      font-size: 0.82rem;
      color: #64748b;
      margin: 0.2rem 0 0.4rem 0;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-dialog {
      background: #ffffff;
      border-radius: 16px;
      width: 100%;
      max-width: 560px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      font-size: 1.2rem;
      font-weight: 800;
      color: #0d2d5e;
      margin: 0.25rem 0 0 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      padding-top: 1rem;
      margin-top: 1rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .col-6 { flex: 1; }

    .loading-state, .empty-state, .empty-card {
      text-align: center;
      padding: 3rem 1.5rem;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #0d2d5e;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-icon { font-size: 3rem; margin-bottom: 0.75rem; }

    @media print {
      body * { visibility: hidden; }
      #print-area, #print-area * { visibility: visible; }
      #print-area { position: absolute; left: 0; top: 0; width: 100%; }
    }
  `],
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
    // Si no se pasa diaId, calculamos el día actual de la semana (1 = Lunes, ..., 7 = Domingo)
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

    // Intentar buscar en matrizData existente
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
