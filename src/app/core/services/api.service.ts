import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  Mensaje,
  Notificacion,
  SalonMatrizHorario,
  RealtimeResponse,
  Aviso,
} from '../models';



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
    return this.http.get<PaginatedResponse<Empleado>>(`${this.baseUrl}/empleados`, { params });
  }

  getTiposEmpleado(): Observable<TipoEmpleado[]> {
    return this.http.get<TipoEmpleado[]>(`${this.baseUrl}/empleados/tipos`);
  }

  getPuestos(): Observable<TipoEmpleado[]> {
    return this.http.get<TipoEmpleado[]>(`${this.baseUrl}/empleados/puestos`);
  }

  createPuesto(data: { name: string }): Observable<TipoEmpleado> {
    return this.http.post<TipoEmpleado>(`${this.baseUrl}/empleados/puestos`, data);
  }

  updatePuesto(id: number, data: { name?: string; estado?: number }): Observable<TipoEmpleado> {
    return this.http.put<TipoEmpleado>(`${this.baseUrl}/empleados/puestos/${id}`, data);
  }

  deletePuesto(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/empleados/puestos/${id}`);
  }

  searchEmpleados(query: string): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(`${this.baseUrl}/empleados/buscar`, {
      params: new HttpParams().set('q', query),
    });
  }

  createEmpleado(data: Partial<Empleado>): Observable<Empleado> {
    return this.http.post<Empleado>(`${this.baseUrl}/empleados`, data);
  }

  updateEmpleado(id: number, data: Partial<Empleado>): Observable<Empleado> {
    return this.http.put<Empleado>(`${this.baseUrl}/empleados/${id}`, data);
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
    return this.http.get<PaginatedResponse<Salon>>(`${this.baseUrl}/salones`, { params });
  }

  getSalon(id: number): Observable<Salon> {
    return this.http.get<Salon>(`${this.baseUrl}/salones/${id}`);
  }

  createSalon(data: Partial<Salon>): Observable<Salon> {
    return this.http.post<Salon>(`${this.baseUrl}/salones`, data);
  }

  updateSalon(id: number, data: Partial<Salon>): Observable<Salon> {
    return this.http.put<Salon>(`${this.baseUrl}/salones/${id}`, data);
  }

  deleteSalon(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/salones/${id}`);
  }

  assignJornada(salonId: number, data: any): Observable<SalonJornada> {
    return this.http.post<SalonJornada>(`${this.baseUrl}/salones/${salonId}/jornadas`, data);
  }

  // Reporte Matriz Semanal (AdminSalones/reporte & AdminSalones/reporteTalleres)
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

  // Disponibilidad en Tiempo Real (RealTime/reporte & RealTime/reporte_talleres)
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
    return this.http.get<PaginatedResponse<Reservacion>>(`${this.baseUrl}/reservaciones`, { params });
  }

  getReservacionesStats(): Observable<ReservacionesStats> {
    return this.http.get<ReservacionesStats>(`${this.baseUrl}/reservaciones/stats`);
  }

  createReservacion(data: any): Observable<Reservacion> {
    return this.http.post<Reservacion>(`${this.baseUrl}/reservaciones`, data);
  }

  updateReservacion(id: number, data: any): Observable<Reservacion> {
    return this.http.put<Reservacion>(`${this.baseUrl}/reservaciones/${id}`, data);
  }

  cambiarEstadoReservacion(id: number, estado: number, motivoRechazo?: string): Observable<Reservacion> {
    return this.http.patch<Reservacion>(`${this.baseUrl}/reservaciones/${id}/estado`, { estado, motivoRechazo });
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
    return this.http.get<Carrera[]>(`${this.baseUrl}/academico/carreras`);
  }

  getCarreraById(id: number): Observable<Carrera> {
    return this.http.get<Carrera>(`${this.baseUrl}/academico/carreras/${id}`);
  }

  createCarrera(data: Partial<Carrera> | string): Observable<Carrera> {
    const payload = typeof data === 'string' ? { nombre: data } : data;
    return this.http.post<Carrera>(`${this.baseUrl}/academico/carreras`, payload);
  }

  updateCarrera(id: number, data: Partial<Carrera>): Observable<Carrera> {
    return this.http.put<Carrera>(`${this.baseUrl}/academico/carreras/${id}`, data);
  }

  deleteCarrera(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/academico/carreras/${id}`);
  }

  getCursos(limit = 50, offset = 0, search?: string): Observable<PaginatedResponse<Curso>> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (search && search.trim() !== '') params = params.set('search', search);
    return this.http.get<PaginatedResponse<Curso>>(`${this.baseUrl}/academico/cursos`, { params });
  }

  getCursoById(id: number): Observable<Curso> {
    return this.http.get<Curso>(`${this.baseUrl}/academico/cursos/${id}`);
  }

  createCurso(data: Partial<Curso>): Observable<Curso> {
    return this.http.post<Curso>(`${this.baseUrl}/academico/cursos`, data);
  }

  updateCurso(id: number, data: Partial<Curso>): Observable<Curso> {
    return this.http.put<Curso>(`${this.baseUrl}/academico/cursos/${id}`, data);
  }

  deleteCurso(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/academico/cursos/${id}`);
  }

  getJornadas(): Observable<Jornada[]> {
    return this.http.get<Jornada[]>(`${this.baseUrl}/academico/jornadas`);
  }

  getJornadaById(id: number): Observable<Jornada> {
    return this.http.get<Jornada>(`${this.baseUrl}/academico/jornadas/${id}`);
  }

  createJornada(data: Partial<Jornada>): Observable<Jornada> {
    return this.http.post<Jornada>(`${this.baseUrl}/academico/jornadas`, data);
  }

  updateJornada(id: number, data: Partial<Jornada>): Observable<Jornada> {
    return this.http.put<Jornada>(`${this.baseUrl}/academico/jornadas/${id}`, data);
  }

  deleteJornada(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/academico/jornadas/${id}`);
  }

  // Inventario
  getMobiliario(limit = 50, offset = 0, search?: string): Observable<PaginatedResponse<Mobiliario>> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (search && search.trim() !== '') params = params.set('search', search);
    return this.http.get<PaginatedResponse<Mobiliario>>(`${this.baseUrl}/inventario/mobiliario`, { params });
  }

  getMobiliarioById(id: number): Observable<Mobiliario> {
    return this.http.get<Mobiliario>(`${this.baseUrl}/inventario/mobiliario/${id}`);
  }

  createMobiliario(data: Partial<Mobiliario>): Observable<Mobiliario> {
    return this.http.post<Mobiliario>(`${this.baseUrl}/inventario/mobiliario`, data);
  }

  updateMobiliario(id: number, data: Partial<Mobiliario>): Observable<Mobiliario> {
    return this.http.put<Mobiliario>(`${this.baseUrl}/inventario/mobiliario/${id}`, data);
  }

  deleteMobiliario(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/inventario/mobiliario/${id}`);
  }

  getItems(limit = 50, offset = 0, search?: string): Observable<PaginatedResponse<Item>> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (search && search.trim() !== '') params = params.set('search', search);
    return this.http.get<PaginatedResponse<Item>>(`${this.baseUrl}/inventario/items`, { params });
  }

  getItemById(id: number): Observable<Item> {
    return this.http.get<Item>(`${this.baseUrl}/inventario/items/${id}`);
  }

  createItem(data: Partial<Item>): Observable<Item> {
    return this.http.post<Item>(`${this.baseUrl}/inventario/items`, data);
  }

  updateItem(id: number, data: Partial<Item>): Observable<Item> {
    return this.http.put<Item>(`${this.baseUrl}/inventario/items/${id}`, data);
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
    return this.http.get<PaginatedResponse<ControlCalidad>>(`${this.baseUrl}/calidad`, { params });
  }

  getCalidadById(id: number): Observable<ControlCalidad> {
    return this.http.get<ControlCalidad>(`${this.baseUrl}/calidad/${id}`);
  }

  createCalidad(data: Partial<ControlCalidad>): Observable<ControlCalidad> {
    return this.http.post<ControlCalidad>(`${this.baseUrl}/calidad`, data);
  }

  updateCalidad(id: number, data: Partial<ControlCalidad>): Observable<ControlCalidad> {
    return this.http.put<ControlCalidad>(`${this.baseUrl}/calidad/${id}`, data);
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
    return this.http.get<PaginatedResponse<User>>(`${this.baseUrl}/users`, { params });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`);
  }

  createUser(data: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users`, data);
  }

  updateUser(id: number, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${id}`, data);
  }

  deleteUser(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/users/${id}`);
  }

  // Chat & Notificaciones
  getMensajes(): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.baseUrl}/chat/mensajes`);
  }

  sendMensaje(mensaje: string, tipo = 1): Observable<Mensaje> {
    return this.http.post<Mensaje>(`${this.baseUrl}/chat/mensajes`, { mensaje, tipo });
  }

  getNotificaciones(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.baseUrl}/chat/notificaciones`);
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
    return this.http.get<Aviso[]>(`${this.baseUrl}/avisos`, { params });
  }

  getAvisosTv(): Observable<Aviso[]> {
    return this.http.get<Aviso[]>(`${this.baseUrl}/avisos/tv`);
  }

  getAvisoById(id: number): Observable<Aviso> {
    return this.http.get<Aviso>(`${this.baseUrl}/avisos/${id}`);
  }

  createAviso(data: Partial<Aviso>): Observable<Aviso> {
    return this.http.post<Aviso>(`${this.baseUrl}/avisos`, data);
  }

  updateAviso(id: number, data: Partial<Aviso>): Observable<Aviso> {
    return this.http.put<Aviso>(`${this.baseUrl}/avisos/${id}`, data);
  }

  toggleAvisoTv(id: number): Observable<Aviso> {
    return this.http.patch<Aviso>(`${this.baseUrl}/avisos/${id}/tv-toggle`, {});
  }

  deleteAviso(id: number): Observable<{ message: string; id: number }> {
    return this.http.delete<{ message: string; id: number }>(`${this.baseUrl}/avisos/${id}`);
  }
}


