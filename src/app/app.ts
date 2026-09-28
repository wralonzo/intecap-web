import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingBarComponent } from './shared/components/loading-bar/loading-bar.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { ConfirmModalComponent } from './shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingBarComponent, ToastContainerComponent, ConfirmModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('intecap-web');
}
