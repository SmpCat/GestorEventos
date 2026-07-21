'use client';

import { useState } from 'react';
import styles from './FinancesAdmin.module.css'; 
import { addTransaction, deleteTransaction, updateTransaction } from '@/actions/finances';
import SelectField from './SelectField';
import TrashIcon from './TrashIcon';

export default function FinancesAdmin({ attendees, payments, eventId, currentUser }: { attendees: any[], payments: any[], eventId: string, currentUser: any }) {
  // Transaction state
  const [txType, setTxType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txAttendeeId, setTxAttendeeId] = useState<string>(''); // Vacio = Ninguno
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  const resetForm = () => {
    setTxType('INCOME');
    setTxAmount('');
    setTxDescription('');
    setTxAttendeeId('');
    setEditingPaymentId(null);
  };

  const handleStartEdit = (payment: any) => {
    setEditingPaymentId(payment.id);
    setTxType(payment.type);
    setTxAmount(payment.amount.toString());
    setTxDescription(payment.description || '');
    setTxAttendeeId(payment.attendeeId || '');
    // Hacer scroll arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveTransaction = async () => {
    const val = parseFloat(txAmount);
    if (isNaN(val) || val <= 0) {
      alert('Introduce una cantidad válida superior a cero.');
      return;
    }
    if (!txDescription.trim()) {
      alert('Por favor, introduce una descripción para el movimiento.');
      return;
    }

    setIsProcessing(true);
    let res;
    
    if (editingPaymentId) {
      res = await updateTransaction(editingPaymentId, val, txType, txDescription, txAttendeeId || null);
    } else {
      res = await addTransaction(eventId, val, txType, txDescription, currentUser.id, txAttendeeId || null);
    }
    
    if (!res.success) {
      alert(res.error);
    } else {
      resetForm();
    }
    setIsProcessing(false);
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (confirm('¿Seguro que quieres borrar este movimiento?')) {
      setIsProcessing(true);
      const res = await deleteTransaction(txId);
      if (!res.success) alert(res.error);
      if (editingPaymentId === txId) resetForm();
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.adminContainer}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Flujo de Caja (Bote Global)</h2>
      </div>

      <div className={styles.editSection} style={{ marginBottom: '2rem' }}>
        <div className={styles.actionBox}>
          <div className={styles.actionBoxTitleAlt}>
            {editingPaymentId ? 'Editar Movimiento' : 'Añadir Nuevo Movimiento'}
          </div>
          
          <div className={styles.addPaymentRow} style={{ marginTop: '0.25rem', alignItems: 'center' }}>
            <span className={styles.infoLabel} style={{ minWidth: '80px' }}>Tipo:</span>
            <div style={{ flex: 1 }}>
              <SelectField
                value={txType}
                onChange={(e) => setTxType(e.target.value as 'INCOME' | 'EXPENSE')}
                disabled={isProcessing}
                containerStyle={{ width: '100%', marginBottom: 0 }}
                style={{ opacity: isProcessing ? 0.6 : 1 }}
              >
                <option value="INCOME">🟢 ENTRADA (Al Bote)</option>
                <option value="EXPENSE">🔴 SALIDA (Del Bote)</option>
              </SelectField>
            </div>
          </div>

          <div className={styles.addPaymentRow} style={{ marginTop: '1rem', alignItems: 'center' }}>
            <span className={styles.infoLabel} style={{ minWidth: '80px' }}>Asistente:</span>
            <div style={{ flex: 1 }}>
              <SelectField
                value={txAttendeeId}
                onChange={(e) => setTxAttendeeId(e.target.value)}
                disabled={isProcessing}
                containerStyle={{ width: '100%', marginBottom: 0 }}
                style={{ opacity: isProcessing ? 0.6 : 1 }}
              >
                <option value="">--- Ninguno (Movimiento Externo) ---</option>
                {attendees.map(a => (
                  <option key={a.id} value={a.id}>{a.user.name} (@{a.user.username})</option>
                ))}
              </SelectField>
            </div>
          </div>

          <div className={styles.addPaymentRow} style={{ marginTop: '1rem', alignItems: 'center' }}>
            <span className={styles.infoLabel} style={{ minWidth: '80px' }}>Motivo:</span>
            <div style={{ flex: 1 }}>
              <input 
                type="text" 
                className="input-field"
                value={txDescription}
                onChange={e => setTxDescription(e.target.value)}
                placeholder="Ej: Hielos, Devolución sobrante..."
                disabled={isProcessing}
                style={{ width: '100%', margin: 0 }}
              />
            </div>
          </div>

          <div className={styles.addPaymentRow} style={{ marginTop: '1rem', alignItems: 'center' }}>
            <span className={styles.infoLabel} style={{ minWidth: '80px' }}>Importe:</span>
            <div className={styles.inputWrapper} style={{ flex: 1 }}>
              <input 
                type="number" 
                className={`input-field ${styles.currencyInput}`}
                value={txAmount}
                onChange={e => setTxAmount(e.target.value)}
                placeholder="0"
                disabled={isProcessing}
              />
              <span className={styles.currencySymbol}>€</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
            {editingPaymentId && (
              <button 
                onClick={resetForm}
                className="btn btn-secondary"
                disabled={isProcessing}
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
            )}
              <button 
              onClick={handleSaveTransaction} 
              className="btn" 
              disabled={isProcessing || !txAmount || !txDescription.trim()} 
              style={{ 
                flex: 2, 
                padding: '0.75rem', 
                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                border: '1px solid rgba(255,255,255,0.2)', 
                color: '#ffffff',
                fontWeight: 'bold',
                borderRadius: '8px'
              }}
            >
              {editingPaymentId ? 'Guardar Cambios' : 'Registrar Movimiento'}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.headerRow} style={{ marginTop: '3rem' }}>
        <h3 className={styles.title} style={{ fontSize: '1.2rem' }}>Historial Global</h3>
      </div>
      
      <div className={styles.editSection}>
        {payments && payments.length > 0 ? (
          <div className={styles.paymentsList}>
            {payments.map((p: any) => (
              <div key={p.id} className={styles.paymentRow} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                
                <div style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className={styles.paymentDate} style={{ opacity: 0.8 }}>
                    {new Date(p.date).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })} 
                    <span style={{fontSize: '0.7rem', opacity: 0.6, marginLeft: '0.5rem'}}>(por @{p.registeredBy?.username || '?'})</span>
                  </span>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleStartEdit(p)} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} disabled={isProcessing} title="Editar">
                      ✏️
                    </button>
                    <button onClick={() => handleDeleteTransaction(p.id)} className={styles.deletePaymentBtn} disabled={isProcessing} title="Borrar">
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.95rem', wordBreak: 'break-word' }}>{p.description || 'Sin descripción'}</span>
                  <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                    {p.attendee ? `👤 ${p.attendee.user.name}` : '🌐 Bote Global (Externo)'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: '100px' }}>
                  <span className={styles.paymentAmount} style={{ fontSize: '1.3rem', fontWeight: 'bold', color: p.type === 'INCOME' ? '#4ade80' : '#f87171' }}>
                    {p.type === 'INCOME' ? '+' : '-'}{p.amount}€
                  </span>
                </div>
                
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>
            No hay ningún movimiento registrado todavía.
          </div>
        )}
      </div>
    </div>
  );
}
