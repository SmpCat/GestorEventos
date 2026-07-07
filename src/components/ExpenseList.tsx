'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { deleteExpenseAction, processReceiptAction, saveExpenseAction, ReceiptData } from '@/actions/receipts';

export default function ExpenseList({ expenses, isAdmin, currentUserId }: { expenses: any[], isAdmin: boolean, currentUserId: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = async (expenseId: string) => {
    if (window.confirm('¿Seguro que quieres borrar este gasto y su ticket asociado?')) {
      setLoading(expenseId);
      await deleteExpenseAction(expenseId);
      setLoading(null);
    }
  };

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
      setReceiptData(null);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">

      {/* Controles para Añadir Elementos (Arriba) */}
      <h3 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>📸 Añadir Gasto</h3>
      <div className="glass-panel mb-10 p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex flex-col gap-4 max-w-md mx-auto">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            style={{ display: 'none' }}
          />
          <button 
            className="w-full btn btn-primary py-3 text-lg font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            style={{ opacity: isUploading ? 0.7 : 1 }}
          >
            {isUploading && !receiptData ? (
              '⏳ Procesando con IA...'
            ) : (
              <>
                <span className="text-2xl">📸</span> Escanear Nuevo Ticket
              </>
            )}
          </button>
          
          <div className="text-center">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sube una foto y la IA extraerá los datos automáticamente</span>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
              ❌ {error}
            </div>
          )}
        </div>
      </div>

      {/* Previsualización y Revisión del JSON devuelto */}
      {receiptData && (
        <div className="glass-panel mb-10 overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 md:p-6 border-b border-white/10 bg-emerald-500/10">
            <h3 className="font-bold text-emerald-400 text-lg flex items-center gap-2">
              <span>✨</span> Datos Extraídos con Éxito
            </h3>
            <p className="text-sm text-secondary mt-1">Revisa y confirma los detalles antes de guardar el gasto.</p>
          </div>
          
          <div className="p-4 md:p-6 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Imagen */}
              <div className="w-full md:w-1/3 flex flex-col gap-2">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Ticket Original</span>
                <div className="border border-white/10 rounded-xl overflow-hidden shadow-lg bg-black/50 p-2">
                  <img src={receiptData.imageUrl} alt="Ticket" className="w-full h-auto object-contain max-h-[350px] rounded-lg" />
                </div>
              </div>
              
              {/* Formulario */}
              <div className="w-full md:w-2/3 flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider pl-1">Comercio</label>
                    <input 
                      type="text" 
                      defaultValue={receiptData.store} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary transition-all appearance-none" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider pl-1">Fecha</label>
                    <input 
                      type="date" 
                      defaultValue={receiptData.date} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary transition-all appearance-none" 
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 mt-1">
                  <label className="text-xs font-bold text-emerald-500/80 uppercase tracking-wider pl-1">Importe Total (€)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    defaultValue={receiptData.amount} 
                    className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-400 font-bold text-2xl focus:outline-none focus:border-emerald-400 transition-all appearance-none" 
                  />
                </div>

                <div className="mt-2 bg-black/30 border border-white/5 rounded-xl p-4">
                  <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">
                    Desglose ({receiptData.items?.length || 0} artículos)
                  </p>
                  <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
                    {receiptData.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white/5 px-3 py-2.5 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-accent-primary font-bold text-sm bg-accent-primary/10 px-2 py-1 rounded">{item.quantity}x</span>
                          <span className="text-slate-200 text-sm truncate">{item.name}</span>
                        </div>
                        <span className="text-white font-mono text-sm shrink-0 pl-2">{item.price.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 mt-4 pt-6 border-t border-white/10">
              <button 
                onClick={() => setReceiptData(null)} 
                className="btn btn-secondary flex-1 py-3"
              >
                Cancelar y Descartar
              </button>
              <button 
                onClick={confirmReceipt} 
                disabled={isUploading} 
                className="btn btn-primary flex-[2] py-3 text-lg font-bold shadow-lg shadow-indigo-500/20"
              >
                {isUploading ? '⏳ Guardando...' : '✅ Confirmar y Guardar Gasto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listado de Elementos */}
      <div className="glass-panel p-4 md:p-6 mb-8">
        <h3 className="mb-4 text-secondary font-bold text-lg border-b border-white/10 pb-2">Últimos Gastos Registrados</h3>
        
        <div className="mt-4">
          {expenses.length === 0 ? (
            <p className="text-secondary italic">Aún no se ha registrado ningún gasto.</p>
          ) : (
            expenses.map((expense) => {
              const canDelete = isAdmin || expense.purchaserId === currentUserId;
              const dateStr = new Date(expense.date).toLocaleDateString('es-ES', {
                day: '2-digit', month: '2-digit', year: 'numeric'
              });

              return (
                <div key={expense.id} className="flex flex-col bg-black/40 border border-white/5 rounded-lg p-4 mb-3 relative overflow-hidden group hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-xl shrink-0">
                        🛍️
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight mb-1" style={{ color: 'var(--text-primary)' }}>{expense.store}</h3>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {dateStr} • Subido por <strong className="text-white/80">{expense.purchaser.name}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-emerald-400 ml-4 shrink-0">
                      {expense.amount.toFixed(2)} €
                    </div>
                  </div>
                  
                  <div className="text-sm mt-1 pl-14" style={{ color: 'var(--text-secondary)' }}>
                    {expense.description}
                  </div>

                  <div className="flex gap-3 mt-3 pt-3 border-t border-white/5 justify-between items-center pl-14">
                    <div className="text-xs text-secondary font-mono">
                      {expense.items.length} artículos detectados
                    </div>
                    <div className="flex gap-2">
                      {canDelete && (
                        <button 
                          onClick={() => handleDelete(expense.id)}
                          disabled={loading === expense.id}
                          className="text-red-400 hover:text-red-300 font-bold px-3 py-1 bg-red-400/10 rounded"
                        >
                          {loading === expense.id ? '...' : 'X'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Galería de Evidencias (Tickets Originales) */}
      {(() => {
        const allImages = expenses.flatMap(exp => 
          exp.images.map((img: any) => ({
            ...img,
            expenseId: exp.id,
            date: exp.date,
            createdAt: exp.createdAt
          }))
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (allImages.length === 0) return null;

        return (
          <div style={{ marginTop: '2.5rem' }}>
            <h3 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>📷 Tickets Originales</h3>
            <div className="glass-panel mb-10 p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {allImages.map((ev: any) => {
                  const apiImageUrl = ev.url;
                  const dateStr = new Date(ev.createdAt).toLocaleString('es-ES', {
                    day: '2-digit', month: '2-digit', year: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                  });
                  return (
                    <div key={ev.id} className="flex flex-col gap-2 relative">
                      <div className="flex justify-between items-center px-1">
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          🗓️ {dateStr}
                        </span>
                      </div>
                      <a href={apiImageUrl} target="_blank" rel="noreferrer" className="block border border-white/10 rounded overflow-hidden" style={{ minHeight: '100px' }}>
                        <img src={apiImageUrl} alt="Ticket" className="w-full h-auto object-cover" style={{ aspectRatio: '1/1' }} />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
