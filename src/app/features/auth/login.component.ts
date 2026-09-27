import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <!-- Background Ambient Blobs -->
      <div class="ambient-blob blob-1"></div>
      <div class="ambient-blob blob-2"></div>

      <div class="login-card">
        <!-- Logo Brand Banner -->
        <div class="login-header">
          <div class="brand-badge">INTECAP</div>
          <h2>Portal Institucional</h2>
          <p>Sistema de Gestión Integral de Salones y Recursos</p>
        </div>

        @if (errorMessage()) {
          <div class="alert-error">
            <svg class="alert-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="username">Usuario</label>
            <input
              id="username"
              type="text"
              class="form-control"
              placeholder="Ingresa tu nombre de usuario"
              [(ngModel)]="username"
              name="username"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              id="password"
              type="password"
              class="form-control"
              placeholder="••••••••"
              [(ngModel)]="password"
              name="password"
              required
            />
          </div>

          <button type="submit" class="btn btn-gold btn-block" [disabled]="loading()">
            @if (loading()) {
              <span>Iniciando sesión...</span>
            } @else {
              <span>Ingresar al Sistema</span>
            }
          </button>
        </form>

        <!-- Quick Demo Accounts Helper -->
        <div class="demo-helpers">
          <div class="demo-title">Acceso Rápido / Registro de Prueba</div>
          <div class="demo-buttons">
            <button type="button" (click)="quickRegister()" class="btn btn-secondary btn-sm">
              Crear Usuario Demo (admin/123456)
            </button>
          </div>
        </div>

        <div class="login-footer">
          Instituto Técnico de Capacitación y Productividad — Guatemala
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--intecap-navy-dark) 0%, #001229 100%);
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
    }

    .ambient-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.25;
      pointer-events: none;
    }

    .blob-1 {
      width: 400px;
      height: 400px;
      background: var(--intecap-blue);
      top: -100px;
      left: -100px;
    }

    .blob-2 {
      width: 350px;
      height: 350px;
      background: var(--intecap-gold);
      bottom: -100px;
      right: -100px;
    }

    .login-card {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 440px;
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      padding: 2.5rem 2rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;

      .brand-badge {
        display: inline-block;
        background: var(--intecap-gold);
        color: var(--intecap-navy-dark);
        font-family: var(--font-heading);
        font-weight: 900;
        font-size: 1.5rem;
        letter-spacing: 0.1em;
        padding: 0.35rem 1.25rem;
        border-radius: var(--radius-sm);
        margin-bottom: 0.75rem;
        box-shadow: 0 4px 12px rgba(253, 184, 19, 0.35);
      }

      h2 {
        font-size: 1.35rem;
        color: var(--intecap-navy-dark);
        margin-bottom: 0.25rem;
      }

      p {
        font-size: 0.8125rem;
        color: var(--text-secondary);
      }
    }

    .login-form {
      margin-bottom: 1.5rem;
    }

    .btn-block {
      width: 100%;
      padding: 0.75rem;
      font-size: 0.9375rem;
      margin-top: 0.5rem;
    }

    .alert-error {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background-color: var(--status-danger-bg);
      color: var(--status-danger);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
      border-left: 4px solid var(--status-danger);
    }

    .alert-icon {
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
    }

    .demo-helpers {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px dashed var(--border-color);
      text-align: center;

      .demo-title {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        margin-bottom: 0.5rem;
        text-transform: uppercase;
      }
    }

    .login-footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.6875rem;
      color: var(--text-muted);
    }
  `],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = 'admin';
  password = 'password123';
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.errorMessage.set('Por favor completa todos los campos.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.error?.message || 'Usuario o contraseña incorrectos. Si no tienes cuenta, usa el botón de crear cuenta demo abajo.'
        );
      },
    });
  }

  quickRegister(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const demoUser = {
      username: 'admin',
      password: 'password123',
      staff: 1,
    };

    this.authService.register(demoUser).subscribe({
      next: () => {
        // Automatically login
        this.onSubmit();
      },
      error: () => {
        // If user already exists, try logging in
        this.onSubmit();
      },
    });
  }
}
