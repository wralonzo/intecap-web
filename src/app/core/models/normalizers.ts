import {
  User,
  Empleado,
  Position,
  Salon,
  Carrera,
  Curso,
  Jornada,
  Reservacion,
  Mobiliario,
  Suministro,
  ControlCalidad,
  Aviso,
} from './index';

export function normalizePosition(p: any): Position {
  if (!p) return p;
  const name = p.name || p.tipoEmpleado || '';
  return {
    ...p,
    name,
    tipoEmpleado: name,
    status: p.status ?? p.estado ?? 1,
    estado: p.estado ?? p.status ?? 1,
  };
}

export function normalizeEmpleado(e: any): Empleado {
  if (!e) return e;
  const nombres = e.nombres || e.firstName || '';
  const apellidos = e.apellidos || e.lastName || '';
  const direccion = e.direccion || e.address || '';
  const telefono = e.telefono || e.phone || '';
  const profesion = e.profesion || e.profession || '';
  const positionId = e.positionId ?? e.tipoEmpleadoId ?? 1;
  const position = normalizePosition(e.position || e.tipoEmpleado);
  const status = e.status ?? e.estado ?? 1;

  return {
    ...e,
    nombres,
    apellidos,
    firstName: nombres,
    lastName: apellidos,
    direccion,
    address: direccion,
    telefono,
    phone: telefono,
    profesion,
    profession: profesion,
    positionId,
    tipoEmpleadoId: positionId,
    position,
    tipoEmpleado: position,
    status,
    estado: status,
    user: normalizeUser(e.user),
  };
}

export function normalizeUser(u: any): User {
  if (!u) return u;
  const employeeId = u.employeeId ?? u.empleadoId ?? null;
  const employee = normalizeEmpleado(u.employee || u.empleado);
  const status = u.status ?? u.estado ?? 1;
  return {
    ...u,
    employeeId,
    empleadoId: employeeId,
    employee,
    empleado: employee,
    status,
    estado: status,
  };
}

export function normalizeSalon(s: any): Salon {
  if (!s) return s;
  const capacity = s.capacity ?? s.cantidadPersonas ?? 25;
  const roomType = s.roomType ?? s.tipoSalon ?? 1;
  const start = s.start || s.startTime || undefined;
  const end = s.end || s.endTime || undefined;
  const employeeId = s.employeeId ?? s.empleadoId ?? undefined;
  const employee = normalizeEmpleado(s.employee || s.empleado);
  const shiftId = s.shiftId ?? s.jornadaId ?? undefined;
  const shift = normalizeJornada(s.shift || s.jornada);
  const courseId = s.courseId ?? s.cursoId ?? undefined;
  const course = normalizeCurso(s.course || s.curso);
  const furniture = (s.furniture || s.mobiliarios || []).map(normalizeMobiliario);
  const status = s.status ?? s.estado ?? 1;

  return {
    ...s,
    capacity,
    cantidadPersonas: capacity,
    roomType,
    tipoSalon: roomType,
    start,
    startTime: start,
    end,
    endTime: end,
    employeeId,
    empleadoId: employeeId,
    employee,
    empleado: employee,
    shiftId,
    jornadaId: shiftId,
    shift,
    jornada: shift,
    courseId,
    cursoId: courseId,
    course,
    curso: course,
    furniture,
    mobiliarios: furniture,
    status,
    estado: status,
  };
}

export function normalizeCarrera(c: any): Carrera {
  if (!c) return c;
  const name = c.name || c.nombre || '';
  const description = c.description || c.descripcion || '';
  const code = c.code || c.codigo || '';
  const status = c.status ?? c.estado ?? 1;
  const courses = (c.courses || c.cursos || []).map(normalizeCurso);
  return {
    ...c,
    name,
    nombre: name,
    description,
    descripcion: description,
    code,
    codigo: code,
    status,
    estado: status,
    courses,
    cursos: courses,
  };
}

