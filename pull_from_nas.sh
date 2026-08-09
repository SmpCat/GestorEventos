#!/bin/bash

# Script de Replicación de Datos de Producción a Desarrollo (NAS -> Local)
# Este script descarga la BBDD real de producción (prod.db) y las fotos/tickets subidos al entorno local.

NAS_USER="smp"
NAS_IP="192.168.178.60"
NAS_DIR="/share/CACHEDEV1_DATA/Container/gestoreventos"
NAS_PORT="8222"

echo "📥 Descargando copia de datos de Producción a Desarrollo..."

# 1. Copia de seguridad de la BBDD local anterior
if [ -f dev.db ]; then
    cp dev.db dev.db.bak
    echo "💾 Backup local de dev.db guardado como dev.db.bak"
fi

# 2. Descargar la BBDD de producción como dev.db
echo "🗄️ Descargando base de datos prod.db..."
rsync -avz -e "ssh -p ${NAS_PORT}" ${NAS_USER}@${NAS_IP}:${NAS_DIR}/data/prod.db ./dev.db

if [ $? -ne 0 ]; then
    echo "❌ Error al descargar prod.db. Revisa la conexión SSH."
    exit 1
fi

# 3. Descargar fotos e imágenes de subidas (receipts y shopping-lists)
echo "🖼️ Sincronizando fotos de tickets y listas de la compra..."
mkdir -p public/uploads
rsync -avz -e "ssh -p ${NAS_PORT}" ${NAS_USER}@${NAS_IP}:${NAS_DIR}/public/uploads/ ./public/uploads/

if [ $? -ne 0 ]; then
    echo "❌ Error al descargar las imágenes subidas."
    exit 1
fi

# 4. Asegurar que Prisma sincronice la estructura si hay cambios nuevos
echo "🔄 Asegurando compatibilidad con el esquema Prisma local..."
npx prisma db push --accept-data-loss --skip-generate

echo "✅ ¡Replicación completada con éxito! Tu entorno local de desarrollo ahora tiene todos los datos y fotos reales de Producción."
