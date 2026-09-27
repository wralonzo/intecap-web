import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
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