export function normalizeCurso(cur: any): Curso {
  if (!cur) return cur;
  const name = cur.name || cur.nombre || '';
  const description = cur.description || cur.descripcion || '';
  const careerId = cur.careerId ?? cur.carreraId ?? null;
  const career = normalizeCarrera(cur.career || cur.carrera);
  const isOnline = cur.isOnline ?? cur.esEnLinea ?? false;
  const employeeId = cur.employeeId ?? cur.empleadoId ?? null;
  const employee = normalizeEmpleado(cur.employee || cur.empleado);
  const shiftId = cur.shiftId ?? cur.jornadaId ?? null;
  const shift = normalizeJornada(cur.shift || cur.jornada);
  const status = cur.status ?? cur.estado ?? 1;

  return {
    ...cur,
    name,
    nombre: name,
    description,
    descripcion: description,
    careerId,
    carreraId: careerId,
    career,
    carrera: career,
    isOnline,
    esEnLinea: isOnline,
    employeeId,
    empleadoId: employeeId,
    employee,
    empleado: employee,
    shiftId,
    jornadaId: shiftId,
    shift,
    jornada: shift,
    status,
    estado: status,
  };
}

export function normalizeJornada(j: any): Jornada {
  if (!j) return j;
  const name = j.name || j.nombre || '';
  const startTime = j.startTime || j.horaInicio || j.horainicio || '07:30';
  const endTime = j.endTime || j.horaFin || j.horafin || '12:30';
  const status = j.status ?? j.estado ?? 1;

  return {
    ...j,
    name,
    nombre: name,
    startTime,
    horaInicio: startTime,
    horainicio: startTime,
    endTime,
    horaFin: endTime,
    horafin: endTime,
    status,
    estado: status,
  };
}

export function normalizeReservacion(r: any): Reservacion {
  if (!r) return r;
  const userId = r.userId ?? r.usuarioId ?? undefined;
  const user = normalizeUser(r.user || r.usuario);
  const roomId = r.roomId ?? r.salonId;
  const room = normalizeSalon(r.room || r.salon);
  const employeeId = r.employeeId ?? r.empleadoId;
  const employee = normalizeEmpleado(r.employee || r.empleado);
  const courseId = r.courseId ?? r.cursoId;
  const course = normalizeCurso(r.course || r.curso);
  const shiftName = r.shiftName || r.jornada || 'Jornada Única';
  const eventType = r.eventType || r.tipoEvento || 'Evento Especial';
  const eventDate = r.eventDate || r.fechaEvento || '';
  const startTime = r.startTime || r.horaInicio || '08:00';
  const endTime = r.endTime || r.horaFin || '12:00';
  const attendeesCount = r.attendeesCount ?? r.cantidadPersonas ?? 20;
  const description = r.description || r.descripcion || '';
  const followUp = r.followUp || r.seguimiento || '';
  const rejectionReason = r.rejectionReason || r.motivoRechazo || '';
  const status = r.status ?? r.estado ?? 1;

  return {
    ...r,
    userId,
    usuarioId: userId,
    user,
    usuario: user,
    roomId,
    salonId: roomId,
    room,
    salon: room,
    employeeId,
    empleadoId: employeeId,
    employee,
    empleado: employee,
    courseId,
    cursoId: courseId,
    course,
    curso: course,
    shiftName,
    jornada: shiftName,
    eventType,
    tipoEvento: eventType,
    eventDate,
    fechaEvento: eventDate,
    startTime,
    horaInicio: startTime,
    endTime,
    horaFin: endTime,
    attendeesCount,
    cantidadPersonas: attendeesCount,
    description,
    descripcion: description,
    followUp,
    seguimiento: followUp,
    rejectionReason,
    motivoRechazo: rejectionReason,
    status,
    estado: status,
  };
}

export function normalizeMobiliario(m: any): Mobiliario {
  if (!m) return m;
  const name = m.name || m.nombre || '';
  const quantity = m.quantity ?? m.cantidad ?? 1;
  const description = m.description || m.descripcion || '';
  const status = m.status ?? m.estado ?? 1;
  return {
    ...m,
    name,
    nombre: name,
    quantity,
    cantidad: quantity,
    description,
    descripcion: description,
    status,
    estado: status,
  };
}

