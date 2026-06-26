'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
