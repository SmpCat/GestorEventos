'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteExpenseAction, processReceiptAction, saveExpenseAction, saveManualExpenseAction, deleteExpenseEvidence, ReceiptData, reScanExpenseAI } from '@/actions/receipts';
import TrashIcon from './TrashIcon';
import styles from './ExpenseList.module.css';
import AiLoadingOverlay from './AiLoadingOverlay';
import ImageLightbox from './ImageLightbox';

export default function ExpenseList({ 
  expenses, 
  isAdmin, 
  isSuperAdmin,
  currentUserId,
  canUploadTickets = true
}: { 
  expenses: any[]; 
  isAdmin: boolean; 
  isSuperAdmin?: boolean;
  currentUserId: string;
  canUploadTickets?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanWarning, setScanWarning] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (receiptData) {
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [receiptData]);

  // Estados para entrada manual
  const [manualStore, setManualStore] = useState('');
  const [manualAmount, setManualAmount] = useState<number | ''>('');
  const [isManualLoading, setIsManualLoading] = useState(false);

  const handleDelete = async (expenseId: string) => {
    if (window.confirm('¿Seguro que quieres borrar este gasto y su ticket asociado?')) {
      setLoading(expenseId);
      await deleteExpenseAction(expenseId);
      setLoading(null);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (window.confirm('¿Seguro que quieres borrar esta foto de evidencia?')) {
      setLoading(`delete-ev-${evidenceId}`);
      await deleteExpenseEvidence(evidenceId);
      setLoading(null);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStore.trim() || manualAmount === '' || Number(manualAmount) <= 0) return;
    
    setIsManualLoading(true);
    setError(null);
    const dateStr = new Date().toISOString().split('T')[0];
    
    const res = await saveManualExpenseAction({
      store: manualStore,
      amount: Number(manualAmount),
      description: `Compra manual en ${manualStore}`,
      date: dateStr
    });
    
    if (!res.success) {
      setError(res.error || 'Error al guardar gasto manual.');
    } else {
      setManualStore('');
      setManualAmount('');
    }
    setIsManualLoading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setScanWarning(null);
    setReceiptData(null);

    const formData = new FormData();
    formData.append("receipt", file);

    try {
      const res = await processReceiptAction(formData);
      if (res.success) {
        if (res.isScanned && res.data) {
          setReceiptData(res.data);
          alert("¡Magia! La IA ha leído el ticket. Revisa los datos y pulsa en 'Confirmar Gasto' abajo.");
        } else {
          alert(res.message || "La IA no pudo leer el ticket, pero se ha guardado correctamente en la galería inferior de Tickets Originales.");
          router.refresh();
        }
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
      setScanWarning(null);
      setIsUploading(false);
    }
  };

  const handleReScan = async (expenseId: string) => {
    setLoading(`rescan-exp-${expenseId}`);
    try {
      const res = await reScanExpenseAI(expenseId);
      if (res.success) {
        alert("¡Éxito! El ticket ha sido escaneado correctamente y el gasto ha sido actualizado.");
        router.refresh();
      } else {
        alert(`No se pudo escanear: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error al procesar: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={styles.container}>
      <AiLoadingOverlay 
        isVisible={isUploading || (typeof loading === 'string' && loading.startsWith('rescan-exp-'))} 
        message={typeof loading === 'string' && loading.startsWith('rescan-exp-') ? "Re-escaneando ticket con IA..." : "Extrayendo comercio, importe y fecha con IA..."} 
      />
      
      <div className={styles.headerRow}>
        <div>
          <h1>Gastos Registrados</h1>
          <p className="subtitle">Gestiona y revisa los tickets escaneados del evento activo.</p>
        </div>
      </div>

      <h3 className={styles.sectionTitle} style={{ marginBottom: '0.75rem' }}>🧾 Añadir Gasto</h3>

      <div className="glass-panel" style={{ marginBottom: '4rem' }}>
        <div className={styles.innerBlackBox}>
          {!canUploadTickets ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#fca5a5' }}>
              <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                🚫 Subida de Tickets Deshabilitada
              </p>
              <p style={{ fontSize: '0.875rem', opacity: 0.85, color: 'var(--text-secondary)' }}>
                Tu usuario tiene deshabilitada la entrada de tickets (tanto manual como fotográfica) por la administración.
              </p>
            </div>
          ) : (
            <div className={styles.uploadWrapper}>
              
              {/* Formulario de Entrada Manual */}
              <div className={styles.inputRow}>
                <span className={styles.rowLabel}>Manualmente</span>
                <form onSubmit={handleManualAdd} className={styles.addForm}>
                  <input 
                    type="text" 
                    className={`input-field ${styles.addInput}`} 
                    placeholder="Establecimiento o concepto..."
                    value={manualStore}
                    onChange={e => setManualStore(e.target.value)}
                    disabled={isManualLoading || isUploading}
                  />
                  <input 
                    type="number" 
                    step="0.01"
                    className={`input-field ${styles.addInputAmount}`} 
                    placeholder="0.00 €"
                    value={manualAmount}
                    onChange={e => setManualAmount(e.target.value ? Number(e.target.value) : '')}
                    disabled={isManualLoading || isUploading}
                  />
                  <button type="submit" className={`btn ${styles.addBtn}`} disabled={isManualLoading || isUploading || !manualStore.trim() || manualAmount === ''}>
                    {isManualLoading ? '⏳' : '+ Añadir'}
                  </button>
                </form>
              </div>

              <div className={styles.orDivider}>
                <span className={styles.orText}>o alternativamente...</span>
              </div>

              {/* Escáner de IA */}
              <div className={styles.inputRow}>
                <span className={styles.rowLabel}>Fotográficamente</span>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button 
                  className={`btn ${styles.uploadBtn}`}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isManualLoading}
                  style={{ opacity: isUploading ? 0.7 : 1 }}
                >
                  {isUploading && !receiptData ? (
                    '⏳ Procesando con IA...'
                  ) : (
                    <>
                      <span style={{ fontSize: '1.5rem' }}>📸</span> Subir o hacer foto a un ticket
                    </>
                  )}
                </button>
              </div>

              <div className={styles.uploadHelperText}>
                Sube una foto y la IA extraerá los datos automáticamente
              </div>

              {error && (
                <div className={styles.errorBox}>
                  ❌ {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Previsualización y Revisión del JSON devuelto */}
      {receiptData && (
        <div ref={previewRef} className={`glass-panel ${styles.previewContainer}`} style={{ marginBottom: '4rem' }}>
          <div className={styles.previewHeader}>
            <h3 className={styles.previewTitle}>
              {scanWarning ? (
                <><span>⚠️</span> Introducción Manual (IA no disponible)</>
              ) : (
                <><span>✨</span> Datos Extraídos con Éxito</>
              )}
            </h3>
            <p className={styles.previewSubtitle}>
              {scanWarning 
                ? "La IA no pudo procesar la imagen, pero se ha guardado. Introduce los detalles a continuación:" 
                : "Revisa y confirma los detalles antes de guardar el gasto."}
            </p>
          </div>
          
          <div className={styles.previewBody}>
            {scanWarning && (
              <div className={styles.warningBox}>
                ⚠️ {scanWarning}
              </div>
            )}

            <div className={styles.previewFlexRow}>
              {/* Imagen */}
              <div className={styles.previewImageCol}>
                <span className={styles.previewLabel}>Ticket Original</span>
                <div className={styles.previewImageWrapper} onClick={() => setLightboxImage(`/api${receiptData.imageUrl}`)} style={{ cursor: 'pointer' }}>
                  <img src={`/api${receiptData.imageUrl}`} alt="Ticket" className={styles.previewImage} />
                </div>
              </div>
              
              {/* Formulario de Revisión */}
              <div className={styles.previewFormCol}>
                <div className={styles.previewGrid2}>
                  <div className={styles.previewInputGroup}>
                    <label className={styles.previewLabel}>Establecimiento</label>
                    <input 
                      type="text" 
                      value={receiptData.store}
                      onChange={(e) => setReceiptData({...receiptData, store: e.target.value})}
                      className={`input-field ${styles.previewInput}`} 
                      placeholder="Ej. Mercadona, Consum..."
                    />
                  </div>
                  <div className={styles.previewInputGroup}>
                    <label className={styles.previewLabel}>Fecha</label>
                    <input 
                      type="date" 
                      value={receiptData.date}
                      onChange={(e) => setReceiptData({...receiptData, date: e.target.value})}
                      className={`input-field ${styles.previewInput}`} 
                    />
                  </div>
                </div>

                <div className={styles.previewInputGroup}>
                  <label className={styles.previewLabel}>Importe Total (€)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={receiptData.amount || ''} 
                    onChange={(e) => setReceiptData({...receiptData, amount: parseFloat(e.target.value) || 0})}
                    className={`input-field ${styles.previewInput} ${styles.previewInputAmount}`} 
                    placeholder="0.00"
                  />
                </div>

                <div className={styles.previewInputGroup}>
                  <label className={`${styles.previewLabel} ${styles.previewItemsLabel}`}>
                    Artículos Detectados ({receiptData.items?.length || 0})
                  </label>
                  <div className={`custom-scrollbar ${styles.previewItemsList}`}>
                    {receiptData.items?.length === 0 ? (
                      <p style={{ fontStyle: 'italic', opacity: 0.5, fontSize: '0.9rem', padding: '0.5rem 0' }}>Ningún artículo detectado automáticamente.</p>
                    ) : (
                      receiptData.items?.map((item, idx) => (
                        <div key={idx} className={styles.previewItemRow}>
                          <div className={styles.previewItemLeft}>
                            <span className={styles.previewItemQty}>{item.quantity}x</span>
                            <span className={styles.previewItemName} title={item.name}>{item.name}</span>
                          </div>
                          <span className={styles.previewItemPrice}>{item.price.toFixed(2)} €</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.previewActions}>
              <button 
                onClick={() => { setReceiptData(null); setScanWarning(null); }} 
                className={`btn ${styles.cancelBtn}`}
              >
                Cancelar y Descartar
              </button>
              <button 
                onClick={confirmReceipt} 
                disabled={isUploading || !receiptData.store.trim() || receiptData.amount <= 0} 
                className={`btn ${styles.confirmBtn}`}
              >
                {isUploading ? '⏳ Guardando...' : '✅ Confirmar y Guardar Gasto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listado de Elementos */}
      {(() => {
        const visibleExpenses = expenses.filter((exp: any) => exp.isScanned || exp.amount > 0);
        return (
          <>
            <div className={styles.listHeader}>
              <h3 className={styles.listHeaderTitle}>📊 Lista de Gastos</h3>
              <div className={styles.listHeaderTotal}>
                {visibleExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0).toFixed(2)}&nbsp;€
              </div>
            </div>
            
            <div className="glass-panel" style={{ marginBottom: '2rem' }}>
              <div className={styles.innerBlackBox}>
                <div className={styles.expensesList}>
                  {visibleExpenses.length === 0 ? (
                    <p className={styles.emptyState}>Aún no se ha registrado ningún gasto.</p>
                  ) : (
                    visibleExpenses.map((expense) => {
                      const canDelete = isAdmin || expense.purchaserId === currentUserId;
                      const dateStr = new Date(expense.date).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div key={expense.id} className={styles.expenseCard}>
                          
                          {/* Top Row: Icon, Store (if known) + Date + Purchaser, Delete/ReScan Buttons */}
                          <div className={styles.expenseTopRow}>
                            <div className={styles.expenseMeta}>
                              <div className={styles.expenseMetaInfo}>
                                <div className={styles.expenseDateUser}>
                                  {dateStr} <span style={{ margin: '0 0.25rem' }}>•</span> <strong className={styles.expenseUser}>{expense.purchaser.name}</strong>
                                  {!expense.isScanned && (
                                    <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#fef08a', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                      ⚠️ No digitalizado
                                    </span>
                                  )}
                                </div>
                                {expense.store !== 'Desconocido' && expense.store !== 'Gasto general' && (
                                  <div className={styles.expenseStore}>{expense.store}</div>
                                )}
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              {!expense.isScanned && expense.images.length > 0 && (
                                <button
                                  onClick={() => handleReScan(expense.id)}
                                  disabled={loading === `rescan-exp-${expense.id}`}
                                  className={styles.expenseReScanBtn}
                                  title="Intentar volver a escanear ticket con IA"
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '0.95rem' }}
                                >
                                  {loading === `rescan-exp-${expense.id}` ? '⏳' : '🔄'}
                                </button>
                              )}
                              {canDelete && (
                                <button 
                                  onClick={() => handleDelete(expense.id)}
                                  disabled={loading === expense.id}
                                  className={styles.expenseDeleteBtn}
                                  title="Eliminar gasto"
                                >
                                  {loading === expense.id ? '⏳' : <TrashIcon />}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Description if present */}
                          {expense.description && expense.description !== 'Compra en Desconocido' && expense.description !== 'Compra en Gasto general' && (
                            <div className={styles.expenseDescription}>
                              {expense.description}
                            </div>
                          )}

                          {/* Items and Total */}
                          <div className={styles.expenseItemsContainer}>
                            <div className={styles.expenseItemsList}>
                              {expense.items.map((item: any, idx: number) => (
                                <div key={idx} className={styles.expenseItemRow}>
                                  <span>{item.quantity}x {item.name}</span>
                                  {item.price > 0 && (
                                    <span className={styles.expenseItemPrice}>{item.price.toFixed(2)}&nbsp;€</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className={styles.expenseTotalRow}>
                              <span>Total</span>
                              <span className={styles.expenseTotalValue}>{expense.amount.toFixed(2)}&nbsp;€</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* Galería de Evidencias (Tickets Originales) */}
      {(() => {
        const allImages = expenses.flatMap(exp => 
          exp.images.map((img: any) => ({
            ...img,
            expenseId: exp.id,
            isScanned: exp.isScanned,
            date: exp.date,
            createdAt: exp.createdAt
          }))
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (allImages.length === 0) return null;

        return (
          <div style={{ marginTop: '2.5rem' }}>
            <h3 className={`${styles.sectionTitle} ${styles.sectionTitleSpaced}`}>📷 Tickets Originales</h3>
            <div className="glass-panel" style={{ marginBottom: '2.5rem' }}>
              <div className={styles.innerBlackBox}>
                <div className={styles.galleryGrid}>
                  {allImages.map((ev: any) => {
                    const apiImageUrl = `/api${ev.url}`;
                    const dateStr = new Date(ev.createdAt).toLocaleString('es-ES', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit'
                    });
                    return (
                      <div key={ev.id} className={styles.galleryItem}>
                        <div className={styles.galleryHeader}>
                          <span className={styles.galleryDate} title={ev.isScanned ? "Escaneado por IA con éxito" : "No escaneado / Error IA"}>
                            {ev.isScanned ? '✅' : '⚠️'} {dateStr}
                          </span>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {!ev.isScanned && (
                              <button
                                onClick={() => handleReScan(ev.expenseId)}
                                disabled={loading === `rescan-exp-${ev.expenseId}` || loading === `delete-ev-${ev.id}`}
                                className={styles.galleryReScanBtn}
                                title="Volver a escanear con IA"
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff' }}
                              >
                                {loading === `rescan-exp-${ev.expenseId}` ? '⏳' : '🔄'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteEvidence(ev.id)}
                              disabled={loading === `delete-ev-${ev.id}`}
                              className={styles.galleryDeleteBtn}
                              title="Borrar foto"
                            >
                              {loading === `delete-ev-${ev.id}` ? '⏳' : <TrashIcon />}
                            </button>
                          </div>
                        </div>
                        <div 
                          onClick={() => setLightboxImage(apiImageUrl)}
                          className={styles.galleryLink}
                          style={{ opacity: loading === `delete-ev-${ev.id}` ? 0.5 : 1, cursor: 'pointer' }}
                        >
                          <img src={apiImageUrl} alt="Ticket" className={styles.galleryImg} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
}
