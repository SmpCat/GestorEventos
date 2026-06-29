import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Asegurarse de que la API Key está configurada
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Definimos el formato JSON exacto que queremos que nos devuelva la IA
const receiptSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    store: {
      type: SchemaType.STRING,
      description: "El nombre del establecimiento o comercio donde se hizo la compra (ej. Mercadona, Carrefour, Bar Manolo)."
    },
    amount: {
      type: SchemaType.NUMBER,
      description: "El importe total del ticket en formato numérico decimal (ej. 15.50)."
    },
    date: {
      type: SchemaType.STRING,
      description: "La fecha de la compra extraída del ticket en formato YYYY-MM-DD. Si no se ve clara, usa la fecha actual."
    },
    items: {
      type: SchemaType.ARRAY,
      description: "Lista de los productos o conceptos comprados.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: "Nombre del producto" },
          price: { type: SchemaType.NUMBER, description: "Precio total de este producto" },
          quantity: { type: SchemaType.NUMBER, description: "Cantidad comprada (1 por defecto)" }
        },
        required: ["name", "price"]
      }
    }
  },
  required: ["store", "amount", "date", "items"]
};

// Configuración del modelo
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: receiptSchema,
    temperature: 0.1, // Temperatura baja para que sea muy preciso leyendo
  }
});

// Función auxiliar para convertir el archivo a la estructura que pide Gemini
function fileToGenerativePart(filePath: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

export async function scanReceiptWithAI(imagePath: string, mimeType: string = "image/jpeg") {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("La clave de API de Gemini no está configurada.");
  }

  // Convertir la ruta relativa /uploads/receipts/... a absoluta
  const absolutePath = path.join(process.cwd(), 'public', imagePath);

  try {
    const imagePart = fileToGenerativePart(absolutePath, mimeType);
    
    const prompt = `
      Eres un contable experto. Tu tarea es leer detenidamente este recibo o ticket de compra y extraer la información clave con la máxima precisión posible.
      Presta especial atención al importe total pagado y asegúrate de identificar correctamente cada producto individual de la lista.
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    // Parsear el JSON devuelto
    const data = JSON.parse(responseText);
    return data;
    
  } catch (error) {
    console.error("Error al escanear el ticket con IA:", error);
    throw new Error("No se pudo procesar la imagen del ticket.");
  }
}