export function normalizeSuministro(i: any): Suministro {
  if (!i) return i;
  const name = i.name || i.nombre || '';
  const quantity = i.quantity ?? i.cantidad ?? 1;
  const category = i.category || i.categoria || 'General';
  const description = i.description || i.descripcion || '';
  const status = i.status ?? i.estado ?? 1;
  return {
    ...i,
    name,
    nombre: name,
    quantity,
    cantidad: quantity,
    category,
    categoria: category,
    description,
    descripcion: description,
    status,
    estado: status,
  };
}

export function normalizeControlCalidad(q: any): ControlCalidad {
  if (!q) return q;
  const employeeId = q.employeeId ?? q.empleadoId;
  const employee = normalizeEmpleado(q.employee || q.empleado);
  const moduleName = q.moduleName || q.nombreModulo || '';
  const programNumber = q.programNumber || q.noPrograma || '';
  const location = q.location || q.lugar || '';
  const developmentTopic = q.developmentTopic || q.temaDesarrollo || '';
  const learningResult = q.learningResult || q.resultadoAprendizaje || '';
  const trainingProduct = q.trainingProduct || q.productoFormacion || '';
  const startDate = q.startDate || q.fechaInicio || '';
  const endDate = q.endDate || q.fechaFin || '';

  const planScore = q.planScore ?? q.totalPlanificacion ?? 25;
  const processScore = q.processScore ?? q.totalProceso ?? 10;
  const pedagogicalScore = q.pedagogicalScore ?? q.totalDesempeno ?? 50;
  const transversalScore = q.transversalScore ?? q.totalAspectos ?? 15;
  const totalScore = q.totalScore ?? q.promedio ?? q.punteoTotal ?? 100;
  const statusDeclaration = q.statusDeclaration || q.declaracionEstado || 'CONFORME';
  const observations = q.observations || q.observaciones || '';
  const teacherCommitments = q.teacherCommitments || q.compromisosDocente || '';
  const status = q.status ?? q.estado ?? 1;
  const createdAt = q.createdAt || q.fechaCreacion || '';

  return {
    ...q,
    employeeId,
    empleadoId: employeeId,
    employee,
    empleado: employee,
    moduleName,
    nombreModulo: moduleName,
    programNumber,
    noPrograma: programNumber,
    location,
    lugar: location,
    developmentTopic,
    temaDesarrollo: developmentTopic,
    learningResult,
    resultadoAprendizaje: learningResult,
    trainingProduct,
    productoFormacion: trainingProduct,
    startDate,
    fechaInicio: startDate,
    endDate,
    fechaFin: endDate,
    planScore,
    totalPlanificacion: planScore,
    processScore,
    totalProceso: processScore,
    pedagogicalScore,
    totalDesempeno: pedagogicalScore,
    transversalScore,
    totalAspectos: transversalScore,
    totalScore,
    promedio: totalScore,
    punteoTotal: totalScore,
    statusDeclaration,
    declaracionEstado: statusDeclaration,
    observations,
    observaciones: observations,
    teacherCommitments,
    compromisosDocente: teacherCommitments,
    status,
    estado: status,
    createdAt,
    fechaCreacion: createdAt,
  };
}

export function normalizeAviso(a: any): Aviso {
  if (!a) return a;
  const title = a.title || a.titulo || '';
  const content = a.content || a.contenido || '';
  const type = a.type || a.tipo || 'general';
  const showOnTv = a.showOnTv ?? a.mostrarEnTv ?? true;
  const priority = a.priority ?? a.prioridad ?? 2;
  const startDate = a.startDate || a.fechaInicio || '';
  const endDate = a.endDate || a.fechaFin || '';
  const status = a.status ?? a.estado ?? 1;

  return {
    ...a,
    title,
    titulo: title,
    content,
    contenido: content,
    type,
    tipo: type,
    showOnTv,
    mostrarEnTv: showOnTv,
    priority,
    prioridad: priority,
    startDate,
    fechaInicio: startDate,
    endDate,
    fechaFin: endDate,
    status,
    estado: status,
  };
}
