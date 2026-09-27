import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { RealtimeSalonStatus, RealtimeResponse } from '../../core/models';

@Component({
  selector: 'app-tv-display',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="tv-container" [class.fullscreen]="isFullscreen()">
      <!-- Top TV Header -->
      <header class="tv-header">
        <div class="tv-brand">
          <div class="brand-badge">INTECAP</div>
          <div class="brand-titles">
            <h1 class="tv-main-title">PROGRAMACIÓN Y ASIGNACIÓN DE SALONES Y TALLERES</h1>
            <p class="tv-subtitle">PANEL INFORMATIVO EN TIEMPO REAL PARA ESTUDIANTES Y DOCENTES</p>
          </div>
        </div>

        <div class="tv-header-center">
          <div class="shift-badge">
            <span class="shift-icon">{{ currentTurnoIcon() }}</span>
            <div class="shift-text">
              <span class="shift-label">TURNO ACTUAL</span>
              <span class="shift-name">{{ currentTurnoNombre() }}</span>
            </div>
          </div>

          <div class="live-indicator">
            <span class="pulse-ring"></span>
            <span class="live-dot"></span>
            <span class="live-text">TRANSMISIÓN EN VIVO</span>
          </div>
        </div>

        <div class="tv-clock-panel">
          <div class="tv-clock-box">
            <div class="tv-time">{{ currentTime() }}</div>
            <div class="tv-date">{{ currentDate() }}</div>
          </div>
          <div class="tv-controls">
            <button class="tv-btn" (click)="toggleFullscreen()" [title]="isFullscreen() ? 'Salir de pantalla completa' : 'Pantalla completa'">
              <svg class="tv-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                @if (!isFullscreen()) {
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                } @else {
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                }
              </svg>
            </button>
            <a routerLink="/dashboard" class="tv-btn" title="Volver al Panel Administrativo">
              <svg class="tv-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <!-- KPI Summary Bar & Category Filter & TV Rotation Controls -->
      <div class="tv-stats-bar">
        <div class="tv-filter-chips">
          <button class="chip-filter" [class.active]="filterCategory() === 'todos'" (click)="setFilter('todos')">
            🏢 Todos los Espacios ({{ totalCount() }})
          </button>
          <button class="chip-filter chip-talleres" [class.active]="filterCategory() === 'talleres'" (click)="setFilter('talleres')">
            🔧 Solo Talleres Técnicos ({{ talleresCount() }})
          </button>
          <button class="chip-filter chip-salones" [class.active]="filterCategory() === 'salones'" (click)="setFilter('salones')">
            🏛️ Solo Aulas Teóricas ({{ salonesCount() }})
          </button>
          <button class="chip-filter chip-en-clase" [class.active]="filterCategory() === 'ocupados'" (click)="setFilter('ocupados')">
            🟢 En Clase Ahora ({{ ocupadosCount() }})
          </button>
          <button class="chip-filter chip-libres" [class.active]="filterCategory() === 'libres'" (click)="setFilter('libres')">
            🔵 Libres / Disponibles ({{ disponiblesCount() }})
          </button>
        </div>

        <div class="tv-bar-right">
          <!-- KPI Summary -->
          <div class="tv-kpi-summary">
            <div class="kpi-mini">
              <span class="kpi-num text-emerald">{{ ocupadosCount() }}</span>
              <span class="kpi-lbl">En Clase</span>
            </div>
            <div class="kpi-divider"></div>
            <div class="kpi-mini">
              <span class="kpi-num text-sky">{{ disponiblesCount() }}</span>
              <span class="kpi-lbl">Libres</span>
            </div>
            <div class="kpi-divider"></div>
            <div class="kpi-mini">
              <span class="kpi-num text-gold">{{ porcentajeOcupacion() }}%</span>
              <span class="kpi-lbl">Ocupación</span>
            </div>
          </div>

          <!-- TV Multi-Page Rotation Controls for Smart TV / Kiosk -->
          @if (totalPages() > 1) {
            <div class="tv-pagination-widget">
              <button class="page-nav-btn" (click)="prevPage()" title="Página anterior">
                ‹
              </button>

              <div class="page-info-box">
                <span class="page-text">Pág. {{ currentPage() }}/{{ totalPages() }}</span>
                <div class="rotation-progress-track" [title]="autoRotate() ? 'Rotación automática activa (' + (12 - currentProgressSeconds()) + 's)' : 'Rotación en pausa'">
                  <div class="rotation-progress-bar" [style.width.%]="autoRotate() ? progressPercent() : 0"></div>
                </div>
              </div>

              <button class="page-nav-btn" (click)="nextPage()" title="Página siguiente">
                ›
              </button>

              <button class="page-toggle-btn" (click)="toggleAutoRotate()" [title]="autoRotate() ? 'Pausar rotación automática de pantallas' : 'Reanudar rotación automática de pantallas'">
                {{ autoRotate() ? '⏸️' : '▶️' }}
              </button>
            </div>
          }
        </div>
      </div>

      <!-- TV Main Content Grid -->
      <main class="tv-body">
        @if (loading()) {
          <div class="tv-loading">
            <div class="tv-spinner"></div>
            <h2>Sincronizando información de salones en tiempo real...</h2>
          </div>
        } @else if (filteredSalones().length === 0) {
          <div class="tv-empty">
            <div class="empty-icon">🏛️</div>
            <h2>No se encontraron salones que coincidan con el filtro</h2>
          </div>
        } @else {
          <div class="tv-grid" [class.page-transition]="isTransitioning()">
            @for (s of paginatedSalones(); track s.id) {
              <div class="tv-card" [class.occupied]="isOcupado(s)" [class.available]="!isOcupado(s)">
                <!-- Card Header -->
                <div class="card-top">
                  <div class="space-identity">
                    <span class="space-type-tag" [class.tag-taller]="s.tipoSalon === 0" [class.tag-salon]="s.tipoSalon === 1">
                      {{ s.tipoSalon === 0 ? '🔧 TALLER' : '🏛️ AULA' }}
                    </span>
                    <h2 class="space-title">{{ s.title }}</h2>
                  </div>

                  <div class="space-status-badge" [class.status-in-class]="isOcupado(s)" [class.status-free]="!isOcupado(s)">
                    @if (isOcupado(s)) {
                      <span class="status-dot green"></span>
                      <span class="status-text">EN CLASE</span>
                    } @else {
                      <span class="status-dot blue"></span>
                      <span class="status-text">DISPONIBLE</span>
                    }
                  </div>
                </div>

                <!-- Card Body (Current Course & Details) -->
                <div class="card-main-info">
                  @if (isOcupado(s)) {
                    <div class="active-course-box">
                      <span class="course-label">CURSO O ESPECIALIDAD EN IMPARTICIÓN:</span>
                      <h3 class="course-title">{{ getCursoActual(s) || 'Capacitación Técnica INTECAP' }}</h3>
                      
                      <div class="course-details">
                        <div class="detail-item">
                          <span class="detail-icon">👥</span>
                          <span class="detail-val font-semibold">Capacidad: {{ s.cantidadPersonas }} estudiantes</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-icon">⏰</span>
                          <span class="detail-val">{{ currentTurnoHorario() }}</span>
                        </div>
                      </div>
                    </div>
                  } @else {
                    <div class="free-space-box">
                      <div class="free-icon">✨</div>
                      <div class="free-text">
                        <h4>Espacio Disponible</h4>
                        <p>Libre para prácticas de taller, estudio guiado o asignación de grupo.</p>
                      </div>
                    </div>
                  }
                </div>

                <!-- Daily Schedule Mini-Timeline -->
                <div class="card-footer-schedule">
                  <div class="shift-slot" [class.active-slot]="isShiftNow('manana')" [class.has-class]="s.turnos.manana.ocupado">
                    <span class="slot-name">Mañana</span>
                    <span class="slot-course">{{ s.turnos.manana.curso || 'Libre' }}</span>
                  </div>
                  <div class="shift-slot" [class.active-slot]="isShiftNow('tarde')" [class.has-class]="s.turnos.tarde.ocupado">
                    <span class="slot-name">Tarde</span>
                    <span class="slot-course">{{ s.turnos.tarde.curso || 'Libre' }}</span>
                  </div>
                  <div class="shift-slot" [class.active-slot]="isShiftNow('noche')" [class.has-class]="s.turnos.noche.ocupado">
                    <span class="slot-name">Noche</span>
                    <span class="slot-course">{{ s.turnos.noche.curso || 'Libre' }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </main>

      <!-- Bottom Info Ticker -->
      <footer class="tv-footer-ticker">
        <div class="ticker-badge">📢 AVISOS INTECAP</div>
        <div class="ticker-track">
          <div class="ticker-content">
            ✦ BIENVENIDOS A INTECAP • Recuerda portar tu carnet institucional y equipo de protección personal (EPP) dentro de los talleres técnicos •
            ✦ Las reservaciones de eventos extraordinarios se confirman en Administración •
            ✦ Sistema de Salones en tiempo real sincronizado mediante WebSockets •
            ✦ Horarios de Atención: Lunes a Domingo •
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    /* Host Reset */
    :host {
      display: block;
      width: 100vw;
      min-height: 100vh;
      background-color: #0A1128;
      color: #FFFFFF;
      font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
      overflow-x: hidden;
    }

    .tv-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: radial-gradient(circle at 10% 10%, #0F1C3F 0%, #070D1E 100%);
    }

    .tv-container.fullscreen {
      position: fixed;
      inset: 0;
      z-index: 99999;
      width: 100vw;
      height: 100vh;
    }

    /* =========================================================================
       HEADER (TV Topbar)
       ========================================================================= */
    .tv-header {
      background: rgba(10, 21, 51, 0.95);
      border-bottom: 2px solid rgba(253, 184, 19, 0.3);
      padding: 0.75rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.25rem;
      backdrop-filter: blur(12px);
      flex-shrink: 0;
    }

    .tv-brand {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-shrink: 0;
    }

    .brand-badge {
      background: linear-gradient(135deg, #FDB813 0%, #D97706 100%);
      color: #001A3D;
      font-weight: 900;
      font-size: 1.5rem;
      letter-spacing: 0.12em;
      padding: 0.3rem 0.9rem;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(253, 184, 19, 0.4);
    }

    .brand-titles {
      display: flex;
      flex-direction: column;
    }

    .tv-main-title {
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      color: #FFFFFF;
      margin: 0;
      line-height: 1.2;
    }

    .tv-subtitle {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: #FDB813;
      margin: 0;
    }

    .tv-header-center {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex-shrink: 0;
    }

    .shift-badge {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 0.35rem 0.85rem;
      border-radius: 30px;
    }

    .shift-icon {
      font-size: 1.25rem;
    }

    .shift-text {
      display: flex;
      flex-direction: column;
    }

    .shift-label {
      font-size: 0.58rem;
      color: #94A3B8;
      font-weight: 700;
      letter-spacing: 0.08em;
    }

    .shift-name {
      font-size: 0.85rem;
      font-weight: 800;
      color: #F8FAFC;
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      padding: 0.35rem 0.85rem;
      border-radius: 30px;
      position: relative;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      background: #10B981;
      border-radius: 50%;
    }

    .pulse-ring {
      position: absolute;
      left: 10px;
      width: 8px;
      height: 8px;
      background: rgba(16, 185, 129, 0.6);
      border-radius: 50%;
      animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
    }

    @keyframes ping {
      75%, 100% {
        transform: scale(2.8);
        opacity: 0;
      }
    }

    .live-text {
      font-size: 0.7rem;
      font-weight: 800;
      color: #10B981;
      letter-spacing: 0.08em;
    }

    /* Clock & Fullscreen Controls */
    .tv-clock-panel {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-shrink: 0;
    }

    .tv-clock-box {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      text-align: right;
    }

    .tv-time {
      font-size: 1.5rem;
      font-weight: 800;
      font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
      font-variant-numeric: tabular-nums;
      color: #38BDF8;
      letter-spacing: 0.04em;
      line-height: 1.1;
      white-space: nowrap;
      text-shadow: 0 0 14px rgba(56, 189, 248, 0.35);
    }

    .tv-date {
      font-size: 0.76rem;
      color: #CBD5E1;
      font-weight: 600;
      white-space: nowrap;
      margin-top: 0.15rem;
    }

    .tv-controls {
      display: flex;
      gap: 0.4rem;
    }

    .tv-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #F8FAFC;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;

      &:hover {
        background: #FDB813;
        color: #001A3D;
        border-color: #FDB813;
      }
    }

    .tv-icon {
      width: 18px;
      height: 18px;
    }

    /* =========================================================================
       SUBBAR & FILTERS & TV CONTROLS
       ========================================================================= */
    .tv-stats-bar {
      background: rgba(6, 15, 38, 0.88);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 0.55rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      flex-shrink: 0;
    }

    .tv-filter-chips {
      display: flex;
      gap: 0.45rem;
      flex-wrap: wrap;
    }

    .chip-filter {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #CBD5E1;
      padding: 0.32rem 0.75rem;
      border-radius: 20px;
      font-size: 0.76rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      &.active {
        background: #0284C7;
        color: #FFFFFF;
        border-color: #38BDF8;
        box-shadow: 0 0 12px rgba(2, 132, 199, 0.5);
      }
    }

    .chip-talleres.active {
      background: #D97706;
      border-color: #FDB813;
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
    }

    .chip-en-clase.active {
      background: #059669;
      border-color: #10B981;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
    }

    .chip-libres.active {
      background: #2563EB;
      border-color: #60A5FA;
    }

    .tv-bar-right {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex-wrap: wrap;
    }

    .tv-kpi-summary {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.25rem 0.75rem;
      border-radius: 8px;
    }

    .kpi-mini {
      display: flex;
      align-items: baseline;
      gap: 0.3rem;
    }

    .kpi-num {
      font-size: 1.1rem;
      font-weight: 800;
      line-height: 1;
    }

    .kpi-lbl {
      font-size: 0.65rem;
      color: #94A3B8;
      font-weight: 600;
    }

    .kpi-divider {
      width: 1px;
      height: 14px;
      background: rgba(255, 255, 255, 0.15);
    }

    .text-emerald { color: #34D399; }
    .text-sky { color: #38BDF8; }
    .text-gold { color: #FBBF24; }

    /* TV Pagination / Auto-Rotation Widget */
    .tv-pagination-widget {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(15, 28, 63, 0.8);
      border: 1px solid rgba(253, 184, 19, 0.4);
      padding: 0.2rem 0.5rem;
      border-radius: 20px;
    }

    .page-nav-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #FFFFFF;
      font-size: 1rem;
      font-weight: 800;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      line-height: 1;

      &:hover {
        background: #FDB813;
        color: #001A3D;
      }
    }

    .page-info-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 60px;
    }

    .page-text {
      font-size: 0.68rem;
      font-weight: 800;
      color: #F8FAFC;
      letter-spacing: 0.5px;
    }

    .rotation-progress-track {
      width: 100%;
      height: 3px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 2px;
      overflow: hidden;
      margin-top: 2px;
    }

    .rotation-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #38BDF8, #FDB813);
      border-radius: 2px;
      transition: width 0.1s linear;
    }

    .page-toggle-btn {
      background: none;
      border: none;
      font-size: 0.75rem;
      cursor: pointer;
      padding: 0 0.15rem;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.2);
      }
    }

    /* =========================================================================
       MAIN GRID & ROOM CARDS
       ========================================================================= */
    .tv-body {
      flex: 1;
      padding: 1.25rem 1.5rem;
      overflow-y: auto;
    }

    .tv-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
      transition: opacity 0.25s ease, transform 0.25s ease;
    }

    .tv-grid.page-transition {
      opacity: 0.15;
      transform: scale(0.99);
    }

    .tv-card {
      background: rgba(15, 28, 63, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
      }

      &.occupied {
        border-color: rgba(16, 185, 129, 0.45);
        background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 28, 63, 0.85) 100%);
      }

      &.available {
        border-color: rgba(2, 132, 199, 0.3);
      }
    }

    .card-top {
      padding: 0.8rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(0, 0, 0, 0.2);
    }

    .space-identity {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      overflow: hidden;
    }

    .space-type-tag {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      letter-spacing: 0.5px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .tag-taller {
      background: #D97706;
      color: #FFF;
    }

    .tag-salon {
      background: #0284C7;
      color: #FFF;
    }

    .space-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #F8FAFC;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .space-status-badge {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.6rem;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .status-in-class {
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid #10B981;
      color: #34D399;
    }

    .status-free {
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid #38BDF8;
      color: #38BDF8;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .status-dot.green { background: #10B981; }
    .status-dot.blue { background: #38BDF8; }

    /* Card Main Info */
    .card-main-info {
      padding: 0.95rem 1rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 96px;
    }

    .active-course-box {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .course-label {
      font-size: 0.63rem;
      color: #FDB813;
      font-weight: 800;
      letter-spacing: 0.08em;
    }

    .course-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #FFFFFF;
      margin: 0;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .course-details {
      display: flex;
      flex-wrap: wrap;
      gap: 0.85rem;
      margin-top: 0.35rem;
      padding-top: 0.45rem;
      border-top: 1px dashed rgba(255, 255, 255, 0.1);
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.76rem;
      color: #CBD5E1;
    }

    .free-space-box {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.35rem 0;
    }

    .free-icon {
      font-size: 1.6rem;
      flex-shrink: 0;
    }

    .free-text h4 {
      font-size: 0.95rem;
      color: #38BDF8;
      margin: 0 0 0.15rem;
      font-weight: 700;
    }

    .free-text p {
      font-size: 0.74rem;
      color: #94A3B8;
      margin: 0;
      line-height: 1.3;
    }

    /* Card Footer Mini Timeline */
    .card-footer-schedule {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(0, 0, 0, 0.25);
    }

    .shift-slot {
      padding: 0.45rem 0.6rem;
      display: flex;
      flex-direction: column;
      border-right: 1px solid rgba(255, 255, 255, 0.06);

      &:last-child {
        border-right: none;
      }

      &.active-slot {
        background: rgba(253, 184, 19, 0.12);
        border-top: 2px solid #FDB813;
      }
    }

    .slot-name {
      font-size: 0.62rem;
      font-weight: 700;
      color: #94A3B8;
      text-transform: uppercase;
    }

    .slot-course {
      font-size: 0.72rem;
      color: #F8FAFC;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 0.15rem;
    }

    .has-class .slot-course {
      color: #34D399;
    }

    /* =========================================================================
       BOTTOM TICKER (News Broadcast)
       ========================================================================= */
    .tv-footer-ticker {
      background: #001A3D;
      border-top: 2px solid #FDB813;
      height: 38px;
      display: flex;
      align-items: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    .ticker-badge {
      background: #FDB813;
      color: #001A3D;
      font-weight: 900;
      font-size: 0.75rem;
      padding: 0 1rem;
      height: 100%;
      display: flex;
      align-items: center;
      white-space: nowrap;
      z-index: 2;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.5);
    }

    .ticker-track {
      flex: 1;
      overflow: hidden;
      white-space: nowrap;
      position: relative;
    }

    .ticker-content {
      display: inline-block;
      padding-left: 100%;
      animation: ticker 35s linear infinite;
      font-size: 0.8rem;
      font-weight: 600;
      color: #E2E8F0;
      letter-spacing: 0.5px;
    }

    @keyframes ticker {
      0% { transform: translate3d(0, 0, 0); }
      100% { transform: translate3d(-100%, 0, 0); }
    }

    /* Loading & Empty States */
    .tv-loading, .tv-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
      gap: 1rem;
      text-align: center;
    }

    .tv-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-top-color: #FDB813;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 1200px) {
      .tv-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .tv-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .tv-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class TvDisplayComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private ws = inject(WebSocketService);

  // Realtime Data Signals
  realtimeData = signal<RealtimeResponse | null>(null);
  loading = signal<boolean>(true);
  filterCategory = signal<'todos' | 'talleres' | 'salones' | 'ocupados' | 'libres'>('todos');
  isFullscreen = signal<boolean>(false);

  // TV Multi-Page & Automatic Rotation Signals
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(6); // 6 cards fits perfectly on standard 1080p and 4K displays in 3x2 grid
  autoRotate = signal<boolean>(true);
  rotateDurationSeconds = 12; // 12 seconds per page
  progressPercent = signal<number>(0);
  isTransitioning = signal<boolean>(false);

  // Time & Date Signals
  currentTime = signal<string>('');
  currentDate = signal<string>('');
  private timeInterval: any;
  private pollInterval: any;
  private rotationInterval: any;

  // Computed Values
  salonesList = computed(() => this.realtimeData()?.data || []);
  
  totalCount = computed(() => this.salonesList().length);
  talleresCount = computed(() => this.salonesList().filter(s => s.tipoSalon === 0).length);
  salonesCount = computed(() => this.salonesList().filter(s => s.tipoSalon === 1).length);
  ocupadosCount = computed(() => this.salonesList().filter(s => this.isOcupado(s)).length);
  disponiblesCount = computed(() => this.salonesList().filter(s => !this.isOcupado(s)).length);
  
  porcentajeOcupacion = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.ocupadosCount() / total) * 100);
  });

  filteredSalones = computed(() => {
    const list = this.salonesList();
    const filter = this.filterCategory();

    switch (filter) {
      case 'talleres':
        return list.filter(s => s.tipoSalon === 0);
      case 'salones':
        return list.filter(s => s.tipoSalon === 1);
      case 'ocupados':
        return list.filter(s => this.isOcupado(s));
      case 'libres':
        return list.filter(s => !this.isOcupado(s));
      default:
        return list;
    }
  });

  totalPages = computed(() => {
    const total = this.filteredSalones().length;
    const perPage = this.itemsPerPage();
    return Math.max(1, Math.ceil(total / perPage));
  });

  paginatedSalones = computed(() => {
    const list = this.filteredSalones();
    const page = Math.min(this.currentPage(), this.totalPages());
    const perPage = this.itemsPerPage();
    const startIndex = (page - 1) * perPage;
    return list.slice(startIndex, startIndex + perPage);
  });

  currentProgressSeconds = computed(() => {
    return Math.round((this.progressPercent() / 100) * this.rotateDurationSeconds);
  });

  isOcupado(s: RealtimeSalonStatus): boolean {
    const hour = new Date().getHours();
    if (hour < 12) return !!s.turnos?.manana?.ocupado;
    if (hour < 18) return !!s.turnos?.tarde?.ocupado;
    return !!s.turnos?.noche?.ocupado;
  }

  getCursoActual(s: RealtimeSalonStatus): string | null {
    const hour = new Date().getHours();
    if (hour < 12) return s.turnos?.manana?.curso || null;
    if (hour < 18) return s.turnos?.tarde?.curso || null;
    return s.turnos?.noche?.curso || null;
  }

  ngOnInit() {
    this.updateClock();
    this.timeInterval = setInterval(() => this.updateClock(), 1000);

    this.loadRealtimeData();
    this.startRotationTimer();

    // Sincronización en vivo por WebSocket
    this.ws.onDisponibilidadUpdate().subscribe(() => {
      this.loadRealtimeData(false);
    });

    this.ws.onNuevaReservacion().subscribe(() => {
      this.loadRealtimeData(false);
    });

    // Polling de respaldo cada 30 segundos
    this.pollInterval = setInterval(() => {
      this.loadRealtimeData(false);
    }, 30000);
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.rotationInterval) clearInterval(this.rotationInterval);
  }

  startRotationTimer() {
    const stepMs = 100;
    const totalSteps = (this.rotateDurationSeconds * 1000) / stepMs;
    const increment = 100 / totalSteps;

    this.rotationInterval = setInterval(() => {
      if (!this.autoRotate() || this.totalPages() <= 1) {
        return;
      }

      const nextVal = this.progressPercent() + increment;
      if (nextVal >= 100) {
        this.progressPercent.set(0);
        this.nextPage();
      } else {
        this.progressPercent.set(nextVal);
      }
    }, stepMs);
  }

  nextPage() {
    if (this.totalPages() <= 1) return;
    this.isTransitioning.set(true);
    setTimeout(() => {
      const next = this.currentPage() >= this.totalPages() ? 1 : this.currentPage() + 1;
      this.currentPage.set(next);
      this.progressPercent.set(0);
      this.isTransitioning.set(false);
    }, 200);
  }

  prevPage() {
    if (this.totalPages() <= 1) return;
    this.isTransitioning.set(true);
    setTimeout(() => {
      const prev = this.currentPage() <= 1 ? this.totalPages() : this.currentPage() - 1;
      this.currentPage.set(prev);
      this.progressPercent.set(0);
      this.isTransitioning.set(false);
    }, 200);
  }

  toggleAutoRotate() {
    this.autoRotate.set(!this.autoRotate());
    if (!this.autoRotate()) {
      this.progressPercent.set(0);
    }
  }

  updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    this.currentTime.set(`${strHours}:${minutes}:${seconds} ${ampm.toUpperCase()}`);

    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('es-GT', options);
    this.currentDate.set(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));
  }

  loadRealtimeData(showSpinner = true) {
    if (showSpinner) this.loading.set(true);
    this.api.getRealtimeDisponibilidad().subscribe({
      next: (res) => {
        this.realtimeData.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando datos en tiempo real para display TV:', err);
        this.loading.set(false);
      },
    });
  }

  setFilter(category: 'todos' | 'talleres' | 'salones' | 'ocupados' | 'libres') {
    this.filterCategory.set(category);
    this.currentPage.set(1);
    this.progressPercent.set(0);
  }

  currentTurnoNombre(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Jornada Matutina';
    if (hour < 18) return 'Jornada Vespertina';
    return 'Jornada Nocturna';
  }

  currentTurnoHorario(): string {
    const hour = new Date().getHours();
    if (hour < 12) return '07:30 - 12:00';
    if (hour < 18) return '13:00 - 17:30';
    return '18:00 - 21:00';
  }

  currentTurnoIcon(): string {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 18) return '🌤️';
    return '🌙';
  }

  isShiftNow(shift: 'manana' | 'tarde' | 'noche'): boolean {
    const hour = new Date().getHours();
    if (shift === 'manana') return hour < 12;
    if (shift === 'tarde') return hour >= 12 && hour < 18;
    return hour >= 18;
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        this.isFullscreen.set(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        this.isFullscreen.set(false);
      }).catch(() => {});
    }
  }
}
