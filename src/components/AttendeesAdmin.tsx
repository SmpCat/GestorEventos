'use client';

import { useState, useEffect } from 'react';
import { updateAttendeeAdmin, addPayment, deletePayment, deleteAttendee } from '@/actions/attendance';
import TrashIcon from './TrashIcon';

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
    if (!window.confirm('¿Borrar este registro de pago?')) return;
    setLoading(`del-pay-${paymentId}`);
    const res = await deletePayment(paymentId);
    if (res.success) {
      alert('Pago eliminado.');
    } else {
      alert(res.error || 'Error al borrar el pago.');
    }
    setLoading(null);
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
  };

  return (
    <div className="glass-panel p-6" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
      {attendees.length === 0 ? (
        <div className="py-8 text-center text-secondary italic">Aún no hay nadie apuntado a este evento.</div>
      ) : (
        <>
          {/* VISTA MÓVIL (Cards) */}
          <div className="desktop-hide flex flex-col gap-4">
            {attendees.map((att: any) => {
              const isEditing = editingAttendee === att.id;
              const isProcessing = loading === `att-${att.id}` || loading === `pay-${att.id}` || loading?.startsWith('del-pay');
              const amountPaid = att.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
              const currentQuota = att.expectedPayment !== null ? att.expectedPayment : 0; 
              const balance = currentQuota - amountPaid;

              return (
                <div key={`mobile-${att.id}`} className="flex flex-col gap-2" style={{ backgroundColor: "rgba(0,0,0,0.3)", padding: "0.75rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex justify-between items-center">
                    <div style={{ fontSize: "0.875rem", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: "0.5rem" }}>
                      {att.user.name} <span className="text-secondary" style={{ fontWeight: "normal" }}>@{att.user.username}</span>
                    </div>
                    {!isEditing && isAdmin && (
                      <button onClick={() => startEditing(att)} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.9rem' }}>✏️</button>
                    )}
                  </div>
                  
                  {!isEditing ? (
                    <div className="flex flex-col gap-2 mt-1" style={{ fontSize: "0.875rem" }}>
                      <div className="flex justify-between">
                        <span className="text-secondary">Cuota Asignada ({att.daysAttending}d):</span>
                        <span className="font-bold">{att.expectedPayment !== null ? `${att.expectedPayment}€` : '??€'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary">Total Pagado:</span>
                        <span className="text-success">{amountPaid}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Pendiente Bote:</span>
                        <span className={`font-bold ${balance > 0 ? 'text-danger' : balance < 0 ? 'text-success' : 'text-secondary'}`}>
                          {balance > 0 ? `${balance}€` : balance < 0 ? `Bote te debe ${Math.abs(balance)}€` : '0€'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.5rem" }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: "bold", color: "var(--accent-warning)", marginBottom: "0.25rem" }}>Ajuste de Cuota</div>
                      <div className="flex flex-col gap-1">
                        <span className="text-secondary" style={{ fontSize: "0.875rem" }}>Cuota de {att.daysAttending} días:</span>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input 
                            type="number" 
                            className="input-field w-full text-center" style={{ fontSize: "0.875rem", padding: "0.25rem" ,  paddingRight: '1.5rem' }}
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value ? Number(e.target.value) : '')}
                            placeholder="Automático"
                          />
                          <span className="text-secondary" style={{ fontWeight: "bold", fontSize: "0.875rem" ,  position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)' }}>€</span>
                        </div>
                      </div>
                      <input 
                        type="text" 
                        className="input-field w-full" style={{ fontSize: "0.875rem", padding: "0.5rem" }} 
                        placeholder="Comentario interno (opcional)..."
                        value={editComment}
                        onChange={e => setEditComment(e.target.value)}
                      />
                      <div className="flex mobile-col gap-2 mt-1">
                        <button onClick={() => saveAttendee(att.id)} className="btn mobile-w-full py-1.5 text-sm font-bold" style={{ backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)' }} disabled={isProcessing}>
                          Guardar Cuota
                        </button>
                      </div>

                      <div className="mt-6" style={{ paddingTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: "bold" ,  marginBottom: '0.35rem' }}>Historial de Pagos</div>
                        <div className="flex flex-col" style={{ gap: '0.35rem' }}>
                          {att.payments?.map((p: any) => (
                            <div key={p.id} className="flex justify-between items-center gap-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                              <span className="text-secondary" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{new Date(p.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}</span>
                              <span className="font-bold flex-1 text-right" style={{ color: 'var(--accent-success)', fontSize: '1rem' }}>+{p.amount}€</span>
                              <button onClick={() => handleDeletePayment(p.id)} style={{ color: 'rgba(255, 255, 255, 0.7)', padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }} disabled={isProcessing} title="Borrar Pago">
                                <TrashIcon />
                              </button>
                            </div>
                          ))}
                        </div>
                        {(!att.payments || att.payments.length === 0) && (
                          <div className="text-secondary" style={{ fontSize: "0.75rem", fontStyle: "italic", marginBottom: "0.5rem" }}>Ningún pago registrado.</div>
                        )}
                        <div className="flex items-center gap-2 mt-6">
                          <span className="text-secondary" style={{ fontSize: "0.875rem" }}>Añadir Pago:</span>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <input 
                              type="number" 
                              className="input-field w-full text-center" style={{ fontSize: "0.875rem", padding: "0.25rem" ,  paddingRight: '1.5rem' }}
                              value={newPaymentAmount}
                              onChange={e => setNewPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                              placeholder="0"
                            />
                            <span className="text-secondary" style={{ fontWeight: "bold", fontSize: "0.875rem" ,  position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)' }}>€</span>
                          </div>
                          <button onClick={() => handleAddPayment(att.id)} className="btn flex items-center justify-center" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', color: '#fff', width: '32px', height: '32px', padding: 0, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '1.25rem', fontWeight: 'bold' }} disabled={isProcessing || newPaymentAmount === ''} title="Añadir Pago">
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-center mt-4">
                        <button 
                          onClick={() => handleDeleteAttendee(att)} 
                          className="btn flex items-center justify-center gap-2 w-full py-2 font-bold" 
                          style={{ backgroundColor: 'transparent', color: 'var(--accent-danger)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                          disabled={isProcessing}
                        >
                          <TrashIcon /> Expulsar Asistente
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {!isEditing && att.adminComment && (
                    <div style={{ fontSize: "0.75rem", padding: "0.375rem", borderRadius: "0.25rem", backgroundColor: "rgba(234, 179, 8, 0.2)", color: "var(--accent-warning)", display: "inline-block", marginTop: "0.25rem" }}>📝 {att.adminComment}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* VISTA ESCRITORIO (Tabla) */}
          <div className="table-wrapper mobile-hide">
            <table className="table">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}>Asistente</th>
                  <th className="text-center" style={{ paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}>Días</th>
                  <th style={{ textAlign: "right", paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}>Cuota Base</th>
                  <th style={{ textAlign: "right", paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}>Pagado</th>
                  <th style={{ textAlign: "right", paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}>Balance</th>
                  <th style={{ paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}>Acciones / Historial</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((att: any) => {
                  const isEditing = editingAttendee === att.id;
                  const isProcessing = loading === `att-${att.id}` || loading === `pay-${att.id}` || loading?.startsWith('del-pay');
                  const amountPaid = att.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
                  const currentQuota = att.expectedPayment !== null ? att.expectedPayment : 0;
                  const balance = currentQuota - amountPaid;

                  return (
                    <tr key={att.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ paddingTop: "0.75rem", paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem", verticalAlign: "top" }}>
                        <strong>{att.user.name}</strong>
                        <br/>
                        <span className="text-secondary" style={{ fontSize: "0.75rem" }}>@{att.user.username}</span>
                        {!isEditing && att.adminComment && (
                          <p style={{ fontSize: "0.75rem", marginTop: "0.25rem", padding: "0.25rem", borderRadius: "0.25rem", backgroundColor: "rgba(234, 179, 8, 0.2)", color: "var(--accent-warning)", display: "inline-block" }}>📝 {att.adminComment}</p>
                        )}
                      </td>
                      <td className="text-center text-secondary" style={{ paddingTop: "0.75rem", paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem", verticalAlign: "top" }}>{att.daysAttending}</td>
                      
                      <td style={{ textAlign: "right", paddingTop: "0.75rem", paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem", verticalAlign: "top" }}>
                        {isEditing ? (
                          <div style={{ position: 'relative', display: 'inline-block', width: '5rem' }}>
                            <input 
                              type="number" 
                              className="input-field w-full" style={{ textAlign: "right", fontSize: "0.875rem" ,  paddingRight: '1.2rem', paddingLeft: '0.2rem' }}
                              value={editPrice}
                              onChange={e => setEditPrice(e.target.value ? Number(e.target.value) : '')}
                              placeholder="Auto"
                            />
                            <span className="text-secondary text-sm" style={{ position: 'absolute', right: '0.25rem', top: '50%', transform: 'translateY(-50%)' }}>€</span>
                          </div>
                        ) : (
                          <span style={{ color: att.adminComment ? 'var(--accent-warning)' : 'inherit', fontWeight: 'bold' }}>
                            {att.expectedPayment !== null ? `${att.expectedPayment}€` : '??'}
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: "right", paddingTop: "0.75rem", paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem", verticalAlign: "top", color: "var(--accent-success)", fontWeight: "bold" }}>
                        {amountPaid > 0 ? `${amountPaid}€` : '-'}
                      </td>

                      <td style={{ textAlign: "right", paddingTop: "0.75rem", paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem", verticalAlign: "top" }}>
                        <span 
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            backgroundColor: balance > 0 ? 'rgba(239, 68, 68, 0.2)' : balance < 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                            color: balance > 0 ? 'var(--accent-danger)' : balance < 0 ? 'var(--accent-success)' : 'var(--text-secondary)',
                            border: balance > 0 ? '1px solid var(--accent-danger)' : balance < 0 ? '1px solid var(--accent-success)' : '1px solid rgba(255,255,255,0.05)'
                          }}
                        >
                          {balance > 0 ? `Debe ${balance}€` : balance < 0 ? `Bote debe ${Math.abs(balance)}€` : 'Pagado'}
                        </span>
                      </td>

                      <td style={{ paddingTop: "0.75rem", paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem", verticalAlign: "top" }}>
                        {isEditing && isAdmin ? (
                          <div className="flex flex-col gap-5" style={{ minWidth: "280px" }}>
                            <div style={{ backgroundColor: "rgba(0,0,0,0.3)", padding: "0.5rem", borderRadius: "0.25rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <div style={{ fontSize: "0.75rem", color: "var(--accent-warning)", marginBottom: "0.25rem" }}>Ajuste Cuota</div>
                              <input 
                                type="text" 
                                className="input-field w-full" style={{ fontSize: "0.75rem", padding: "0.5rem", marginBottom: "0.5rem" }} 
                                placeholder="Comentario (opcional)"
                                value={editComment}
                                onChange={e => setEditComment(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <button onClick={() => saveAttendee(att.id)} className="btn" style={{ paddingLeft: "0.75rem", paddingRight: "0.75rem", fontSize: "0.75rem", fontWeight: "bold" ,  backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)' }} disabled={isProcessing}>
                                  Guardar Cuota
                                </button>
                              </div>
                            </div>
                            
                            <div style={{ backgroundColor: "rgba(0,0,0,0.3)", padding: "0.5rem", borderRadius: "0.25rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: "bold" ,  marginBottom: '0.35rem' }}>Pagos</div>
                              <div className="flex flex-col" style={{ gap: '0.35rem' }}>
                                {att.payments?.map((p: any) => (
                                  <div key={p.id} className="flex justify-between items-center gap-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                                    <span className="text-secondary" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{new Date(p.date).toLocaleDateString('es-ES')}</span>
                                    <span className="font-bold flex-1 text-right" style={{ color: 'var(--accent-success)', fontSize: '1rem' }}>+{p.amount}€</span>
                                    <button onClick={() => handleDeletePayment(p.id)} style={{ color: 'rgba(255, 255, 255, 0.7)', padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }} disabled={isProcessing} title="Borrar Pago">
                                      <TrashIcon />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              {(!att.payments || att.payments.length === 0) && (
                                <div className="text-secondary" style={{ fontSize: "0.75rem", fontStyle: "italic", marginBottom: "0.5rem" }}>Ningún pago.</div>
                              )}
                              <div className="flex items-center gap-2 mt-6">
                                <span className="text-secondary" style={{ fontSize: "0.875rem" }}>Añadir Pago:</span>
                                <div style={{ position: 'relative', flex: 1 }}>
                                  <input 
                                    type="number" 
                                    className="input-field w-full text-center" style={{ fontSize: "0.875rem", padding: "0.25rem" ,  paddingRight: '1.5rem' }}
                                    value={newPaymentAmount}
                                    onChange={e => setNewPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                                    placeholder="0"
                                  />
                                  <span className="text-secondary" style={{ fontWeight: "bold", fontSize: "0.875rem" ,  position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)' }}>€</span>
                                </div>
                                <button onClick={() => handleAddPayment(att.id)} className="btn flex items-center justify-center" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', color: '#fff', width: '32px', height: '32px', padding: 0, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '1.25rem', fontWeight: 'bold' }} disabled={isProcessing || newPaymentAmount === ''} title="Añadir Pago">
                                  +
                                </button>
                              </div>
                            </div>
                            <div className="flex justify-center" style={{ marginTop: "0.75rem" }}>
                              <button 
                                onClick={() => handleDeleteAttendee(att)} 
                                className="btn flex items-center justify-center gap-2 w-full py-1.5 text-xs font-bold" 
                                style={{ backgroundColor: 'transparent', color: 'var(--accent-danger)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                                disabled={isProcessing}
                              >
                                <TrashIcon /> Expulsar Asistente
                              </button>
                            </div>
                          </div>
                        ) : (
                          isAdmin ? (
                            <button onClick={() => startEditing(att)} className="btn btn-secondary w-full" style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}>
                              Gestionar Pagos y Cuota
                            </button>
                          ) : (
                             <div className="text-secondary" style={{ fontSize: "0.75rem" }}>Contacta al admin para cambios</div>
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
