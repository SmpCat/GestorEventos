import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function saveReceiptImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Asegurarnos de que el directorio existe
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (err) {
    console.error('Error creating upload directory', err);
  }

  // Generar un nombre único para evitar colisiones
  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  // Reemplazar espacios y caracteres raros del nombre original
  const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filename = `${uniquePrefix}-${safeFilename}`;
  
  const filepath = path.join(uploadDir, filename);

  // Escribir el archivo en disco
  await writeFile(filepath, buffer);

  // Devolver la URL pública relativa para poder mostrarla en el HTML
  return `/uploads/receipts/${filename}`;
}
