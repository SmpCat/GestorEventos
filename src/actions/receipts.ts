"use server";

import { revalidatePath } from "next/cache";
import { saveReceiptImage } from "@/lib/storage";
import { scanReceiptWithAI } from "@/lib/ai-scanner";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/actions/auth";

export type ReceiptData = {
  store: string;
  amount: number;
  date: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  imageUrl: string;
  isScanned?: boolean;
  groupId?: string;
  description?: string;
};

// Obtener o crear un grupo por nombre para el evento activo
async function getOrCreateGroup(name: string, eventId: string): Promise<string> {
  const groupName = name?.trim() || 'Restos';
  const group = await prisma.expenseGroup.upsert({
    where: { name_eventId: { name: groupName, eventId } },
    update: {},
    create: { name: groupName, eventId },
  });
  return group.id;
}

// Obtener todos los grupos del evento activo
export async function getExpenseGroups(eventId: string) {
  return prisma.expenseGroup.findMany({
    where: { eventId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function processReceiptAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "No autorizado" };

    const currentUser = await prisma.user.findUnique({ where: { id: session.id } });
    if (currentUser && currentUser.canUploadTickets === false && session.username !== 'admin') {
      return { success: false, error: "Tu usuario tiene deshabilitada la subida de tickets." };
    }

    const file = formData.get("receipt") as File | null;
    if (!file) {
      return { success: false, error: "No se ha proporcionado ninguna imagen." };
    }

    const groupName = (formData.get("groupName") as string) || 'Restos';
    const description = (formData.get("description") as string) || '';

    // --- MOCK E2E PARA TEST ---
    if (file.name === "E2E_TEST_TICKET.png") {
      return {
        success: true,
        data: {
          store: "Supermercado E2E",
          amount: 5.50,
          date: new Date().toISOString().split('T')[0],
          items: [
            { name: "Pan de molde automático", price: 2.50, quantity: 1 },
            { name: "Hielo de prueba", price: 3.00, quantity: 1 }
          ],
          imageUrl: "/placeholder.png",
          groupId: undefined,
        } as ReceiptData,
      };
    }
    // --- FIN MOCK E2E ---

    // 1. Guardar la imagen localmente
    const imageUrl = await saveReceiptImage(file);

    // 2. Analizar con Gemini AI
    try {
      const aiData = await scanReceiptWithAI(imageUrl, file.type);

      const activeEvent = await prisma.event.findFirst({ where: { isActive: true } });
      if (!activeEvent) return { success: false, error: "No hay evento activo" };
      const groupId = await getOrCreateGroup(groupName, activeEvent.id);

      return {
        success: true,
        isScanned: true,
        data: {
          ...aiData,
          imageUrl,
          isScanned: true,
          groupId,
          description: description || undefined,
        } as ReceiptData,
      };
    } catch (err: any) {
      console.error("Error al escanear con IA (guardado directo a 0 activo):", err);

      const activeEvent = await prisma.event.findFirst({ where: { isActive: true } });
      if (!activeEvent) return { success: false, error: "No hay evento activo" };
      const groupId = await getOrCreateGroup(groupName, activeEvent.id);

      // Creamos el gasto a 0€ vinculando la imagen (re-escaneable)
      await prisma.expense.create({
        data: {
          description: description || 'Compra en Comercio desconocido (Sin digitalizar)',
          store: "Comercio desconocido",
          amount: 0,
          date: new Date(),
          isScanned: false,
          eventId: activeEvent.id,
          purchaserId: session.id,
          groupId,
          images: {
            create: [{ url: imageUrl }]
          }
        }
      });

      revalidatePath('/expenses');
      revalidatePath('/pricing/results');

      return {
        success: true,
        isScanned: false,
        message: "La IA no pudo leer el ticket, pero se ha guardado correctamente. Puedes re-escanearlo desde la galería."
      };
    }
  } catch (error: any) {
    console.error("Error en processReceiptAction:", error);
    return { success: false, error: error.message || "Error desconocido procesando el ticket." };
  }
}

export async function saveExpenseAction(data: ReceiptData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "No autorizado" };

    const activeEvent = await prisma.event.findFirst({ where: { isActive: true } });
    if (!activeEvent) return { success: false, error: "No hay evento activo" };

    // Si viene groupId ya resuelto lo usamos; si no, usamos 'Restos'
    const groupId = data.groupId || await getOrCreateGroup('Restos', activeEvent.id);

    await prisma.expense.create({
      data: {
        description: data.description || `Compra en ${data.store}`,
        store: data.store,
        amount: data.amount,
        date: new Date(data.date),
        isScanned: data.isScanned !== undefined ? data.isScanned : true,
        eventId: activeEvent.id,
        purchaserId: session.id,
        groupId,
        images: {
          create: [{ url: data.imageUrl }]
        },
        items: {
          create: data.items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
          }))
        }
      }
    });

    revalidatePath('/expenses');
    revalidatePath('/pricing/results');
    return { success: true };
  } catch (err: any) {
    console.error("Error en saveExpenseAction:", err);
    return { success: false, error: err.message || "Error al guardar el gasto en la base de datos." };
  }
}

