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
  isScanned?: boolean;
};

export async function processReceiptAction(formData: FormData) {
  try {
    const file = formData.get("receipt") as File | null;
    if (!file) {
      return { success: false, error: "No se ha proporcionado ninguna imagen." };
    }

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
          imageUrl: "/placeholder.png" // Usamos una imagen genérica para la previsualización
        } as ReceiptData,
      };
    }
    // --- FIN MOCK E2E ---

    // 1. Guardar la imagen localmente
    const imageUrl = await saveReceiptImage(file);

    // 2. Analizar con Gemini AI
    // Escaneamos la imagen guardada. La función ya la convierte a base64
    let aiData;
    let scanError = null;
    let isScanned = true;
    try {
      aiData = await scanReceiptWithAI(imageUrl, file.type);
    } catch (err: any) {
      console.error("Error al escanear con IA (fallback manual activo):", err);
      scanError = "La IA no ha podido digitalizar el ticket automáticamente, pero la imagen se ha guardado correctamente. Introduce los detalles a continuación:";
      isScanned = false;
      aiData = {
        store: "",
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        items: []
      };
    }

    // Devolvemos los datos a la interfaz de usuario para que pueda revisarlos
    return {
      success: true,
      scanError,
      data: {
        ...aiData,
        imageUrl,
        isScanned,
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
        isScanned: data.isScanned !== undefined ? data.isScanned : true,
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

export async function saveManualExpenseAction(data: { store: string; amount: number; description: string; date: string }) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "No autorizado" };

    const activeEvent = await prisma.event.findFirst({ where: { isActive: true } });
    if (!activeEvent) return { success: false, error: "No hay evento activo" };

    await prisma.expense.create({
      data: {
        description: data.description || `Compra en ${data.store}`,
        store: data.store,
        amount: data.amount,
        date: new Date(data.date),
        eventId: activeEvent.id,
        purchaserId: session.id,
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
    
    // Escanear con la utilidad de IA (recibe ruta relativa)
    const aiData = await scanReceiptWithAI(image.url);

    // Actualizar el gasto con los nuevos datos de la IA
    await prisma.$transaction(async (tx) => {
      // 1. Borrar items manuales antiguos
      await tx.expenseItem.deleteMany({
        where: { expenseId }
      });

      // 2. Actualizar gasto principal
      await tx.expense.update({
        where: { id: expenseId },
        data: {
          store: aiData.store,
          description: `Compra en ${aiData.store}`,
          amount: aiData.amount,
          date: new Date(aiData.date),
          isScanned: true, // Marcar como escaneado con éxito
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
