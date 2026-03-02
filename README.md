# 🌐 Portal Web - Sistema de Reciclaje de Baterías

Portal web administrativo desarrollado con React, TypeScript y Vite para la gestión y monitoreo del sistema de reciclaje de baterías.

## ⚡ Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con la URL de tu backend

# 3. Iniciar en modo desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:5173
```

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Desarrollo](#-desarrollo)
- [Producción](#-producción)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Funcionalidades](#-funcionalidades)
- [Scripts Disponibles](#-scripts-disponibles)
- [Integración con Backend](#-integración-con-backend)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Características

- 📊 Dashboard con métricas en tiempo real
- 🚛 Gestión de vehículos y pesajes
- 📦 Control de pallets y productos
- 📈 Reportes y gráficas interactivas
- 🔔 Sistema de alertas y notificaciones
- 📄 Exportación a PDF, Excel y CSV
- 🏷️ Generación de etiquetas con QR
- 👥 Gestión de usuarios y roles
- 🔐 Autenticación con JWT
- 📱 Diseño responsive
- 🎨 Interfaz moderna con Tailwind CSS

---

## 🛠️ Tecnologías

### Core
- **React 19** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server

### UI/Styling
- **Tailwind CSS** - Framework de CSS utility-first
- **Heroicons** - Iconos
- **Recharts** - Gráficas y visualizaciones

### Estado y Datos
- **TanStack Query (React Query)** - Gestión de estado del servidor
- **TanStack Table** - Tablas avanzadas
- **Axios** - Cliente HTTP

### Routing y Formularios
- **React Router DOM** - Enrutamiento
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas

### Utilidades
- **jsPDF** - Generación de PDFs
- **xlsx** - Exportación a Excel
- **QRCode.react** - Generación de códigos QR
- **Socket.io Client** - Comunicación en tiempo real
- **JWT Decode** - Decodificación de tokens

### Desarrollo
- **ESLint** - Linter
- **JSON Server** - Mock API para desarrollo
- **Concurrently** - Ejecutar múltiples comandos

---

## 📦 Requisitos Previos

- **Node.js** v18 o superior
- **npm** v9 o superior
- **Backend** corriendo (ver `backend-kilo/README.md`)

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd portal-web
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita el archivo `.env`:

```env
# URL del backend
VITE_API_BASE_URL=http://localhost:3000/api
```

**Importante**: Asegúrate de que el backend esté corriendo en el puerto 3000.

---

## ⚙️ Configuración

### Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | URL base del backend | `http://localhost:3000/api` |

### Configuración de Tailwind

El proyecto usa Tailwind CSS v4. La configuración está en:
- `tailwind.config.js` - Configuración principal
- `postcss.config.js` - PostCSS config
- `src/index.css` - Estilos globales

### Configuración de TypeScript

- `tsconfig.json` - Configuración base
- `tsconfig.app.json` - Configuración de la app
- `tsconfig.node.json` - Configuración de Node

---

## 💻 Desarrollo

### Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Esto iniciará:
- **Vite dev server** en `http://localhost:5173`
- **JSON Server** (mock API) en `http://localhost:5179`

### Desarrollo con Backend Real

Si quieres usar el backend real en lugar del mock:

1. Asegúrate de que el backend esté corriendo
2. Configura `VITE_API_BASE_URL` en `.env`
3. Inicia solo Vite:

```bash
vite
```

### Hot Module Replacement (HMR)

Vite proporciona HMR automático. Los cambios se reflejan instantáneamente sin recargar la página.

### Linting

```bash
npm run lint
```

---

## 🏗️ Producción

### Build para Producción

```bash
npm run build
```

Esto genera los archivos optimizados en la carpeta `dist/`.

### Preview del Build

```bash
npm run preview
```

Sirve el build de producción localmente para verificar antes de desplegar.

### Despliegue

El contenido de la carpeta `dist/` puede desplegarse en cualquier servidor web estático:

- **Netlify**: Conecta tu repositorio y configura el build command como `npm run build`
- **Vercel**: Similar a Netlify
- **Nginx**: Copia el contenido de `dist/` a `/var/www/html`
- **Apache**: Copia el contenido de `dist/` al directorio del servidor

**Importante**: Configura el servidor para redirigir todas las rutas a `index.html` (SPA routing).

#### Ejemplo de configuración Nginx:

