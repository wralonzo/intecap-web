export type UserRole = 'ADMIN' | 'DOCENTE' | 'BODEGA';

export interface User {
  id: number;
  username: string;
  password?: string;
  employeeId?: number | null;
  empleadoId?: number | null;
  employee?: Empleado | null;
  empleado?: Empleado | null;
  staff: number;
  role?: UserRole;
  status?: number;
  estado?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Position {
  id: number;
  name: string;
  tipoEmpleado?: string;
  status?: number;
  estado?: number;
}
export type PuestoEmpleado = Position;
export type TipoEmpleado = Position;

export interface Empleado {
  id: number;
  nombres: string;
  firstName?: string;
  apellidos: string;
  lastName?: string;
  dpi?: string;
  nit?: string;
  direccion?: string;
  address?: string;
  telefono?: string;
  phone?: string;
  email?: string;
  tipoEmpleadoId: number;
  positionId?: number;
  tipoEmpleado?: Position;
  position?: Position;
  profesion?: string;
  profession?: string;
  estado: number;
  status?: number;
  user?: User;
  crearUsuario?: boolean;
  username?: string;
  password?: string;
  staff?: number;
}
export type Employee = Empleado;

export interface Salon {
  id: number;
  title: string;
  cantidadPersonas: number;
  capacity?: number;
  disponibilidad?: number;
  tipoSalon: number; // 1 = Salon, 0 = Taller
  roomType?: number;
  color?: string;
  start?: string;
  startTime?: string;
  end?: string;
  endTime?: string;
  empleadoId?: number;
  employeeId?: number;
  empleado?: Empleado;
  employee?: Empleado;
  jornadaId?: number;
  shiftId?: number;
  jornada?: Jornada;
  shift?: Jornada;
  cursoId?: number;
  courseId?: number;
  curso?: Curso;
  course?: Curso;
  mobiliarios?: Mobiliario[];
  furniture?: Mobiliario[];
  salonJornadas?: SalonJornada[];
  roomShifts?: SalonJornada[];
  estado: number;
  status?: number;
}
export type Room = Salon;

export interface SalonJornada {
  id: number;
  salonId: number;
  roomId?: number;
  jornadaId: number;
  shiftId?: number;
  jornada?: Jornada;
  shift?: Jornada;
  curso?: Curso;
  course?: Curso;
  empleado?: Empleado;
  employee?: Empleado;
  lunes: number;
  martes: number;
  miercoles: number;
  jueves: number;
  viernes: number;
  sabado: number;
  domingo: number;
}
export type RoomShift = SalonJornada;

export interface Carrera {
  id: number;
  nombre: string;
  name?: string;
  descripcion?: string;
  description?: string;
  codigo?: string;
  code?: string;
  estado: number;
  status?: number;
  cursos?: Curso[];
  courses?: Curso[];
}
export type Career = Carrera;

export interface Curso {
  id: number;
  nombre: string;
  name?: string;
  descripcion?: string;
  description?: string;
  carreraId?: number | null;
  careerId?: number | null;
  carrera?: Carrera;
  career?: Carrera;
  esEnLinea?: boolean;
  isOnline?: boolean;
  empleadoId?: number | null;
  employeeId?: number | null;
  empleado?: Empleado;
  employee?: Empleado;
  jornadaId?: number | null;
  shiftId?: number | null;
  jornada?: Jornada;
  shift?: Jornada;
  estado: number;
  status?: number;
}
export type Course = Curso;

export interface Jornada {
  id: number;
  nombre: string;
  name?: string;
  horaInicio?: string;
  startTime?: string;
  horaFin?: string;
  endTime?: string;
  horainicio?: string;
  horafin?: string;
  estado: number;
  status?: number;
}
export type Shift = Jornada;

export interface Reservacion {
  id: number;
  usuarioId?: number;
  userId?: number;
  usuario?: User;
  user?: User;
  salonId?: number;
  roomId?: number;
  salon?: Salon;
  room?: Salon;
  empleadoId?: number;
  employeeId?: number;
  empleado?: Empleado;
  employee?: Empleado;
  cursoId?: number;
  courseId?: number;
  curso?: Curso;
  course?: Curso;
  jornada?: string;
  shiftName?: string;
  tipoEvento?: string;
  eventType?: string;
  fechaEvento?: string;
  eventDate?: string;
  horaInicio?: string;
  startTime?: string;
  horaFin?: string;
  endTime?: string;
  cantidadPersonas: number;
  attendeesCount?: number;
  descripcion?: string;
  description?: string;
  seguimiento?: string;
  followUp?: string;
  motivoRechazo?: string;
  rejectionReason?: string;
  reubicacionCursoSalonId?: number;
  reubicacionCursoSalon?: Salon;
  estado: number;
  status?: number;
  createdAt: string;
  updatedAt?: string;
}
export type Reservation = Reservacion;

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
  name?: string;
  cantidad: number;
  quantity?: number;
  descripcion?: string;
  description?: string;
  salon?: number;
  roomId?: number;
  estado: number;
  status?: number;
}
export type Furniture = Mobiliario;

