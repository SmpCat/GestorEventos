#!/bin/bash

# Script de Despliegue Automatizado para GestorEventos (QNAP NAS)
# Este script transfiere el código al NAS y ejecuta la compilación en producción.

NAS_USER="smp"
NAS_IP="192.168.178.60"
NAS_DIR="/share/CACHEDEV1_DATA/Container/gestoreventos"

echo "🚀 Iniciando despliegue de GestorEventos a Producción..."

# 0. Ajustar permisos en la carpeta del NAS por si fue creada por root o Docker
echo "🔧 Ajustando permisos en el NAS para permitir la copia..."
ssh -t ${NAS_USER}@${NAS_IP} "sudo mkdir -p ${NAS_DIR} && sudo chown -R ${NAS_USER} ${NAS_DIR}"

# 1. Sincronizar archivos (ignorar dependencias y archivos ocultos pesados)
echo "📦 Transfiriendo archivos nuevos al NAS..."
rsync -rlv --delete --update --exclude 'node_modules' --exclude '.next' --exclude '.git' ./ ${NAS_USER}@${NAS_IP}:${NAS_DIR}/

if [ $? -ne 0 ]; then
    echo "❌ Error al copiar los archivos. Revisa la conexión."
    exit 1
fi

# 2. Ejecutar la compilación remota
echo "🏗️  Construyendo la imagen Docker en el NAS (esto puede tardar unos minutos)..."
# Usamos -t para forzar TTY y poder meter la contraseña si "sudo" lo pide.
ssh -t ${NAS_USER}@${NAS_IP} "source /etc/profile && cd ${NAS_DIR} && \
sudo mkdir -p data public/uploads && sudo chown -R 1001:1001 data public/uploads && \
rm -f next.config.js next.config.mjs && \
sudo docker rm -f gestoreventos || true && \
sudo docker compose build --no-cache && \
sudo docker compose up -d --remove-orphans && echo '🧹 Limpiando imágenes antiguas (basura)...' && sudo docker image prune -f"

if [ $? -ne 0 ]; then
    echo "❌ Error durante la construcción de Docker."
    exit 1
fi

echo "✅ ¡Despliegue completado con éxito! El contenedor está corriendo en el NAS."
