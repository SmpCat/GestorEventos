'use client';

import { useState } from 'react';
import styles from './FinancesAdmin.module.css'; // Reutilizaremos algo similar a AttendeesAdmin
import { addTransaction, deleteTransaction } from '@/actions/finances';

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
                  <div className={styles.editCard}>
                    <h4 style={{ marginBottom: '1rem' }}>Añadir Movimiento</h4>
                    
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label className={styles.editLabel}>Tipo de Movimiento</label>
                        <select 
                          className={styles.editSelect}
                          value={txType}
                          onChange={(e) => setTxType(e.target.value as 'INCOME' | 'EXPENSE')}
                          disabled={isProcessing}
                        >
                          <option value="INCOME">Ingreso (Aporta al bote)</option>
                          <option value="EXPENSE">Gasto (Dinero del bote para él)</option>
                        </select>
                      </div>
                      
                      <div style={{ width: '100px' }}>
                        <label className={styles.editLabel}>Euros (€)</label>
                        <input 
                          type="number"
                          className={styles.editInput}
                          value={txAmount}
                          onChange={(e) => setTxAmount(e.target.value)}
                          placeholder="0.00"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleAddTransaction(att.id)}
                      className={`btn btn-primary`}
                      disabled={isProcessing || !txAmount}
                      style={{ width: '100%' }}
                    >
                      {isProcessing ? 'Guardando...' : 'Registrar Movimiento'}
                    </button>
                  </div>
                  
                  {att.payments && att.payments.length > 0 && (
                    <div className={styles.historySection}>
                      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Historial de Movimientos</h4>
                      <ul className={styles.historyList}>
                        {att.payments.map((p: any) => (
                          <li key={p.id} className={styles.historyItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontWeight: 'bold', color: p.type === 'INCOME' ? '#4ade80' : '#f87171' }}>
                                {p.type === 'INCOME' ? '+' : '-'}{p.amount}€
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                                ({new Date(p.date).toLocaleDateString('es-ES')})
                              </span>
                            </div>
                            <button 
                              onClick={() => handleDeleteTransaction(p.id)}
                              className={styles.deleteHistoryBtn}
                              disabled={isProcessing}
                              title="Borrar movimiento"
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
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
