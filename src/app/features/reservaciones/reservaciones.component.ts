import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { Reservacion, Salon, Empleado, Curso, Jornada, ReservacionesStats } from '../../core/models';

@Component({
  selector: 'app-reservaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reservaciones-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <div class="badge-tag">GESTIÓN DE SOLICITUDES, AUDITORÍA Y FLUJO DE APROBACIÓN</div>
          <h1>Reservación de Eventos Especiales y Salones</h1>
          <p class="subtitle">
            Administración de solicitudes para talleres únicos, seminarios, certificaciones y eventos específicos con control de aprobación y bitácora.
          </p>
        </div>
        <div class="header-actions">
          <button (click)="openCreateModal()" class="btn btn-gold">
            <svg class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Solicitar Nuevo Evento
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="stats-grid">
        <div class="stat-card" [class.active-filter]="filterEstado() === null" (click)="setFilterEstado(null)">
          <div class="stat-icon bg-navy-light">📜</div>
          <div class="stat-info">
            <span class="stat-label">Total Solicitudes</span>
            <span class="stat-value">{{ stats().total }}</span>
          </div>
        </div>

        <div class="stat-card stat-pending" [class.active-filter]="filterEstado() === 1" (click)="setFilterEstado(1)">
          <div class="stat-icon bg-amber-light">⏳</div>
          <div class="stat-info">
            <span class="stat-label">Pendientes de Aprobación</span>
            <span class="stat-value text-amber">{{ stats().pendientes }}</span>
          </div>
        </div>

        <div class="stat-card stat-approved" [class.active-filter]="filterEstado() === 2" (click)="setFilterEstado(2)">
          <div class="stat-icon bg-emerald-light">✅</div>
          <div class="stat-info">
            <span class="stat-label">Eventos Aprobados</span>
            <span class="stat-value text-emerald">{{ stats().aprobadas }}</span>
          </div>
        </div>

        <div class="stat-card stat-rejected" [class.active-filter]="filterEstado() === 3" (click)="setFilterEstado(3)">
          <div class="stat-icon bg-rose-light">❌</div>
          <div class="stat-info">
            <span class="stat-label">Rechazadas / Canceladas</span>
            <span class="stat-value text-rose">{{ stats().rechazadas }}</span>
          </div>
        </div>

        <div class="stat-card" [class.active-filter]="filterEstado() === 4" (click)="setFilterEstado(4)">
          <div class="stat-icon bg-blue-light">🏁</div>
          <div class="stat-info">
            <span class="stat-label">Eventos Finalizados</span>
            <span class="stat-value">{{ stats().finalizadas }}</span>
          </div>
        </div>
      </div>

      <!-- Filter and Search Bar -->
      <div class="card filter-bar-card">
        <div class="filter-row">
          <div class="search-box">
            <svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              class="search-input"
              placeholder="Buscar por salón, curso, instructor, motivo o tipo de evento..."
              [(ngModel)]="searchQuery"
              (input)="onSearchChange()"
            />
            @if (searchQuery) {
              <button class="clear-search-btn" (click)="clearSearch()">&times;</button>
            }
          </div>

          <!-- State Tab Pills -->
          <div class="state-pills">
            <button
              class="pill-btn"
              [class.active]="filterEstado() === null"
              (click)="setFilterEstado(null)"
            >
              Todos ({{ stats().total }})
            </button>
            <button
              class="pill-btn pill-pending"
              [class.active]="filterEstado() === 1"
              (click)="setFilterEstado(1)"
            >
              ⏳ Pendientes ({{ stats().pendientes }})
            </button>
            <button
              class="pill-btn pill-approved"
              [class.active]="filterEstado() === 2"
              (click)="setFilterEstado(2)"
            >
              ✅ Aprobados ({{ stats().aprobadas }})
            </button>
            <button
              class="pill-btn pill-rejected"
              [class.active]="filterEstado() === 3"
              (click)="setFilterEstado(3)"
            >
              ❌ Rechazados ({{ stats().rechazadas }})
            </button>
            <button
              class="pill-btn pill-finished"
              [class.active]="filterEstado() === 4"
              (click)="setFilterEstado(4)"
            >
              🏁 Finalizados ({{ stats().finalizadas }})
            </button>
          </div>
        </div>
      </div>

      <!-- Table / Cards of Reservations -->
      <div class="card table-card">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando solicitudes y auditoría de eventos...</p>
          </div>
        } @else if (reservaciones().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📅</div>
            <h3>No se encontraron solicitudes de reservación</h3>
            <p>No hay eventos registrados que coincidan con los filtros seleccionados.</p>
            <button (click)="openCreateModal()" class="btn btn-primary btn-sm">Crear Nueva Solicitud</button>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 22%;">Espacio / Salón</th>
                  <th style="width: 16%;">Tipo de Evento</th>
                  <th style="width: 18%;">Fecha y Horario</th>
                  <th style="width: 20%;">Docente / Curso</th>
                  <th style="width: 8%;">Asistentes</th>
                  <th style="width: 10%;">Estado</th>
                  <th style="width: 6%; text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (r of reservaciones(); track r.id) {
                  <tr>
                    <td>
                      <div class="cell-main font-bold text-navy">
                        {{ r.salon?.title || 'Salón #' + r.salonId }}
                      </div>
                    </td>
                    <td>
                      <span class="event-pill">{{ r.tipoEvento || 'Taller Especial' }}</span>
                    </td>
                    <td>
                      <div class="cell-main">
                        {{ r.fechaEvento || (r.createdAt | date:'yyyy-MM-dd') }}
                      </div>
                      <div class="cell-sub">
                        {{ r.horaInicio || '08:00' }} - {{ r.horaFin || '12:00' }}
                      </div>
                    </td>
                    <td>
                      <div class="cell-main">
                        {{ r.empleado ? r.empleado.nombres + ' ' + r.empleado.apellidos : 'Sin asignar' }}
                      </div>
                      <div class="cell-sub text-truncate">
                        {{ r.curso?.nombre || 'Capacitación' }}
                      </div>
                    </td>
                    <td>
                      <span class="text-sm font-semibold">{{ r.cantidadPersonas }}</span>
                    </td>
                    <td>
                      @switch (r.estado) {
                        @case (1) {
                          <span class="badge badge-warning">Pendiente</span>
                        }
                        @case (2) {
                          <span class="badge badge-success">Aprobado</span>
                        }
                        @case (3) {
                          <span class="badge badge-danger">Rechazado</span>
                        }
                        @case (4) {
                          <span class="badge badge-secondary">Finalizado</span>
                        }
                        @default {
                          <span class="badge badge-info">Registrado</span>
                        }
                      }
                    </td>
                    <td>
                      <div class="action-buttons-group">
                        @if (r.estado === 1) {
                          <button
                            (click)="aprobarReservacion(r)"
                            class="btn-action-sm btn-approve"
                            title="Aprobar Solicitud"
                          >
                            Aprobar
                          </button>
                        } @else if (r.estado === 2) {
                          <button
                            (click)="finalizarReservacion(r)"
                            class="btn-action-sm btn-finish"
                            title="Marcar como Finalizado"
                          >
                            Concluir
                          </button>
                        }

                        <button
                          (click)="openDetailModal(r)"
                          class="btn-icon-btn"
                          title="Ver detalle completo"
                        >
                          <svg class="icon-xs" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

      <!-- ================================================================= -->
      <!-- MODAL 1: Crear Solicitud de Evento / Reservación -->
      <!-- ================================================================= -->
      @if (showCreateModal()) {
        <div class="modal-overlay" (click)="closeCreateModal()">
          <div class="modal-content card modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <span class="badge-tag">SOLICITUD DE ESPACIO PARA EVENTOS</span>
                <h3>Nueva Solicitud de Reservación de Evento</h3>
              </div>
              <button (click)="closeCreateModal()" class="close-btn">&times;</button>
            </div>

            <form (ngSubmit)="saveReservacion()">
              <div class="modal-body-grid">
                <!-- Tipo de Evento -->
                <div class="form-group">
                  <label>Tipo de Evento Especial *</label>
                  <select class="form-control" [(ngModel)]="formRes.tipoEvento" name="tipoEvento" required>
                    <option value="Taller Especial">🔧 Taller Técnico Especial</option>
                    <option value="Seminario">🎓 Seminario / Conferencia</option>
                    <option value="Capacitación Empresarial">💼 Capacitación Empresarial</option>
                    <option value="Examen / Certificación">📝 Evaluación / Certificación</option>
                    <option value="Práctica de Laboratorio">🔬 Práctica de Laboratorio</option>
                    <option value="Reunión Institucional">🤝 Reunión Institucional / Evento</option>
                    <option value="Otro Evento">✨ Otro Evento Específico</option>
                  </select>
                </div>

                <!-- Salón o Taller -->
                <div class="form-group">
                  <label>Espacio / Salón / Taller Solicitado *</label>
                  <select class="form-control" [(ngModel)]="formRes.salonId" name="salonId" required>
                    <option [ngValue]="null" disabled>-- Selecciona un espacio --</option>
                    @for (s of salonesList(); track s.id) {
                      <option [ngValue]="s.id">
                        {{ s.title }} ({{ s.tipoSalon === 0 ? 'Taller' : 'Salón' }}) - Capacidad: {{ s.cantidadPersonas }} pax
                      </option>
                    }
                  </select>
                </div>

                <!-- Fecha del Evento -->
                <div class="form-group">
                  <label>Fecha Programada del Evento *</label>
                  <input
                    type="date"
                    class="form-control"
                    [(ngModel)]="formRes.fechaEvento"
                    name="fechaEvento"
                    required
                  />
                </div>

                <!-- Horario de Inicio y Fin -->
                <div class="form-group">
                  <label>Horario (Inicio - Fin) *</label>
                  <div class="time-range-group">
                    <input
                      type="time"
                      class="form-control"
                      [(ngModel)]="formRes.horaInicio"
                      name="horaInicio"
                      required
                    />
                    <span class="time-separator">a</span>
                    <input
                      type="time"
                      class="form-control"
                      [(ngModel)]="formRes.horaFin"
                      name="horaFin"
                      required
                    />
                  </div>
                </div>

                <!-- Instructor / Docente Responsable -->
                <div class="form-group">
                  <label>Docente / Instructor Responsable *</label>
                  <select class="form-control" [(ngModel)]="formRes.empleadoId" name="empleadoId" required>
                    <option [ngValue]="null" disabled>-- Selecciona un instructor --</option>
                    @for (e of empleadosList(); track e.id) {
                      <option [ngValue]="e.id">
                        {{ e.nombres }} {{ e.apellidos }} ({{ e.tipoEmpleado?.tipoEmpleado || 'Docente' }})
                      </option>
                    }
                  </select>
                </div>

                <!-- Curso / Tema -->
                <div class="form-group">
                  <label>Curso o Especialidad Vinculada *</label>
                  <select class="form-control" [(ngModel)]="formRes.cursoId" name="cursoId" required>
                    <option [ngValue]="null" disabled>-- Selecciona un curso --</option>
                    @for (c of cursosList(); track c.id) {
                      <option [ngValue]="c.id">{{ c.nombre }}</option>
                    }
                  </select>
                </div>

                <!-- Jornada / Horario de Referencia -->
                <div class="form-group">
                  <label>Jornada de Referencia</label>
                  <select class="form-control" [(ngModel)]="formRes.jornada" name="jornada">
                    <option value="Jornada Única">Jornada Única / Específica</option>
                    @for (j of jornadasList(); track j.id) {
                      <option [value]="j.nombre">{{ j.nombre }}</option>
                    }
                  </select>
                </div>

                <!-- Cantidad de Personas -->
                <div class="form-group">
                  <label>Cantidad Estimada de Participantes *</label>
                  <input
                    type="number"
                    min="1"
                    class="form-control"
                    [(ngModel)]="formRes.cantidadPersonas"
                    name="cantidadPersonas"
                    required
                  />
                </div>

                <!-- Descripción y Justificación -->
                <div class="form-group full-width">
                  <label>Descripción y Justificación del Evento *</label>
                  <textarea
                    class="form-control"
                    rows="3"
                    [(ngModel)]="formRes.descripcion"
                    name="descripcion"
                    placeholder="Describe el objetivo, requerimientos especiales de mobiliario/herramientas o contexto del evento..."
                    required
                  ></textarea>
                </div>

                <!-- Notas internas de seguimiento -->
                <div class="form-group full-width">
                  <label>Bitácora / Notas de Seguimiento</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="formRes.seguimiento"
                    name="seguimiento"
                    placeholder="Ej. Material didáctico entregado, confirmación de proyector, etc."
                  />
                </div>

                <!-- Estado Inicial -->
                <div class="form-group full-width">
                  <label>Estado Inicial de la Solicitud</label>
                  <div class="radio-status-group">
                    <label class="radio-label">
                      <input type="radio" [(ngModel)]="formRes.estado" name="estado" [value]="1" />
                      <span>🟡 Enviar como Solicitud Pendiente (Flujo de Aprobación)</span>
                    </label>
                    <label class="radio-label">
                      <input type="radio" [(ngModel)]="formRes.estado" name="estado" [value]="2" />
                      <span>🟢 Registrar como Directamente Aprobada</span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" (click)="closeCreateModal()" class="btn btn-outline">Cancelar</button>
                <button type="submit" [disabled]="saving()" class="btn btn-gold">
                  {{ saving() ? 'Guardando...' : 'Guardar y Enviar Solicitud' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ================================================================= -->
      <!-- MODAL 2: Rechazar Solicitud con Motivo -->
      <!-- ================================================================= -->
      @if (showRechazoModal() && selectedRes()) {
        <div class="modal-overlay" (click)="closeRechazoModal()">
          <div class="modal-content card modal-sm" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="text-rose">Rechazar Solicitud #{{ selectedRes()?.id }}</h3>
              <button (click)="closeRechazoModal()" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
              <p class="modal-desc">
                Indica el motivo por el cual se rechaza o cancela la reservación del espacio <strong>{{ selectedRes()?.salon?.title }}</strong>:
              </p>
              <div class="form-group">
                <label>Motivo de Rechazo *</label>
                <textarea
                  class="form-control"
                  rows="3"
                  [(ngModel)]="motivoRechazoText"
                  placeholder="Ej. Conflicto de horario con curso curricular, mantenimiento de taller programado..."
                  required
                ></textarea>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" (click)="closeRechazoModal()" class="btn btn-outline">Cancelar</button>
              <button type="button" (click)="confirmarRechazo()" [disabled]="!motivoRechazoText.trim()" class="btn btn-danger">
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ================================================================= -->
      <!-- MODAL 3: Detalle Completo de Auditoría y Bitácora -->
      <!-- ================================================================= -->
      @if (showDetailModal() && selectedRes()) {
        <div class="modal-overlay" (click)="closeDetailModal()">
          <div class="modal-content card modal-md" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <span class="badge-tag">HISTORIAL Y AUDITORÍA DE SOLICITUD</span>
                <h3>Detalle de Reservación #{{ selectedRes()?.id }}</h3>
              </div>
              <button (click)="closeDetailModal()" class="close-btn">&times;</button>
            </div>

            <div class="audit-body">
              <!-- Header Summary Grid -->
              <div class="audit-header-grid">
                <div class="audit-item">
                  <span class="audit-label">Tipo de Evento</span>
                  <span class="audit-value font-bold text-navy">{{ selectedRes()?.tipoEvento || 'Taller Especial' }}</span>
                </div>

                <div class="audit-item">
                  <span class="audit-label">Estado Actual</span>
                  <div>
                    @switch (selectedRes()?.estado) {
                      @case (1) { <span class="badge badge-warning">⏳ Pendiente de Aprobación</span> }
                      @case (2) { <span class="badge badge-success">✅ Aprobado</span> }
                      @case (3) { <span class="badge badge-danger">❌ Rechazado</span> }
                      @case (4) { <span class="badge badge-secondary">🏁 Finalizado</span> }
                    }
                  </div>
                </div>

                <div class="audit-item">
                  <span class="audit-label">Espacio Asignado</span>
                  <span class="audit-value font-bold">{{ selectedRes()?.salon?.title }}</span>
                </div>

                <div class="audit-item">
                  <span class="audit-label">Fecha y Horario</span>
                  <span class="audit-value">
                    📅 {{ selectedRes()?.fechaEvento || 'No especificada' }}
                    (⏰ {{ selectedRes()?.horaInicio || '08:00' }} - {{ selectedRes()?.horaFin || '12:00' }})
                  </span>
                </div>

                <div class="audit-item">
                  <span class="audit-label">Docente Responsable</span>
                  <span class="audit-value">
                    {{ selectedRes()?.empleado?.nombres }} {{ selectedRes()?.empleado?.apellidos }}
                  </span>
                </div>

                <div class="audit-item">
                  <span class="audit-label">Curso / Tema</span>
                  <span class="audit-value">{{ selectedRes()?.curso?.nombre }}</span>
                </div>

                <div class="audit-item">
                  <span class="audit-label">Participantes</span>
                  <span class="audit-value">{{ selectedRes()?.cantidadPersonas }} alumnos</span>
                </div>

                <div class="audit-item">
                  <span class="audit-label">Fecha de Solicitud (Registro)</span>
                  <span class="audit-value">{{ selectedRes()?.createdAt | date:'medium' }}</span>
                </div>
              </div>

              <!-- Motivo de Rechazo if any -->
              @if (selectedRes()?.motivoRechazo) {
                <div class="audit-alert-box alert-danger">
                  <strong>⚠️ Motivo de Rechazo / Cancelación:</strong>
                  <p>{{ selectedRes()?.motivoRechazo }}</p>
                </div>
              }

              <!-- Description -->
              <div class="audit-section">
                <span class="audit-label">Descripción y Justificación:</span>
                <p class="audit-text">{{ selectedRes()?.descripcion || 'Sin descripción ingresada.' }}</p>
              </div>

              <!-- Follow up / Tracking -->
              @if (selectedRes()?.seguimiento) {
                <div class="audit-section">
                  <span class="audit-label">Bitácora de Seguimiento:</span>
                  <p class="audit-text">{{ selectedRes()?.seguimiento }}</p>
                </div>
              }
            </div>

            <div class="modal-actions">
              <button (click)="closeDetailModal()" class="btn btn-outline">Cerrar</button>
              @if (selectedRes()?.estado === 1) {
                <button (click)="aprobarDesdeModal()" class="btn btn-gold">✅ Aprobar Esta Solicitud</button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .reservaciones-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .badge-tag {
      display: inline-block;
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--intecap-navy);
      background: var(--intecap-blue-light);
      padding: 0.15rem 0.55rem;
      border-radius: var(--radius-sm);
      letter-spacing: 0.5px;
      margin-bottom: 0.35rem;
    }

    .page-header h1 {
      font-size: 1.45rem;
      color: var(--intecap-navy-dark);
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .subtitle {
      color: var(--text-secondary);
      font-size: 0.85rem;
      max-width: 800px;
    }

    /* KPI Stats Cards */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.85rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--intecap-blue);
    }

    .stat-card.active-filter {
      border-color: var(--intecap-navy);
      background: #F8FAFC;
      box-shadow: 0 0 0 2px var(--intecap-navy-light);
    }

    .stat-icon {
      font-size: 1.35rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
    }

    .bg-navy-light { background: #E0E7FF; }
    .bg-amber-light { background: #FEF3C7; }
    .bg-emerald-light { background: #D1FAE5; }
    .bg-rose-light { background: #FFE4E6; }
    .bg-blue-light { background: #E0F2FE; }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.72rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .stat-value {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--intecap-navy-dark);
      line-height: 1.1;
    }

    .text-amber { color: #D97706; }
    .text-emerald { color: #059669; }
    .text-rose { color: #E11D48; }

    /* Filter Bar */
    .filter-bar-card {
      padding: 0.75rem 1rem;
    }

    .filter-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 260px;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      color: var(--text-muted);
    }

    .search-input {
      width: 100%;
      height: 38px;
      padding: 0.45rem 2rem 0.45rem 2.25rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      border-color: var(--intecap-blue);
      box-shadow: 0 0 0 2px var(--intecap-blue-light);
    }

    .clear-search-btn {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      font-size: 1.1rem;
      color: var(--text-muted);
      cursor: pointer;
    }

    .state-pills {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    .pill-btn {
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.78rem;
      font-weight: 600;
      background: var(--bg-main);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      cursor: pointer;
      transition: all 0.15s;
    }

    .pill-btn:hover {
      background: var(--border-color);
    }

    .pill-btn.active {
      background: var(--intecap-navy);
      color: #FFF;
      border-color: var(--intecap-navy);
    }

    .pill-pending.active {
      background: #D97706;
      border-color: #D97706;
    }

    .pill-approved.active {
      background: #059669;
      border-color: #059669;
    }

    .pill-rejected.active {
      background: #E11D48;
      border-color: #E11D48;
    }

    .pill-finished.active {
      background: #475569;
      border-color: #475569;
    }

    /* Table & Rows */
    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .data-table th {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-secondary);
      background: #F8FAFC;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .data-table td {
      padding: 0.65rem 1rem;
      vertical-align: middle;
      border-bottom: 1px solid var(--border-subtle);
    }

    .cell-main {
      font-size: 0.84rem;
      color: var(--text-primary);
      line-height: 1.25;
    }

    .cell-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    .text-truncate {
      max-width: 180px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .event-pill {
      display: inline-block;
      font-size: 0.74rem;
      font-weight: 600;
      color: var(--intecap-navy);
      background: #EFF6FF;
      border: 1px solid #DBEAFE;
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-full);
    }

    /* Action Buttons */
    .action-buttons-group {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.4rem;
    }

    .btn-action-sm {
      padding: 0.25rem 0.6rem;
      border-radius: var(--radius-sm);
      font-size: 0.74rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: opacity 0.15s;
    }

    .btn-action-sm:hover {
      opacity: 0.9;
    }

    .btn-approve {
      background: #10B981;
      color: #FFF;
    }

    .btn-finish {
      background: var(--intecap-navy);
      color: #FFF;
    }

    .btn-icon-btn {
      background: none;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 0.15s;
    }

    .btn-icon-btn:hover {
      background: #F1F5F9;
      color: var(--intecap-navy);
      border-color: var(--intecap-navy-light);
    }

    .icon-xs {
      width: 14px;
      height: 14px;
    }

    /* Modals */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 26, 61, 0.45);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: #FFF;
      border-radius: var(--radius-lg);
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border-color);
      padding: 1.5rem;
    }

    .modal-sm { width: 100%; max-width: 440px; }
    .modal-md { width: 100%; max-width: 600px; }
    .modal-lg { width: 100%; max-width: 780px; }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 0.75rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--text-muted);
      cursor: pointer;
      line-height: 1;
    }

    .modal-body-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.85rem 1rem;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .time-range-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .time-separator {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    .radio-status-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      background: #F8FAFC;
      padding: 0.75rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.82rem;
      cursor: pointer;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.25rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
    }

    /* Audit Modal Styles */
    .audit-header-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem 1rem;
      background: #F8FAFC;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .audit-item {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .audit-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .audit-value {
      font-size: 0.85rem;
      color: var(--text-primary);
    }

    .audit-alert-box {
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      margin-bottom: 1rem;
      font-size: 0.82rem;
    }

    .alert-danger {
      background: #FEF2F2;
      border: 1px solid #FECACA;
      color: #991B1B;
    }

    .audit-section {
      margin-bottom: 0.85rem;
    }

    .audit-text {
      font-size: 0.85rem;
      color: var(--text-secondary);
      background: #FAFAFA;
      border-left: 3px solid var(--intecap-blue);
      padding: 0.6rem 0.85rem;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      margin-top: 0.25rem;
    }

    /* Loading & Empty */
    .loading-state, .empty-state {
      padding: 3rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .empty-icon {
      font-size: 2.5rem;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(0, 47, 108, 0.1);
      border-top-color: var(--intecap-navy);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .modal-body-grid, .audit-header-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class ReservacionesComponent implements OnInit {
  private api = inject(ApiService);
  private ws = inject(WebSocketService);

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
          this.loadStats();
          this.loadReservaciones(false);
        },
        error: (err) => alert('Error al aprobar solicitud: ' + (err.error?.message || err.message)),
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
          this.loadStats();
          this.loadReservaciones(false);
        },
        error: (err) => alert('Error al finalizar evento: ' + (err.error?.message || err.message)),
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
        this.loadStats();
        this.loadReservaciones(false);
      },
      error: (err) => alert('Error al rechazar solicitud: ' + (err.error?.message || err.message)),
    });
  }

  deleteReservacion(r: Reservacion) {
    if (confirm(`¿Estás seguro de eliminar el registro de reservación #${r.id}?`)) {
      this.api.deleteReservacion(r.id).subscribe({
        next: () => {
          this.loadStats();
          this.loadReservaciones(false);
        },
        error: (err) => alert('Error al eliminar reservación: ' + (err.error?.message || err.message)),
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
      alert('Por favor completa los campos requeridos (Salón, Instructor y Curso).');
      return;
    }

    this.saving.set(true);
    this.api.createReservacion(this.formRes).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeCreateModal();
        this.loadStats();
        this.loadReservaciones(false);
      },
      error: (err) => {
        this.saving.set(false);
        alert('Error al guardar solicitud: ' + (err.error?.message || err.message));
      },
    });
  }
}