export interface Suministro {
  id: number;
  nombre: string;
  name?: string;
  cantidad: number;
  quantity?: number;
  categoria?: string;
  category?: string;
  descripcion?: string;
  description?: string;
  estado: number;
  status?: number;
}
export type Item = Suministro;
export type InventoryItem = Suministro;

export interface ControlCalidad {
  id: number;
  empleadoId: number;
  employeeId?: number;
  empleado?: Empleado;
  employee?: Empleado;
  nombreModulo?: string;
  moduleName?: string;
  noPrograma?: string;
  programNumber?: string;
  lugar?: string;
  location?: string;
  temaDesarrollo?: string;
  developmentTopic?: string;
  resultadoAprendizaje?: string;
  learningResult?: string;
  productoFormacion?: string;
  trainingProduct?: string;
  fechaInicio?: string;
  startDate?: string;
  fechaFin?: string;
  endDate?: string;

  // 1.1 Planificación (máx 25)
  planP1?: number; planQ1?: number;
  planP2?: number; planQ2?: number;
  planP3?: number; planQ3?: number;
  planP4?: number; planQ4?: number;
  planP5?: number; planQ5?: number;
  totalPlanificacion?: number; planScore?: number;

  // 1.2 Proceso Formativo (máx 10)
  procesoP1?: number; processQ1?: number;
  procesoP2?: number; processQ2?: number;
  procesoP3?: number; processQ3?: number;
  totalProceso?: number; processScore?: number;

  // 1.3 Desempeño Pedagógico (máx 45)
  desempenoP1?: number; pedagogicalQ1?: number;
  desempenoP2?: number; pedagogicalQ2?: number;
  desempenoP3?: number; pedagogicalQ3?: number;
  desempenoP4?: number; pedagogicalQ4?: number;
  desempenoP5?: number; pedagogicalQ5?: number;
  desempenoP6?: number; pedagogicalQ6?: number;
  desempenoP7?: number; pedagogicalQ7?: number;
  desempenoP8?: number; pedagogicalQ8?: number;
  desempenoP9?: number; pedagogicalQ9?: number;
  desempenoP10?: number; pedagogicalQ10?: number;
  desempenoP11?: number; pedagogicalQ11?: number;
  totalDesempeno?: number; pedagogicalScore?: number;

  // 1.4 Aspectos Transversales (máx 15)
  aspectosP1?: number; transversalQ1?: number;
  aspectosP2?: number; transversalQ2?: number;
  aspectosP3?: number; transversalQ3?: number;
  aspectosP4?: number; transversalQ4?: number;
  aspectosP5?: number; transversalQ5?: number;
  totalAspectos?: number; transversalScore?: number;

  // Puntuación General
  promedio: number;
  totalScore?: number;
  punteoTotal?: number;
  declaracionEstado?: string;
  statusDeclaration?: string;
  observaciones?: string;
  observations?: string;
  compromisosDocente?: string;
  teacherCommitments?: string;
  estado: number;
  status?: number;
  fechaCreacion: string;
  createdAt?: string;
}
export type QualityEvaluation = ControlCalidad;

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
    roomType?: number;
    tipoNombre: string;
    cantidadPersonas: number;
    capacity?: number;
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
  roomType?: number;
  tipoNombre: string;
  cantidadPersonas: number;
  capacity?: number;
  color: string;
  dia: string;
  diaId: number;
  turnos: {
    manana: { curso: string | null; ocupado: boolean; evento?: string | null };
    tarde: { curso: string | null; ocupado: boolean; evento?: string | null };
    noche: { curso: string | null; ocupado: boolean; evento?: string | null };
  };
  disponibilidadActual: string;
  eventoActivo?: {
    id: number;
    tipoEvento: string;
    horario: string;
    docente?: string | null;
    curso?: string | null;
    participantes?: number;
  } | null;
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
  title?: string;
  contenido: string;
  content?: string;
  tipo: string; // 'informativo' | 'urgente' | 'evento' | 'mantenimiento' | 'general'
  type?: string;
  mostrarEnTv: boolean;
  showOnTv?: boolean;
  prioridad: number; // 1: Alta / Urgente, 2: Media, 3: Baja / General
  priority?: number;
  fechaInicio?: string;
  startDate?: string;
  fechaFin?: string;
  endDate?: string;
  estado: number;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}
export type Announcement = Aviso;

export interface AuditLog {
  id: number;
  userId?: number | null;
  user?: User | null;
  username?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'APPROVE' | 'REJECT' | 'STATUS_CHANGE' | string;
  module: 'USUARIOS' | 'EMPLEADOS' | 'SALONES' | 'RESERVACIONES' | 'ACADEMICO' | 'INVENTARIO' | 'CALIDAD' | 'AVISOS' | 'AUTH' | string;
  resourceId?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: string;
}

export interface AuditLogStats {
  total: number;
  totalHoy: number;
  porAccion: { action: string; count: number }[];
  porModulo: { module: string; count: number }[];
  porUsuario: { username: string; count: number }[];
}

export interface AuditFilter {
  module?: string;
  action?: string;
  userId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}



