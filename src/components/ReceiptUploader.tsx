"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { processReceiptAction, saveExpenseAction, ReceiptData } from "@/actions/receipts";

export default function ReceiptUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setReceiptData(null);

    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const res = await processReceiptAction(formData);
      if (res.success && res.data) {
        setReceiptData(res.data);
      } else {
        setError(res.error || "Error al leer el ticket.");
      }
    } catch (err: any) {
      setError(err.message || "Error de red.");
    } finally {
      setIsUploading(false);
      // Limpiar el input para permitir subir la misma foto otra vez si hubo error
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const confirmReceipt = async () => {
    if (!receiptData) return;
    setIsUploading(true);
    const res = await saveExpenseAction(receiptData);
    if (!res.success) {
      alert(res.error);
      setIsUploading(false);
    } else {
      router.push('/expenses');
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-white mb-4">Escáner de Tickets</h2>
      <p className="text-slate-300 mb-6">
        Hazle una foto a tu ticket de compra o súbelo desde la galería. La IA se encargará de extraer los datos.
      </p>

      {!receiptData && (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-500/50 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 transition-colors cursor-pointer"
             onClick={() => fileInputRef.current?.click()}>
          {isUploading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-blue-300 font-medium animate-pulse">La IA está leyendo el ticket...</p>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-4xl mb-3 block">📸</span>
              <p className="text-blue-400 font-semibold text-lg">Toca para abrir la cámara o seleccionar foto</p>
              <p className="text-sm text-slate-400 mt-2">Soporta JPG, PNG, WEBP</p>
            </div>
          )}
        </div>
      )}

      {/* Input oculto */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
          <p className="font-semibold">❌ Vaya, algo ha fallado:</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Previsualización y Revisión del JSON devuelto */}
      {receiptData && (
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-900/50 rounded-xl overflow-hidden border border-emerald-500/30">
            <div className="bg-emerald-500/20 px-4 py-3 border-b border-emerald-500/30 flex justify-between items-center">
              <h3 className="font-bold text-emerald-400">✨ Datos Extraídos con Éxito</h3>
              <button onClick={() => setReceiptData(null)} className="text-slate-400 hover:text-white text-sm">Descartar</button>
            </div>
            
            <div className="p-4 flex flex-col md:flex-row gap-6">
              {/* Columna Izquierda: La foto recortada */}
              <div className="w-full md:w-1/3 shrink-0">
                <img src={receiptData.imageUrl} alt="Ticket" className="w-full h-auto max-h-64 object-cover rounded-lg border border-white/10" />
              </div>
              
              {/* Columna Derecha: Formulario editable (Simulado con inputs) */}
              <div className="w-full md:w-2/3 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Comercio</label>
                    <input type="text" defaultValue={receiptData.store} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Fecha</label>
                    <input type="date" defaultValue={receiptData.date} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Importe Total (€)</label>
                  <input type="number" step="0.01" defaultValue={receiptData.amount} className="w-full bg-emerald-500/10 border border-emerald-500/50 rounded-lg px-3 py-2 text-emerald-400 font-bold text-xl focus:outline-none" />
                </div>

                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs font-medium text-slate-400 mb-2">Desglose ({receiptData.items?.length || 0} artículos detectados):</p>
                  <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {receiptData.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm bg-white/5 px-3 py-1.5 rounded">
                        <span className="text-slate-300 truncate mr-2 flex-1">{item.quantity}x {item.name}</span>
                        <span className="text-white font-mono">{item.price} €</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            <div className="p-4 bg-black/20">
              <button onClick={confirmReceipt} className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02]">
                Confirmar y Guardar Gasto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
