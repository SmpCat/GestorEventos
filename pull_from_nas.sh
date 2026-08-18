#!/bin/bash

# Script de Replicación Completa de Datos y Fotos de Producción a Desarrollo (NAS -> Local)
# Este script descarga directamente la base de datos SQLite real de producción (prod.db) 
# y las fotos subidas (public/uploads) a tu entorno local.

NAS_USER="smp"
NAS_IP="192.168.178.60"
NAS_DIR="/share/CACHEDEV1_DATA/Container/gestoreventos"
NAS_PORT="8222"

echo "📥 1. Descargando base de datos de producción directamente..."
if [ -f dev.db ]; then
    cp dev.db dev.db.bak
fi

# Copia binaria directa de SQLite (100% inmune a errores de foreign keys y cambios de esquema)
ssh -p ${NAS_PORT} ${NAS_USER}@${NAS_IP} "cat ${NAS_DIR}/data/prod.db" > dev.db

if [ $? -ne 0 ]; then
    echo "❌ Error al descargar la base de datos de producción."
    exit 1
fi

echo "🖼️ 2. Descargando fotos subidas (tickets y listas de la compra)..."
mkdir -p public/uploads
rsync -avz -e "ssh -p ${NAS_PORT}" ${NAS_USER}@${NAS_IP}:${NAS_DIR}/public/uploads/ ./public/uploads/

if [ $? -ne 0 ]; then
    echo "❌ Error al descargar las fotos."
    exit 1
fi

echo "✅ ¡Replicación completada con éxito! Datos y fotos locales sincronizados con producción."
