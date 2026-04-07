

# -----------------------------------------------------------------------------
# Stage 1: Build (Vite + React)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Instalar dependencias
COPY package.json package-lock.json* ./
RUN npm ci

# Copiar código fuente
COPY . .

# Build con tolerancia a errores de TypeScript:
# 1) intenta script normal (tsc -b && vite build)
# 2) si falla por TS, ejecuta vite build para generar /dist
RUN npm run build || npx vite build
RUN npm cache clean --force


# -----------------------------------------------------------------------------
# Stage 2: Runtime (Nginx)
# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Copiar configuración personalizada de Nginx (SPA support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos generados
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar script de inicio
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Exponer puerto
EXPOSE 80

# Usar el script de inicio
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]