import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ControlCalidad, Empleado, CalidadEstadisticas } from '../../core/models';

@Component({
  selector: 'app-calidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="calidad-page">
      <!-- ========================================================================= -->
      <!-- VISTA 1: LISTADO PRINCIPAL DE EVALUACIONES (DASHBOARD) -->
      <!-- ========================================================================= -->
      @if (currentView() === 'list') {
        <!-- Header -->
        <div class="page-header">
          <div>
            <div class="badge-tag">SISTEMA INTEGRAL DE CALIDAD INTECAP</div>
            <h1>Supervisión y Control de Calidad Docente</h1>
            <p class="subtitle">
              Evaluación pedagógica integral, seguimiento de procesos formativos y estándares de excelencia I.O.DT-07.
            </p>
          </div>
          <div class="header-actions">
            <button (click)="openCreateForm()" class="btn btn-gold">
              <svg class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Nueva Evaluación
            </button>
          </div>
        </div>

        <!-- KPI Stats Bar -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon bg-blue">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total Evaluaciones</span>
              <span class="stat-value">{{ estadisticas()?.total || evaluaciones().length }}</span>
              <span class="stat-sub">Fichas registradas</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon bg-green">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Conformes (≥ 95 pts)</span>
              <span class="stat-value text-green">{{ totalConformes() }}</span>
              <span class="stat-sub">{{ porcentajeConformidad() }}% de conformidad</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon bg-amber">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">No Conformes (< 95 pts)</span>
              <span class="stat-value text-amber">{{ totalNoConformes() }}</span>
              <span class="stat-sub">Requieren plan de mejora</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon bg-gold">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Promedio Institucional</span>
              <span class="stat-value text-gold">{{ promedioGeneral() }} <small>pts</small></span>
              <span class="stat-sub">Escala sobre 100</span>
            </div>
          </div>
        </div>

        <!-- Main Content Card -->
        <div class="card main-table-card">
          <!-- Search and Filters Bar -->
          <div class="toolbar">
            <div class="search-box">
              <svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                class="form-control search-input"
                placeholder="Buscar por docente, módulo, programa o sede..."
                [(ngModel)]="searchTerm"
              />
            </div>

            <div class="filter-group">
              <button
                class="filter-chip"
                [class.active]="filterStatus === 'all'"
                (click)="filterStatus = 'all'"
              >
                Todos ({{ evaluaciones().length }})
              </button>
              <button
                class="filter-chip chip-success"
                [class.active]="filterStatus === 'conforme'"
                (click)="filterStatus = 'conforme'"
              >
                ✓ Conformes (≥95)
              </button>
              <button
                class="filter-chip chip-warning"
                [class.active]="filterStatus === 'no_conforme'"
                (click)="filterStatus = 'no_conforme'"
              >
                ⚠ No Conformes (<95)
              </button>
            </div>
          </div>

          <!-- Table View -->
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Cargando registros de evaluación de calidad...</p>
            </div>
          } @else if (filteredEvaluaciones().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">⭐</div>
              <h3>No se encontraron evaluaciones registradas</h3>
              <p>Inicia el proceso de aseguramiento de calidad registrando la primera ficha docente.</p>
              <button (click)="openCreateForm()" class="btn btn-primary btn-sm">Registrar Evaluación</button>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th class="th-id">Ficha</th>
                    <th class="th-docente">Docente / Instructor</th>
                    <th class="th-modulo">Módulo & Programa</th>
                    <th class="th-sede">Sede / Lugar</th>
                    <th class="th-score text-center">1.1 Plan. <small>(/25)</small></th>
                    <th class="th-score text-center">1.2 Proc. <small>(/10)</small></th>
                    <th class="th-score text-center">1.3 Desemp. <small>(/50)</small></th>
                    <th class="th-score text-center">1.4 Transv. <small>(/15)</small></th>
                    <th class="th-total text-center">Puntaje Total</th>
                    <th class="th-status text-center">Estado</th>
                    <th class="th-actions text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of filteredEvaluaciones(); track item.id) {
                    <tr>
                      <td class="font-mono text-muted">#{{ item.id }}</td>
                      <td>
                        <div class="user-meta">
                          <div class="avatar-circle">
                            {{ item.empleado ? item.empleado.nombres.charAt(0) : 'D' }}
                          </div>
                          <div class="user-info">
                            <div class="font-bold text-navy">
                              {{ item.empleado ? item.empleado.nombres + ' ' + item.empleado.apellidos : 'Docente #' + item.empleadoId }}
                            </div>
                            <div class="text-xs text-muted">{{ item.empleado?.profesion || 'Instructor Técnico' }}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="font-semibold text-primary">{{ item.nombreModulo || 'Módulo General' }}</div>
                        <div class="text-xs text-muted">{{ item.noPrograma || 'Sin Código de Programa' }}</div>
                      </td>
                      <td>
                        <div class="text-sm">{{ item.lugar || 'Sede Central' }}</div>
                        <div class="text-xs text-muted">{{ item.fechaCreacion | date:'dd/MM/yyyy' }}</div>
                      </td>
                      <td class="text-center font-semibold">{{ item.totalPlanificacion ?? 25 }}</td>
                      <td class="text-center font-semibold">{{ item.totalProceso ?? 10 }}</td>
                      <td class="text-center font-semibold text-navy">{{ item.totalDesempeno ?? 50 }}</td>
                      <td class="text-center font-semibold">{{ item.totalAspectos ?? 15 }}</td>
                      <td class="text-center">
                        <div
                          class="score-pill"
                          [class.high]="getItemPromedio(item) >= 95"
                          [class.med]="getItemPromedio(item) >= 80 && getItemPromedio(item) < 95"
                          [class.low]="getItemPromedio(item) < 80"
                        >
                          {{ getItemPromedio(item) }} pts
                        </div>
                      </td>
                      <td class="text-center">
                        <span class="badge" [class.badge-success]="getItemPromedio(item) >= 95" [class.badge-danger]="getItemPromedio(item) < 95">
                          {{ getItemPromedio(item) >= 95 ? '✓ Conforme' : '⚠ No Conforme' }}
                        </span>
                      </td>
                      <td class="text-right">
                        <div class="action-btns">
                          <button (click)="openViewReport(item)" class="action-btn btn-view" title="Ver Ficha y Reporte">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button (click)="openEditForm(item)" class="action-btn btn-edit" title="Editar Calificaciones">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button (click)="deleteEvaluacion(item.id)" class="action-btn btn-delete" title="Eliminar Evaluación">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- ========================================================================= -->
      <!-- VISTA 2: PÁGINA COMPLETA DE EVALUACIÓN (CREAR / EDITAR) -->
      <!-- ========================================================================= -->
      @if (currentView() === 'form') {
        <div class="eval-form-page">
          <!-- Top Breadcrumb & Page Actions -->
          <div class="eval-form-header">
            <div class="eval-header-left">
              <button (click)="backToList()" class="btn-back">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver al Listado
              </button>
              <div class="eval-header-titles">
                <span class="badge badge-gold">{{ isEditing() ? 'Modificar Ficha #' + activeEval.id : 'Nueva Ficha de Evaluación' }}</span>
                <h2>{{ isEditing() ? 'Evaluación de Supervisión Docente I.O.DT-07' : 'Registro de Control de Calidad Docente' }}</h2>
                <p class="subtitle">Aseguramiento y evaluación de competencias pedagógicas, proceso formativo y 9S.</p>
              </div>
            </div>

            <!-- Sticky Live Score Widget & Quick Max Score Button -->
            <div class="eval-header-right">
              <button
                type="button"
                (click)="setAllMaxScores()"
                class="btn btn-secondary btn-sm"
                title="Asignar puntuación máxima en todas las rúbricas (100 pts)"
              >
                ⭐ Puntuación Máxima (100 pts)
              </button>

              <div class="eval-score-header-box" [class.conforme]="calculateGrandTotal() >= 95" [class.no-conforme]="calculateGrandTotal() < 95">
                <div class="score-header-val">
                  <span class="score-main-num">{{ calculateGrandTotal() }}</span>
                  <span class="score-denom">/ 100 pts</span>
                </div>
                <div class="score-header-badge">
                  {{ calculateGrandTotal() >= 95 ? '✓ CONFORME' : '⚠ NO CONFORME' }}
                </div>
                <button type="button" (click)="saveEvaluacion()" class="btn btn-primary btn-save-quick" [disabled]="saving()">
                  {{ saving() ? 'Guardando...' : '💾 Guardar Ficha' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Stepper Navigation Bar -->
          <div class="form-stepper-card">
            <div class="form-stepper-tabs">
              <button [class.active]="activeTab === 'general'" (click)="activeTab = 'general'" class="step-btn">
                <span class="step-num">1</span>
                <div class="step-text">
                  <span class="step-title">Info General</span>
                  <span class="step-sub">Docente y Evento</span>
                </div>
              </button>

              <button [class.active]="activeTab === 'planificacion'" (click)="activeTab = 'planificacion'" class="step-btn">
                <span class="step-num">2</span>
                <div class="step-text">
                  <span class="step-title">1.1 Planificación</span>
                  <span class="step-score-badge">{{ calculatePlanificacionSubtotal() }} / 25 pts</span>
                </div>
              </button>

              <button [class.active]="activeTab === 'proceso'" (click)="activeTab = 'proceso'" class="step-btn">
                <span class="step-num">3</span>
                <div class="step-text">
                  <span class="step-title">1.2 Proceso</span>
                  <span class="step-score-badge">{{ calculateProcesoSubtotal() }} / 10 pts</span>
                </div>
              </button>

              <button [class.active]="activeTab === 'desempeno'" (click)="activeTab = 'desempeno'" class="step-btn highlight-desempeno">
                <span class="step-num">4</span>
                <div class="step-text">
                  <span class="step-title">1.3 Desempeño</span>
                  <span class="step-score-badge">{{ calculateDesempenoSubtotal() }} / 50 pts</span>
                </div>
              </button>

              <button [class.active]="activeTab === 'transversales'" (click)="activeTab = 'transversales'" class="step-btn">
                <span class="step-num">5</span>
                <div class="step-text">
                  <span class="step-title">1.4 Transversales</span>
                  <span class="step-score-badge">{{ calculateTransversalesSubtotal() }} / 15 pts</span>
                </div>
              </button>

              <button [class.active]="activeTab === 'resumen'" (click)="activeTab = 'resumen'" class="step-btn step-final">
                <span class="step-num">★</span>
                <div class="step-text">
                  <span class="step-title">Cierre y Dictamen</span>
                  <span class="step-score-badge">{{ calculateGrandTotal() }} / 100 pts</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Main Workspace Body -->
          <div class="eval-workspace-body">
            <form (ngSubmit)="saveEvaluacion()">
              <!-- ========================================== -->
              <!-- TAB 1: INFORMACIÓN GENERAL -->
              <!-- ========================================== -->
              @if (activeTab === 'general') {
                <div class="workspace-section-card">
                  <div class="section-card-header">
                    <div>
                      <h3 class="section-title">📋 Datos del Evento y Docente Evaluado</h3>
                      <p class="section-sub">Información administrativa, código de programa, módulo y sede de impartición.</p>
                    </div>
                  </div>

                  <div class="form-grid-layout">
                    <div class="form-group col-12 col-md-6">
                      <label>Instructor / Docente a Evaluar *</label>
                      <select class="form-control" [(ngModel)]="activeEval.empleadoId" name="empleadoId" required>
                        <option [ngValue]="null" disabled>Selecciona un docente</option>
                        @for (e of empleados(); track e.id) {
                          <option [ngValue]="e.id">{{ e.nombres }} {{ e.apellidos }} ({{ e.profesion || 'Docente' }})</option>
                        }
                      </select>
                    </div>

                    <div class="form-group col-12 col-md-6">
                      <label>No. de Programa / Código</label>
                      <input type="text" class="form-control" [(ngModel)]="activeEval.noPrograma" name="noPrograma" placeholder="Ej. PROG-2026-TIR01" />
                    </div>

                    <div class="form-group col-12 col-md-6">
                      <label>Nombre del Módulo</label>
                      <input type="text" class="form-control" [(ngModel)]="activeEval.nombreModulo" name="nombreModulo" placeholder="Ej. Configuración de Redes y Enrutamiento" />
                    </div>

                    <div class="form-group col-12 col-md-6">
                      <label>Sede / Lugar de Impartición</label>
                      <input type="text" class="form-control" [(ngModel)]="activeEval.lugar" name="lugar" placeholder="Ej. Sede Central INTECAP - Aula A-101" />
                    </div>

                    <div class="form-group col-12 col-md-6">
                      <label>Tema de Desarrollo</label>
                      <input type="text" class="form-control" [(ngModel)]="activeEval.temaDesarrollo" name="temaDesarrollo" placeholder="Ej. Arquitecturas TCP/IP y Subnetting" />
                    </div>

                    <div class="form-group col-12 col-md-6">
                      <label>Resultado de Aprendizaje (RA)</label>
                      <input type="text" class="form-control" [(ngModel)]="activeEval.resultadoAprendizaje" name="resultadoAprendizaje" placeholder="Ej. RA-1.1 Implementa direccionamiento IPv4" />
                    </div>

                    <div class="form-group col-12 col-md-6">
                      <label>Producto de Formación</label>
                      <select class="form-control" [(ngModel)]="activeEval.productoFormacion" name="productoFormacion">
                        <option value="Guía Didáctica de Aprendizaje">Guía Didáctica de Aprendizaje</option>
                        <option value="Plan de Sesión Formativa">Plan de Sesión Formativa</option>
                        <option value="Evaluación Práctica de Taller">Evaluación Práctica de Taller</option>
                        <option value="Manual de Procedimientos Técnicos">Manual de Procedimientos Técnicos</option>
                      </select>
                    </div>

                    <div class="form-group col-12 col-md-3">
                      <label>Fecha de Inicio</label>
                      <input type="date" class="form-control" [(ngModel)]="activeEval.fechaInicio" name="fechaInicio" />
                    </div>

                    <div class="form-group col-12 col-md-3">
                      <label>Fecha de Fin</label>
                      <input type="date" class="form-control" [(ngModel)]="activeEval.fechaFin" name="fechaFin" />
                    </div>
                  </div>

                  <div class="workspace-card-footer">
                    <div></div>
                    <button type="button" (click)="activeTab = 'planificacion'" class="btn btn-primary btn-next">
                      Continuar a 1.1 Planificación Didáctica →
                    </button>
                  </div>
                </div>
              }

              <!-- ========================================== -->
              <!-- TAB 2: 1.1 PLANIFICACIÓN DIDÁCTICA (25 PTS) -->
              <!-- ========================================== -->
              @if (activeTab === 'planificacion') {
                <div class="workspace-section-card">
                  <div class="section-card-header">
                    <div>
                      <h3 class="section-title">📑 1.1 Planificación Didáctica</h3>
                      <p class="section-sub">Evaluación del portafolio docente, congruencia con el RA y diseño de instrumentos formativos.</p>
                    </div>
                    <div class="subtotal-pill">
                      Subtotal: <strong>{{ calculatePlanificacionSubtotal() }} / 25 pts</strong>
                    </div>
                  </div>

                  <div class="rubric-grid">
                    <div class="rubric-card-enhanced">
                      <div class="rubric-top-row">
                        <span class="rubric-item-title">1. Portafolio de gestión según registro I.O.DT-07</span>
                        <span class="max-score-badge">Máx. 3 pts</span>
                      </div>
                      <p class="rubric-desc-text">Presenta el portafolio completo, ordenado y con la documentación técnica y pedagógica al día.</p>
                      <div class="slider-interactive-row">
                        <input type="range" min="0" max="3" step="0.5" [(ngModel)]="activeEval.planP1" name="planP1" class="rubric-slider" />
                        <div class="score-display-box">{{ activeEval.planP1 }} pts</div>
                      </div>
                    </div>

                    <div class="rubric-card-enhanced">
                      <div class="rubric-top-row">
                        <span class="rubric-item-title">2. Componentes del plan coherentes con el Resultado de Aprendizaje</span>
                        <span class="max-score-badge">Máx. 6 pts</span>
                      </div>
                      <p class="rubric-desc-text">Formula todos los componentes de la situación de aprendizaje alineados directamente al RA del programa.</p>
                      <div class="slider-interactive-row">
                        <input type="range" min="0" max="6" step="0.5" [(ngModel)]="activeEval.planP2" name="planP2" class="rubric-slider" />
                        <div class="score-display-box">{{ activeEval.planP2 }} pts</div>
                      </div>
                    </div>

                    <div class="rubric-card-enhanced">
                      <div class="rubric-top-row">
                        <span class="rubric-item-title">3. Diseño de situaciones de aprendizaje contextualizadas</span>
                        <span class="max-score-badge">Máx. 6 pts</span>
                      </div>
                      <p class="rubric-desc-text">Plantea situaciones reales vinculadas al sector productivo e industrial de Guatemala.</p>
                      <div class="slider-interactive-row">
                        <input type="range" min="0" max="6" step="0.5" [(ngModel)]="activeEval.planP3" name="planP3" class="rubric-slider" />
                        <div class="score-display-box">{{ activeEval.planP3 }} pts</div>
                      </div>
                    </div>

                    <div class="rubric-card-enhanced">
                      <div class="rubric-top-row">
                        <span class="rubric-item-title">4. Recursos didácticos acordes a las situaciones planificadas</span>
                        <span class="max-score-badge">Máx. 5 pts</span>
                      </div>
                      <p class="rubric-desc-text">Diseña o selecciona equipo, herramientas y recursos didácticos específicos y funcionales.</p>
                      <div class="slider-interactive-row">
                        <input type="range" min="0" max="5" step="0.5" [(ngModel)]="activeEval.planP4" name="planP4" class="rubric-slider" />
                        <div class="score-display-box">{{ activeEval.planP4 }} pts</div>
                      </div>
                    </div>

                    <div class="rubric-card-enhanced">
                      <div class="rubric-top-row">
                        <span class="rubric-item-title">5. Criterios de evaluación y dimensiones (Saber, Hacer, Ser)</span>
                        <span class="max-score-badge">Máx. 5 pts</span>
                      </div>
                      <p class="rubric-desc-text">Instrumentos de evaluación que miden conocimientos teóricos, habilidades prácticas y actitudes profesionales.</p>
                      <div class="slider-interactive-row">
                        <input type="range" min="0" max="5" step="0.5" [(ngModel)]="activeEval.planP5" name="planP5" class="rubric-slider" />
                        <div class="score-display-box">{{ activeEval.planP5 }} pts</div>
                      </div>
                    </div>
                  </div>

                  <div class="workspace-card-footer">
                    <button type="button" (click)="activeTab = 'general'" class="btn btn-secondary">← Anterior</button>
                    <button type="button" (click)="activeTab = 'proceso'" class="btn btn-primary btn-next">
                      Continuar a 1.2 Control de Proceso →
                    </button>
                  </div>
                </div>
              }

              <!-- ========================================== -->
              <!-- TAB 3: 1.2 PROCESO FORMATIVO (10 PTS) -->
              <!-- ========================================== -->
              @if (activeTab === 'proceso') {
                <div class="workspace-section-card">
                  <div class="section-card-header">
                    <div>
                      <h3 class="section-title">📊 1.2 Control del Proceso Formativo</h3>
                      <p class="section-sub">Seguimiento de asistencia, deserciones y control teórico-práctico en aula y taller.</p>
                    </div>
                    <div class="subtotal-pill">
                      Subtotal: <strong>{{ calculateProcesoSubtotal() }} / 10 pts</strong>
                    </div>
                  </div>

                  <div class="rubric-grid">
                    <div class="rubric-card-enhanced">
                      <div class="rubric-top-row">
                        <span class="rubric-item-title">1. Control de asistencia y deserciones en orden y al día</span>
                        <span class="max-score-badge">Máx. 2 pts</span>
                      </div>
                      <p class="rubric-desc-text">Registros diarios de asistencia de alumnos y causas documentadas de deserciones.</p>
                      <div class="slider-interactive-row">
                        <input type="range" min="0" max="2" step="0.5" [(ngModel)]="activeEval.procesoP1" name="procesoP1" class="rubric-slider" />
                        <div class="score-display-box">{{ activeEval.procesoP1 }} pts</div>
                      </div>
                    </div>

                    <div class="rubric-card-enhanced">
                      <div class="rubric-top-row">
                        <span class="rubric-item-title">2. Control completo de aspectos teóricos (TI/TG, CDT)</span>
                        <span class="max-score-badge">Máx. 4 pts</span>
                      </div>
                      <p class="rubric-desc-text">Cumplimiento de tareas individuales/grupales y comprobaciones de desarrollo teórico formativo.</p>
                      <div class="slider-interactive-row">
                        <input type="range" min="0" max="4" step="0.5" [(ngModel)]="activeEval.procesoP2" name="procesoP2" class="rubric-slider" />
                        <div class="score-display-box">{{ activeEval.procesoP2 }} pts</div>
                      </div>
                    </div>

                    <div class="rubric-card-enhanced">
                      <div class="rubric-top-row">
                        <span class="rubric-item-title">3. Control completo de aspectos prácticos (AHD, AAT)</span>
                        <span class="max-score-badge">Máx. 4 pts</span>
                      </div>
                      <p class="rubric-desc-text">Actividades de habilidades y destrezas en taller con rúbricas de calificación técnica.</p>
                      <div class="slider-interactive-row">
                        <input type="range" min="0" max="4" step="0.5" [(ngModel)]="activeEval.procesoP3" name="procesoP3" class="rubric-slider" />
                        <div class="score-display-box">{{ activeEval.procesoP3 }} pts</div>
                      </div>
                    </div>
                  </div>

                  <div class="workspace-card-footer">
                    <button type="button" (click)="activeTab = 'planificacion'" class="btn btn-secondary">← Anterior</button>
                    <button type="button" (click)="activeTab = 'desempeno'" class="btn btn-primary btn-next">
                      Continuar a 1.3 Desempeño Pedagógico →
                    </button>
                  </div>
                </div>
              }

              <!-- ========================================== -->
              <!-- TAB 4: 1.3 DESEMPEÑO PEDAGÓGICO (50 PTS) -->
              <!-- ========================================== -->
              @if (activeTab === 'desempeno') {
                <div class="workspace-section-card">
                  <div class="section-card-header">
                    <div>
                      <h3 class="section-title">🎓 1.3 Desempeño Pedagógico en el Aula / Taller</h3>
                      <p class="section-sub">Evaluación directa durante la sesión formativa presencial: Apertura (10 pts), Desarrollo (25 pts) y Cierre (15 pts).</p>
                    </div>
                    <div class="subtotal-pill pill-gold">
                      Subtotal: <strong>{{ calculateDesempenoSubtotal() }} / 50 pts</strong>
                    </div>
                  </div>

                  <!-- SECCIÓN A: APERTURA -->
                  <div class="desempeno-group">
                    <div class="group-header">
                      <div class="group-title-box">
                        <span class="group-icon">🌅</span>
                        <div>
                          <h4 class="group-title">Apertura de la Sesión</h4>
                          <span class="group-caption">Introducción, encuadre y motivación inicial</span>
                        </div>
                      </div>
                      <span class="group-weight-tag">Ponderación: 10 pts</span>
                    </div>

                    <div class="rubric-grid">
                      <div class="rubric-card-enhanced">
                        <div class="rubric-top-row">
                          <span class="rubric-item-title">1. Involucra elementos pertinentes de apertura según el momento</span>
                          <span class="max-score-badge">Máx. 3 pts</span>
                        </div>
                        <div class="slider-interactive-row">
                          <input type="range" min="0" max="3" step="0.5" [(ngModel)]="activeEval.desempenoP1" name="desempenoP1" class="rubric-slider" />
                          <div class="score-display-box">{{ activeEval.desempenoP1 }} pts</div>
                        </div>
                      </div>

                      <div class="rubric-card-enhanced">
                        <div class="rubric-top-row">
                          <span class="rubric-item-title">2. Informa criterios de evaluación de la situación formativa</span>
                          <span class="max-score-badge">Máx. 3 pts</span>
                        </div>
                        <div class="slider-interactive-row">
                          <input type="range" min="0" max="3" step="0.5" [(ngModel)]="activeEval.desempenoP2" name="desempenoP2" class="rubric-slider" />
                          <div class="score-display-box">{{ activeEval.desempenoP2 }} pts</div>
                        </div>
                      </div>

                      <div class="rubric-card-enhanced">
                        <div class="rubric-top-row">
                          <span class="rubric-item-title">3. Activa conocimientos previos con relación al nuevo contenido</span>
                          <span class="max-score-badge">Máx. 4 pts</span>
                        </div>
                        <div class="slider-interactive-row">
                          <input type="range" min="0" max="4" step="0.5" [(ngModel)]="activeEval.desempenoP3" name="desempenoP3" class="rubric-slider" />
                          <div class="score-display-box">{{ activeEval.desempenoP3 }} pts</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- SECCIÓN B: DESARROLLO -->
                  <div class="desempeno-group">
                    <div class="group-header">
                      <div class="group-title-box">
                        <span class="group-icon">⚙️</span>
                        <div>
                          <h4 class="group-title">Desarrollo de la Sesión</h4>
                          <span class="group-caption">Ejecución didáctica, técnicas participativas y retroalimentación</span>
                        </div>
                      </div>
                      <span class="group-weight-tag">Ponderación: 25 pts</span>
                    </div>

                    <div class="rubric-grid">
                      <div class="rubric-card-enhanced">
                        <div class="rubric-top-row">
                          <span class="rubric-item-title">4. Material didáctico, equipo y herramientas disponibles al inicio</span>
                          <span class="max-score-badge">Máx. 4 pts</span>
                        </div>
                        <div class="slider-interactive-row">
                          <input type="range" min="0" max="4" step="0.5" [(ngModel)]="activeEval.desempenoP4" name="desempenoP4" class="rubric-slider" />
                          <div class="score-display-box">{{ activeEval.desempenoP4 }} pts</div>
                        </div>
                      </div>

                      <div class="rubric-card-enhanced">
                        <div class="rubric-top-row">
                          <span class="rubric-item-title">5. Desarrolla las actividades didácticas previstas</span>
                          <span class="max-score-badge">Máx. 3 pts</span>
                        </div>
                        <div class="slider-interactive-row">
                          <input type="range" min="0" max="3" step="0.5" [(ngModel)]="activeEval.desempenoP5" name="desempenoP5" class="rubric-slider" />
                          <div class="score-display-box">{{ activeEval.desempenoP5 }} pts</div>
                        </div>
                      </div>

                      <div class="rubric-card-enhanced">
                        <div class="rubric-top-row">
                          <span class="rubric-item-title">6. Aplica técnicas didácticas pertinentes y participativas</span>
                          <span class="max-score-badge">Máx. 4 pts</span>
                        </div>
                        <div class="slider-interactive-row">
                          <input type="range" min="0" max="4" step="0.5" [(ngModel)]="activeEval.desempenoP6" name="desempenoP6" class="rubric-slider" />
                          <div class="score-display-box">{{ activeEval.desempenoP6 }} pts</div>
                        </div>
                      </div>

                      <div class="rubric-card-enhanced">
                        <div class="rubric-top-row">
                          <span class="rubric-item-title">7. Retroalimenta oportunamente el desempeño del participante</span>
                          <span class="max-score-badge">Máx. 6 pts</span>
                        </div>
                        <div class="slider-interactive-row">
                          <input type="range" min="0" max="6" step="0.5" [(ngModel)]="activeEval.desempenoP7" name="desempenoP7" class="rubric-slider" />
                          <div class="score-display-box">{{ activeEval.desempenoP7 }} pts</div>
                        </div>
                      </div>

                      <div class="rubric-card-enhanced">
                        <div class="rubric-top-row">
                          <span class="rubric-item-title">8. Promueve trabajo en equipo y clima participativo de respeto</span>
                          <span class="max-score-badge">Máx. 4 pts</span>
                        </div>
                        <div class="slider-interactive-row">
                          <input type="range" min="0" max="4" step="0.5" [(ngModel)]="activeEval.desempenoP8" name="desempenoP8" class="rubric-slider" />
                          <div class="score-display-box">{{ activeEval.desempenoP8 }} pts</div>
                        </div>
                      </div>

                      <div class="rubric-card-enhanced">
                        <div class="rubric-top-row">
                          <span class="rubric-item-title">9. Administra adecuadamente el tiempo de la sesión formativa</span>
                          <span class="max-score-badge">Máx. 4 pts</span>
                        </div>
                        <div class="slider-interactive-row">
                          <input type="range" min="0" max="4" step="0.5" [(ngModel)]="activeEval.desempenoP9" name="desempenoP9" class="rubric-slider" />
                          <div class="score-display-box">{{ activeEval.desempenoP9 }} pts</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- SECCIÓN C: CIERRE -->
                  <div class="desempeno-group">
                    <div class="group-header">
                      <div class="group-title-box">
                        <span class="group-icon">🎯</span>
                        <div>
                          <h4 class="group-title">Cierre de la Sesión y Evaluación</h4>
                          <span class="group-caption">Conclusiones, verificación del aprendizaje y síntesis</span>
                        </div>
                      </div>
                      <span class="group-weight-tag">Ponderación: 15 pts</span>
                    </div>

                    <div class="rubric-grid">
                      <div class="rubric-card-enhanced">
                        <div class="rubric-top-row">
                          <span class="rubric-item-title">10. Realiza síntesis o recapitulación de lo aprendido</span>
                          <span class="max-score-badge">Máx. 7 pts</span>
                        </div>
                        <div class="slider-interactive-row">
                          <input type="range" min="0" max="7" step="0.5" [(ngModel)]="activeEval.desempenoP10" name="desempenoP10" class="rubric-slider" />
                          <div class="score-display-box">{{ activeEval.desempenoP10 }} pts</div>
                        </div>
                      </div>

                      <div class="rubric-card-enhanced">
                        <div class="rubric-top-row">
                          <span class="rubric-item-title">11. Aplica instrumentos y actividades de evaluación formativa</span>
                          <span class="max-score-badge">Máx. 8 pts</span>
                        </div>
                        <div class="slider-interactive-row">
                          <input type="range" min="0" max="8" step="0.5" [(ngModel)]="activeEval.desempenoP11" name="desempenoP11" class="rubric-slider" />
                          <div class="score-display-box">{{ activeEval.desempenoP11 }} pts</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="workspace-card-footer">
                    <button type="button" (click)="activeTab = 'proceso'" class="btn btn-secondary">← Anterior</button>
                    <button type="button" (click)="activeTab = 'transversales'" class="btn btn-primary btn-next">
                      Continuar a 1.4 Aspectos Transversales →
                    </button>
                  </div>
                </div>
              }

              <!-- ========================================== -->
              <!-- TAB 5: 1.4 ASPECTOS TRANSVERSALES (15 PTS) -->
              <!-- ========================================== -->
              @if (activeTab === 'transversales') {
                <div class="workspace-section-card">
                  <div class="section-card-header">
                    <div>
                      <h3 class="section-title">🛡️ 1.4 Aspectos Transversales e Institucionales</h3>
                      <p class="section-sub">Cultura de servicio, metodología 9S, seguridad industrial y ética docente INTECAP.</p>
                    </div>
                    <div class="subtotal-pill">
                      Subtotal: <strong>{{ calculateTransversalesSubtotal() }} / 15 pts</strong>
                    </div>
                  </div>

                  <div class="rubric-grid">
                    <div class="rubric-card-enhanced">
                      <div class="rubric-top-row">
                        <span class="rubric-item-title">1. Aplicación de procedimientos involucrados con su labor y servicio</span>
                        <span class="max-score-badge">Máx. 4 pts</span>
                      </div>
                      <div class="slider-interactive-row">
                        <input type="range" min="0" max="4" step="0.5" [(ngModel)]="activeEval.aspectosP1" name="aspectosP1" class="rubric-slider" />
                        <div class="score-display-box">{{ activeEval.aspectosP1 }} pts</div>
                      </div>
                    </div>

                    <div class="rubric-card-enhanced">
                      <div class="rubric-top-row">
                        <span class="rubric-item-title">2. Imagen personal, higiene y uso de equipo de seguridad (EPP)</span>
                        <span class="max-score-badge">Máx. 2 pts</span>
                      </div>
                      <div class="slider-interactive-row">
                        <input type="range" min="0" max="2" step="0.5" [(ngModel)]="activeEval.aspectosP2" name="aspectosP2" class="rubric-slider" />
                        <div class="score-display-box">{{ activeEval.aspectosP2 }} pts</div>
                      </div>
                    </div>

                    <div class="rubric-card-enhanced">
                      <div class="rubric-top-row">
                        <span class="rubric-item-title">3. Aplica metodología 9S en su entorno de trabajo / taller</span>
                        <span class="max-score-badge">Máx. 3 pts</span>
                      </div>
                      <div class="slider-interactive-row">
                        <input type="range" min="0" max="3" step="0.5" [(ngModel)]="activeEval.aspectosP3" name="aspectosP3" class="rubric-slider" />
                        <div class="score-display-box">{{ activeEval.aspectosP3 }} pts</div>
                      </div>
                    </div>

                    <div class="rubric-card-enhanced">
                      <div class="rubric-top-row">
                        <span class="rubric-item-title">4. Legibilidad y ortografía correcta en registros y material</span>
                        <span class="max-score-badge">Máx. 2 pts</span>
                      </div>
                      <div class="slider-interactive-row">
                        <input type="range" min="0" max="2" step="0.5" [(ngModel)]="activeEval.aspectosP4" name="aspectosP4" class="rubric-slider" />
                        <div class="score-display-box">{{ activeEval.aspectosP4 }} pts</div>
                      </div>
                    </div>

                    <div class="rubric-card-enhanced">
                      <div class="rubric-top-row">
                        <span class="rubric-item-title">5. Informa oportunamente sobre aspectos de formación</span>
                        <span class="max-score-badge">Máx. 4 pts</span>
                      </div>
                      <div class="slider-interactive-row">
                        <input type="range" min="0" max="4" step="0.5" [(ngModel)]="activeEval.aspectosP5" name="aspectosP5" class="rubric-slider" />
                        <div class="score-display-box">{{ activeEval.aspectosP5 }} pts</div>
                      </div>
                    </div>
                  </div>

                  <div class="workspace-card-footer">
                    <button type="button" (click)="activeTab = 'desempeno'" class="btn btn-secondary">← Anterior</button>
                    <button type="button" (click)="activeTab = 'resumen'" class="btn btn-primary btn-next">
                      Ver Cierre y Puntuación Total →
                    </button>
                  </div>
                </div>
              }

              <!-- ========================================== -->
              <!-- TAB 6: RESUMEN DE CIERRE Y DICTAMEN FINAL -->
              <!-- ========================================== -->
              @if (activeTab === 'resumen') {
                <div class="workspace-section-card">
                  <div class="section-card-header">
                    <div>
                      <h3 class="section-title">⭐ Declaración del Estado del Servicio y Cierre</h3>
                      <p class="section-sub">Resumen de ponderación global, observaciones del evaluador y plan de compromisos.</p>
                    </div>
                  </div>

                  <!-- Score Card Summary -->
                  <div class="summary-score-card" [class.conforme]="calculateGrandTotal() >= 95" [class.no-conforme]="calculateGrandTotal() < 95">
                    <div class="score-banner-left">
                      <div class="score-big">{{ calculateGrandTotal() }} <small>/ 100 pts</small></div>
                      <div class="score-status-badge">
                        {{ calculateGrandTotal() >= 95 ? '✓ ESTADO: CONFORME (Cumple Estándar)' : '⚠ ESTADO: NO CONFORME (Requiere Plan de Mejora)' }}
                      </div>
                      <div class="text-sm mt-1 text-muted">
                        {{ calculateGrandTotal() >= 95 ? 'Cumple satisfactoriamente con el estándar institucional I.O.DT-07 (≥ 95 pts).' : 'La puntuación total es menor a 95 pts. Es indispensable documentar compromisos de mejora.' }}
                      </div>
                    </div>

                    <div class="dimension-breakdown">
                      <div class="dim-row">
                        <span>1.1 Planificación Didáctica:</span>
                        <strong>{{ calculatePlanificacionSubtotal() }} / 25 pts</strong>
                      </div>
                      <div class="dim-row">
                        <span>1.2 Control de Proceso Formativo:</span>
                        <strong>{{ calculateProcesoSubtotal() }} / 10 pts</strong>
                      </div>
                      <div class="dim-row">
                        <span>1.3 Desempeño Pedagógico:</span>
                        <strong>{{ calculateDesempenoSubtotal() }} / 50 pts</strong>
                      </div>
                      <div class="dim-row">
                        <span>1.4 Aspectos Transversales:</span>
                        <strong>{{ calculateTransversalesSubtotal() }} / 15 pts</strong>
                      </div>
                    </div>
                  </div>

                  <div class="form-group mt-4">
                    <label>Observaciones del Supervisor / Evaluador</label>
                    <textarea
                      class="form-control"
                      rows="4"
                      [(ngModel)]="activeEval.observaciones"
                      name="observaciones"
                      placeholder="Indique fortalezas observadas, técnicas aplicadas y áreas de oportunidad durante la sesión..."
                    ></textarea>
                  </div>

                  <div class="form-group mt-3">
                    <label>Compromisos y Plan de Mejora del Docente</label>
                    <textarea
                      class="form-control"
                      rows="4"
                      [(ngModel)]="activeEval.compromisosDocente"
                      name="compromisosDocente"
                      placeholder="Acuerdos, fechas de seguimiento y compromisos pedagógicos asumidos por el instructor..."
                    ></textarea>
                  </div>

                  <div class="workspace-card-footer">
                    <button type="button" (click)="activeTab = 'transversales'" class="btn btn-secondary">← Anterior</button>
                    <button type="submit" class="btn btn-gold btn-lg" [disabled]="saving()">
                      {{ saving() ? 'Guardando...' : (isEditing() ? 'Actualizar Ficha de Calidad' : 'Guardar y Finalizar Evaluación') }}
                    </button>
                  </div>
                </div>
              }
            </form>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- VISTA 3: REPORTE IMPRIMIBLE / DETALLE COMPLETO DE FICHA -->
      <!-- ========================================================================= -->
      @if (currentView() === 'report' && viewingEval) {
        <div class="report-view-page">
          <div class="report-page-header">
            <button (click)="backToList()" class="btn-back">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al Listado
            </button>

            <div class="report-actions">
              <button (click)="openEditForm(viewingEval)" class="btn btn-secondary">✏️ Editar Ficha</button>
              <button (click)="printFicha()" class="btn btn-primary">🖨️ Imprimir Ficha Oficial</button>
            </div>
          </div>

          <div class="printable-document-card">
            <div class="doc-header">
              <div class="doc-badge">INSTITUTO TÉCNICO DE CAPACITACIÓN Y PRODUCTIVIDAD</div>
              <h2 class="doc-title">Ficha de Supervisión de Calidad Docente I.O.DT-07</h2>
              <p class="doc-sub">Control y Aseguramiento del Proceso de Formación Profesional</p>
            </div>

            <!-- Meta Information Grid -->
            <div class="print-meta-grid">
              <div><strong>Docente Evaluado:</strong> {{ viewingEval.empleado ? viewingEval.empleado.nombres + ' ' + viewingEval.empleado.apellidos : 'Docente #' + viewingEval.empleadoId }}</div>
              <div><strong>No. Programa:</strong> {{ viewingEval.noPrograma || '-' }}</div>
              <div><strong>Módulo:</strong> {{ viewingEval.nombreModulo || '-' }}</div>
              <div><strong>Sede / Aula:</strong> {{ viewingEval.lugar || 'Sede Central' }}</div>
              <div><strong>Tema de Desarrollo:</strong> {{ viewingEval.temaDesarrollo || '-' }}</div>
              <div><strong>Resultado Aprendizaje:</strong> {{ viewingEval.resultadoAprendizaje || '-' }}</div>
              <div><strong>Fecha Evaluación:</strong> {{ viewingEval.fechaCreacion | date:'dd/MM/yyyy' }}</div>
              <div><strong>Producto Formación:</strong> {{ viewingEval.productoFormacion || 'Guía Didáctica' }}</div>
            </div>

            <!-- Score Matrix Table -->
            <table class="report-table">
              <thead>
                <tr>
                  <th>Dimensión Evaluada</th>
                  <th class="text-center">Máximo</th>
                  <th class="text-center">Obtenido</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>1.1 Planificación Didáctica</strong> (Portafolio, Plan, Situaciones, Recursos, Instrumentos)</td>
                  <td class="text-center">25 pts</td>
                  <td class="text-center font-bold">{{ viewingEval.totalPlanificacion ?? 25 }} pts</td>
                  <td><span class="badge badge-success">Evaluado</span></td>
                </tr>
                <tr>
                  <td><strong>1.2 Control de Proceso Formativo</strong> (Asistencias, TI/TG, AHD/AAT)</td>
                  <td class="text-center">10 pts</td>
                  <td class="text-center font-bold">{{ viewingEval.totalProceso ?? 10 }} pts</td>
                  <td><span class="badge badge-success">Evaluado</span></td>
                </tr>
                <tr>
                  <td><strong>1.3 Desempeño Pedagógico</strong> (Apertura, Desarrollo de competencias, Cierre)</td>
                  <td class="text-center">50 pts</td>
                  <td class="text-center font-bold">{{ viewingEval.totalDesempeno ?? 50 }} pts</td>
                  <td><span class="badge badge-success">Evaluado</span></td>
                </tr>
                <tr>
                  <td><strong>1.4 Aspectos Transversales</strong> (Cultura de servicio, 9S, EPP, ortografía)</td>
                  <td class="text-center">15 pts</td>
                  <td class="text-center font-bold">{{ viewingEval.totalAspectos ?? 15 }} pts</td>
                  <td><span class="badge badge-success">Evaluado</span></td>
                </tr>
                <tr class="total-row">
                  <td><strong>TOTAL GENERAL DE CALIFICACIÓN</strong></td>
                  <td class="text-center"><strong>100 pts</strong></td>
                  <td class="text-center font-bold text-lg">{{ getItemPromedio(viewingEval) }} pts</td>
                  <td>
                    <span class="badge" [class.badge-success]="getItemPromedio(viewingEval) >= 95" [class.badge-danger]="getItemPromedio(viewingEval) < 95">
                      {{ getItemPromedio(viewingEval) >= 95 ? '✓ CONFORME' : '⚠ NO CONFORME' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            @if (viewingEval.observaciones) {
              <div class="report-box mt-3">
                <strong>Observaciones del Evaluador:</strong>
                <p>{{ viewingEval.observaciones }}</p>
              </div>
            }

            @if (viewingEval.compromisosDocente) {
              <div class="report-box mt-2">
                <strong>Compromisos y Plan de Acción:</strong>
                <p>{{ viewingEval.compromisosDocente }}</p>
              </div>
            }

            <!-- Signatures Row -->
            <div class="signatures-row">
              <div class="sign-block">
                <div class="sign-line"></div>
                <span>Firma del Evaluador / Supervisor</span>
              </div>
              <div class="sign-block">
                <div class="sign-line"></div>
                <span>Firma del Docente / Instructor</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .calidad-page {
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

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
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
      flex-shrink: 0;
      svg { width: 24px; height: 24px; }
    }

    .bg-blue { background: #e0f2fe; color: #0284c7; }
    .bg-green { background: #dcfce7; color: #16a34a; }
    .bg-amber { background: #fef3c7; color: #d97706; }
    .bg-gold { background: #fef9c3; color: #ca8a04; }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-label { font-size: 0.8rem; font-weight: 600; color: #64748b; }
    .stat-value { font-size: 1.5rem; font-weight: 800; color: #0f172a; }
    .stat-sub { font-size: 0.75rem; color: #94a3b8; }

    .text-green { color: #16a34a; }
    .text-amber { color: #d97706; }
    .text-gold { color: #ca8a04; }
    .text-navy { color: #0d2d5e; }

    /* Main Table Card */
    .main-table-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .toolbar {
      padding: 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      max-width: 450px;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      color: #94a3b8;
    }

    .search-input {
      padding-left: 38px;
    }

    .filter-group {
      display: flex;
      gap: 0.5rem;
    }

    .filter-chip {
      padding: 0.45rem 0.9rem;
      border-radius: 20px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s;

      &:hover { background: #e2e8f0; }
      &.active {
        background: #0d2d5e;
        color: #ffffff;
        border-color: #0d2d5e;
      }
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      th, td {
        padding: 0.85rem 1rem;
        border-bottom: 1px solid #e2e8f0;
        vertical-align: middle;
      }

      th {
        background: #f8fafc;
        font-weight: 700;
        color: #475569;
        text-align: left;
        white-space: nowrap;
      }

      tbody tr:hover {
        background: #f8fafc;
      }
    }

    .user-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      white-space: nowrap;
    }

    .avatar-circle {
      width: 38px;
      height: 38px;
      min-width: 38px;
      flex-shrink: 0;
      border-radius: 50%;
      background: #e0f2fe;
      color: #0284c7;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      line-height: 1.3;
      white-space: nowrap;
    }

    .score-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-weight: 800;
      font-size: 0.875rem;
      white-space: nowrap;
      min-width: 90px;
    }

    .score-pill.high { background: #dcfce7; color: #15803d; }
    .score-pill.med { background: #fef9c3; color: #a16207; }
    .score-pill.low { background: #fee2e2; color: #b91c1c; }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .badge-success { background: #dcfce7; color: #166534; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .badge-gold { background: #fef3c7; color: #92400e; }

    .action-btns {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
      white-space: nowrap;
    }

    .action-btn {
      width: 34px;
      height: 34px;
      min-width: 34px;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      cursor: pointer;
      color: #475569;
      transition: all 0.15s;

      svg { width: 16px; height: 16px; }

      &:hover {
        background: #f1f5f9;
        color: #0f172a;
        border-color: #94a3b8;
      }
    }

    .btn-view:hover { color: #0284c7; border-color: #0284c7; background: #e0f2fe; }
    .btn-edit:hover { color: #ca8a04; border-color: #ca8a04; background: #fef9c3; }
    .btn-delete:hover { color: #dc2626; border-color: #dc2626; background: #fee2e2; }

    /* =========================================================================
       FULL-PAGE WORKSPACE STYLES (Form View)
       ========================================================================= */
    .eval-form-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    .eval-form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
      background: #ffffff;
      padding: 1.25rem 1.75rem;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .eval-header-left {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 0.4rem 0.85rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      align-self: flex-start;

      svg { width: 16px; height: 16px; }

      &:hover {
        background: #0d2d5e;
        color: #ffffff;
        border-color: #0d2d5e;
      }
    }

    .eval-header-titles h2 {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0d2d5e;
      margin: 0.25rem 0 0 0;
    }

    .eval-header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .eval-score-header-box {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      border: 2px solid #cbd5e1;
      background: #f8fafc;

      &.conforme {
        background: #f0fdf4;
        border-color: #86efac;
      }

      &.no-conforme {
        background: #fef2f2;
        border-color: #fca5a5;
      }
    }

    .score-header-val {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
    }

    .score-main-num {
      font-size: 1.8rem;
      font-weight: 900;
      color: #0f172a;
      line-height: 1;
    }

    .score-denom {
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 700;
    }

    .score-header-badge {
      font-size: 0.8rem;
      font-weight: 800;
      padding: 0.3rem 0.6rem;
      border-radius: 6px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #0f172a;
    }

    .eval-score-header-box.conforme .score-header-badge {
      color: #166534;
      border-color: #86efac;
      background: #dcfce7;
    }

    .eval-score-header-box.no-conforme .score-header-badge {
      color: #991b1b;
      border-color: #fca5a5;
      background: #fee2e2;
    }

    .btn-save-quick {
      padding: 0.6rem 1.15rem;
      font-weight: 700;
    }

    /* Stepper Navigation Card */
    .form-stepper-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }

    .form-stepper-tabs {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      overflow-x: auto;
    }

    .step-btn {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 1rem 0.85rem;
      border: none;
      background: #f8fafc;
      border-right: 1px solid #e2e8f0;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;

      &:last-child {
        border-right: none;
      }

      &:hover {
        background: #f1f5f9;
      }

      &.active {
        background: #ffffff;
        border-bottom-color: #e5a823;
        box-shadow: inset 0 -2px 0 #e5a823;
      }
    }

    .step-num {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #475569;
      font-weight: 800;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .step-btn.active .step-num {
      background: #0d2d5e;
      color: #ffffff;
    }

    .step-text {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .step-title {
      font-size: 0.82rem;
      font-weight: 800;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .step-sub, .step-score-badge {
      font-size: 0.72rem;
      color: #64748b;
      font-weight: 600;
      white-space: nowrap;
    }

    .step-btn.active .step-score-badge {
      color: #0284c7;
      font-weight: 800;
    }

    /* Workspace Section Card */
    .workspace-section-card {
      background: #ffffff;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      padding: 1.75rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .section-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 1rem;
      flex-wrap: wrap;
    }

    .section-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: #0d2d5e;
      margin: 0;
    }

    .section-sub {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0.25rem 0 0 0;
    }

    .subtotal-pill {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      padding: 0.45rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 700;
      white-space: nowrap;

      &.pill-gold {
        background: #fef9c3;
        border-color: #fde047;
        color: #854d0e;
      }
    }

    /* Rubric Cards Layout */
    .rubric-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .rubric-card-enhanced {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.15rem 1.25rem;
      transition: all 0.2s;

      &:hover {
        border-color: #cbd5e1;
        background: #f1f5f9;
      }
    }

    .rubric-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.4rem;
    }

    .rubric-item-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
    }

    .max-score-badge {
      background: #e2e8f0;
      color: #334155;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      white-space: nowrap;
    }

    .rubric-desc-text {
      font-size: 0.82rem;
      color: #64748b;
      margin: 0 0 0.85rem 0;
    }

    .slider-interactive-row {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-top: 0.5rem;
    }

    .rubric-slider {
      flex: 1;
      height: 8px;
      accent-color: #0d2d5e;
      cursor: pointer;
    }

    .score-display-box {
      min-width: 75px;
      padding: 0.35rem 0.75rem;
      background: #0d2d5e;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.95rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(13, 45, 94, 0.2);
    }

    /* 1.3 Desempeño Group Styling */
    .desempeno-group {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #e2e8f0;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .group-title-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .group-icon {
      font-size: 1.5rem;
    }

    .group-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0d2d5e;
      margin: 0;
    }

    .group-caption {
      font-size: 0.78rem;
      color: #64748b;
    }

    .group-weight-tag {
      font-size: 0.78rem;
      font-weight: 800;
      background: #fef3c7;
      color: #92400e;
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
    }

    /* Form Grid Layout */
    .form-grid-layout {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 1rem;
    }

    .col-12 { grid-column: span 12; }
    .col-md-6 { grid-column: span 6; }
    .col-md-3 { grid-column: span 3; }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-group label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #334155;
    }

    .workspace-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1.25rem;
      border-top: 1px solid #e2e8f0;
      margin-top: 0.5rem;
    }

    .btn-next {
      padding: 0.65rem 1.5rem;
      font-weight: 700;
    }

    /* Score Summary Card */
    .summary-score-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.75rem;
      border-radius: 12px;
      border: 2px solid #e2e8f0;
      gap: 1.5rem;
      flex-wrap: wrap;

      &.conforme {
        background: #f0fdf4;
        border-color: #86efac;
      }

      &.no-conforme {
        background: #fef2f2;
        border-color: #fca5a5;
      }
    }

    .score-big {
      font-size: 2.75rem;
      font-weight: 900;
      color: #0f172a;
      line-height: 1;
      small { font-size: 1.1rem; color: #64748b; }
    }

    .score-status-badge {
      font-weight: 800;
      font-size: 1.1rem;
      color: #166534;
      margin-top: 0.5rem;
    }

    .summary-score-card.no-conforme .score-status-badge {
      color: #991b1b;
    }

    .dimension-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.9rem;
      background: rgba(255, 255, 255, 0.7);
      padding: 1rem 1.25rem;
      border-radius: 8px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      min-width: 320px;
    }

    .dim-row {
      display: flex;
      justify-content: space-between;
      gap: 1.5rem;
    }

    /* =========================================================================
       REPORT VIEW STYLES
       ========================================================================= */
    .report-view-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
    }

    .report-page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .report-actions {
      display: flex;
      gap: 0.75rem;
    }

    .printable-document-card {
      background: #ffffff;
      border-radius: 14px;
      border: 1px solid #cbd5e1;
      padding: 2.5rem;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    }

    .doc-header {
      text-align: center;
      margin-bottom: 2rem;
      border-bottom: 2px solid #0d2d5e;
      padding-bottom: 1.25rem;
    }

    .doc-badge {
      font-size: 0.8rem;
      font-weight: 800;
      color: #e5a823;
      letter-spacing: 1px;
    }

    .doc-title {
      font-size: 1.6rem;
      font-weight: 900;
      color: #0d2d5e;
      margin: 0.35rem 0 0.2rem 0;
    }

    .doc-sub {
      font-size: 0.9rem;
      color: #64748b;
      margin: 0;
    }

    .print-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.85rem;
      background: #f8fafc;
      padding: 1.25rem;
      border-radius: 8px;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      margin-bottom: 1.25rem;
    }

    .report-table th, .report-table td {
      border: 1px solid #cbd5e1;
      padding: 0.75rem 1rem;
    }

    .report-table th { background: #f1f5f9; }
    .total-row { background: #f8fafc; font-weight: 800; font-size: 1rem; }

    .report-box {
      background: #f8fafc;
      border-left: 4px solid #0d2d5e;
      padding: 1rem 1.25rem;
      font-size: 0.9rem;
      border-radius: 0 8px 8px 0;
      p { margin: 0.35rem 0 0 0; color: #334155; }
    }

    .signatures-row {
      display: flex;
      justify-content: space-around;
      margin-top: 3.5rem;
      padding-top: 1rem;
    }

    .sign-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.85rem;
      color: #64748b;
    }

    .sign-line {
      width: 240px;
      border-top: 1.5px solid #0f172a;
    }

    @media (max-width: 900px) {
      .form-stepper-tabs {
        grid-template-columns: repeat(3, 1fr);
      }
      .col-md-6, .col-md-3 {
        grid-column: span 12;
      }
      .eval-form-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .print-meta-grid {
        grid-template-columns: 1fr;
      }
    }

    @media print {
      body * { visibility: hidden; }
      .printable-document-card, .printable-document-card * { visibility: visible; }
      .printable-document-card { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; padding: 0; }
    }
  `],
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
