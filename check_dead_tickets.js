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

  // Obtener todos los archivos recursivamente en public/uploads/
  function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      } else {
        arrayOfFiles.push(fullPath);
      }
    });

    return arrayOfFiles;
  }

  const allPhysicalFiles = getAllFiles(uploadsDir);

  // Obtener todas las URLs de imágenes referenciadas en ExpenseImage
  const expenseImages = db.prepare("SELECT url FROM ExpenseImage").all();
  // Obtener todas las URLs de imágenes referenciadas en ShoppingList
  const shoppingListImages = db.prepare("SELECT imageUrl FROM ShoppingList WHERE imageUrl IS NOT NULL").all();

  const dbReferencedUrls = new Set([
    ...expenseImages.map(img => img.url),
    ...shoppingListImages.map(img => img.imageUrl)
  ]);

  const orphanFiles = [];
  allPhysicalFiles.forEach(absolutePath => {
    // Convertir ruta absoluta local a URL relativa (ej: /uploads/receipts/archivo.jpg)
    const relativePath = '/uploads' + absolutePath.split('/public/uploads')[1].replace(/\\/g, '/');
    if (!dbReferencedUrls.has(relativePath)) {
      orphanFiles.push(relativePath);
    }
  });

  console.log(`\n2. 🖼️  ARCHIVOS DE IMÁGENES HUÉRFANAS EN DISCO (Archivos en la carpeta uploads sin referencia en la BBDD): ${orphanFiles.length}`);
  if (orphanFiles.length > 0) {
    orphanFiles.forEach(file => {
      console.log(`   - Archivo huérfano: ${file}`);
    });
  } else {
    console.log("   ✅ No hay archivos de imágenes huérfanas en la carpeta de uploads.");
  }

  // 3. Buscar referencias rotas en la BBDD (registros que apuntan a archivos que no existen en disco)
  const brokenReferences = [];
  dbReferencedUrls.forEach(url => {
    const localPath = path.join(__dirname, 'public', url);
    if (!fs.existsSync(localPath)) {
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
