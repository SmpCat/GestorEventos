# Script de Replicacion de Datos y Fotos de Produccion a Desarrollo para Windows (PowerShell)
# Este script descarga los datos reales del NAS QNAP y los importa en tu entorno local.

$NAS_USER = "smp"
$NAS_IP = "192.168.178.60"
$NAS_PORT = "8222"
$NAS_DIR = "/share/CACHEDEV1_DATA/Container/gestoreventos"

Write-Host "[1/2] Copiando la base de datos de produccion desde el NAS..." -ForegroundColor Cyan

# Copiar prisma/dev.db actual a dev.db.bak por seguridad
if (Test-Path "prisma/dev.db") {
    Copy-Item "prisma/dev.db" "prisma/dev.db.bak" -Force
}

# Descargar la base de datos real mediante scp (modo binario seguro legacy)
scp -O -P $NAS_PORT "${NAS_USER}@${NAS_IP}:${NAS_DIR}/data/prod.db" "prisma/dev.db"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al descargar la base de datos prod.db."
    exit
}

Write-Host "[2/2] Descargando y sincronizando imagenes y fotos..." -ForegroundColor Cyan
if (!(Test-Path "public/uploads")) {
    New-Item -ItemType Directory -Force -Path "public/uploads" | Out-Null
}

# Descargar las imagenes completas recursivamente (legacy -O)
scp -O -r -P $NAS_PORT "${NAS_USER}@${NAS_IP}:${NAS_DIR}/public/uploads" "public/"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al descargar las imagenes."
    exit
}

# Regenerar cliente de prisma
npx prisma generate

Write-Host "Proceso de sincronizacion finalizado en Windows local." -ForegroundColor Green
