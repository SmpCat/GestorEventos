'use client';

import { useState, useEffect } from 'react';
import { updateAttendeeDays, addPayment, deletePayment, deleteAttendee, expelAllNonAdminAttendees } from '@/actions/attendance';
import TrashIcon from './TrashIcon';
import SelectField from './SelectField';
import styles from './AttendeesAdmin.module.css';

export default function AttendeesAdmin({ attendees, pricingRules, isAdmin }: { attendees: any[], pricingRules: any[], isAdmin: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);

  // Estados para el editor manual de asistentes
  const [editingAttendee, setEditingAttendee] = useState<string | null>(null);
  
  // Nuevo pago y días
  const [newPaymentAmount, setNewPaymentAmount] = useState<number | ''>('');
  const [newDays, setNewDays] = useState<number | ''>('');

  // Bulk Expel
  const [isSelectAll, setIsSelectAll] = useState(false);

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
    setNewPaymentAmount('');
    setNewDays(att.daysAttending);
  };

  const handleUpdateDays = async (attId: string, newVal: number) => {
    const label = newVal === 0 ? 'No lo sé aún' : `${newVal} días`;
    const confirmed = window.confirm(`¿Seguro que quieres cambiar la asistencia a "${label}"?`);
    if (!confirmed) {
      // Revert select back to current by forcing a re-render
      setNewDays((prev) => prev === newVal ? '' : prev);
      return;
    }

    setLoading(`att-${attId}`);
    const res = await updateAttendeeDays(attId, newVal);
    if (res.success) {
      setNewDays(newVal);
    } else {
      alert(res.error || 'Error al actualizar días.');
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

  const handleBulkExpel = async () => {
    if (attendees.length === 0) return;
    const eventId = attendees[0].eventId;
    if (!eventId) return;

    if (window.confirm('🚨 ¿Estás SÚPER SEGURO de que quieres EXPULSAR a todos los asistentes del evento que no sean Administradores? Esta acción es irreversible y solo expulsará a aquellos que NO tengan pagos ni tickets asociados.')) {
      setLoading('bulk-expel');
      const res = await expelAllNonAdminAttendees(eventId);
      if (res.success) {
        alert(`¡Limpieza completada! Se expulsaron ${res.deletedCount} asistentes limpios. Se han conservado ${res.skippedCount} asistentes que tienen pagos o tickets registrados.`);
        setIsSelectAll(false);
      } else {
        alert(res.error || 'Error al expulsar asistentes en lote.');
      }
      setLoading(null);
    }
  };

  return (
    <div className={`glass-panel ${styles.adminPanel}`}>
      {attendees.length === 0 ? (
        <div className={styles.emptyState}>Aún no hay nadie apuntado a este evento.</div>
      ) : (
        <>
          {isAdmin && attendees.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div className={styles.mobileCard} style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input 
                    type="checkbox"
                    checked={isSelectAll}
                    onChange={(e) => setIsSelectAll(e.target.checked)}
                    style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer', flexShrink: 0 }}
                    title="Selección Maestra de Expulsión"
                  />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setIsSelectAll(!isSelectAll)}>
                    Expulsión Masiva
                  </span>
                </div>
                {isSelectAll && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={handleBulkExpel}
                      disabled={loading === 'bulk-expel'}
                      className={`btn ${styles.deleteAttendeeTableBtn}`}
                      style={{ padding: '0.3rem 0.6rem' }}
                      title="Expulsar Todos los Asistentes No Administradores"
                    >
                      {loading === 'bulk-expel' ? '⏳' : <TrashIcon />} Expulsar a todos
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

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
                    <button 
                      onClick={() => isEditing ? setEditingAttendee(null) : startEditing(att)} 
                      className={`btn btn-secondary ${styles.editBtnSmall}`}
                    >
                      {isEditing ? '⬆️' : (isAdmin ? '✏️' : '👁️')}
                    </button>
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
                      {isAdmin && (
                        <div className={styles.actionBox} style={{ marginBottom: '1rem' }}>
                          <div className={styles.actionBoxTitleAlt}>Días de Asistencia</div>
                          <div className={styles.addPaymentRow} style={{ marginTop: '0.25rem', alignItems: 'center' }}>
                            <span className={styles.infoLabel} style={{ minWidth: '40px' }}>Días:</span>
                            <div style={{ flex: 1, maxWidth: '250px' }}>
                              <SelectField
                                value={newDays}
                                onChange={e => handleUpdateDays(att.id, Number(e.target.value))}
                                disabled={isProcessing}
                                containerStyle={{ width: '100%', marginBottom: 0 }}
                                style={{ opacity: isProcessing ? 0.6 : 1 }}
                              >
                                <option value={0}>No lo sé aún</option>
                                {pricingRules.map(r => (
                                  <option key={r.id} value={r.days}>{r.days} días ({r.price}€)</option>
                                ))}
                              </SelectField>
                            </div>
                          </div>
                        </div>
                      )}

                      {att.history && att.history.length > 0 && (
                        <div className={styles.paymentsSection} style={{ marginTop: 0 }}>
                          <div className={styles.paymentsTitle}>Historial de Días</div>
                          <div className={styles.paymentsList}>
                            {att.history.map((h: any) => (
                              <div key={h.id} className={styles.paymentRow}>
                                <span className={styles.paymentDate}>{new Date(h.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} <span style={{fontSize: '0.65rem', opacity: 0.6}}><br/>(por @{h.changedBy?.username || '?'})</span></span>
                                <span className={styles.paymentAmount} style={{ color: 'var(--text-primary)' }}>{h.newDays}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isAdmin && (
                        <div className={styles.actionBox} style={{ marginTop: '1rem' }}>
                          <div className={styles.actionBoxTitleAlt}>Añadir Pago</div>
                          <div className={styles.addPaymentRow}>
                            <span className={styles.infoLabel} style={{ minWidth: '40px' }}>Importe:</span>
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
                      )}

                      <div className={styles.paymentsSection} style={{ marginTop: '0.75rem' }}>
                        <div className={styles.paymentsTitle}>Historial de Pagos</div>
                        <div className={styles.paymentsList}>
                          {att.payments?.map((p: any) => (
                            <div key={p.id} className={styles.paymentRow}>
                              <span className={styles.paymentDate}>{new Date(p.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })} <span style={{fontSize: '0.65rem', opacity: 0.6}}><br/>(por @{p.registeredBy?.username || '?'})</span></span>
                              <span className={styles.paymentAmount}>{p.amount}€</span>
                              {isAdmin && (
                                <button onClick={() => handleDeletePayment(p.id)} className={styles.deletePaymentBtn} disabled={isProcessing} title="Borrar Pago">
                                  <TrashIcon />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        {(!att.payments || att.payments.length === 0) && (
                          <div className={styles.noPayments}>Ningún pago registrado.</div>
                        )}
                      </div>
                      {isAdmin && (
                        <div className={styles.deleteAttendeeContainer}>
                          <button 
                            onClick={() => handleDeleteAttendee(att)} 
                            className={`btn ${styles.deleteAttendeeBtn}`}
                            disabled={isProcessing}
                          >
                            <TrashIcon /> Expulsar Asistente
                          </button>
                        </div>
                      )}
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
                        <span style={{ fontWeight: 'bold' }}>
                          {att.expectedPayment !== null ? `${att.expectedPayment}€` : '0€'}
                        </span>
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
                        {isEditing ? (
                          <div className={styles.desktopActions}>
                            <button 
                              onClick={() => setEditingAttendee(null)} 
                              className={`btn btn-secondary ${styles.manageBtn}`} 
                              style={{ marginBottom: '1rem' }}
                            >
                              ⬆️ Cerrar Panel
                            </button>
                            <div className={styles.actionBox}>
                              {isAdmin && (
                                <>
                                  <div className={styles.actionBoxTitleAlt}>Días de Asistencia</div>
                                  <div className={styles.addPaymentRow} style={{ marginTop: '0.25rem', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                      <SelectField
                                        value={newDays}
                                        onChange={e => setNewDays(Number(e.target.value))}
                                        disabled={isProcessing}
                                        containerStyle={{ width: '100%', marginBottom: 0 }}
                                      >
                                        <option value={0}>No lo sé aún</option>
                                        {pricingRules.map(r => (
                                          <option key={r.id} value={r.days}>{r.days} días ({r.price}€)</option>
                                        ))}
                                      </SelectField>
                                    </div>
                                  </div>
                                </>
                              )}
                              
                            {att.history && att.history.length > 0 && (
                                <div style={{ marginTop: '0.75rem' }}>
                                  <div className={styles.actionBoxTitleAlt}>Historial de Días</div>
                                  <div className={styles.paymentsList}>
                                    {att.history.map((h: any) => (
                                      <div key={h.id} className={styles.paymentRow} style={{ padding: '0.4rem', fontSize: '0.7rem' }}>
                                        <span className={styles.paymentDate}>{new Date(h.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} <span style={{opacity: 0.6}}>(@{h.changedBy?.username || '?'})</span></span>
                                        <span style={{ fontWeight: 'bold' }}>{h.newDays}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className={styles.actionBox}>
                              {isAdmin && (
                                <>
                                  <div className={styles.actionBoxTitleAlt}>Añadir Pago</div>
                                  <div className={styles.addPaymentRow} style={{ marginBottom: '0.75rem' }}>
                                    <span className={styles.infoLabel} style={{ minWidth: '40px' }}>Importe:</span>
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
                                </>
                              )}
                              <div style={{ marginTop: '0.75rem' }}>
                                <div className={styles.actionBoxTitleAlt}>Historial de Pagos</div>
                                <div className={styles.paymentsList}>
                                  {att.payments?.map((p: any) => (
                                    <div key={p.id} className={styles.paymentRow} style={{ padding: '0.4rem', fontSize: '0.7rem' }}>
                                      <span className={styles.paymentDate}>{new Date(p.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} <span style={{opacity: 0.6}}>(@{p.registeredBy?.username || '?'})</span></span>
                                      <span className={styles.paymentAmount}>{p.amount}€</span>
                                      {isAdmin && (
                                        <button onClick={() => handleDeletePayment(p.id)} className={styles.deletePaymentBtn} disabled={isProcessing} title="Borrar Pago">
                                          <TrashIcon />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {(!att.payments || att.payments.length === 0) && (
                                  <div className={styles.noPayments}>Ningún pago.</div>
                                )}
                              </div>
                            </div>
                            {isAdmin && (
                              <div className={styles.deleteAttendeeContainer} style={{ marginTop: "0.25rem" }}>
                                <button 
                                  onClick={() => handleDeleteAttendee(att)} 
                                  className={`btn ${styles.deleteAttendeeTableBtn}`}
                                  disabled={isProcessing}
                                >
                                  <TrashIcon /> Expulsar Asistente
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <button onClick={() => startEditing(att)} className={`btn btn-secondary ${styles.manageBtn}`} title={isAdmin ? "Gestionar Pagos y Cuota" : "Ver Historial"}>
                            {isAdmin ? 'Gestionar Pagos y Cuota' : '👁️ Ver Historial'}
                          </button>
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
