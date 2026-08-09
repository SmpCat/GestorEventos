'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { generateContentWithRetry } from '@/lib/ai-scanner';

// ---------------------------------------------------------
// LISTAS DE LA COMPRA (PADRE)
// ---------------------------------------------------------

// Obtener todas las listas de la compra de un evento con sus productos y encargado
export async function getShoppingLists(eventId: string) {
  try {
    const lists = await prisma.shoppingList.findMany({
      where: { eventId },
      include: {
        assignee: {
          select: { id: true, name: true, username: true }
        },
        items: {
          include: {
            history: {
              include: {
                user: { select: { username: true } }
              },
              orderBy: { date: 'asc' }
            }
          },
          orderBy: [
            { isPurchased: 'asc' },
            { createdAt: 'desc' }
          ]
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: lists };
  } catch (error: any) {
    return { success: false, error: 'Error al obtener las listas: ' + error.message };
  }
}

// Crear una nueva lista (Manual o escaneada)
export async function createShoppingList(eventId: string, name: string, assigneeId?: string | null, imageUrl?: string | null) {
  try {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: 'El nombre de la lista no puede estar vacío.' };
    }

    const newList = await prisma.shoppingList.create({
      data: {
        name: trimmed,
        eventId,
        assigneeId: assigneeId || null,
        imageUrl: imageUrl || null
      },
      include: {
        assignee: { select: { id: true, name: true, username: true } },
        items: true
      }
    });

    revalidatePath('/shopping');
    return { success: true, data: newList };
  } catch (error: any) {
    return { success: false, error: 'Error al crear la lista: ' + error.message };
  }
}

// Actualizar una lista (nombre y/o encargado)
export async function updateShoppingList(listId: string, name: string, assigneeId?: string | null) {
  try {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: 'El nombre de la lista no puede estar vacío.' };
    }

    const updated = await prisma.shoppingList.update({
      where: { id: listId },
      data: {
        name: trimmed,
        assigneeId: assigneeId === 'UNASSIGN' ? null : assigneeId
      },
      include: {
        assignee: { select: { id: true, name: true, username: true } }
      }
    });

    revalidatePath('/shopping');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: 'Error al actualizar la lista: ' + error.message };
  }
}

// Borrar una lista completa con todos sus productos
export async function deleteShoppingList(listId: string) {
  try {
    const list = await prisma.shoppingList.findUnique({
      where: { id: listId }
    });

    if (list?.imageUrl) {
      const filename = path.basename(list.imageUrl);
      const filepath = path.join(process.cwd(), 'public', 'uploads', 'shopping-lists', filename);
      if (fs.existsSync(filepath)) {
        try { fs.unlinkSync(filepath); } catch (_) {}
      }
    }

    await prisma.shoppingList.delete({
      where: { id: listId }
    });

    revalidatePath('/shopping');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al borrar la lista: ' + error.message };
  }
}

// ---------------------------------------------------------
// PRODUCTOS DENTRO DE UNA LISTA (HIJOS)
// ---------------------------------------------------------

// Añadir un artículo manualmente a una lista específica
export async function addShoppingItemToList(listId: string, name: string, userId: string) {
  try {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: 'El nombre del producto no puede estar vacío.' };
    }

    const item = await prisma.shoppingListItem.create({
      data: {
        name: trimmed,
        listId,
        history: {
          create: {
            action: 'CREATED',
            userId
          }
        }
      },
    });

    revalidatePath('/shopping');
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: 'Error al añadir el producto: ' + error.message };
  }
}

// Marcar como comprado o no comprado
export async function togglePurchased(itemId: string, isPurchased: boolean, userId: string) {
  try {
    const item = await prisma.shoppingListItem.update({
      where: { id: itemId },
      data: { 
        isPurchased,
        history: {
          create: {
            action: isPurchased ? 'PURCHASED' : 'UNPURCHASED',
            userId
          }
        }
      },
    });
    revalidatePath('/shopping');
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: 'Error al actualizar el estado: ' + error.message };
  }
}

