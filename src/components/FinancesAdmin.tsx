'use client';

import { useState } from 'react';
import styles from './FinancesAdmin.module.css'; 
import { addTransaction, deleteTransaction } from '@/actions/finances';
import SelectField from './SelectField';

export default function FinancesAdmin({ attendees, eventId, currentUser }: { attendees: any[], eventId: string, currentUser: any }) {
  const [editingAttendee, setEditingAttendee] = useState<string | null>(null);
  
  // Transaction state
  const [txType, setTxType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [txAmount, setTxAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const startEditing = (att: any) => {
    setEditingAttendee(att.id);
    setTxType('INCOME');
    setTxAmount('');
  };

  const handleAddTransaction = async (attId: string) => {
    const val = parseFloat(txAmount);
    if (isNaN(val) || val <= 0) {
      alert('Introduce una cantidad válida superior a cero.');
      return;
    }

    setIsProcessing(true);
    const res = await addTransaction(attId, val, txType, currentUser.id);
    if (!res.success) {
      alert(res.error);
    } else {
      setTxAmount('');
    }
    setIsProcessing(false);
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (confirm('¿Seguro que quieres borrar este movimiento?')) {
      setIsProcessing(true);
      const res = await deleteTransaction(txId);
      if (!res.success) alert(res.error);
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.adminContainer}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Ingresos y Gastos</h2>
      </div>

      <div className={styles.gridCards}>
        {attendees.map(att => {
          const isEditing = editingAttendee === att.id;
          
          // Cálculos financieros locales
          const expected = att.expectedPayment !== null ? att.expectedPayment : 0;
          const incomes = att.payments.filter((p: any) => p.type === 'INCOME').reduce((acc: number, p: any) => acc + p.amount, 0);
          const expenses = att.payments.filter((p: any) => p.type === 'EXPENSE').reduce((acc: number, p: any) => acc + p.amount, 0);
          
          const quotaBalance = incomes - expected; // Positivo = ha pagado de más, Negativo = debe dinero de la cuota
          
          // El Saldo Global incluye los adelantos (gastos) que se le han dado para compras.
          // Si le damos 100€ (EXPENSE), su saldo empeora porque tiene dinero nuestro.
          const globalBalance = quotaBalance - expenses; 

          return (
            <div key={att.id} className={styles.mobileCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  {att.user.name} <span className={styles.cardUsername}>@{att.user.username}</span>
                </div>
                <button 
                  onClick={() => isEditing ? setEditingAttendee(null) : startEditing(att)} 
                  className={`btn btn-secondary ${styles.editBtnSmall}`}
                >
                  {isEditing ? '▲' : '✏️'}
                </button>
              </div>
              
              {!isEditing ? (
                <div className={styles.infoGrid}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Cuota Asignada:</span>
                    <span className={styles.infoValue}>{expected}€</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Ingresos:</span>
                    <span className={styles.infoValue} style={{ color: incomes >= expected && expected > 0 ? '#4ade80' : 'inherit' }}>
                      {incomes}€
                    </span>
                  </div>
                  {expenses > 0 && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Adelantos (Gastos):</span>
                      <span className={styles.infoValue} style={{ color: '#f87171' }}>{expenses}€</span>
                    </div>
                  )}
                  <div className={styles.infoRow} style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                    <span className={styles.infoLabel}>Saldo Global:</span>
                    <span className={styles.infoValue} style={{ color: globalBalance < 0 ? '#f87171' : (globalBalance > 0 ? '#4ade80' : 'inherit') }}>
                      {globalBalance}€
                    </span>
                  </div>
                </div>
              ) : (
                <div className={styles.editSection}>
                  <div className={styles.actionBox} style={{ marginBottom: '1rem' }}>
                    <div className={styles.actionBoxTitleAlt}>Añadir Movimiento</div>
                    
                    <div className={styles.addPaymentRow} style={{ marginTop: '0.25rem', alignItems: 'center' }}>
                      <span className={styles.infoLabel} style={{ minWidth: '40px' }}>Tipo:</span>
                      <div style={{ flex: 1 }}>
                        <SelectField
                          value={txType}
                          onChange={(e) => setTxType(e.target.value as 'INCOME' | 'EXPENSE')}
                          disabled={isProcessing}
                          containerStyle={{ width: '100%', marginBottom: 0 }}
                          style={{ opacity: isProcessing ? 0.6 : 1 }}
                        >
                          <option value="INCOME">Ingreso (Aporta al bote)</option>
                          <option value="EXPENSE">Gasto (Dinero para él)</option>
                        </SelectField>
                      </div>
                    </div>

                    <div className={styles.addPaymentRow} style={{ marginTop: '1rem' }}>
                      <span className={styles.infoLabel} style={{ minWidth: '40px' }}>Importe:</span>
                      <div className={styles.inputWrapper}>
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
                      <button 
                        onClick={() => handleAddTransaction(att.id)} 
                        className={`btn ${styles.addPaymentBtn}`} 
                        disabled={isProcessing || !txAmount} 
                        title="Añadir Movimiento"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  {att.payments && att.payments.length > 0 && (
                    <div className={styles.paymentsSection} style={{ marginTop: '0.75rem' }}>
                      <div className={styles.paymentsTitle}>Historial de Movimientos</div>
                      <div className={styles.paymentsList}>
                        {att.payments.map((p: any) => (
                          <div key={p.id} className={styles.paymentRow}>
                            <span className={styles.paymentDate}>
                              {new Date(p.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })} 
                              <span style={{fontSize: '0.65rem', opacity: 0.6}}><br/>(por @{p.registeredBy?.username || '?'})</span>
                            </span>
                            <span className={styles.paymentAmount} style={{ color: p.type === 'INCOME' ? '#4ade80' : '#f87171' }}>
                              {p.type === 'INCOME' ? '+' : '-'}{p.amount}€
                            </span>
                            <button onClick={() => handleDeleteTransaction(p.id)} className={styles.deletePaymentBtn} disabled={isProcessing} title="Borrar Movimiento">
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