```nginx
server {
    listen 80;
    server_name tudominio.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 📁 Estructura del Proyecto

```
portal-web/
├── api/                          # Mock API (JSON Server)
│   └── db.json                   # Datos de prueba
│
├── public/                       # Archivos estáticos públicos
│   └── vite.svg
│
├── src/
│   ├── assets/                   # Assets (fuentes, imágenes)
│   │   └── fonts/
│   │
│   ├── components/               # Componentes reutilizables
│   │   ├── DateRange.tsx         # Selector de rango de fechas
│   │   ├── Header.tsx            # Encabezado de la app
│   │   ├── HistorialAlertas.tsx  # Historial de alertas
│   │   ├── Layout.tsx            # Layout principal
│   │   ├── Modal.tsx             # Modal genérico
│   │   ├── Pagination.tsx        # Paginación
│   │   ├── ReportCharts.tsx      # Gráficas de reportes
│   │   ├── Sidebar.tsx           # Menú lateral
│   │   └── ...
│   │
│   ├── hooks/                    # Custom hooks
│   │   ├── useReportData.ts      # Hook para datos de reportes
│   │   └── useSabanaData.ts      # Hook para sábanas
│   │
│   ├── images/                   # Imágenes de la app
│   │   ├── logo.png
│   │   └── eslogan.png
│   │
│   ├── lib/                      # Librerías y utilidades
│   │   └── auth.tsx              # Contexto de autenticación
│   │
│   ├── pages/                    # Páginas/Vistas
│   │   ├── Dashboard.tsx         # Dashboard principal
│   │   ├── Login.tsx             # Página de login
│   │   ├── Vehiculos.tsx         # Gestión de vehículos
│   │   ├── Pesajes.tsx           # Gestión de pesajes
│   │   ├── Reportes.tsx          # Reportes generales
│   │   ├── Usuarios.tsx          # Gestión de usuarios
│   │   └── ...
│   │
│   ├── routes/                   # Configuración de rutas
│   │   └── ProtectedRoute.tsx    # Rutas protegidas
│   │
│   ├── services/                 # Servicios y API
│   │   └── api.ts                # Cliente API (Axios)
│   │
│   ├── styles/                   # Estilos adicionales
│   │   └── report-sabanas.css    # Estilos de reportes
│   │
│   ├── utils/                    # Utilidades
│   │   └── label.ts              # Utilidades para etiquetas
│   │
│   ├── App.tsx                   # Componente principal
│   ├── App.css                   # Estilos del App
│   ├── main.tsx                  # Punto de entrada
│   └── index.css                 # Estilos globales
│
├── .env                          # Variables de entorno (no commitear)
├── .env.example                  # Ejemplo de variables de entorno
├── .gitignore                    # Archivos ignorados por Git
├── eslint.config.js              # Configuración de ESLint
├── index.html                    # HTML principal
├── package.json                  # Dependencias y scripts
├── postcss.config.js             # Configuración de PostCSS
├── tailwind.config.js            # Configuración de Tailwind
├── tsconfig.json                 # Configuración de TypeScript
├── vite.config.ts                # Configuración de Vite
└── README.md                     # Este archivo
```

---

## 🎯 Funcionalidades

### 1. Dashboard
- Métricas en tiempo real
- Gráficas de pesajes y variaciones
- Vehículos en planta
- Alertas activas
- Peso en proceso por camión

### 2. Gestión de Vehículos
- Registro de ingreso y salida
- Historial de vehículos
- Estados (En proceso / Descargado)
- Búsqueda y filtros

### 3. Gestión de Pesajes
- Registro de pesajes de pallets
- Repesajes
- Cálculo de variaciones
- Alertas automáticas

### 4. Reportes
- Reportes generales de pesajes
- Reportes de alertas
- Gráficas interactivas
- Exportación a PDF, Excel, CSV
- Filtros por fecha, cliente, producto

### 5. Gestión de Usuarios
- CRUD de usuarios
- Asignación de roles
- Permisos por rol

### 6. Catálogos
- Productos
- Clientes
- Tipos de vehículos
- Configuraciones

### 7. Etiquetas
- Generación de etiquetas con QR
- Impresión de etiquetas
- Vista pública de etiquetas

---

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia Vite + JSON Server
vite                     # Solo Vite (sin mock API)

# Build
npm run build            # Build de producción
npm run preview          # Preview del build

# Linting
npm run lint             # Ejecutar ESLint

# Mock API
npm run api              # Solo JSON Server
```

---

## 🔌 Integración con Backend

