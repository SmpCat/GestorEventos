'use client';

import { useState } from 'react';
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

  const handleDeleteAttendee = async (attId: string) => {
    if (!window.confirm('🚨 ¿ESTÁS COMPLETAMENTE SEGURO? Esta acción expulsará a esta persona del evento y borrará todos sus pagos registrados. No se puede deshacer.')) return;
    
    setLoading(`del-att-${attId}`);
    const res = await deleteAttendee(attId);
    if (res.success) {
      alert('Asistente expulsado del evento correctamente.');
      setEditingAttendee(null);
    } else {
      alert(res.error || 'Error al eliminar el asistente.');
    }
    setLoading(null);
  };

  return (
    <div className="glass-panel p-6" style={{ borderColor: isAdmin ? 'var(--accent-warning)' : 'rgba(255,255,255,0.1)' }}>
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
                <div key={`mobile-${att.id}`} className="bg-black/30 p-3 rounded-lg border flex flex-col gap-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-bold truncate pr-2">
                      {att.user.name} <span className="text-secondary font-normal">@{att.user.username}</span>
                    </div>
                    {!isEditing && isAdmin && (
                      <button onClick={() => startEditing(att)} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.9rem' }}>✏️</button>
                    )}
                  </div>
                  
                  {!isEditing ? (
                    <div className="flex flex-col gap-2 text-sm mt-1">
                      <div className="flex justify-between">
                        <span className="text-secondary">Cuota Asignada ({att.daysAttending}d):</span>
                        <span className="font-bold">{att.expectedPayment !== null ? `${att.expectedPayment}€` : '??€'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary">Total Pagado:</span>
                        <span className="text-success">{amountPaid}€</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                        <span className="font-bold">Pendiente Bote:</span>
                        <span className={`font-bold ${balance > 0 ? 'text-danger' : balance < 0 ? 'text-success' : 'text-secondary'}`}>
                          {balance > 0 ? `${balance}€` : balance < 0 ? `Bote te debe ${Math.abs(balance)}€` : '0€'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 mt-2 border-t border-white/10 pt-2">
                      <div className="text-sm font-bold text-warning mb-1">Ajuste de Cuota</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-secondary">Fijar Cuota (€):</span>
                        <input 
                          type="number" 
                          className="input-field text-sm p-1 text-center flex-1" 
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value ? Number(e.target.value) : '')}
                          placeholder="Automático"
                        />
                      </div>
                      <input 
                        type="text" 
                        className="input-field text-sm p-2 w-full" 
                        placeholder="Comentario interno (opcional)..."
                        value={editComment}
                        onChange={e => setEditComment(e.target.value)}
                      />
                      <div className="flex mobile-col gap-2 mt-1">
                        <button onClick={() => saveAttendee(att.id)} className="btn btn-primary mobile-w-full py-1.5 text-sm" disabled={isProcessing}>
                          💾 Guardar Cuota
                        </button>
                      </div>

                      <div className="mt-6 pt-5 border-t border-white/10">
                        <div className="text-sm font-bold text-success mb-4">Historial de Pagos</div>
                        <div className="flex flex-col gap-10">
                          {att.payments?.map((p: any) => (
                            <div key={p.id} className="flex justify-between items-center gap-4 text-xs bg-black/40 py-3 px-3 rounded">
                              <span className="text-secondary truncate">{new Date(p.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}</span>
                              <span className="font-bold text-success flex-1 text-right text-base">+{p.amount}€</span>
                              <button onClick={() => handleDeletePayment(p.id)} className="text-red-400/70 hover:text-red-400 transition-colors flex-none p-2" disabled={isProcessing} title="Borrar Pago">
                                <TrashIcon />
                              </button>
                            </div>
                          ))}
                        </div>
                        {(!att.payments || att.payments.length === 0) && (
                          <div className="text-xs text-secondary italic mb-2">Ningún pago registrado.</div>
                        )}
                        <div className="mt-6 flex items-center gap-2">
                          <span className="text-sm text-secondary">Añadir Pago (€):</span>
                          <input 
                            type="number" 
                            className="input-field text-sm p-1 text-center flex-1" 
                            value={newPaymentAmount}
                            onChange={e => setNewPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                            placeholder="0"
                          />
                          <button onClick={() => handleAddPayment(att.id)} className="btn btn-secondary py-1 px-4 text-sm whitespace-nowrap" disabled={isProcessing || newPaymentAmount === ''}>
                            + Pago
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-center">
                        <button 
                          onClick={() => handleDeleteAttendee(att.id)} 
                          className="btn flex items-center justify-center gap-2 w-full py-2 font-bold" 
                          style={{ backgroundColor: 'var(--accent-danger)', color: '#fff', borderColor: 'var(--accent-danger)' }}
                          disabled={isProcessing}
                        >
                          <TrashIcon /> Expulsar Asistente
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {!isEditing && att.adminComment && (
                    <div className="text-xs p-1.5 rounded bg-warning/20 text-warning inline-block mt-1">📝 {att.adminComment}</div>
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
                  <th className="pb-3 px-2">Asistente</th>
                  <th className="pb-3 px-2 text-center">Días</th>
                  <th className="pb-3 px-2 text-right">Cuota Base</th>
                  <th className="pb-3 px-2 text-right">Pagado</th>
                  <th className="pb-3 px-2 text-right">Balance</th>
                  <th className="pb-3 px-2">Acciones / Historial</th>
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
                      <td className="py-3 px-2 align-top">
                        <strong>{att.user.name}</strong>
                        <br/>
                        <span className="text-secondary text-xs">@{att.user.username}</span>
                        {!isEditing && att.adminComment && (
                          <p className="text-xs mt-1 p-1 rounded bg-warning/20 text-warning inline-block">📝 {att.adminComment}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center text-secondary align-top">{att.daysAttending}</td>
                      
                      <td className="py-3 px-2 text-right align-top">
                        {isEditing ? (
                          <input 
                            type="number" 
                            className="input-field w-20 text-right text-sm" 
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value ? Number(e.target.value) : '')}
                            placeholder="Auto"
                          />
                        ) : (
                          <span style={{ color: att.adminComment ? 'var(--accent-warning)' : 'inherit', fontWeight: 'bold' }}>
                            {att.expectedPayment !== null ? `${att.expectedPayment}€` : '??'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-2 text-right align-top text-success font-bold">
                        {amountPaid > 0 ? `${amountPaid}€` : '-'}
                      </td>

                      <td className="py-3 px-2 text-right align-top">
                        <span className={`badge ${balance > 0 ? 'bg-danger/20 text-danger border border-danger' : balance < 0 ? 'bg-success/20 text-success border border-success' : 'bg-black/40 text-secondary border border-white/10'}`}>
                          {balance > 0 ? `Debe ${balance}€` : balance < 0 ? `Bote debe ${Math.abs(balance)}€` : 'Pagado'}
                        </span>
                      </td>

                      <td className="py-3 px-2 align-top">
                        {isEditing && isAdmin ? (
                          <div className="flex flex-col gap-5 min-w-[280px]">
                            <div className="bg-black/30 p-2 rounded border border-white/5">
                              <div className="text-xs text-warning mb-1">Ajuste Cuota</div>
                              <input 
                                type="text" 
                                className="input-field text-xs p-2 mb-2 w-full" 
                                placeholder="Comentario (opcional)"
                                value={editComment}
                                onChange={e => setEditComment(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <button onClick={() => saveAttendee(att.id)} className="btn btn-primary w-full py-1 text-xs" disabled={isProcessing}>
                                  Guardar Cuota
                                </button>
                              </div>
                            </div>
                            
                            <div className="bg-black/30 p-2 rounded border border-white/5">
                              <div className="text-xs text-success mb-4">Pagos</div>
                              <div className="flex flex-col gap-10">
                                {att.payments?.map((p: any) => (
                                  <div key={p.id} className="flex justify-between items-center gap-4 text-xs bg-black/40 py-3 px-3 rounded">
                                    <span className="text-secondary truncate">{new Date(p.date).toLocaleDateString('es-ES')}</span>
                                    <span className="font-bold text-success flex-1 text-right text-base">+{p.amount}€</span>
                                    <button onClick={() => handleDeletePayment(p.id)} className="text-red-400/70 hover:text-red-400 transition-colors flex-none p-2" disabled={isProcessing} title="Borrar Pago">
                                      <TrashIcon />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              {(!att.payments || att.payments.length === 0) && (
                                <div className="text-xs text-secondary italic mb-2">Ningún pago.</div>
                              )}
                              <div className="mt-6 flex items-center gap-2">
                                <span className="text-sm text-secondary">Añadir Pago (€):</span>
                                <input 
                                  type="number" 
                                  className="input-field text-sm p-1 text-center flex-1" 
                                  value={newPaymentAmount}
                                  onChange={e => setNewPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                                  placeholder="0"
                                />
                                <button onClick={() => handleAddPayment(att.id)} className="btn btn-secondary py-1 px-4 text-sm whitespace-nowrap" disabled={isProcessing || newPaymentAmount === ''}>
                                  + Pago
                                </button>
                              </div>
                            </div>
                            <div className="mt-3 flex justify-center">
                              <button 
                                onClick={() => handleDeleteAttendee(att.id)} 
                                className="btn flex items-center justify-center gap-2 w-full py-1.5 text-xs font-bold" 
                                style={{ backgroundColor: 'var(--accent-danger)', color: '#fff', borderColor: 'var(--accent-danger)' }}
                                disabled={isProcessing}
                              >
                                <TrashIcon /> Expulsar Asistente
                              </button>
                            </div>
                          </div>
                        ) : (
                          isAdmin ? (
                            <button onClick={() => startEditing(att)} className="btn btn-secondary py-1 px-3 text-xs w-full">
                              Gestionar Pagos y Cuota
                            </button>
                          ) : (
                             <div className="text-xs text-secondary">Contacta al admin para cambios</div>
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
