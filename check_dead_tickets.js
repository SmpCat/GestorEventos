const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🔍 INICIANDO ANÁLISIS DE REGISTROS Y ARCHIVOS HUÉRFANOS (TICKETS MUERTOS)...");

  const dbPath = 'dev.db';
  if (!fs.existsSync(dbPath)) {
    console.error("❌ No se encuentra el archivo dev.db local. Por favor, ejecuta primero ./pull_from_nas.sh para descargar los datos de producción.");
    return;
  }

  const db = new DatabaseSync(dbPath);

  // 1. Buscar gastos en la base de datos con importe 0 y no escaneados (IA fallida oculta)
  const deadExpenses = db.prepare(`
    SELECT e.id, e.description, e.store, e.amount, e.date, u.name as purchaserName
    FROM Expense e
    JOIN User u ON e.purchaserId = u.id
    WHERE e.amount = 0 AND e.isScanned = 0
  `).all();

  console.log(`\n1. 🧾 REGISTROS DE TICKETS MUERTOS EN LA BBDD (Importe 0 y No Escaneados): ${deadExpenses.length}`);
  if (deadExpenses.length > 0) {
    deadExpenses.forEach(e => {
      const dateStr = new Date(e.date).toLocaleString('es-ES');
      console.log(`   - ID: ${e.id} | Comprador: ${e.purchaserName} | Fecha: ${dateStr} | Desc: "${e.description}"`);
    });
  } else {
    console.log("   ✅ No hay registros de tickets a 0€ y no escaneados en la base de datos.");
  }

  // 2. Buscar archivos físicos huérfanos en la carpeta public/uploads/
  const uploadsDir = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.log("\n2. 📁 CARPETA DE UPLOADS LOCAL NO ENCONTRADA. No se pueden analizar los archivos físicos.");
    return;
  }

  // Obtener todos los archivos en public/uploads/ (excluyendo subcarpetas si las hay)
  const filesOnDisk = fs.readdirSync(uploadsDir).filter(file => {
    const stat = fs.statSync(path.join(uploadsDir, file));
    return stat.isFile();
  });

  // Obtener todas las URLs de imágenes referenciadas en ExpenseImage
  const expenseImages = db.prepare("SELECT url FROM ExpenseImage").all();
  // Obtener todas las URLs de imágenes referenciadas en ShoppingList
  const shoppingListImages = db.prepare("SELECT imageUrl FROM ShoppingList WHERE imageUrl IS NOT NULL").all();

  const dbReferencedUrls = new Set([
    ...expenseImages.map(img => img.url),
    ...shoppingListImages.map(img => img.imageUrl)
  ]);

  // Convertir a nombres de archivos relativos para comparar
  // Las URLs en la base de datos suelen guardarse como '/uploads/filename.ext'
  const dbReferencedFiles = new Set();
  dbReferencedUrls.forEach(url => {
    const filename = path.basename(url);
    dbReferencedFiles.add(filename);
  });

  const orphanFiles = [];
  filesOnDisk.forEach(file => {
    if (!dbReferencedFiles.has(file)) {
      orphanFiles.push(file);
    }
  });

  console.log(`\n2. 🖼️  ARCHIVOS DE IMÁGENES HUÉRFANAS EN DISCO (Archivos en la carpeta uploads sin referencia en la BBDD): ${orphanFiles.length}`);
  if (orphanFiles.length > 0) {
    orphanFiles.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      const stat = fs.statSync(filePath);
      const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);
      console.log(`   - Archivo: ${file} (${sizeMB} MB)`);
    });
  } else {
    console.log("   ✅ No hay archivos de imágenes huérfanas en la carpeta de uploads.");
  }

  // 3. Buscar referencias rotas en la BBDD (registros que apuntan a archivos que no existen en disco)
  const brokenReferences = [];
  dbReferencedUrls.forEach(url => {
    const filename = path.basename(url);
    if (!filesOnDisk.includes(filename)) {
      brokenReferences.push(url);
    }
  });

  console.log(`\n3. 🔗 REFERENCIAS ROTAS EN LA BBDD (Registros de imágenes en la BBDD que no existen físicamente en disco): ${brokenReferences.length}`);
  if (brokenReferences.length > 0) {
    brokenReferences.forEach(url => {
      console.log(`   - Referencia rota: ${url}`);
    });
  } else {
    console.log("   ✅ Todas las imágenes referenciadas en la base de datos existen en disco.");
  }
}

main().catch(err => console.error(err));
