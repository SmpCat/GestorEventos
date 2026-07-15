#!/bin/bash

NAS_USER="smp"
NAS_IP="192.168.178.60"
NAS_DIR="/share/CACHEDEV1_DATA/Container/watchtower"

echo "🚀 Iniciando instalación global de WatchTower en el NAS..."

# 1. Crear el archivo docker-compose.yml localmente
cat > watchtower-compose.yml << 'EOF'
version: "3.8"
services:
  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_INCLUDE_STOPPED=false
      - TZ=Europe/Madrid
EOF

# 2. Preparar la carpeta en el NAS y ajustar permisos
echo "🔧 Preparando la carpeta en el servidor..."
ssh -t ${NAS_USER}@${NAS_IP} "sudo mkdir -p ${NAS_DIR} && sudo chown -R ${NAS_USER} ${NAS_DIR}"

# 3. Enviar el archivo
echo "📦 Enviando configuración de WatchTower..."
rsync -v watchtower-compose.yml ${NAS_USER}@${NAS_IP}:${NAS_DIR}/docker-compose.yml

# 4. Arrancar WatchTower en el NAS
echo "⚙️  Arrancando WatchTower..."
ssh -t ${NAS_USER}@${NAS_IP} "source /etc/profile && cd ${NAS_DIR} && sudo docker rm -f watchtower || true && sudo docker compose up -d"
DEPLOY_STATUS=$?

# 5. Limpieza local
rm watchtower-compose.yml

if [ $DEPLOY_STATUS -ne 0 ]; then
    echo "❌ Error al configurar WatchTower en el NAS."
    exit 1
fi

echo "✅ ¡WatchTower instalado con éxito! A partir de ahora vigilará todas las aplicaciones excepto GestorEventos."