### Cliente API

El cliente API está configurado en `src/services/api.ts`:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Endpoints Principales

| Módulo | Endpoint | Descripción |
|--------|----------|-------------|
| **Auth** | `POST /auth/login` | Iniciar sesión |
| **Dashboard** | `GET /dashboard/stats` | Estadísticas del dashboard |
| **Vehículos** | `GET /vehicles` | Listar vehículos |
| **Vehículos** | `POST /vehicles/ingreso` | Registrar ingreso |
| **Vehículos** | `POST /vehicles/salida` | Registrar salida |
| **Pallets** | `GET /pallets` | Listar pallets |
| **Pallets** | `POST /pallets/peso` | Registrar peso |
| **Reportes** | `GET /weighings/reports` | Obtener reportes |
| **Exportar** | `GET /weighings/export/pdf` | Exportar a PDF |
| **Exportar** | `GET /weighings/export/excel` | Exportar a Excel |

### Autenticación

El sistema usa JWT para autenticación:

1. El usuario inicia sesión en `/login`
2. El backend devuelve un token JWT
3. El token se guarda en `localStorage`
4. Todas las peticiones incluyen el token en el header `Authorization`

### Manejo de Errores

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 🐛 Troubleshooting

### El servidor no inicia

**Problema**: Error al ejecutar `npm run dev`

**Solución**:
```bash
# Limpia node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
```

### Error de conexión con el backend

**Problema**: `Network Error` o `CORS Error`

**Solución**:
1. Verifica que el backend esté corriendo
2. Verifica la URL en `.env`
3. Asegúrate de que el backend tenga CORS configurado:

```typescript
// backend-kilo/src/main.ts
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
```

### Estilos no se aplican

**Problema**: Los estilos de Tailwind no funcionan

**Solución**:
```bash
# Limpia caché de Vite
rm -rf node_modules/.vite
npm run dev
```

### Build falla

**Problema**: Error al ejecutar `npm run build`

**Solución**:
```bash
# Verifica errores de TypeScript
npx tsc --noEmit

# Corrige los errores y vuelve a intentar
npm run build
```

### Token expirado

**Problema**: Sesión expira constantemente

**Solución**:
- Verifica la configuración de JWT en el backend
- Aumenta el tiempo de expiración del token
- Implementa refresh tokens

### Rutas no funcionan en producción

**Problema**: 404 al recargar la página en producción

**Solución**:
Configura el servidor para redirigir todas las rutas a `index.html`:

```nginx
# Nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

```apache
# Apache (.htaccess)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 🔐 Seguridad

### Mejores Prácticas

- ✅ No commitear archivos `.env`
- ✅ Usar HTTPS en producción
- ✅ Validar datos en el frontend y backend
- ✅ Sanitizar inputs de usuario
- ✅ Implementar rate limiting
- ✅ Usar tokens con expiración
- ✅ Implementar refresh tokens
- ✅ Validar permisos en cada endpoint

---

## 📊 Performance

### Optimizaciones Implementadas

- ✅ Code splitting con React.lazy
- ✅ Tree shaking automático con Vite
- ✅ Minificación de assets
- ✅ Compresión de imágenes
- ✅ Lazy loading de componentes
- ✅ Memoización con React.memo
- ✅ Debouncing en búsquedas

### Métricas Objetivo

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: > 90

---

## 🧪 Testing (Próximamente)

El proyecto está preparado para testing con:
- **Vitest** - Test runner
- **React Testing Library** - Testing de componentes
- **MSW** - Mock Service Worker para APIs

---

## 📚 Recursos Adicionales

### Documentación del Proyecto
- `backend-kilo/README.md` - Documentación del backend
- `app-reciclaje/README.md` - Documentación de la app móvil
- `DOCUMENTACION_API.md` - Documentación de la API

### Documentación Externa
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [React Router](https://reactrouter.com/)

---

## 👥 Equipo

Desarrollado para Rubix Energy Group

---

## 📝 Changelog

### v1.0.0 (Actual)
- ✅ Dashboard con métricas en tiempo real
- ✅ Gestión completa de vehículos y pesajes
- ✅ Sistema de reportes con exportación
- ✅ Generación de etiquetas con QR
- ✅ Autenticación con JWT
- ✅ Diseño responsive

---

**Versión**: 1.0.0  
**Framework**: React 19 + TypeScript + Vite  
**UI**: Tailwind CSS  
**Estado**: TanStack Query
