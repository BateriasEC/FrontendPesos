

# -----------------------------------------------------------------------------
# Stage 1: Build (Vite + React)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=/api
ARG BACKEND_HOST=backend-api
ARG BACKEND_PORT=3000

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Instalar dependencias con pnpm usando el lockfile del proyecto
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && \
    pnpm config set ignore-scripts false && \
    pnpm install --frozen-lockfile --config.dangerously-allow-all-builds=true

# Copiar código fuente
COPY . .

# Preparar la configuración de Nginx en build para que runtime no ejecute scripts
RUN sed -i "s|__BACKEND_HOST__|${BACKEND_HOST}|g; s|__BACKEND_PORT__|${BACKEND_PORT}|g" nginx.conf

# Build de producción
RUN pnpm run build


# -----------------------------------------------------------------------------
# Stage 2: Runtime (Nginx)
# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Copiar configuración personalizada de Nginx (SPA support)
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos generados
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer puerto
EXPOSE 80