// Marcar múltiples artículos como comprados o no comprados a la vez
export async function togglePurchasedBulk(itemIds: string[], isPurchased: boolean, userId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.shoppingListItem.updateMany({
        where: { id: { in: itemIds } },
        data: { isPurchased },
      });
      
      const historyData = itemIds.map(id => ({
        shoppingListItemId: id,
        action: isPurchased ? 'PURCHASED' : 'UNPURCHASED',
        userId
      }));
      
      await tx.shoppingListHistory.createMany({
        data: historyData
      });
    });

    revalidatePath('/shopping');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al actualizar múltiples artículos: ' + error.message };
  }
}

// Borrar un producto individual
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

// Modificar nombre de un producto
export async function updateShoppingItem(itemId: string, name: string) {
  try {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: 'El nombre del producto no puede estar vacío.' };
    }
    const item = await prisma.shoppingListItem.update({
      where: { id: itemId },
      data: { name: trimmed },
    });
    revalidatePath('/shopping');
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: 'Error al modificar el producto: ' + error.message };
  }
}

// ---------------------------------------------------------
// IA Y ESCANEO FOTOGRÁFICO DE LISTAS
// ---------------------------------------------------------

export async function scanShoppingListAI(eventId: string, base64Image: string, mimeType: string, listName?: string) {
  let savedImageUrl = null;
  
  // 1. Guardar la imagen físicamente en public/uploads/shopping-lists
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'shopping-lists');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filename = `lista-${crypto.randomBytes(6).toString('hex')}.jpg`;
    const filepath = path.join(uploadDir, filename);
    
    fs.writeFileSync(filepath, Buffer.from(base64Image, 'base64'));
    savedImageUrl = `/uploads/shopping-lists/${filename}`;
  } catch (err: any) {
    console.error("Error guardando la evidencia física:", err);
  }

  // 2. Procesar con la IA
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('No hay clave de API de Gemini configurada en el servidor.');
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    
    const prompt = `Eres un asistente experto en transcripción. 
Extrae todos los artículos de la lista de la compra de esta imagen. 
Ignora firmas, títulos u otros textos irrelevantes. 
Si hay cantidades, inclúyelas junto al nombre (ej. "2 tomates").
DEVLEVLE ÚNICAMENTE UN ARRAY EN FORMATO JSON, sin bloques de código Markdown (\`\`\`), sin la palabra "json".
Ejemplo de salida exacta que espero de ti:
["Manzanas", "2 Litros de leche", "Pan de molde", "Patatas"]`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType
      }
    };

    const result = await generateContentWithRetry(model, [prompt, imagePart]);
    const text = result.response.text();
    const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    let parsedItems: string[] = [];
    try {
      parsedItems = JSON.parse(cleanedText);
    } catch (e) {
      // Si la IA falla pero se guardó la imagen, creamos la lista vacía con la foto
      const finalListName = listName?.trim() || `Lista Manuscrita (${new Date().toLocaleDateString('es-ES')})`;
      await prisma.shoppingList.create({
        data: {
          name: finalListName,
          eventId,
          imageUrl: savedImageUrl
        }
      });
      revalidatePath('/shopping');
      return { 
        success: false, 
        error: 'La IA no devolvió un formato válido, pero la lista con su foto se guardó.',
        savedImageUrl 
      };
    }

    const finalListName = listName?.trim() || `Lista Escaneada (${new Date().toLocaleDateString('es-ES')})`;

    // Crear la lista con sus productos leídos
    const newList = await prisma.shoppingList.create({
      data: {
        name: finalListName,
        eventId,
        imageUrl: savedImageUrl,
        items: {
          create: (Array.isArray(parsedItems) ? parsedItems : []).map(name => ({
            name: String(name).trim()
          }))
        }
      }
    });

    revalidatePath('/shopping');
    return { success: true, count: parsedItems.length, data: newList };

  } catch (error: any) {
    revalidatePath('/shopping');
    return { 
      success: false, 
      error: 'Error al procesar con IA: ' + error.message,
      savedImageUrl 
    };
  }
}
