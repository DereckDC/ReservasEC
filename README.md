# AgendaEC - Plataforma Integral de Agendamiento y Gestión de Citas

**AgendaEC** es una plataforma web full-stack diseñada para centralizar el catálogo, reserva y administración operativa de citas para múltiples negocios de servicios (centros médicos, clínicas odontológicas, centros estéticos, spas, peluquerías, consultorios profesionales y más).

La aplicación cuenta con una arquitectura moderna que combina un frontend interactivo en React 19 con Tailwind CSS, un backend en Express para automatización de notificaciones por correo y analíticas, y persistencia en tiempo real a través de **Supabase (PostgreSQL)**.

---

## Características Principales

### 1. Catálogo Global y Exploración
- **Directorio de Negocios**: Búsqueda en tiempo real por nombre, dirección, categoría y servicios.
- **Páginas de Perfil de Negocio**: Identidad visual corporativa, galería de imágenes, certificados de acreditación, horarios de atención y enlace a ubicación geográfica.
- **Sistema de Calificaciones y Reseñas**: Opiniones verificadas con puntuación por estrellas.

### 2. Agendamiento Interactivo en Tiempo Real
- **Flujo de Reserva Paso a Paso**: Selección de servicio, elección de profesional especialista, selector dinámico de fecha y selección de franjas horarias disponibles.
- **Validación de Disponibilidad**: Prevención automática de solapamiento de turnos según días y horarios de trabajo del especialista.
- **Confirmación Inmediata**: Creación de cita y envío automático de notificación por correo tanto al cliente como al administrador.

### 3. Panel de Administración para Negocios
- **Gestión Integral de Citas**: Visualización de agenda (pendientes, confirmadas, atendidas y canceladas) con actualización de estado en un clic.
- **Catálogo de Servicios**: Altas, bajas y modificaciones con precios, tiempos de duración y fotos.
- **Gestión del Equipo Profesional**: Registro de especialistas, asignación de especialidades, días laborables y franjas horarias personalizadas.
- **Ficha y Expediente del Cliente**: Registro de consultas, diagnósticos, recetas y tratamientos con exportación de fichas en PDF.
- **Analíticas de Rendimiento**: Métricas de ingresos totales, tasa de asistencia, servicios más demandados y distribución de carga laboral con gráficos interactivos.

### 4. Panel de Control Superadmin
- **Supervisión Global**: Conteo de negocios activos, volumen de citas en la plataforma, usuarios registrados y estimación de ingresos globales.
- **Gestión de Cuentas y Roles**: Asignación y cambio de roles (Cliente, Admin de Negocio, Superadmin) y vinculación a comercios específicos.

### 5. Notificaciones Automáticas por Correo
- Envío de correos automáticos mediante transportador SMTP (bienvenida a nuevos usuarios, confirmación de cita agendada, cambios de estado y recordatorios).

---

## Tecnologías Utilizadas

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React (iconos), Motion (animaciones), Recharts (gráficos), jsPDF (generación de comprobantes y fichas).
- **Backend**: Express.js, TypeScript, Nodemailer (envío de correos SMTP).
- **Base de Datos & Auth**: Supabase (PostgreSQL con Row Level Security).
- **Empaquetado & Compilación**: tsx, esbuild, Vite.

---

## Estructura del Proyecto

```plaintext
├── src/
│   ├── components/            # Componentes visuales y vistas
│   │   ├── AdminPanel.tsx     # Panel administrativo del negocio
│   │   ├── SuperAdminPanel.tsx # Panel maestro de control global
│   │   ├── Catalog.tsx        # Catálogo público de comercios
│   │   ├── BusinessDetail.tsx # Perfil público y agenda del negocio
│   │   ├── BookingModal.tsx   # Modal de flujo de reserva interactivo
│   │   ├── Header.tsx         # Barra superior, navegación y autenticación
│   │   ├── ClientHistoryModal.tsx # Expediente clínico y de atención
│   │   └── ...
│   ├── lib/
│   │   └── db.ts              # Capa de datos y cliente Supabase
│   ├── types.ts               # Definición de tipos e interfaces TypeScript
│   ├── App.tsx                # Enrutador principal y estado global
│   └── main.tsx               # Entrada de la aplicación React
├── server.ts                  # Servidor Express, API REST y servidor Vite
├── supabase_schema.sql        # Esquema DDL completo de PostgreSQL para Supabase
├── insert_business_example.sql # Script SQL para insertar un negocio de demostración
├── package.json               # Dependencias y scripts de ejecución
├── tsconfig.json              # Configuración de compilador TypeScript
└── .env.example               # Plantilla de variables de entorno requeridas
```

