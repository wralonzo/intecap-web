import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
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
