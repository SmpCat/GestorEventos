'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Obtener la lista de la compra de un evento
export async function getShoppingList(eventId: string) {
  try {
    const items = await prisma.shoppingListItem.findMany({
      where: { eventId },
      include: {
        assignee: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { isPurchased: 'asc' }, // Los no comprados primero
        { createdAt: 'desc' }
      ],
    });
    return { success: true, data: items };
  } catch (error: any) {
    return { success: false, error: 'Error al obtener la lista: ' + error.message };
  }
}

// Añadir un artículo manualmente
export async function addShoppingItem(eventId: string, name: string) {
  try {
    const item = await prisma.shoppingListItem.create({
      data: {
        name,
        eventId,
      },
    });
    revalidatePath('/shopping');
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: 'Error al añadir el producto: ' + error.message };
  }
}

// Marcar como comprado o no comprado
export async function togglePurchased(itemId: string, isPurchased: boolean) {
  try {
    const item = await prisma.shoppingListItem.update({
      where: { id: itemId },
      data: { isPurchased },
    });
    revalidatePath('/shopping');
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: 'Error al actualizar el estado: ' + error.message };
  }
}

// Marcar múltiples artículos como comprados o no comprados a la vez
export async function togglePurchasedBulk(itemIds: string[], isPurchased: boolean) {
  try {
    await prisma.shoppingListItem.updateMany({
      where: { id: { in: itemIds } },
      data: { isPurchased },
    });
    revalidatePath('/shopping');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al actualizar múltiples artículos: ' + error.message };
  }
}

// Asignar el artículo a un usuario para que lo compre
export async function assignItem(itemId: string, userId: string | null) {
  try {
    const item = await prisma.shoppingListItem.update({
      where: { id: itemId },
      data: { assigneeId: userId },
    });
    revalidatePath('/shopping');
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: 'Error al asignar el producto: ' + error.message };
  }
}

// Borrar un artículo
export async function deleteItem(itemId: string) {
  try {
    await prisma.shoppingListItem.delete({
      where: { id: itemId },
    });
    revalidatePath('/shopping');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al borrar el producto: ' + error.message };
  }
}

// ==============================================================
// FUNCIONES DE INTELIGENCIA ARTIFICIAL (GEMINI)
// ==============================================================

export async function scanShoppingListAI(eventId: string, base64Image: string, mimeType: string) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('No hay clave de API de Gemini configurada en el servidor.');
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Usamos el modelo rápido y multimodal para visión
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    
    const prompt = `Eres un asistente experto en transcripción. 
Extrae todos los artículos de la lista de la compra de esta imagen. 
Ignora firmas, títulos u otros textos irrelevantes. 
Si hay cantidades, inclúyelas junto al nombre (ej. "2 tomates").
DEVUELVE ÚNICAMENTE UN ARRAY EN FORMATO JSON, sin bloques de código Markdown (\`\`\`), sin la palabra "json".
Ejemplo de salida exacta que espero de ti:
["Manzanas", "2 Litros de leche", "Pan de molde", "Patatas"]`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    
    // Limpiamos el texto por si la IA devuelve bloques markdown
    const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    let parsedItems: string[] = [];
    try {
      parsedItems = JSON.parse(cleanedText);
    } catch (e) {
      return { success: false, error: 'La IA no devolvió un formato válido. Intentó responder: ' + cleanedText };
    }

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
       return { success: false, error: 'La IA no pudo detectar artículos en la imagen.' };
    }

    // Preparamos los datos para la BBDD
    const dataToInsert = parsedItems.map(name => ({
      name: String(name).trim(),
      eventId
    }));

    // Inserción masiva de productos
    await prisma.shoppingListItem.createMany({
      data: dataToInsert
    });

    // Guardado físico de la evidencia
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'shopping-lists');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filename = `lista-${crypto.randomBytes(6).toString('hex')}.jpg`;
      const filepath = path.join(uploadDir, filename);
      
      // Guardar archivo
      fs.writeFileSync(filepath, Buffer.from(base64Image, 'base64'));
      
      // Registrar en base de datos
      await prisma.shoppingListEvidence.create({
        data: {
          url: `/uploads/shopping-lists/${filename}`,
          eventId
        }
      });
    } catch (err: any) {
      console.error("Error guardando la evidencia:", err);
      // No hacemos throw aquí para no cancelar el success de la IA si la imagen falla al guardar
    }

    revalidatePath('/shopping');
    return { success: true, count: parsedItems.length };
  } catch (error: any) {
    return { success: false, error: 'Error procesando la imagen con IA: ' + error.message };
  }
}

export async function getShoppingListEvidences(eventId: string) {
  try {
    const evidences = await prisma.shoppingListEvidence.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: evidences };
  } catch (error: any) {
    return { success: false, error: 'Error al obtener evidencias: ' + error.message };
  }
}

// Borrar evidencia de compra
export async function deleteShoppingListEvidence(evidenceId: string) {
  try {
    const evidence = await prisma.shoppingListEvidence.findUnique({
      where: { id: evidenceId }
    });
    if (!evidence) return { success: false, error: 'Evidencia no encontrada' };

    // Borrar de la base de datos
    await prisma.shoppingListEvidence.delete({
      where: { id: evidenceId }
    });

    // Borrar el archivo físico si existe
    if (evidence.url) {
      const filename = evidence.url.replace('/uploads/shopping-lists/', '');
      const filepath = path.join(process.cwd(), 'public', 'uploads', 'shopping-lists', filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    revalidatePath('/shopping');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al borrar evidencia: ' + error.message };
  }
}
