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
