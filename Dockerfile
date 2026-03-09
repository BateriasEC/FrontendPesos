# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# En producción las peticiones /api las resuelve nginx (proxy al backend)
ENV VITE_API_BASE_URL=/api
RUN npm run build

# Stage 2: Servir con nginx
FROM nginx:alpine

# Copiar artefactos del build y configuración nginx
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
