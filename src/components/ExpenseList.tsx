'use client';

import { useState, useRef } from 'react';
import { deleteExpenseAction, processReceiptAction, saveExpenseAction, saveManualExpenseAction, deleteExpenseEvidence, ReceiptData } from '@/actions/receipts';
import TrashIcon from './TrashIcon';
import styles from './ExpenseList.module.css';

export default function ExpenseList({ expenses, isAdmin, currentUserId }: { expenses: any[], isAdmin: boolean, currentUserId: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1>Gastos Registrados</h1>
          <p className="subtitle">Gestiona y revisa los tickets escaneados del evento activo.</p>
        </div>
      </div>

      {/* Controles para Añadir Elementos (Arriba) */}
      <h3 className={styles.sectionTitle}>🧾 Añadir Gasto</h3>
      <div className="glass-panel" style={{ marginBottom: '4rem' }}>
        <div className={styles.innerBlackBox}>
          <div className={styles.uploadWrapper}>
            
            {/* Formulario de Entrada Manual */}
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

            <div className={styles.orDivider}>
              <span className={styles.orText}>o escanea un ticket</span>
            </div>

            {/* Escáner de IA */}
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
                  <span style={{ fontSize: '1.5rem' }}>📸</span> Escanear Nuevo Ticket
                </>
              )}
            </button>
            
            <div className={styles.uploadHelperText}>
              Sube una foto y la IA extraerá los datos automáticamente
            </div>

            {error && (
              <div className={styles.errorBox}>
                ❌ {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Previsualización y Revisión del JSON devuelto */}
      {receiptData && (
        <div className={`glass-panel ${styles.previewContainer}`} style={{ marginBottom: '4rem' }}>
          <div className={styles.previewHeader}>
            <h3 className={styles.previewTitle}>
              <span>✨</span> Datos Extraídos con Éxito
            </h3>
            <p className={styles.previewSubtitle}>Revisa y confirma los detalles antes de guardar el gasto.</p>
          </div>
          
          <div className={styles.previewBody}>
            <div className={styles.previewFlexRow}>
              {/* Imagen */}
              <div className={styles.previewImageCol}>
                <span className={styles.previewLabel}>Ticket Original</span>
                <div className={styles.previewImageWrapper}>
                  <img src={receiptData.imageUrl} alt="Ticket" className={styles.previewImage} />
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
                    value={receiptData.amount} 
                    onChange={(e) => setReceiptData({...receiptData, amount: parseFloat(e.target.value) || 0})}
                    className={`input-field ${styles.previewInput} ${styles.previewInputAmount}`} 
                  />
                </div>

                <div className={styles.previewInputGroup}>
                  <label className={`${styles.previewLabel} ${styles.previewItemsLabel}`}>
                    Artículos Detectados ({receiptData.items?.length || 0})
                  </label>
                  <div className={`custom-scrollbar ${styles.previewItemsList}`}>
                    {receiptData.items?.map((item, idx) => (
                      <div key={idx} className={styles.previewItemRow}>
                        <div className={styles.previewItemLeft}>
                          <span className={styles.previewItemQty}>{item.quantity}x</span>
                          <span className={styles.previewItemName} title={item.name}>{item.name}</span>
                        </div>
                        <span className={styles.previewItemPrice}>{item.price.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.previewActions}>
              <button 
                onClick={() => setReceiptData(null)} 
                className={`btn ${styles.cancelBtn}`}
              >
                Cancelar y Descartar
              </button>
              <button 
                onClick={confirmReceipt} 
                disabled={isUploading} 
                className={`btn ${styles.confirmBtn}`}
              >
                {isUploading ? '⏳ Guardando...' : '✅ Confirmar y Guardar Gasto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listado de Elementos */}
      <div className={styles.listHeader}>
        <h3 className={styles.listHeaderTitle}>📊 Lista de Gastos</h3>
        <div className={styles.listHeaderTotal}>
          {expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}&nbsp;€
        </div>
      </div>
      
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div className={styles.innerBlackBox}>
          <div className={styles.expensesList}>
            {expenses.length === 0 ? (
              <p className={styles.emptyState}>Aún no se ha registrado ningún gasto.</p>
            ) : (
              expenses.map((expense) => {
                const canDelete = isAdmin || expense.purchaserId === currentUserId;
                const dateStr = new Date(expense.date).toLocaleDateString('es-ES', {
                  day: '2-digit', month: '2-digit', year: 'numeric'
                });

                return (
                  <div key={expense.id} className={styles.expenseCard}>
                    
                    {/* Top Row: Icon, Store (if known) + Date + Purchaser, Delete Button */}
                    <div className={styles.expenseTopRow}>
                      <div className={styles.expenseMeta}>
                        <div className={styles.expenseMetaInfo}>
                          <div className={styles.expenseDateUser}>
                            {dateStr} <span style={{ margin: '0 0.25rem' }}>•</span> <strong className={styles.expenseUser}>{expense.purchaser.name}</strong>
                          </div>
                          {expense.store !== 'Desconocido' && expense.store !== 'Gasto general' && (
                            <div className={styles.expenseStore}>{expense.store}</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <div>
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
            <h3 className={`${styles.sectionTitle} ${styles.sectionTitleSpaced}`}>📷 Tickets Originales</h3>
            <div className="glass-panel" style={{ marginBottom: '2.5rem' }}>
              <div className={styles.innerBlackBox}>
                <div className={styles.galleryGrid}>
                  {allImages.map((ev: any) => {
                    const apiImageUrl = ev.url;
                    const dateStr = new Date(ev.createdAt).toLocaleString('es-ES', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit'
                    });
                    return (
                      <div key={ev.id} className={styles.galleryItem}>
                        <div className={styles.galleryHeader}>
                          <span className={styles.galleryDate}>
                            🗓️ {dateStr}
                          </span>
                          <button
                            onClick={() => handleDeleteEvidence(ev.id)}
                            disabled={loading === `delete-ev-${ev.id}`}
                            className={styles.galleryDeleteBtn}
                            title="Borrar foto"
                          >
                            {loading === `delete-ev-${ev.id}` ? '⏳' : <TrashIcon />}
                          </button>
                        </div>
                        <a 
                          href={apiImageUrl}
                          className={styles.galleryLink}
                          style={{ opacity: loading === `delete-ev-${ev.id}` ? 0.5 : 1 }}
                        >
                          <img src={apiImageUrl} alt="Ticket" className={styles.galleryImg} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
