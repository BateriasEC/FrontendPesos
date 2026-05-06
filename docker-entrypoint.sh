#!/bin/sh
set -e

echo "Configurando variables de entorno..."

# Reemplazar placeholder de la URL de la API en los JS compilados
API_URL="${VITE_API_BASE_URL:-/api}"
for file in /usr/share/nginx/html/assets/*.js; do
  if [ -f "$file" ]; then
    sed -i "s|VITE_API_BASE_URL_PLACEHOLDER|${API_URL}|g" "$file"
  fi
done

# Reemplazar placeholders del host/puerto del backend en la config de Nginx
BACKEND_HOST="${BACKEND_HOST:-backend}"
BACKEND_PORT="${BACKEND_PORT:-3000}"
sed -i "s/__BACKEND_HOST__/${BACKEND_HOST}/g" /etc/nginx/conf.d/default.conf
sed -i "s/__BACKEND_PORT__/${BACKEND_PORT}/g" /etc/nginx/conf.d/default.conf

echo "Variables configuradas. Backend: ${BACKEND_HOST}:${BACKEND_PORT} | API URL: ${API_URL}"
echo "Iniciando Nginx..."

exec nginx -g "daemon off;"
