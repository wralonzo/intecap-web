import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack-container" aria-live="polite">
      @for (toast of toastService.activeToasts(); track toast.id) {
        <div class="toast-item toast-{{ toast.type }}" (click)="toastService.remove(toast.id)">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { ✓ }
              @case ('error') { ✕ }
              @case ('warning') { ⚠ }
              @case ('info') { ℹ }
            }
          </div>
          <div class="toast-body">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="$event.stopPropagation(); toastService.remove(toast.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 100000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
      width: calc(100% - 40px);
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      background: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 47, 108, 0.2), 0 8px 10px -6px rgba(0, 47, 108, 0.1);
      cursor: pointer;
      animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      border-left: 5px solid #CBD5E1;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 28px -4px rgba(0, 47, 108, 0.25);
      }

      &.toast-success {
        border-left-color: #10B981;
        .toast-icon { background: #ECFDF5; color: #059669; }
      }

      &.toast-error {
        border-left-color: #EF4444;
        .toast-icon { background: #FEF2F2; color: #DC2626; }
      }

      &.toast-warning {
        border-left-color: #F59E0B;
        .toast-icon { background: #FFFBEB; color: #D97706; }
      }

      &.toast-info {
        border-left-color: #0284C7;
        .toast-icon { background: #E0F2FE; color: #0284C7; }
      }
    }

    .toast-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 900;
      flex-shrink: 0;
    }

    .toast-body {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-weight: 800;
      font-size: 0.875rem;
      color: #0F172A;
      margin-bottom: 2px;
      font-family: var(--font-heading, inherit);
    }

    .toast-message {
      font-size: 0.8rem;
      color: #475569;
      line-height: 1.35;
      word-break: break-word;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: #94A3B8;
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
      padding: 0 4px;
      margin-top: -2px;
      transition: color 0.15s;

      &:hover {
        color: #0F172A;
      }
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `]
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
