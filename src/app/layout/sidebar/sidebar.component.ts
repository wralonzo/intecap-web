import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Mobile Backdrop -->
    @if (layout.sidebarOpen()) {
      <div class="sidebar-backdrop" (click)="layout.closeSidebar()"></div>
    }

    <aside class="sidebar" [class.open]="layout.sidebarOpen()">
      <!-- Logo Brand Header -->
      <div class="brand-header">
        <div class="brand-top-row">
          <div class="logo-badge">
            <span class="logo-text">INTECAP</span>
          </div>
          <button class="mobile-close-btn" (click)="layout.closeSidebar()" aria-label="Cerrar menú">
            &times;
          </button>
        </div>
        <div class="brand-subtext">Sistema de Gestión</div>
      </div>

      <!-- Navigation Links -->
      <nav class="nav-menu">
        <div class="nav-group-label">PRINCIPAL</div>
        <a routerLink="/dashboard" routerLinkActive="active" (click)="onNavClick()" class="nav-item">
          <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Dashboard</span>
        </a>

        <div class="nav-group-label">INFRAESTRUCTURA & OPERACIÓN</div>
        <a routerLink="/salones" routerLinkActive="active" (click)="onNavClick()" class="nav-item">
          <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span>Salones y Talleres</span>
        </a>

        <a routerLink="/reservaciones" routerLinkActive="active" (click)="onNavClick()" class="nav-item">
          <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Reservaciones</span>
        </a>

        <div class="nav-group-label">ACADÉMICO & PERSONAL</div>
        <a routerLink="/empleados" routerLinkActive="active" (click)="onNavClick()" class="nav-item">
          <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>Empleados & Puestos</span>
        </a>

        <a routerLink="/academico" routerLinkActive="active" (click)="onNavClick()" class="nav-item">
          <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>Carreras y Cursos</span>
        </a>

        <div class="nav-group-label">ADMINISTRACIÓN & SEGURIDAD</div>
        <a routerLink="/usuarios" routerLinkActive="active" (click)="onNavClick()" class="nav-item">
          <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Usuarios del Sistema</span>
        </a>

        <a routerLink="/inventario" routerLinkActive="active" (click)="onNavClick()" class="nav-item">
          <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>Inventario & Items</span>
        </a>

        <a routerLink="/calidad" routerLinkActive="active" (click)="onNavClick()" class="nav-item">
          <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Control de Calidad</span>
        </a>
      </nav>

      <!-- User Footnote -->
      <div class="user-panel">
        <div class="avatar">{{ userInitial() }}</div>
        <div class="user-info">
          <div class="username">{{ authService.currentUser()?.username || 'Usuario' }}</div>
          <div class="role-tag">{{ authService.currentUser()?.empleado?.tipoEmpleado?.tipoEmpleado || 'Personal' }}</div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      min-width: 250px;
      height: 100vh;
      background: linear-gradient(180deg, var(--intecap-navy-dark) 0%, var(--bg-sidebar) 100%);
      color: #FFFFFF;
      display: flex;
      flex-direction: column;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      user-select: none;
      z-index: 100;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sidebar-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 26, 61, 0.55);
      backdrop-filter: blur(2px);
      z-index: 99;
    }

    .brand-header {
      padding: 1.25rem 1rem 0.85rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .brand-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .mobile-close-btn {
      display: none;
      background: none;
      border: none;
      color: #FFF;
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
    }

    .logo-badge {
      display: inline-flex;
      align-items: center;
      background: var(--intecap-gold);
      color: var(--intecap-navy-dark);
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-sm);
      font-family: var(--font-heading);
      font-weight: 900;
      font-size: 1.15rem;
      letter-spacing: 0.08em;
      box-shadow: 0 2px 8px rgba(253, 184, 19, 0.4);
    }

    .brand-subtext {
      margin-top: 0.35rem;
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .nav-menu {
      flex: 1;
      padding: 0.75rem 0.65rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .nav-group-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748B;
      padding: 0.65rem 0.65rem 0.2rem;
      letter-spacing: 0.08em;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.5rem 0.75rem;
      color: #CBD5E1;
      text-decoration: none;
      font-size: 0.82rem;
      font-weight: 500;
      border-radius: var(--radius-sm);
      transition: all 0.15s ease;

      &:hover {
        background-color: rgba(255, 255, 255, 0.07);
        color: #FFFFFF;
        transform: translateX(2px);
      }

      &.active {
        background-color: var(--intecap-navy);
        color: #FFFFFF;
        font-weight: 600;
        border-left: 3px solid var(--intecap-gold);
        box-shadow: 0 2px 8px rgba(0, 47, 108, 0.4);
      }
    }

    .nav-icon {
      width: 1.15rem;
      height: 1.15rem;
      flex-shrink: 0;
    }

    .user-panel {
      padding: 0.75rem 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background-color: rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--intecap-gold) 0%, #D97706 100%);
      color: var(--intecap-navy-dark);
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
    }

    .user-info {
      overflow: hidden;
    }

    .username {
      font-size: 0.82rem;
      font-weight: 600;
      color: #FFFFFF;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .role-tag {
      font-size: 0.65rem;
      color: var(--intecap-gold);
      font-weight: 600;
    }

    @media (max-width: 992px) {
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        transform: translateX(-100%);
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.35);
      }

      .sidebar.open {
        transform: translateX(0);
      }

      .mobile-close-btn {
        display: block;
      }
    }
  `],
})
export class SidebarComponent {
  layout = inject(LayoutService);
  authService = inject(AuthService);

  userInitial(): string {
    const name = this.authService.currentUser()?.username || 'U';
    return name.charAt(0).toUpperCase();
  }

  onNavClick(): void {
    if (window.innerWidth <= 992) {
      this.layout.closeSidebar();
    }
  }
}

