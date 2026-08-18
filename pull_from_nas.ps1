# Script de Replicación de Datos y Fotos de Producción a Desarrollo para Windows (PowerShell)
# Este script descarga los datos reales del NAS QNAP y los importa en tu entorno local.

$NAS_USER = "smp"
$NAS_IP = "192.168.178.60"
$NAS_PORT = "8222"
$NAS_DIR = "/share/CACHEDEV1_DATA/Container/gestoreventos"

Write-Host "📥 1. Generando exportación completa de la BBDD de producción en el NAS..." -ForegroundColor Cyan
Write-Host "Te pedirá la contraseña del usuario '$NAS_USER' del NAS." -ForegroundColor Yellow

$sshCmd = "source /etc/profile && docker exec gestoreventos node -e '
const { PrismaClient } = require(\""@prisma/client\"");
const fs = require(\""fs\"");
const p = new PrismaClient({ datasources: { db: { url: \""file:/app/data/prod.db\"" } } });

async function dump() {
  const data = {
    users: await p.user.findMany(),
    events: await p.event.findMany(),
    shoppingLists: await p.shoppingList.findMany(),
    eventAttendees: await p.eventAttendee.findMany(),
    payments: await p.payment.findMany(),
    pricingRules: await p.pricingRule.findMany(),
    shoppingListItems: await p.shoppingListItem.findMany(),
    shoppingListEvidences: await p.shoppingListEvidence.findMany(),
    expenses: await p.expense.findMany(),
    expenseImages: await p.expenseImage.findMany(),
    expenseItems: await p.expenseItem.findMany(),
    shoppingListHistories: await p.shoppingListHistory.findMany(),
    systemConfigs: await p.systemConfig.findMany()
  };
  fs.writeFileSync(\""/app/public/uploads/full_dump.json\"", JSON.stringify(data, null, 2));
}
dump().finally(() => p.`$disconnect());
'"

# Ejecutar el comando SSH
ssh -p $NAS_PORT "${NAS_USER}@${NAS_IP}" $sshCmd
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Error al comunicarse con el NAS a través de SSH."
    exit
}

Write-Host "🖼️  2. Descargando datos y fotos (esto puede tardar según la red)..." -ForegroundColor Cyan
if (!(Test-Path "public/uploads")) {
    New-Item -ItemType Directory -Force -Path "public/uploads" | Out-Null
}

# Descargar el dump
scp -P $NAS_PORT "${NAS_USER}@${NAS_IP}:${NAS_DIR}/public/uploads/full_dump.json" "public/uploads/full_dump.json"
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Error al descargar full_dump.json."
    exit
}

# Descargar las imágenes (usamos scp recursivo para simular rsync)
Write-Host "Descargando imágenes de tickets y listas..." -ForegroundColor Yellow
scp -P $NAS_PORT -r "${NAS_USER}@${NAS_IP}:${NAS_DIR}/public/uploads/*" "public/uploads/"

# Limpiar dump temporal en el NAS
Write-Host "🧹 Limpiando archivo temporal de volcado en el NAS..." -ForegroundColor Gray
ssh -p $NAS_PORT "${NAS_USER}@${NAS_IP}" "rm -f ${NAS_DIR}/public/uploads/full_dump.json"

if (!(Test-Path "public/uploads/full_dump.json")) {
    Write-Error "❌ No se pudo localizar el archivo full_dump.json descargado."
    exit
}

Write-Host "🔄 3. Importando datos reales a la base de datos local (dev.db)..." -ForegroundColor Cyan
if (Test-Path "dev.db") {
    Copy-Item "dev.db" "dev.db.bak" -Force
}

npx prisma db push --accept-data-loss --skip-generate

node -e '
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const prisma = new PrismaClient();
const dump = JSON.parse(fs.readFileSync("./public/uploads/full_dump.json", "utf-8"));

async function importData() {
  await prisma.shoppingListHistory.deleteMany();
  await prisma.shoppingListItem.deleteMany();
  await prisma.shoppingListEvidence.deleteMany();
  await prisma.shoppingList.deleteMany();
  await prisma.expenseItem.deleteMany();
  await prisma.expenseImage.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.eventAttendee.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemConfig.deleteMany();

  for (const u of dump.users) await prisma.user.create({ data: u });
  for (const e of dump.events) await prisma.event.create({ data: e });
  for (const sl of dump.shoppingLists) await prisma.shoppingList.create({ data: sl });
  for (const ea of dump.eventAttendees) await prisma.eventAttendee.create({ data: ea });
  for (const pr of dump.pricingRules) await prisma.pricingRule.create({ data: pr });
  for (const p of dump.payments) await prisma.payment.create({ data: p });
  for (const sle of dump.shoppingListEvidences) await prisma.shoppingListEvidence.create({ data: sle });
  for (const ex of dump.expenses) await prisma.expense.create({ data: ex });
  for (const ei of dump.expenseImages) await prisma.expenseImage.create({ data: ei });
  for (const eitem of dump.expenseItems) await prisma.expenseItem.create({ data: eitem });
  for (const item of dump.shoppingListItems) await prisma.shoppingListItem.create({ data: item });
  for (const hist of dump.shoppingListHistories) await prisma.shoppingListHistory.create({ data: hist });
  for (const sc of dump.systemConfigs) await prisma.systemConfig.create({ data: sc });
}

importData().then(() => console.log("✅ ¡Importación completada con éxito!")).catch(e => console.error("Error importando:", e)).finally(() => prisma.$disconnect());
'

# Eliminar archivo temporal local
Remove-Item "public/uploads/full_dump.json" -ErrorAction SilentlyContinue

Write-Host "🎉 Proceso de sincronización finalizado en Windows local." -ForegroundColor Green
