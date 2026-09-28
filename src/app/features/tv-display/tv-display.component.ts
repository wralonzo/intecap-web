import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { RealtimeSalonStatus, RealtimeResponse, Aviso } from '../../core/models';

@Component({
  selector: 'app-tv-display',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tv-display.component.html',
  styleUrl: './tv-display.component.scss',
})
export class TvDisplayComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly ws = inject(WebSocketService);

  // Realtime Data Signals
  realtimeData = signal<RealtimeResponse | null>(null);
  avisosTv = signal<Aviso[]>([]);
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
  talleresCount = computed(
    () => this.salonesList().filter((s) => s.tipoSalon === 0 || s.roomType === 0).length,
  );
  salonesCount = computed(
    () => this.salonesList().filter((s) => s.tipoSalon === 1 || s.roomType === 1).length,
  );
  ocupadosCount = computed(() => this.salonesList().filter((s) => this.isOcupado(s)).length);
  disponiblesCount = computed(() => this.salonesList().filter((s) => !this.isOcupado(s)).length);

  porcentajeOcupacion = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.ocupadosCount() / total) * 100);
  });

  // Top Urgent Notice (Priority 1 or type 'urgente')
  urgentNotice = computed(() => {
    return (
      this.avisosTv().find(
        (a) =>
          a.tipo === 'urgente' || a.type === 'urgente' || a.prioridad === 1 || a.priority === 1,
      ) || null
    );
  });

  // Formatted ticker text with all active TV notices
  tickerText = computed(() => {
    const list = this.avisosTv();
    if (list.length === 0) {
      return '✦ BIENVENIDOS A INTECAP • Recuerda portar tu carnet institucional y equipo de protección personal (EPP) dentro de los talleres técnicos • ✦ Las reservaciones de eventos extraordinarios se confirman en Administración • ✦ Sistema de Salones en tiempo real sincronizado mediante WebSockets •';
    }

    return list
      .map((a) => {
        const tipo = a.tipo || a.type;
        const titulo = a.titulo || a.title || 'COMUNICADO';
        const contenido = a.contenido || a.content || '';
        const icon =
          tipo === 'urgente'
            ? '🚨'
            : tipo === 'evento'
              ? '📅'
              : tipo === 'mantenimiento'
                ? '🛠️'
                : '📢';
        return `✦ ${icon} ${titulo.toUpperCase()}: ${contenido}`;
      })
      .join(' • ');
  });

  filteredSalones = computed(() => {
    const list = this.salonesList();
    const filter = this.filterCategory();

    switch (filter) {
      case 'talleres':
        return list.filter((s) => s.tipoSalon === 0 || s.roomType === 0);
      case 'salones':
        return list.filter((s) => s.tipoSalon === 1 || s.roomType === 1);
      case 'ocupados':
        return list.filter((s) => this.isOcupado(s));
      case 'libres':
        return list.filter((s) => !this.isOcupado(s));
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
    if (s.eventoActivo) return true;
    const hour = new Date().getHours();
    if (hour < 12) return !!s.turnos?.manana?.ocupado;
    if (hour < 18) return !!s.turnos?.tarde?.ocupado;
    return !!s.turnos?.noche?.ocupado;
  }

  getCursoActual(s: RealtimeSalonStatus): string | null {
    if (s.eventoActivo) {
      return `${s.eventoActivo.tipoEvento}: ${s.eventoActivo.curso || s.eventoActivo.horario}`;
    }
    const hour = new Date().getHours();
    if (hour < 12) return s.turnos?.manana?.curso || null;
    if (hour < 18) return s.turnos?.tarde?.curso || null;
    return s.turnos?.noche?.curso || null;
  }

  ngOnInit() {
    this.updateClock();
    this.timeInterval = setInterval(() => this.updateClock(), 1000);

    this.loadRealtimeData();
    this.loadAvisosTv();
    this.startRotationTimer();

    // Sincronización en vivo por WebSocket
    this.ws.onDisponibilidadUpdate().subscribe(() => {
      this.loadRealtimeData(false);
    });

    this.ws.onNuevaReservacion().subscribe(() => {
      this.loadRealtimeData(false);
    });

    this.ws.onAvisosUpdate().subscribe(() => {
      this.loadAvisosTv();
    });

    // Polling de respaldo cada 30 segundos
    this.pollInterval = setInterval(() => {
      this.loadRealtimeData(false);
      this.loadAvisosTv();
    }, 30000);
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.rotationInterval) clearInterval(this.rotationInterval);
  }

  loadAvisosTv() {
    this.api.getAvisosTv().subscribe({
      next: (res) => {
        this.avisosTv.set(res || []);
      },
      error: (err) => console.error('Error cargando avisos para TV:', err),
    });
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

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    const dateStr = now.toLocaleDateString('es-GT', options);
    this.currentDate.set(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));
  }

  loadRealtimeData(showSpinner = true) {
    if (showSpinner) this.loading.set(true);
    const localDayIndex = new Date().getDay();
    const diasMap = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    const diaParam = diasMap[localDayIndex];
    this.api.getRealtimeDisponibilidad(undefined, diaParam).subscribe({
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
      document.documentElement
        .requestFullscreen()
        .then(() => {
          this.isFullscreen.set(true);
        })
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => {
          this.isFullscreen.set(false);
        })
        .catch(() => {});
    }
  }
}
