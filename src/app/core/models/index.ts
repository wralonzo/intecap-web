export type UserRole = 'ADMIN' | 'DOCENTE' | 'BODEGA';

export interface User {
  id: number;
  username: string;
  password?: string;
  empleadoId?: number | null;
  staff: number;
  role?: UserRole;
  estado?: number;
  empleado?: Empleado | null;
}

export interface PuestoEmpleado {
  id: number;
  name?: string;
  tipoEmpleado?: string;
  estado: number;
}

export type TipoEmpleado = PuestoEmpleado;
export type Position = PuestoEmpleado;


export interface Empleado {
  id: number;
  nombres: string;
  apellidos: string;
  dpi?: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  tipoEmpleadoId: number;
  tipoEmpleado?: TipoEmpleado;
  profesion?: string;
  estado: number;
  user?: User;
  crearUsuario?: boolean;
  username?: string;
  password?: string;
  staff?: number;
}

export interface Salon {
  id: number;
  title: string;
  cantidadPersonas: number;
  disponibilidad: number;
  color?: string;
  tipoSalon: number; // 1 = Salon, 0 = Taller
  start?: string;
  end?: string;
  empleadoId?: number;
  empleado?: Empleado;
  jornadaId?: number;
  jornada?: Jornada;
  cursoId?: number;
  curso?: Curso;
  mobiliarios?: Mobiliario[];
  salonJornadas?: SalonJornada[];
  estado: number;
}


export interface SalonJornada {
  id: number;
  salonId: number;
  jornadaId: number;
  jornada?: Jornada;
  curso?: Curso;
  empleado?: Empleado;
  lunes: number;
  martes: number;
  miercoles: number;
  jueves: number;
  viernes: number;
  sabado: number;
  domingo: number;
}

export interface Carrera {
  id: number;
  nombre: string;
  descripcion?: string;
  codigo?: string;
  estado: number;
  cursos?: Curso[];
}

export interface Curso {
  id: number;
  nombre: string;
  descripcion?: string;
  carreraId?: number;
  carrera?: Carrera;
  esEnLinea?: boolean;
  empleadoId?: number;
  empleado?: Empleado;
  jornadaId?: number;
  jornada?: Jornada;
  estado: number;
}

export interface Jornada {
  id: number;
  nombre: string;
  horaInicio?: string;
  horaFin?: string;
  horainicio?: string;
  horafin?: string;
  estado: number;
}

export interface Reservacion {
  id: number;
  usuarioId?: number;
  usuario?: User;
  empleadoId?: number;
  empleado?: Empleado;
  cursoId?: number;
  curso?: Curso;
  salonId?: number;
  salon?: Salon;
  jornada?: string;
  tipoEvento?: string;
  fechaEvento?: string;
  horaInicio?: string;
  horaFin?: string;
  cantidadPersonas: number;
  descripcion?: string;
  seguimiento?: string;
  motivoRechazo?: string;
  // 1 = Pendiente, 2 = Aprobada, 3 = Rechazada, 4 = Finalizada
  estado: number;
  createdAt: string;
}

export interface ReservacionesStats {
  total: number;
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  finalizadas: number;
}

export interface Mobiliario {
  id: number;
  nombre: string;
  cantidad: number;
  descripcion?: string;
  salon?: number;
  estado: number;
}

export interface Suministro {
  id: number;
  nombre: string;
  cantidad: number;
  descripcion?: string;
  estado: number;
}

export type Item = Suministro;

export interface ControlCalidad {
  id: number;
  empleadoId: number;
  empleado?: Empleado;
  nombreModulo?: string;
  noPrograma?: string;
  lugar?: string;
  temaDesarrollo?: string;
  resultadoAprendizaje?: string;
  productoFormacion?: string;
  fechaInicio?: string;
  fechaFin?: string;

  // 1.1 Planificación (máx 25)
  planP1?: number;
  planP2?: number;
  planP3?: number;
  planP4?: number;
  planP5?: number;
  totalPlanificacion?: number;

  // 1.2 Proceso Formativo (máx 10)
  procesoP1?: number;
  procesoP2?: number;
  procesoP3?: number;
  totalProceso?: number;

  // 1.3 Desempeño Pedagógico (máx 45)
  desempenoP1?: number;
  desempenoP2?: number;
  desempenoP3?: number;
  desempenoP4?: number;
  desempenoP5?: number;
  desempenoP6?: number;
  desempenoP7?: number;
  desempenoP8?: number;
  desempenoP9?: number;
  desempenoP10?: number;
  desempenoP11?: number;
  totalDesempeno?: number;

  // 1.4 Aspectos Transversales (máx 15)
  aspectosP1?: number;
  aspectosP2?: number;
  aspectosP3?: number;
  aspectosP4?: number;
  aspectosP5?: number;
  totalAspectos?: number;

  // Puntuación General
  promedio: number;
  punteoTotal?: number;
  declaracionEstado?: string;
  observaciones?: string;
  compromisosDocente?: string;
  estado: number;
  fechaCreacion: string;
}

export interface CalidadEstadisticas {
  total: number;
  conformes: number;
  noConformes: number;
  porcentajeConformidad: number;
  promedioGeneral: number;
}

export interface Mensaje {
  id: number;
  mensaje: string;
  timestamp: string;
  status: number;
  tipo: number;
}

export interface Notificacion {
  id: number;
  titulo: string;
  contenido: string;
  leido: number;
  createdAt: string;
}

export interface DiaTurnos {
  manana: string | null;
  tarde: string | null;
  noche: string | null;
}

export interface SalonMatrizHorario {
  salon: {
    id: number;
    title: string;
    tipoSalon: number;
    tipoNombre: string;
    cantidadPersonas: number;
    color: string;
    start?: string;
    end?: string;
  };
  dias: {
    lunes: DiaTurnos;
    martes: DiaTurnos;
    miercoles: DiaTurnos;
    jueves: DiaTurnos;
    viernes: DiaTurnos;
    sabado: DiaTurnos;
    domingo: DiaTurnos;
  };
}

export interface RealtimeSalonStatus {
  id: number;
  title: string;
  tipoSalon: number;
  tipoNombre: string;
  cantidadPersonas: number;
  color: string;
  dia: string;
  diaId: number;
  turnos: {
    manana: { curso: string | null; ocupado: boolean };
    tarde: { curso: string | null; ocupado: boolean };
    noche: { curso: string | null; ocupado: boolean };
  };
  disponibilidadActual: string;
}

export interface RealtimeResponse {
  dia: string;
  diaId: number;
  fecha: string;
  estadisticas: {
    total: number;
    disponiblesAhora: number;
    ocupadosAhora: number;
    porcentajeOcupacion: number;
  };
  data: RealtimeSalonStatus[];
}

export interface Aviso {
  id: number;
  titulo: string;
  contenido: string;
  tipo: string; // 'informativo' | 'urgente' | 'evento' | 'mantenimiento' | 'general'
  mostrarEnTv: boolean;
  prioridad: number; // 1: Alta / Urgente, 2: Media, 3: Baja / General
  fechaInicio?: string;
  fechaFin?: string;
  estado: number;
  createdAt?: string;
  updatedAt?: string;
}


