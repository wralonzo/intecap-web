import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="navbar">
      <div class="navbar-left">
        <button (click)="layout.toggleSidebar()" class="mobile-toggle-btn" aria-label="Abrir menú">
          <svg class="icon-toggle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 class="page-title">Portal de Gestión INTECAP</h2>
        <span class="live-pill">
          <span class="pulse-dot"></span> API Conectada
        </span>
      </div>

      <div class="navbar-right">
        <!-- TV Display Mode Link -->
        <a routerLink="/tv" target="_blank" class="tv-mode-link" title="Abrir Pantalla Informativa en Vivo para Estudiantes">
          <span>📺</span>
          <span class="hide-mobile">Pantalla Estudiantes</span>
        </a>

        <!-- Quick Stats / Docs Link -->
        <a href="http://localhost:3000/api/docs" target="_blank" class="docs-link" title="Ver Documentación Swagger">
          <svg class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span class="hide-mobile">Swagger API</span>
        </a>

        <!-- Logout Button -->
        <button (click)="logout()" class="btn btn-secondary btn-sm" title="Cerrar sesión">
          <svg class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span class="hide-mobile">Salir</span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      height: 56px;
      background: #FFFFFF;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
      z-index: 50;
    }

    .navbar-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .mobile-toggle-btn {
      display: none;
      background: none;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.35rem;
      color: var(--intecap-navy-dark);
      cursor: pointer;
      align-items: center;
      justify-content: center;
    }

    .icon-toggle {
      width: 20px;
      height: 20px;
    }

    .page-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--intecap-navy-dark);
      white-space: nowrap;
    }

    .live-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.15rem 0.5rem;
      background: var(--status-success-bg);
      color: var(--status-success);
      font-size: 0.65rem;
      font-weight: 700;
      border-radius: var(--radius-full);
      white-space: nowrap;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      background-color: var(--status-success);
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      }
      70% {
        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
      }
    }

    .navbar-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .tv-mode-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.65rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #78350F;
      background-color: #FEF3C7;
      border: 1px solid #FDE68A;
      border-radius: var(--radius-sm);
      text-decoration: none;
      transition: all 0.2s ease;

      &:hover {
        background-color: #FDE68A;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(245, 158, 11, 0.25);
      }
    }

    .docs-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.6rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--intecap-navy);
      background-color: var(--intecap-blue-light);
      border-radius: var(--radius-sm);
      text-decoration: none;
      transition: all 0.2s ease;

      &:hover {
        background-color: #BAE6FD;
      }
    }

    .icon-sm {
      width: 0.9rem;
      height: 0.9rem;
    }

    @media (max-width: 992px) {
      .mobile-toggle-btn {
        display: inline-flex;
      }
      .page-title {
        font-size: 0.9rem;
      }
    }

    @media (max-width: 576px) {
      .live-pill, .hide-mobile {
        display: none;
      }
      .navbar {
        padding: 0 0.75rem;
      }
    }
  `],
})
export class NavbarComponent {
  layout = inject(LayoutService);
  private authService = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