export async function deleteExpenseAction(expenseId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "No autorizado" };

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { images: true }
    });

    if (!expense) return { success: false, error: "Gasto no encontrado" };

    if (!session.isAdmin && expense.purchaserId !== session.id) {
      return { success: false, error: "No tienes permiso para borrar este gasto" };
    }

    await prisma.expense.delete({ where: { id: expenseId } });

    revalidatePath('/expenses');
    revalidatePath('/pricing/results');
    return { success: true };
  } catch (err: any) {
    console.error("Error en deleteExpenseAction:", err);
    return { success: false, error: err.message || "Error al borrar el gasto." };
  }
}

export async function deleteExpenseEvidence(evidenceId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "No autorizado" };

    await prisma.expenseImage.delete({
      where: { id: evidenceId }
    });

    revalidatePath('/expenses');
    return { success: true };
  } catch (err: any) {
    console.error("Error en deleteExpenseEvidence:", err);
    return { success: false, error: err.message || "Error al eliminar la evidencia." };
  }
}

export async function saveManualExpenseAction(data: { store: string; amount: number; description: string; date: string; groupName?: string }) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "No autorizado" };

    const currentUser = await prisma.user.findUnique({ where: { id: session.id } });
    if (currentUser && currentUser.canUploadTickets === false && session.username !== 'admin') {
      return { success: false, error: "Tu usuario tiene deshabilitada la subida de tickets." };
    }

    const activeEvent = await prisma.event.findFirst({ where: { isActive: true } });
    if (!activeEvent) return { success: false, error: "No hay evento activo" };

    const groupId = await getOrCreateGroup(data.groupName || 'Restos', activeEvent.id);

    await prisma.expense.create({
      data: {
        description: data.description || `Compra en ${data.store}`,
        store: data.store,
        amount: data.amount,
        date: new Date(data.date),
        eventId: activeEvent.id,
        purchaserId: session.id,
        groupId,
      }
    });

    revalidatePath('/expenses');
    revalidatePath('/pricing/results');
    return { success: true };
  } catch (err: any) {
    console.error("Error en saveManualExpenseAction:", err);
    return { success: false, error: err.message || "Error al guardar el gasto manual." };
  }
}

export async function moveExpenseToGroup(expenseId: string, groupName: string) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) return { success: false, error: "No autorizado" };

    const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense) return { success: false, error: "Gasto no encontrado" };

    const groupId = await getOrCreateGroup(groupName, expense.eventId);

    await prisma.expense.update({
      where: { id: expenseId },
      data: { groupId }
    });

    revalidatePath('/expenses');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function renameExpenseGroup(groupId: string, newName: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "No autorizado" };
    const trimmed = newName.trim();
    if (!trimmed) return { success: false, error: "El nombre no puede estar vacío" };

    await prisma.expenseGroup.update({
      where: { id: groupId },
      data: { name: trimmed }
    });

    revalidatePath('/expenses');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteExpenseGroup(groupId: string) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) return { success: false, error: "No autorizado" };

    // Borrar todos los gastos del grupo primero (cascade manual por si acaso)
    const expenses = await prisma.expense.findMany({ where: { groupId }, select: { id: true } });
    for (const exp of expenses) {
      await prisma.expense.delete({ where: { id: exp.id } });
    }
    await prisma.expenseGroup.delete({ where: { id: groupId } });

    revalidatePath('/expenses');
    revalidatePath('/pricing/results');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateExpenseDescription(expenseId: string, description: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "No autorizado" };

    const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense) return { success: false, error: "Gasto no encontrado" };
    if (!session.isAdmin && expense.purchaserId !== session.id) {
      return { success: false, error: "No tienes permiso" };
    }

    await prisma.expense.update({
      where: { id: expenseId },
      data: { description: description.trim() }
    });

    revalidatePath('/expenses');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function reScanExpenseAI(expenseId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "No autorizado" };

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { images: true }
    });

    if (!expense) return { success: false, error: "Gasto no encontrado" };
    if (expense.images.length === 0) return { success: false, error: "No hay imagen asociada a este gasto" };

    const image = expense.images[0];
    const aiData = await scanReceiptWithAI(image.url);

    await prisma.$transaction(async (tx) => {
      await tx.expenseItem.deleteMany({ where: { expenseId } });
      await tx.expense.update({
        where: { id: expenseId },
        data: {
          store: aiData.store,
          description: `Compra en ${aiData.store}`,
          amount: aiData.amount,
          date: new Date(aiData.date),
          isScanned: true,
          items: {
            create: aiData.items.map((item: any) => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity
            }))
          }
        }
      });
    });

    revalidatePath('/expenses');
    revalidatePath('/pricing/results');
    return { success: true };
  } catch (error: any) {
    console.error("Error al re-escanear ticket:", error);
    return { success: false, error: error.message || "Error procesando el ticket con IA." };
  }
}
