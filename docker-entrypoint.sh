#!/bin/sh

# Reemplazar variables de entorno en el archivo JavaScript compilado
# Esto permite configurar la API URL en tiempo de ejecución

echo "🔧 Configurando variables de entorno..."
echo "   VITE_API_BASE_URL: ${VITE_API_BASE_URL:-/api}"

# Si no se proporciona VITE_API_BASE_URL, usar /api por defecto
API_URL="${VITE_API_BASE_URL:-/api}"

# Buscar todos los archivos JS en /usr/share/nginx/html/assets
for file in /usr/share/nginx/html/assets/*.js; do
  if [ -f "$file" ]; then
    echo "   Procesando: $(basename $file)"
    # Reemplazar el placeholder con la variable de entorno real
    sed -i "s|VITE_API_BASE_URL_PLACEHOLDER|${API_URL}|g" "$file"
  fi
done

echo "✅ Variables de entorno configuradas correctamente"

# Host/puerto del API en la red Docker (debe coincidir con el nombre del SERVICIO en Portainer/Compose)
BACKEND_HOST="${BACKEND_HOST:-backend}"
BACKEND_PORT="${BACKEND_PORT:-3000}"
echo "🔧 Nginx proxy /api → http://${BACKEND_HOST}:${BACKEND_PORT}"
sed -i "s/__BACKEND_HOST__/${BACKEND_HOST}/g" /etc/nginx/conf.d/default.conf
sed -i "s/__BACKEND_PORT__/${BACKEND_PORT}/g" /etc/nginx/conf.d/default.conf

# Ejecutar el comando original (nginx)
exec "$@"
