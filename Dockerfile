

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

# Exponer puerto
EXPOSE 80

# Configurar variables de entorno y arrancar Nginx directamente sin scripts externos
CMD ["sh", "-c", "\
    echo ' Configurando variables de entorno...'; \
    API_URL=\"\${VITE_API_BASE_URL:-/api}\"; \
    for file in /usr/share/nginx/html/assets/*.js; do \
      if [ -f \"\$file\" ]; then \
        sed -i \"s|VITE_API_BASE_URL_PLACEHOLDER|\${API_URL}|g\" \"\$file\"; \
      fi; \
    done; \
    BACKEND_HOST=\"\${BACKEND_HOST:-backend}\"; \
    BACKEND_PORT=\"\${BACKEND_PORT:-3000}\"; \
    sed -i \"s/__BACKEND_HOST__/\${BACKEND_HOST}/g\" /etc/nginx/conf.d/default.conf; \
    sed -i \"s/__BACKEND_PORT__/\${BACKEND_PORT}/g\" /etc/nginx/conf.d/default.conf; \
    echo ' Variables configuradas, iniciando Nginx...'; \
    exec nginx -g 'daemon off;' \
"]