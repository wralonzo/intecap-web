# INTECAP Web Frontend (Angular 22.0.7)

Portal institucional y administrativo de **INTECAP** desarrollado en **Angular 22.0.7** con la paleta de colores oficial institucional ([https://intecap.edu.gt](https://intecap.edu.gt)), Standalone Components, Angular Signals y conexión directa con el backend NestJS REST API.

---

## 🎨 Paleta de Colores Institucional (INTECAP)

- **Azul Principal Institucional (Navy):** `#002F6C` / `#001A3D`
- **Dorado / Amarillo Accent:** `#FDB813` / `#F59E0B`
- **Azul Cielo / Destacados:** `#0284C7` / `#E0F2FE`
- **Tipografía Oficial:** `Outfit` (Títulos y branding) + `Inter` (UI y tablas)

---

## 🚀 Módulos y Vistas Implementadas

1. **Autenticación Institucional (`/login`):**
   - Inicio de sesión con JWT.
   - Botón de auto-registro y acceso rápido demo (`admin` / `password123`).
2. **Dashboard Principal (`/dashboard`):**
   - Tarjetas KPI en tiempo real (Salones, Talleres, Docentes, Reservaciones activas).
   - Acceso rápido y tabla de últimas reservaciones.
3. **Salones y Talleres (`/salones`):**
   - Pestañas de filtrado (Salones teóricos vs Talleres prácticos).
   - Indicadores de disponibilidad en tiempo real y capacidad.
   - Modal para registrar nuevos espacios.
4. **Reservaciones (`/reservaciones`):**
   - Asignación de salones con instructor, curso, jornada y capacidad.
   - Modal interactivo de programación de eventos.
5. **Directorio Docente (`/empleados`):**
   - Directorio de instructores y colaboradores.
   - Buscador en tiempo real por nombre, apellido o correo.
   - Modal de alta de personal.
6. **Gestión Académica (`/academico`):**
   - Catálogo de Carreras Técnicas, Cursos Modulares y Jornadas/Horarios.
7. **Control de Inventario (`/inventario`):**
   - Seguimiento de mobiliario pedagógico y suministros en aulas.
8. **Control de Calidad (`/calidad`):**
   - Evaluaciones docentes con semáforo de calificaciones y observaciones.

---

## 🏃‍♂️ Ejecución

```bash
# Iniciar servidor de desarrollo
cd intecap-web
npm start

# Compilar para producción
npm run build
```

- **Frontend:** [http://localhost:4200](http://localhost:4200)
- **Backend API:** [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- **Swagger Docs:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
