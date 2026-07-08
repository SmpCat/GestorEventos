"use server";

import { revalidatePath } from "next/cache";
import { saveReceiptImage } from "@/lib/storage";
import { scanReceiptWithAI } from "@/lib/ai-scanner";

export type ReceiptData = {
  store: string;
  amount: number;
  date: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  imageUrl: string; // The saved URL of the image
};

export async function processReceiptAction(formData: FormData) {
  try {
    const file = formData.get("receipt") as File | null;
    if (!file) {
      return { success: false, error: "No se ha proporcionado ninguna imagen." };
    }

    // 1. Guardar la imagen localmente
    const imageUrl = await saveReceiptImage(file);

    // 2. Analizar con Gemini AI
    // Escaneamos la imagen guardada. La función ya la convierte a base64
    const aiData = await scanReceiptWithAI(imageUrl, file.type);

    // Devolvemos los datos a la interfaz de usuario para que pueda revisarlos
    return {
      success: true,
      data: {
        ...aiData,
        imageUrl,
      } as ReceiptData,
    };
} catch (error: any) {
    console.error("Error en processReceiptAction:", error);
    return { success: false, error: error.message || "Error desconocido procesando el ticket." };
  }
}

import { prisma } from "@/lib/prisma";
import { getSession } from "@/actions/auth";

export async function saveExpenseAction(data: ReceiptData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "No autorizado" };

    const activeEvent = await prisma.event.findFirst({ where: { isActive: true } });
    if (!activeEvent) return { success: false, error: "No hay evento activo" };

    await prisma.expense.create({
      data: {
        description: `Compra en ${data.store}`,
        store: data.store,
        amount: data.amount,
        date: new Date(data.date),
        eventId: activeEvent.id,
        purchaserId: session.id,
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

    // Permitir borrar si es Admin o si es el creador del gasto
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
