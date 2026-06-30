'use client';

import { useState } from 'react';
import { updateAttendeeAdmin } from '@/actions/attendance';

export default function AttendeesAdmin({ attendees, isAdmin }: { attendees: any[], isAdmin: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);

  // Estados para el editor manual de asistentes
  const [editingAttendee, setEditingAttendee] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editComment, setEditComment] = useState('');
  const [editHasPaid, setEditHasPaid] = useState(false);

  const startEditing = (att: any) => {
    setEditingAttendee(att.id);
    setEditPrice(att.expectedPayment !== null ? att.expectedPayment : '');
    setEditComment(att.adminComment || '');
    setEditHasPaid(att.hasPaid);
  };

  const saveAttendee = async (attId: string) => {
    setLoading(`att-${attId}`);
    const finalPrice = editPrice === '' ? null : Number(editPrice);
    const res = await updateAttendeeAdmin(attId, editHasPaid, finalPrice, editComment);
    if (res.success) {
      setEditingAttendee(null);
    } else {
      alert(res.error);
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
              const isProcessing = loading === `att-${att.id}`;
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
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-black/40 px-2 py-1 rounded"><strong>{att.daysAttending}</strong>d</span>
                      <span className="bg-black/40 px-2 py-1 rounded" style={{ color: att.adminComment ? 'var(--accent-warning)' : 'inherit' }}>
                        <strong>{att.expectedPayment !== null ? `${att.expectedPayment}€` : '??€'}</strong>
                      </span>
                      <span className={`px-2 py-1 rounded ${att.hasPaid ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`} style={{ fontSize: '0.8rem' }}>
                        {att.hasPaid ? '✅ Pagado' : '❌ Pendiente'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Cuota:</span>
                        <input 
                          type="number" 
                          className="input-field text-sm p-1 text-center" 
                          style={{ width: '4rem' }}
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value ? Number(e.target.value) : '')}
                          placeholder="Auto"
                        />
                        <span className="text-sm">€</span>
                        <span className="text-sm ml-2">Pagado:</span>
                        <input 
                          type="checkbox" 
                          checked={editHasPaid}
                          onChange={e => setEditHasPaid(e.target.checked)}
                          style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-success)' }}
                        />
                      </div>
                      <input 
                        type="text" 
                        className="input-field text-sm p-2 w-full" 
                        placeholder="Comentario interno (opcional)..."
                        value={editComment}
                        onChange={e => setEditComment(e.target.value)}
                      />
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => saveAttendee(att.id)} className="btn btn-primary flex-1 py-1.5 text-sm" disabled={isProcessing}>
                          {isProcessing ? '...' : '💾 Guardar'}
                        </button>
                        <button onClick={() => setEditingAttendee(null)} className="btn btn-secondary flex-1 py-1.5 text-sm">
                          Cancelar
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

          {/* VISTA ESCRITORIO (Tabla original) */}
          <div className="mobile-hide overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th className="pb-3 px-2">Usuario</th>
                  <th className="pb-3 px-2 text-center">Días</th>
                  <th className="pb-3 px-2 text-right">Cuota (€)</th>
                  <th className="pb-3 px-2 text-center">Pagado</th>
                  <th className="pb-3 px-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((att: any) => {
                  const isEditing = editingAttendee === att.id;
                  const isProcessing = loading === `att-${att.id}`;

                  return (
                    <tr key={att.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="py-3 px-2">
                        <strong>{att.user.name}</strong>
                        <br/>
                        <span className="text-secondary text-xs">@{att.user.username}</span>
                        {!isEditing && att.adminComment && (
                          <p className="text-xs mt-1 p-1 rounded bg-warning/20 text-warning inline-block">📝 {att.adminComment}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center text-secondary">{att.daysAttending}</td>
                      
                      <td className="py-3 px-2 text-right">
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
                            {att.expectedPayment !== null ? `${att.expectedPayment}€` : 'Pendiente'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-2 text-center">
                        {isEditing ? (
                          <input 
                            type="checkbox" 
                            checked={editHasPaid}
                            onChange={e => setEditHasPaid(e.target.checked)}
                            style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-success)' }}
                          />
                        ) : (
                          <span className={`badge ${att.hasPaid ? 'bg-success/20 text-success border border-success' : 'bg-danger/20 text-danger border border-danger'}`}>
                            {att.hasPaid ? 'SÍ' : 'NO'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-2">
                        {isEditing && isAdmin ? (
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <input 
                              type="text" 
                              className="input-field text-xs p-2" 
                              placeholder="Comentario interno (opcional)"
                              value={editComment}
                              onChange={e => setEditComment(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button onClick={() => setEditingAttendee(null)} className="btn btn-secondary flex-1 py-1 text-xs">Cancelar</button>
                              <button onClick={() => saveAttendee(att.id)} className="btn btn-primary flex-1 py-1 text-xs" disabled={isProcessing}>
                                Guardar
                              </button>
                            </div>
                          </div>
                        ) : (
                          isAdmin ? (
                            <button onClick={() => startEditing(att)} className="btn btn-secondary py-1 px-3 text-xs">
                              Editar Ajustes
                            </button>
                          ) : null
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
