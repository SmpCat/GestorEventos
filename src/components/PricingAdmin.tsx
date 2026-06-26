'use client';

import { useState } from 'react';
import { savePricingRules, updateAttendeeAdmin } from '@/actions/attendance';

export default function PricingAdmin({ eventId, initialRules, attendees, isAdmin }: { eventId: string, initialRules: any[], attendees: any[], isAdmin: boolean }) {
  const [rules, setRules] = useState<{ days: number, price: number }[]>(initialRules);
  const [loading, setLoading] = useState<string | null>(null);

  // Estados para el editor manual de asistentes
  const [editingAttendee, setEditingAttendee] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editComment, setEditComment] = useState('');
  const [editHasPaid, setEditHasPaid] = useState(false);

  const handleAddRule = () => {
    setRules([...rules, { days: 1, price: 0 }]);
  };

  const handleRuleChange = (index: number, field: 'days' | 'price', value: number) => {
    const newRules = [...rules];
    newRules[index][field] = value;
    setRules(newRules);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSaveRules = async () => {
    setLoading('rules');
    const res = await savePricingRules(eventId, rules);
    if (!res.success) alert(res.error);
    else alert('Tarifas guardadas correctamente.');
    setLoading(null);
  };

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
    <div className="flex flex-col gap-8">
      
      {/* SECCIÓN 1: TABLA DE PRECIOS */}
      <div className="glass-panel p-6">
        <h2 className="mb-2" style={{ color: 'var(--accent-primary)' }}>1. Configurar Tarifas</h2>
        <p className="text-secondary mb-6 text-sm">Define cuánto cuesta el evento según los días de asistencia. Si un usuario elige una cantidad de días que no está aquí, se le aplicará la tarifa más alta por seguridad.</p>
        
        <div className="flex flex-col gap-3 mb-4">
          {rules.length === 0 && <p className="text-secondary italic">No hay tarifas configuradas.</p>}
          {rules.map((rule, idx) => (
            <div key={idx} className="flex gap-4 items-center bg-black/20 p-3 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex-1 flex items-center gap-2">
                <label className="text-sm">Si viene</label>
                {isAdmin ? (
                  <input 
                    type="number" 
                    min="1" 
                    className="input-field w-20 text-center" 
                    value={rule.days}
                    onChange={e => handleRuleChange(idx, 'days', Number(e.target.value))}
                  />
                ) : (
                  <strong className="w-20 text-center">{rule.days}</strong>
                )}
                <label className="text-sm">días,</label>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <label className="text-sm">paga</label>
                {isAdmin ? (
                  <input 
                    type="number" 
                    min="0" 
                    step="0.5"
                    className="input-field w-24 text-right" 
                    value={rule.price}
                    onChange={e => handleRuleChange(idx, 'price', Number(e.target.value))}
                  />
                ) : (
                  <strong className="w-24 text-right text-success">{rule.price}</strong>
                )}
                <label className="text-sm">€</label>
              </div>
              {isAdmin && (
                <button onClick={() => handleRemoveRule(idx)} className="btn btn-danger px-3 py-1 text-sm">✖</button>
              )}
            </div>
          ))}
        </div>

        {isAdmin && (
          <div className="flex gap-4">
            <button onClick={handleAddRule} className="btn btn-secondary flex-1">
              + Añadir Regla de Precio
            </button>
            <button onClick={handleSaveRules} className="btn btn-primary flex-1" disabled={loading === 'rules'}>
              {loading === 'rules' ? 'Guardando...' : '💾 Guardar Tarifas'}
            </button>
          </div>
        )}
      </div>

      {/* SECCIÓN 2: CONTROL DE ASISTENTES */}
      <div className="glass-panel p-6" style={{ borderColor: isAdmin ? 'var(--accent-warning)' : 'rgba(255,255,255,0.1)' }}>
        <h2 className="mb-2" style={{ color: isAdmin ? 'var(--accent-warning)' : 'inherit' }}>{isAdmin ? '2. Control de Asistentes y Pagos' : '2. Lista de Asistentes'}</h2>
        <p className="text-secondary mb-6 text-sm">{isAdmin ? 'Lista de usuarios apuntados a este evento. Aquí puedes registrar si ya han pagado y forzar precios personalizados en casos especiales.' : 'Consulta quién se ha apuntado ya a la fiesta.'}</p>

        <div className="overflow-x-auto">
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
              {attendees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-secondary italic">Aún no hay nadie apuntado a este evento.</td>
                </tr>
              ) : attendees.map((att: any) => {
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
      </div>

    </div>
  );
}
