import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models';

interface LoginResponse {
  access_token: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'intecap_jwt_token';
  private readonly USER_KEY = 'intecap_user_data';

  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(this.getStoredToken());

  isAuthenticated = computed(() => !!this.token());
  role = computed<UserRole>(() => {
    const user = this.currentUser();
    if (!user) return 'DOCENTE';
    if (user.role) return user.role;
    if (user.staff === 1) return 'ADMIN';
    const puesto = user.empleado?.tipoEmpleado?.name || user.empleado?.tipoEmpleado?.tipoEmpleado || '';
    if (puesto.toLowerCase().includes('bodega') || puesto.toLowerCase().includes('almacen') || puesto.toLowerCase().includes('suministro')) {
      return 'BODEGA';
    }
    return 'DOCENTE';
  });
  isAdmin = computed(() => this.role() === 'ADMIN');
  isBodega = computed(() => this.role() === 'BODEGA');
  isDocente = computed(() => this.role() === 'DOCENTE');

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        this.setSession(res.access_token, res.user);
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
