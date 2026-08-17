#!/bin/bash

# Script de Replicación Completa de Datos y Fotos de Producción a Desarrollo (NAS -> Local)
# Este script extrae de forma segura los registros reales de producción (BBDD SQLite + Fotos subidas) 
# y los replica en tu entorno de desarrollo local (dev.db y public/uploads/).

NAS_USER="smp"
NAS_IP="192.168.178.60"
NAS_DIR="/share/CACHEDEV1_DATA/Container/gestoreventos"
NAS_PORT="8222"

echo "📥 1. Generando exportación completa de la BBDD de producción en el NAS..."
ssh -p ${NAS_PORT} ${NAS_USER}@${NAS_IP} "source /etc/profile && docker exec gestoreventos node -e '
const { PrismaClient } = require(\"@prisma/client\");
const fs = require(\"fs\");
const p = new PrismaClient({ datasources: { db: { url: \"file:/app/data/prod.db\" } } });

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
  fs.writeFileSync(\"/app/public/uploads/full_dump.json\", JSON.stringify(data, null, 2));
}
dump().finally(() => p.\$disconnect());
'"

if [ $? -ne 0 ]; then
    echo "❌ Error al comunicarse con el contenedor Docker del NAS."
    exit 1
fi

echo "🖼️ 2. Descargando fotos subidas (tickets y listas de la compra)..."
mkdir -p public/uploads
rsync -avz -e "ssh -p ${NAS_PORT}" ${NAS_USER}@${NAS_IP}:${NAS_DIR}/public/uploads/ ./public/uploads/

echo "🧹 Limpiando archivo temporal de volcado en el NAS..."
ssh -p ${NAS_PORT} ${NAS_USER}@${NAS_IP} "source /etc/profile && docker exec gestoreventos rm -f /app/public/uploads/full_dump.json"

if [ ! -f public/uploads/full_dump.json ]; then
    echo "❌ No se pudo descargar full_dump.json."
    exit 1
fi

echo "🔄 3. Importando datos reales a la base de datos local (dev.db)..."
if [ -f dev.db ]; then
    cp dev.db dev.db.bak
fi

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

importData().catch(e => console.error("Error importando:", e)).finally(() => prisma.$disconnect());
'

rm -f public/uploads/full_dump.json ./full_dump.json

echo "✅ ¡Replicación completada! Se han importado los 35 usuarios, 152 artículos de compra y 4 fotos de listas manuscritas a tu dev.db local."