---

## Configuración y Puesta en Marcha

### 1. Requisitos Previos
- **Node.js**: Versión 18 o superior.
- **npm**: Versión 9 o superior.
- **Cuenta en Supabase**: Proyecto activo con base de datos PostgreSQL.

### 2. Instalación de Dependencias
Clona el repositorio o abre el proyecto y ejecuta:

```bash
npm install
```

### 3. Configuración de la Base de Datos en Supabase

1. Accede a tu consola de [Supabase](https://supabase.com/).
2. Entra a la sección **SQL Editor**.
3. Abre y ejecuta el archivo `supabase_schema.sql`. Esto creará automáticamente todas las tablas (`businesses`, `services`, `professionals`, `appointments`, `profiles`, `reviews`, `categories`, `client_histories`), restricciones de clave foránea e índices.
4. *(Opcional)* Para cargar un negocio inicial con sus categorías, servicios y doctores, ejecuta el script `insert_business_example.sql` en el mismo editor SQL.

### 4. Configuración de Variables de Entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Define los siguientes valores en tu archivo `.env`:

```env
# Conexión con Supabase
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-anon-key-de-supabase"

# Configuración SMTP para envío de correos (Opcional pero recomendado para notificaciones)
SMTP_USER="tu-correo@gmail.com"
SMTP_PASS="tu-contraseña-de-aplicacion"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
```

> **Nota para Gmail**: Si utilizas Gmail como servidor SMTP, genera una *Contraseña de Aplicación* desde la configuración de seguridad de tu cuenta de correo en lugar de tu contraseña personal.

---

## Scripts Disponibles

En el directorio del proyecto puedes ejecutar:

### `npm run dev`
Inicia la aplicación en modo de desarrollo con servidor Express y middleware de Vite:
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

### `npm run lint`
Ejecuta el chequeo estático de tipos con TypeScript:
```bash
npm run lint
```

### `npm run build`
Compila la interfaz de usuario en archivos estáticos optimizados (`dist/`) y empaqueta el servidor Node en `dist/server.cjs`:
```bash
npm run build
```

### `npm start`
Ejecuta el servidor compilado en modo de producción:
```bash
npm start
```

---

## Modelo de Datos Principal

- **`businesses`**: Registro de la empresa o consultorio (nombre, slug único, categoría, teléfono, dirección, fotos y certificados).
- **`services`**: Catálogo de prestaciones que ofrece cada negocio (duración en minutos, precio, descripción e imagen).
- **`professionals`**: Especialistas adscritos a un negocio, sus especialidades, días laborables (ej. lunes a viernes) y horarios de inicio/fin.
- **`appointments`**: Citas agendadas que vinculan cliente, negocio, servicio, profesional, fecha, hora y estado (`pending`, `reserved`, `confirmed`, `attended`, `completed`, `cancelled`).
- **`profiles`**: Usuarios registrados con rol asignado (`client`, `admin`, `superadmin`) y asociación de negocio.
- **`reviews`**: Reseñas de clientes con calificación del 1 al 5 y comentario.
- **`client_histories`**: Fichas de consulta con evolución, diagnóstico y prescripción médica/técnica.

---

## Licencia

Este proyecto está distribuido bajo la licencia MIT. Siéntete libre de adaptarlo y desplegarlo en tu propia infraestructura.
