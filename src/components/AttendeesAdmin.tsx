'use client';

import { useState, useEffect } from 'react';
import { updateAttendeeAdmin, addPayment, deletePayment, deleteAttendee } from '@/actions/attendance';
import TrashIcon from './TrashIcon';
import styles from './AttendeesAdmin.module.css';

export default function AttendeesAdmin({ attendees, isAdmin }: { attendees: any[], isAdmin: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);

  // Estados para el editor manual de asistentes
  const [editingAttendee, setEditingAttendee] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editComment, setEditComment] = useState('');
  
  // Nuevo pago
  const [newPaymentAmount, setNewPaymentAmount] = useState<number | ''>('');

  // Interceptar el botón "Volver" global del Navbar
  useEffect(() => {
    const handleVolver = (e: Event) => {
      if (editingAttendee) {
        e.preventDefault();
        setEditingAttendee(null);
      }
    };
    window.addEventListener('navbar-volver', handleVolver);
    return () => window.removeEventListener('navbar-volver', handleVolver);
  }, [editingAttendee]);

  const startEditing = (att: any) => {
    setEditingAttendee(att.id);
    setEditPrice(att.expectedPayment !== null ? att.expectedPayment : '');
    setEditComment(att.adminComment || '');
    setNewPaymentAmount('');
  };

  const saveAttendee = async (attId: string) => {
    if (!window.confirm('¿Seguro que quieres guardar los cambios en la cuota de este asistente?')) {
      return;
    }
    setLoading(`att-${attId}`);
    const finalPrice = editPrice === '' ? null : Number(editPrice);
    const res = await updateAttendeeAdmin(attId, finalPrice, editComment);
    if (res.success) {
      alert('Cuota guardada correctamente.');
      setEditingAttendee(null);
    } else {
      alert(res.error || 'Error al guardar.');
    }
    setLoading(null);
  };

  const handleAddPayment = async (attId: string) => {
    if (newPaymentAmount === '' || Number(newPaymentAmount) <= 0) return;
    setLoading(`pay-${attId}`);
    const res = await addPayment(attId, Number(newPaymentAmount));
    if (res.success) {
      alert(`Pago de ${newPaymentAmount}€ registrado.`);
      setNewPaymentAmount('');
    } else {
      alert(res.error || 'Error al añadir pago.');
    }
    setLoading(null);
  };

  const handleDeletePayment = async (paymentId: string) => {
    setTimeout(async () => {
      if (!window.confirm('¿Borrar este registro de pago?')) return;
      setLoading(`del-pay-${paymentId}`);
      const res = await deletePayment(paymentId);
      if (res.success) {
        alert('Pago eliminado.');
      } else {
        alert(res.error || 'Error al borrar el pago.');
      }
      setLoading(null);
    }, 50);
  };

  const handleDeleteAttendee = async (att: any) => {
    const hasPayments = att.payments && att.payments.length > 0;
    const hasExpenses = att.user?.expenses && att.user.expenses.length > 0;

    if (hasPayments) {
      alert('⛔️ No puedes expulsar a este asistente porque tiene PAGOS de cuota registrados. Debes borrarlos todos primero.');
      return;
    }
    if (hasExpenses) {
      alert('⛔️ No puedes expulsar a este asistente porque tiene TICKETS de gastos registrados. Debes borrar o reasignar sus tickets en la sección Gastos primero.');
      return;
    }

    setTimeout(async () => {
      if (!window.confirm('🚨 ¿ESTÁS COMPLETAMENTE SEGURO? Esta acción expulsará a esta persona del evento. No se puede deshacer.')) return;
      
      setLoading(`del-att-${att.id}`);
      const res = await deleteAttendee(att.id);
      if (res.success) {
        alert('Asistente expulsado del evento correctamente.');
        setEditingAttendee(null);
      } else {
        alert(res.error || 'Error al eliminar el asistente.');
      }
      setLoading(null);
    }, 50);
  };

  return (
    <div className={`glass-panel ${styles.adminPanel}`}>
      {attendees.length === 0 ? (
        <div className={styles.emptyState}>Aún no hay nadie apuntado a este evento.</div>
      ) : (
        <>
          {/* VISTA MÓVIL (Cards) */}
          <div className={`desktop-hide ${styles.mobileList}`}>
            {attendees.map((att: any) => {
              const isEditing = editingAttendee === att.id;
              const isProcessing = loading === `att-${att.id}` || loading === `pay-${att.id}` || loading?.startsWith('del-pay');
              const amountPaid = att.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
              const currentQuota = att.expectedPayment !== null ? att.expectedPayment : 0; 
              const balance = currentQuota - amountPaid;

              return (
                <div key={`mobile-${att.id}`} className={styles.mobileCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>
                      {att.user.name} <span className={styles.cardUsername}>@{att.user.username}</span>
                    </div>
                    {!isEditing && isAdmin && (
                      <button onClick={() => startEditing(att)} className={`btn btn-secondary ${styles.editBtnSmall}`}>✏️</button>
                    )}
                  </div>
                  
                  {!isEditing ? (
                    <div className={styles.infoGrid}>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Cuota Asignada ({att.daysAttending}d):</span>
                        <span className={styles.infoValue}>{att.expectedPayment !== null ? `${att.expectedPayment}€` : '??€'}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Total Pagado:</span>
                        <span className={styles.infoSuccess}>{amountPaid}€</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoValue}>Pendiente Bote:</span>
                        <span className={`${styles.infoValue} ${balance > 0 ? styles.infoDanger : balance < 0 ? styles.infoSuccess : styles.infoLabel}`}>
                          {balance > 0 ? `${balance}€` : balance < 0 ? `Bote te debe ${Math.abs(balance)}€` : '0€'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.editSection}>
                      <div className={styles.editTitle}>Ajuste de Cuota</div>
                      <div className="flex flex-col gap-1">
                        <span className={styles.infoLabel}>Cuota de {att.daysAttending} días:</span>
                        <div className={styles.inputWrapper}>
                          <input 
                            type="number" 
                            className={`input-field ${styles.currencyInput}`}
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value ? Number(e.target.value) : '')}
                            placeholder="Automático"
                          />
                          <span className={styles.currencySymbol}>€</span>
                        </div>
                      </div>
                      <input 
                        type="text" 
                        className={`input-field ${styles.commentInput}`}
                        placeholder="Comentario interno (opcional)..."
                        value={editComment}
                        onChange={e => setEditComment(e.target.value)}
                      />
                      <div className="flex mobile-col gap-2 mt-1">
                        <button onClick={() => saveAttendee(att.id)} className={`btn ${styles.saveBtn}`} disabled={isProcessing}>
                          Guardar Cuota
                        </button>
                      </div>

                      <div className={styles.paymentsSection}>
                        <div className={styles.paymentsTitle}>Historial de Pagos</div>
                        <div className={styles.paymentsList}>
                          {att.payments?.map((p: any) => (
                            <div key={p.id} className={styles.paymentRow}>
                              <span className={styles.paymentDate}>{new Date(p.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}</span>
                              <span className={styles.paymentAmount}>+{p.amount}€</span>
                              <button onClick={() => handleDeletePayment(p.id)} className={styles.deletePaymentBtn} disabled={isProcessing} title="Borrar Pago">
                                <TrashIcon />
                              </button>
                            </div>
                          ))}
                        </div>
                        {(!att.payments || att.payments.length === 0) && (
                          <div className={styles.noPayments}>Ningún pago registrado.</div>
                        )}
                        <div className={styles.addPaymentRow}>
                          <span className={styles.infoLabel}>Añadir Pago:</span>
                          <div className={styles.inputWrapper}>
                            <input 
                              type="number" 
                              className={`input-field ${styles.currencyInput}`}
                              value={newPaymentAmount}
                              onChange={e => setNewPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                              placeholder="0"
                            />
                            <span className={styles.currencySymbol}>€</span>
                          </div>
                          <button onClick={() => handleAddPayment(att.id)} className={`btn ${styles.addPaymentBtn}`} disabled={isProcessing || newPaymentAmount === ''} title="Añadir Pago">
                            +
                          </button>
                        </div>
                      </div>
                      <div className={styles.deleteAttendeeContainer}>
                        <button 
                          onClick={() => handleDeleteAttendee(att)} 
                          className={`btn ${styles.deleteAttendeeBtn}`}
                          disabled={isProcessing}
                        >
                          <TrashIcon /> Expulsar Asistente
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {!isEditing && att.adminComment && (
                    <div className={styles.adminComment}>📝 {att.adminComment}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* VISTA ESCRITORIO (Tabla) */}
          <div className="table-wrapper mobile-hide">
            <table className="table">
              <thead>
                <tr className={styles.tableHeader}>
                  <th>Asistente</th>
                  <th className="text-center">Días</th>
                  <th style={{ textAlign: "right" }}>Cuota Base</th>
                  <th style={{ textAlign: "right" }}>Pagado</th>
                  <th style={{ textAlign: "right" }}>Balance</th>
                  <th>Acciones / Historial</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((att: any) => {
                  const isEditing = editingAttendee === att.id;
                  const isProcessing = loading === `att-${att.id}` || loading === `pay-${att.id}` || loading?.startsWith('del-pay');
                  const amountPaid = att.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
                  const currentQuota = att.expectedPayment !== null ? att.expectedPayment : 0;
                  const balance = currentQuota - amountPaid;

                  const balanceClass = balance > 0 ? styles.balanceNegative : balance < 0 ? styles.balancePositive : styles.balanceNeutral;
                  const balanceText = balance > 0 ? `Debe ${balance}€` : balance < 0 ? `Bote debe ${Math.abs(balance)}€` : 'Pagado';

                  return (
                    <tr key={att.id} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        <strong>{att.user.name}</strong>
                        <br/>
                        <span className={styles.tableUsername}>@{att.user.username}</span>
                        {!isEditing && att.adminComment && (
                          <p className={styles.tableComment}>📝 {att.adminComment}</p>
                        )}
                      </td>
                      <td className={`${styles.tableCell} ${styles.tableDays}`}>{att.daysAttending}</td>
                      
                      <td className={styles.tableCell} style={{ textAlign: "right" }}>
                        {isEditing ? (
                          <div className={styles.tableInputWrapper}>
                            <input 
                              type="number" 
                              className={`input-field ${styles.tableCurrencyInput}`}
                              value={editPrice}
                              onChange={e => setEditPrice(e.target.value ? Number(e.target.value) : '')}
                              placeholder="Auto"
                            />
                            <span className={styles.tableCurrencySymbol}>€</span>
                          </div>
                        ) : (
                          <span style={{ color: att.adminComment ? 'var(--accent-warning)' : 'inherit', fontWeight: 'bold' }}>
                            {att.expectedPayment !== null ? `${att.expectedPayment}€` : '??'}
                          </span>
                        )}
                      </td>

                      <td className={styles.tableCell} style={{ textAlign: "right" }}>
                        <span className={styles.tableAmountPaid}>{amountPaid > 0 ? `${amountPaid}€` : '-'}</span>
                      </td>

                      <td className={styles.tableCell} style={{ textAlign: "right" }}>
                        <span className={`${styles.balanceBadge} ${balanceClass}`}>
                          {balanceText}
                        </span>
                      </td>

                      <td className={styles.tableCell}>
                        {isEditing && isAdmin ? (
                          <div className={styles.desktopActions}>
                            <div className={styles.actionBox}>
                              <div className={styles.actionBoxTitle}>Ajuste Cuota</div>
                              <input 
                                type="text" 
                                className={`input-field ${styles.actionInput}`}
                                placeholder="Comentario (opcional)"
                                value={editComment}
                                onChange={e => setEditComment(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <button onClick={() => saveAttendee(att.id)} className={`btn ${styles.actionSaveBtn}`} disabled={isProcessing}>
                                  Guardar Cuota
                                </button>
                              </div>
                            </div>
                            
                            <div className={styles.actionBox}>
                              <div className={styles.actionBoxTitleAlt}>Pagos</div>
                              <div className={styles.paymentsList}>
                                {att.payments?.map((p: any) => (
                                  <div key={p.id} className={styles.paymentRow}>
                                    <span className={styles.paymentDate}>{new Date(p.date).toLocaleDateString('es-ES')}</span>
                                    <span className={styles.paymentAmount}>+{p.amount}€</span>
                                    <button onClick={() => handleDeletePayment(p.id)} className={styles.deletePaymentBtn} disabled={isProcessing} title="Borrar Pago">
                                      <TrashIcon />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              {(!att.payments || att.payments.length === 0) && (
                                <div className={styles.noPayments}>Ningún pago.</div>
                              )}
                              <div className={styles.addPaymentRow} style={{ marginTop: '0.75rem' }}>
                                <span className={styles.infoLabel}>Añadir Pago:</span>
                                <div className={styles.tableInputWrapper}>
                                  <input 
                                    type="number" 
                                    className={`input-field ${styles.tableCurrencyInput}`}
                                    value={newPaymentAmount}
                                    onChange={e => setNewPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                                    placeholder="0"
                                  />
                                  <span className={styles.tableCurrencySymbol}>€</span>
                                </div>
                                <button onClick={() => handleAddPayment(att.id)} className={`btn ${styles.addPaymentBtn}`} disabled={isProcessing || newPaymentAmount === ''} title="Añadir Pago">
                                  +
                                </button>
                              </div>
                            </div>
                            <div className={styles.deleteAttendeeContainer} style={{ marginTop: "0.25rem" }}>
                              <button 
                                onClick={() => handleDeleteAttendee(att)} 
                                className={`btn ${styles.deleteAttendeeTableBtn}`}
                                disabled={isProcessing}
                              >
                                <TrashIcon /> Expulsar Asistente
                              </button>
                            </div>
                          </div>
                        ) : (
                          isAdmin ? (
                            <button onClick={() => startEditing(att)} className={`btn btn-secondary ${styles.manageBtn}`}>
                              Gestionar Pagos y Cuota
                            </button>
                          ) : (
                             <div className={styles.readOnlyMsg}>Contacta al admin para cambios</div>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
