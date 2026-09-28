import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  User,
  Empleado,
  TipoEmpleado,
  Salon,
  SalonJornada,
  Carrera,
  Curso,
  Jornada,
  Reservacion,
  ReservacionesStats,
  Mobiliario,
  Item,
  ControlCalidad,
  SalonMatrizHorario,
  RealtimeResponse,
  Aviso,
  AuditLog,
  AuditLogStats,
  AuditFilter,
} from '../models';
import {
  normalizeUser,
  normalizeEmpleado,
  normalizePosition,
  normalizeSalon,
  normalizeCarrera,
  normalizeCurso,
  normalizeJornada,
  normalizeReservacion,
  normalizeMobiliario,
  normalizeSuministro,
  normalizeControlCalidad,
  normalizeAviso,
} from '../models/normalizers';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Empleados & Puestos
  getEmpleados(limit = 50, offset = 0): Observable<PaginatedResponse<Empleado>> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http
      .get<PaginatedResponse<Empleado>>(`${this.baseUrl}/empleados`, { params })
      .pipe(
        map((res) => ({
          ...res,
          data: (res.data || []).map(normalizeEmpleado),
        }))
      );
  }

  getTiposEmpleado(): Observable<TipoEmpleado[]> {
    return this.http
      .get<TipoEmpleado[]>(`${this.baseUrl}/empleados/tipos`)
      .pipe(map((res) => (res || []).map(normalizePosition)));
  }

  getPuestos(): Observable<TipoEmpleado[]> {
    return this.http
      .get<TipoEmpleado[]>(`${this.baseUrl}/empleados/puestos`)
      .pipe(map((res) => (res || []).map(normalizePosition)));
  }

  createPuesto(data: { name: string; tipoEmpleado?: string }): Observable<TipoEmpleado> {
    const payload = {
      tipoEmpleado: data.tipoEmpleado || data.name,
      ...data,
    };
    return this.http
      .post<TipoEmpleado>(`${this.baseUrl}/empleados/puestos`, payload)
      .pipe(map(normalizePosition));
  }

  updatePuesto(id: number, data: { name?: string; tipoEmpleado?: string; estado?: number; status?: number }): Observable<TipoEmpleado> {
    const payload: any = { ...data };
    if (data.name) {
      payload.tipoEmpleado = data.name;
    }
    return this.http
      .put<TipoEmpleado>(`${this.baseUrl}/empleados/puestos/${id}`, payload)
      .pipe(map(normalizePosition));
  }

  deletePuesto(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/empleados/puestos/${id}`);
  }

  searchEmpleados(query: string): Observable<Empleado[]> {
    return this.http
      .get<Empleado[]>(`${this.baseUrl}/empleados/buscar`, {
        params: new HttpParams().set('q', query),
      })
      .pipe(map((res) => (res || []).map(normalizeEmpleado)));
  }

  createEmpleado(data: Partial<Empleado>): Observable<Empleado> {
    return this.http
      .post<Empleado>(`${this.baseUrl}/empleados`, data)
      .pipe(map(normalizeEmpleado));
  }

  updateEmpleado(id: number, data: Partial<Empleado>): Observable<Empleado> {
    return this.http
      .put<Empleado>(`${this.baseUrl}/empleados/${id}`, data)
      .pipe(map(normalizeEmpleado));
  }

  deleteEmpleado(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/empleados/${id}`);
  }

  // Salones y Talleres
  getSalones(tipo?: number, limit = 50, offset = 0): Observable<PaginatedResponse<Salon>> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (tipo !== undefined) {
      params = params.set('tipo', tipo);
    }
    return this.http
      .get<PaginatedResponse<Salon>>(`${this.baseUrl}/salones`, { params })
      .pipe(
        map((res) => ({
          ...res,
          data: (res.data || []).map(normalizeSalon),
        }))
      );
  }

  getSalon(id: number): Observable<Salon> {
    return this.http
      .get<Salon>(`${this.baseUrl}/salones/${id}`)
      .pipe(map(normalizeSalon));
  }

  createSalon(data: Partial<Salon>): Observable<Salon> {
    return this.http
      .post<Salon>(`${this.baseUrl}/salones`, data)
      .pipe(map(normalizeSalon));
  }

  updateSalon(id: number, data: Partial<Salon>): Observable<Salon> {
    return this.http
      .put<Salon>(`${this.baseUrl}/salones/${id}`, data)
      .pipe(map(normalizeSalon));
  }

  deleteSalon(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/salones/${id}`);
  }

  assignJornada(salonId: number, data: any): Observable<SalonJornada> {
    return this.http.post<SalonJornada>(`${this.baseUrl}/salones/${salonId}/jornadas`, data);
  }

  // Reporte Matriz Semanal
  getReporteMatriz(tipo?: number, search?: string): Observable<{ data: SalonMatrizHorario[]; total: number }> {
    let params = new HttpParams();
    if (tipo !== undefined) params = params.set('tipo', tipo);
    if (search) params = params.set('search', search);
    return this.http.get<{ data: SalonMatrizHorario[]; total: number }>(`${this.baseUrl}/salones/reporte-matriz`, { params });
  }

  getReporteTalleres(search?: string): Observable<{ data: SalonMatrizHorario[]; total: number }> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<{ data: SalonMatrizHorario[]; total: number }>(`${this.baseUrl}/salones/reporte-talleres`, { params });
  }

  getReporteSalones(search?: string): Observable<{ data: SalonMatrizHorario[]; total: number }> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<{ data: SalonMatrizHorario[]; total: number }>(`${this.baseUrl}/salones/reporte-salones`, { params });
  }

  // Disponibilidad en Tiempo Real
  getRealtimeDisponibilidad(tipo?: number, dia?: string): Observable<RealtimeResponse> {
    let params = new HttpParams();
    if (tipo !== undefined) params = params.set('tipo', tipo);
    if (dia) params = params.set('dia', dia);
    return this.http.get<RealtimeResponse>(`${this.baseUrl}/salones/realtime`, { params });
  }

  updateSalonHorario(salonId: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/salones/${salonId}/horario`, data);
  }

  getSalonHorario(salonId: number): Observable<SalonMatrizHorario> {
    return this.http.get<SalonMatrizHorario>(`${this.baseUrl}/salones/${salonId}/horario`);
  }

  // Reservaciones y Eventos Especiales
  getReservaciones(limit = 50, offset = 0, estado?: number, search?: string): Observable<PaginatedResponse<Reservacion>> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (estado !== undefined && estado !== null) params = params.set('estado', estado);
    if (search && search.trim() !== '') params = params.set('search', search);
    return this.http
      .get<PaginatedResponse<Reservacion>>(`${this.baseUrl}/reservaciones`, { params })
      .pipe(
        map((res) => ({
          ...res,
          data: (res.data || []).map(normalizeReservacion),
        }))
      );
  }

  getReservacionesStats(): Observable<ReservacionesStats> {
    return this.http.get<ReservacionesStats>(`${this.baseUrl}/reservaciones/stats`);
  }

  createReservacion(data: any): Observable<Reservacion> {
    return this.http
      .post<Reservacion>(`${this.baseUrl}/reservaciones`, data)
      .pipe(map(normalizeReservacion));
  }

  updateReservacion(id: number, data: any): Observable<Reservacion> {
    return this.http
      .put<Reservacion>(`${this.baseUrl}/reservaciones/${id}`, data)
      .pipe(map(normalizeReservacion));
  }

  cambiarEstadoReservacion(id: number, estado: number, motivoRechazo?: string): Observable<Reservacion> {
    return this.http
      .patch<Reservacion>(`${this.baseUrl}/reservaciones/${id}/estado`, { estado, motivoRechazo })
      .pipe(map(normalizeReservacion));
  }

  deleteReservacion(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/reservaciones/${id}`);
  }

  getCalendario(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/reservaciones/calendario`);
  }

  getCalendarioTaller(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/reservaciones/calendario-taller`);
  }

  // Academico
  getCarreras(): Observable<Carrera[]> {
    return this.http
      .get<Carrera[]>(`${this.baseUrl}/academico/carreras`)
      .pipe(map((res) => (res || []).map(normalizeCarrera)));
  }

  getCarreraById(id: number): Observable<Carrera> {
    return this.http
      .get<Carrera>(`${this.baseUrl}/academico/carreras/${id}`)
      .pipe(map(normalizeCarrera));
  }

  createCarrera(data: Partial<Carrera> | string): Observable<Carrera> {
    const payload = typeof data === 'string' ? { nombre: data } : data;
    return this.http
      .post<Carrera>(`${this.baseUrl}/academico/carreras`, payload)
      .pipe(map(normalizeCarrera));
  }

  updateCarrera(id: number, data: Partial<Carrera>): Observable<Carrera> {
    return this.http
      .put<Carrera>(`${this.baseUrl}/academico/carreras/${id}`, data)
      .pipe(map(normalizeCarrera));
  }

  deleteCarrera(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/academico/carreras/${id}`);
  }

  getCursos(limit = 50, offset = 0, search?: string): Observable<PaginatedResponse<Curso>> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (search && search.trim() !== '') params = params.set('search', search);
    return this.http
      .get<PaginatedResponse<Curso>>(`${this.baseUrl}/academico/cursos`, { params })
      .pipe(
        map((res) => ({
          ...res,
          data: (res.data || []).map(normalizeCurso),
        }))
      );
  }

  getCursoById(id: number): Observable<Curso> {
    return this.http
      .get<Curso>(`${this.baseUrl}/academico/cursos/${id}`)
      .pipe(map(normalizeCurso));
  }

  createCurso(data: Partial<Curso>): Observable<Curso> {
    return this.http
      .post<Curso>(`${this.baseUrl}/academico/cursos`, data)
      .pipe(map(normalizeCurso));
  }

  updateCurso(id: number, data: Partial<Curso>): Observable<Curso> {
    return this.http
      .put<Curso>(`${this.baseUrl}/academico/cursos/${id}`, data)
      .pipe(map(normalizeCurso));
  }

  deleteCurso(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/academico/cursos/${id}`);
  }

  getJornadas(): Observable<Jornada[]> {
    return this.http
      .get<Jornada[]>(`${this.baseUrl}/academico/jornadas`)
      .pipe(map((res) => (res || []).map(normalizeJornada)));
  }

  getJornadaById(id: number): Observable<Jornada> {
    return this.http
      .get<Jornada>(`${this.baseUrl}/academico/jornadas/${id}`)
      .pipe(map(normalizeJornada));
  }

  createJornada(data: Partial<Jornada>): Observable<Jornada> {
    return this.http
      .post<Jornada>(`${this.baseUrl}/academico/jornadas`, data)
      .pipe(map(normalizeJornada));
  }

  updateJornada(id: number, data: Partial<Jornada>): Observable<Jornada> {
    return this.http
      .put<Jornada>(`${this.baseUrl}/academico/jornadas/${id}`, data)
      .pipe(map(normalizeJornada));
  }

  deleteJornada(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/academico/jornadas/${id}`);
  }

  // Inventario
  getMobiliario(limit = 50, offset = 0, search?: string): Observable<PaginatedResponse<Mobiliario>> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (search && search.trim() !== '') params = params.set('search', search);
    return this.http
      .get<PaginatedResponse<Mobiliario>>(`${this.baseUrl}/inventario/mobiliario`, { params })
      .pipe(
        map((res) => ({
          ...res,
          data: (res.data || []).map(normalizeMobiliario),
        }))
      );
  }

  getMobiliarioById(id: number): Observable<Mobiliario> {
    return this.http
      .get<Mobiliario>(`${this.baseUrl}/inventario/mobiliario/${id}`)
      .pipe(map(normalizeMobiliario));
  }

  createMobiliario(data: Partial<Mobiliario>): Observable<Mobiliario> {
    return this.http
      .post<Mobiliario>(`${this.baseUrl}/inventario/mobiliario`, data)
      .pipe(map(normalizeMobiliario));
  }

  updateMobiliario(id: number, data: Partial<Mobiliario>): Observable<Mobiliario> {
    return this.http
      .put<Mobiliario>(`${this.baseUrl}/inventario/mobiliario/${id}`, data)
      .pipe(map(normalizeMobiliario));
  }

  deleteMobiliario(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/inventario/mobiliario/${id}`);
  }

  getItems(limit = 50, offset = 0, search?: string): Observable<PaginatedResponse<Item>> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (search && search.trim() !== '') params = params.set('search', search);
    return this.http
      .get<PaginatedResponse<Item>>(`${this.baseUrl}/inventario/items`, { params })
      .pipe(
        map((res) => ({
          ...res,
          data: (res.data || []).map(normalizeSuministro),
        }))
      );
  }

  getItemById(id: number): Observable<Item> {
    return this.http
      .get<Item>(`${this.baseUrl}/inventario/items/${id}`)
      .pipe(map(normalizeSuministro));
  }

  createItem(data: Partial<Item>): Observable<Item> {
    return this.http
      .post<Item>(`${this.baseUrl}/inventario/items`, data)
      .pipe(map(normalizeSuministro));
  }

  updateItem(id: number, data: Partial<Item>): Observable<Item> {
    return this.http
      .put<Item>(`${this.baseUrl}/inventario/items/${id}`, data)
      .pipe(map(normalizeSuministro));
  }

  deleteItem(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/inventario/items/${id}`);
  }

  // Calidad
  getCalidad(limit = 50, offset = 0, empleadoId?: number): Observable<PaginatedResponse<ControlCalidad>> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (empleadoId) {
      params = params.set('empleadoId', empleadoId);
    }
    return this.http
      .get<PaginatedResponse<ControlCalidad>>(`${this.baseUrl}/calidad`, { params })
      .pipe(
        map((res) => ({
          ...res,
          data: (res.data || []).map(normalizeControlCalidad),
        }))
      );
  }

  getCalidadById(id: number): Observable<ControlCalidad> {
    return this.http
      .get<ControlCalidad>(`${this.baseUrl}/calidad/${id}`)
      .pipe(map(normalizeControlCalidad));
  }

  createCalidad(data: Partial<ControlCalidad>): Observable<ControlCalidad> {
    return this.http
      .post<ControlCalidad>(`${this.baseUrl}/calidad`, data)
      .pipe(map(normalizeControlCalidad));
  }

  updateCalidad(id: number, data: Partial<ControlCalidad>): Observable<ControlCalidad> {
    return this.http
      .put<ControlCalidad>(`${this.baseUrl}/calidad/${id}`, data)
      .pipe(map(normalizeControlCalidad));
  }

  deleteCalidad(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/calidad/${id}`);
  }

  getCalidadEstadisticas(): Observable<{
    total: number;
    conformes: number;
    noConformes: number;
    porcentajeConformidad: number;
    promedioGeneral: number;
  }> {
    return this.http.get<any>(`${this.baseUrl}/calidad/estadisticas`);
  }

  // Users Management
  getUsers(limit = 50, offset = 0): Observable<PaginatedResponse<User>> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http
      .get<PaginatedResponse<User>>(`${this.baseUrl}/users`, { params })
      .pipe(
        map((res) => ({
          ...res,
          data: (res.data || []).map(normalizeUser),
        }))
      );
  }

  getUserById(id: number): Observable<User> {
    return this.http
      .get<User>(`${this.baseUrl}/users/${id}`)
      .pipe(map(normalizeUser));
  }

  createUser(data: Partial<User>): Observable<User> {
    return this.http
      .post<User>(`${this.baseUrl}/users`, data)
      .pipe(map(normalizeUser));
  }

  updateUser(id: number, data: Partial<User>): Observable<User> {
    return this.http
      .put<User>(`${this.baseUrl}/users/${id}`, data)
      .pipe(map(normalizeUser));
  }

  deleteUser(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/users/${id}`);
  }

  // Avisos & Comunicados (CRUD y TV Display)
  getAvisos(soloTv?: boolean, soloActivos = true): Observable<Aviso[]> {
    let params = new HttpParams();
    if (soloTv !== undefined) {
      params = params.set('soloTv', String(soloTv));
    }
    if (soloActivos !== undefined) {
      params = params.set('soloActivos', String(soloActivos));
    }
    return this.http
      .get<Aviso[]>(`${this.baseUrl}/avisos`, { params })
      .pipe(map((res) => (res || []).map(normalizeAviso)));
  }

  getAvisosTv(): Observable<Aviso[]> {
    return this.http
      .get<Aviso[]>(`${this.baseUrl}/avisos/tv`)
      .pipe(map((res) => (res || []).map(normalizeAviso)));
  }

  getAvisoById(id: number): Observable<Aviso> {
    return this.http
      .get<Aviso>(`${this.baseUrl}/avisos/${id}`)
      .pipe(map(normalizeAviso));
  }

  createAviso(data: Partial<Aviso>): Observable<Aviso> {
    return this.http
      .post<Aviso>(`${this.baseUrl}/avisos`, data)
      .pipe(map(normalizeAviso));
  }

  updateAviso(id: number, data: Partial<Aviso>): Observable<Aviso> {
    return this.http
      .put<Aviso>(`${this.baseUrl}/avisos/${id}`, data)
      .pipe(map(normalizeAviso));
  }

  toggleAvisoTv(id: number): Observable<Aviso> {
    return this.http
      .patch<Aviso>(`${this.baseUrl}/avisos/${id}/tv-toggle`, {})
      .pipe(map(normalizeAviso));
  }

  deleteAviso(id: number): Observable<{ message: string; id: number }> {
    return this.http.delete<{ message: string; id: number }>(`${this.baseUrl}/avisos/${id}`);
  }

  // Auditoría y Bitácora de Acciones
  getAuditLogs(limit = 50, offset = 0, filter?: AuditFilter): Observable<PaginatedResponse<AuditLog>> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (filter) {
      if (filter.module && filter.module !== 'TODOS') params = params.set('module', filter.module);
      if (filter.action && filter.action !== 'TODAS') params = params.set('action', filter.action);
      if (filter.userId) params = params.set('userId', filter.userId);
      if (filter.search && filter.search.trim() !== '') params = params.set('search', filter.search.trim());
      if (filter.startDate) params = params.set('startDate', filter.startDate);
      if (filter.endDate) params = params.set('endDate', filter.endDate);
    }
    return this.http.get<PaginatedResponse<AuditLog>>(`${this.baseUrl}/audit`, { params });
  }

  getAuditStats(): Observable<AuditLogStats> {
    return this.http.get<AuditLogStats>(`${this.baseUrl}/audit/stats`);
  }

  getAuditLogById(id: number): Observable<AuditLog> {
    return this.http.get<AuditLog>(`${this.baseUrl}/audit/${id}`);
  }
}



