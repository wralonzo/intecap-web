import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (confirmService.state(); as dialog) {
      <div class="confirm-backdrop" (click)="onBackdropClick($event)">
        <div class="confirm-card animate-spring" [ngClass]="'theme-' + (dialog.options.type || 'danger')" role="dialog" aria-modal="true">
          <!-- Close button -->
          <button class="btn-close-modal" (click)="confirmService.handleAction(false)" aria-label="Cerrar">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Icon Hero Bubble -->
          <div class="confirm-bubble">
            @if (dialog.options.icon) {
              <span class="custom-icon">{{ dialog.options.icon }}</span>
            } @else {
              @switch (dialog.options.type) {
                @case ('danger') {
                  <svg class="bubble-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                }
                @case ('warning') {
                  <svg class="bubble-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
                @case ('success') {
                  <svg class="bubble-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                }
                @default {
                  <svg class="bubble-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              }
            }
          </div>

          <!-- Body Info -->
          <div class="confirm-content">
            <h3 class="confirm-title">{{ dialog.options.title }}</h3>
            <p class="confirm-message">{{ dialog.options.message }}</p>

            @if (dialog.options.detail) {
              <div class="confirm-detail-chip">
                {{ dialog.options.detail }}
              </div>
            }
          </div>

          <!-- Action Buttons -->
          <div class="confirm-buttons">
            <button
              type="button"
              class="btn-cancel"
              (click)="confirmService.handleAction(false)"
            >
              {{ dialog.options.cancelText || 'Cancelar' }}
            </button>

            <button
              type="button"
              class="btn-action"
              [ngClass]="'btn-' + (dialog.options.type || 'danger')"
              (click)="confirmService.handleAction(true)"
              autofocus
            >
              {{ dialog.options.confirmText || 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .confirm-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 100005;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: fadeIn 0.2s ease-out;
    }

    .confirm-card {
      background: #FFFFFF;
      width: 100%;
      max-width: 440px;
      border-radius: 16px;
      padding: 1.75rem 1.5rem 1.5rem;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8);
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .animate-spring {
      animation: springIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .btn-close-modal {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: transparent;
      border: none;
      color: #94A3B8;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: #F1F5F9;
        color: #0F172A;
      }
    }

    .w-4 { width: 1rem; }
    .h-4 { height: 1rem; }

    .confirm-bubble {
      width: 56px;
      height: 56px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.1rem;
      transition: transform 0.2s;
    }

    .bubble-svg {
      width: 28px;
      height: 28px;
    }

    .custom-icon {
      font-size: 1.75rem;
      line-height: 1;
    }

    /* Themes */
    .theme-danger {
      .confirm-bubble {
        background: linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%);
        color: #E11D48;
        box-shadow: 0 0 0 6px rgba(225, 29, 72, 0.1);
        border: 1px solid rgba(225, 29, 72, 0.2);
      }
    }

    .theme-warning {
      .confirm-bubble {
        background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
        color: #D97706;
        box-shadow: 0 0 0 6px rgba(217, 119, 6, 0.1);
        border: 1px solid rgba(217, 119, 6, 0.2);
      }
    }

    .theme-success {
      .confirm-bubble {
        background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
        color: #059669;
        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.25);
      }
    }

    .theme-primary {
      .confirm-bubble {
        background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
        color: #1E3A8A;
        box-shadow: 0 0 0 6px rgba(30, 58, 138, 0.1);
        border: 1px solid rgba(30, 58, 138, 0.2);
      }
    }

    .confirm-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 1.5rem;
    }

    .confirm-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0F172A;
      margin: 0;
      line-height: 1.3;
    }

    .confirm-message {
      font-size: 0.86rem;
      color: #64748B;
      line-height: 1.45;
      margin: 0;
      max-width: 95%;
    }

    .confirm-detail-chip {
      margin-top: 0.5rem;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      color: #1E3A8A;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .confirm-buttons {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      width: 100%;
    }

    .btn-cancel {
      flex: 1;
      padding: 0.55rem 1rem;
      border: 1px solid #CBD5E1;
      background: #FFFFFF;
      color: #475569;
      font-weight: 600;
      font-size: 0.85rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: #F1F5F9;
        color: #0F172A;
        border-color: #94A3B8;
      }
    }

    .btn-action {
      flex: 1;
      padding: 0.55rem 1rem;
      border: none;
      color: #FFFFFF;
      font-weight: 600;
      font-size: 0.85rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;

      &.btn-danger {
        background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        &:hover {
          background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
          transform: translateY(-1px);
        }
      }

      &.btn-warning {
        background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
        &:hover {
          background: linear-gradient(135deg, #D97706 0%, #B45309 100%);
          transform: translateY(-1px);
        }
      }

      &.btn-success {
        background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        &:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-1px);
        }
      }

      &.btn-primary {
        background: linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%);
        box-shadow: 0 2px 8px rgba(30, 58, 138, 0.25);
        &:hover {
          background: linear-gradient(135deg, #172554 0%, #020617 100%);
          transform: translateY(-1px);
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes springIn {
      from {
        opacity: 0;
        transform: scale(0.92) translateY(8px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
  `],
})
export class ConfirmModalComponent {
  readonly confirmService = inject(ConfirmService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmService.state()) {
      this.confirmService.handleAction(false);
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('confirm-backdrop')) {
      this.confirmService.handleAction(false);
    }
  }
}
