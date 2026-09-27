import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loadingService.isLoading()) {
      <div class="global-loader-container" role="progressbar" aria-label="Cargando">
        <div class="loader-bar-glow"></div>
        <div class="loader-spinner-toast">
          <div class="spinner-dot"></div>
          <span>Procesando...</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .global-loader-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      z-index: 99999;
      pointer-events: none;
      background: rgba(0, 47, 108, 0.1);
    }

    .loader-bar-glow {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #002F6C, #FDB813, #0284C7, #FDB813, #002F6C);
      background-size: 200% 100%;
      animation: gradientMove 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      box-shadow: 0 0 10px rgba(253, 184, 19, 0.7);
    }

    .loader-spinner-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: rgba(0, 30, 71, 0.92);
      backdrop-filter: blur(8px);
      color: #FFFFFF;
      padding: 0.5rem 1rem;
      border-radius: 24px;
      font-size: 0.8rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(253, 184, 19, 0.35);
      animation: slideUp 0.25s ease-out;
      pointer-events: auto;
    }

    .spinner-dot {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(253, 184, 19, 0.3);
      border-top-color: #FDB813;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes gradientMove {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LoadingBarComponent {
  readonly loadingService = inject(LoadingService);
}
