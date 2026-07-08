'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { deleteExpenseAction, processReceiptAction, saveExpenseAction, deleteExpenseEvidence, ReceiptData } from '@/actions/receipts';
import TrashIcon from './TrashIcon';

export default function ExpenseList({ expenses, isAdmin, currentUserId }: { expenses: any[], isAdmin: boolean, currentUserId: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDelete = async (expenseId: string) => {
    if (window.confirm('¿Seguro que quieres borrar este gasto y su ticket asociado?')) {
      setLoading(expenseId);
      await deleteExpenseAction(expenseId);
      setLoading(null);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string, expenseId: string) => {
    if (window.confirm('¿Seguro que quieres borrar esta foto de evidencia?')) {
      setLoading(`delete-ev-${evidenceId}`);
      await deleteExpenseEvidence(evidenceId);
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
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.2rem' }}>Gastos Registrados</h1>
          <p className="text-secondary">Gestiona y revisa los tickets escaneados del evento activo.</p>
        </div>
      </div>

      {/* Controles para Añadir Elementos (Arriba) */}
      <h3 className="text-white font-bold text-lg" style={{ marginBottom: '1rem' }}>🧾 Añadir Ticket</h3>
      <div className="glass-panel mb-16 p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
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
        <div className="glass-panel mb-16 overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              
              {/* Formulario de Revisión */}
              <div className="w-full md:w-2/3 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider pl-1">Establecimiento</label>
                    <input 
                      type="text" 
                      value={receiptData.store}
                      onChange={(e) => setReceiptData({...receiptData, store: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary transition-all" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider pl-1">Fecha</label>
                    <input 
                      type="date" 
                      value={receiptData.date}
                      onChange={(e) => setReceiptData({...receiptData, date: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary transition-all appearance-none" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider pl-1">Importe Total (€)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={receiptData.amount} 
                    onChange={(e) => setReceiptData({...receiptData, amount: parseFloat(e.target.value) || 0})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary transition-all font-mono text-lg" 
                  />
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider pl-1 border-b border-white/5 pb-2">Artículos Detectados ({receiptData.items?.length || 0})</label>
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
                onClick={handleConfirmReceipt} 
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
      <div className="flex justify-between items-end mb-4" style={{ marginTop: '3rem' }}>
        <h3 className="text-white font-bold text-lg m-0">📊 Lista de Gastos</h3>
        <div className="text-emerald-400 font-bold text-lg leading-none" style={{ paddingBottom: '0.1rem' }}>
          {expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}&nbsp;€
        </div>
      </div>
      <div className="glass-panel p-4 md:p-6 mb-8">
        <div className="flex flex-col">
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
                  
                  {/* Top Row: Icon, Store (if known) + Date + Purchaser, Delete Button */}
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center flex-1">
                      <div className="text-sm leading-tight flex-1 flex flex-col gap-1">
                        <div className="text-secondary">
                          {dateStr} <span className="mx-1">•</span> <strong className="text-white/80">{expense.purchaser.name}</strong>
                        </div>
                        {expense.store !== 'Desconocido' && expense.store !== 'Gasto general' && (
                          <div className="font-bold text-emerald-100 text-[15px]">{expense.store}</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    <div className="shrink-0 ml-4">
                      {canDelete && (
                        <button 
                          onClick={() => handleDelete(expense.id)}
                          disabled={loading === expense.id}
                          className="text-red-400/70 hover:text-red-400 transition-colors flex items-center justify-center p-1 bg-transparent border-none outline-none"
                          title="Eliminar gasto"
                        >
                          {loading === expense.id ? '⏳' : <TrashIcon />}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Description if present */}
                  {expense.description && expense.description !== 'Compra en Desconocido' && expense.description !== 'Compra en Gasto general' && (
                    <div className="text-xs mt-1 pl-10 text-secondary/70">
                      {expense.description}
                    </div>
                  )}

                  {/* Items and Total */}
                  <div className="flex flex-col gap-1 w-full mt-2 pr-1">
                    <div className="flex flex-col gap-1" style={{ marginLeft: '1.5rem' }}>
                      {expense.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm text-slate-300">
                          <span>{item.quantity}x {item.name}</span>
                          {item.price > 0 && (
                            <span className="font-mono text-white/70">{item.price.toFixed(2)}&nbsp;€</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-emerald-400 mt-2 pt-2 border-t border-white/5" style={{ marginLeft: '1.5rem' }}>
                      <span>Total</span>
                      <span className="font-mono">{expense.amount.toFixed(2)}&nbsp;€</span>
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
            <h3 className="text-white font-bold text-lg" style={{ marginBottom: '1rem' }}>📷 Tickets Originales</h3>
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
                      <div className="flex justify-between items-center px-1 mb-1">
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          🗓️ {dateStr}
                        </span>
                        <button
                          onClick={() => handleDeleteEvidence(ev.id, ev.expenseId)}
                          disabled={loading === `delete-ev-${ev.id}`}
                          className="text-red-400/70 hover:text-red-400 transition-colors bg-transparent border-none outline-none p-1 flex items-center justify-center shrink-0"
                          title="Borrar foto"
                        >
                          {loading === `delete-ev-${ev.id}` ? '⏳' : <TrashIcon />}
                        </button>
                      </div>
                      <a 
                        href={apiImageUrl}
                        className="block border border-white/10 rounded overflow-hidden" 
                        style={{ minHeight: '100px' }}
                      >
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
