'use client';

import { useState } from 'react';
import { savePricingRules } from '@/actions/attendance';

export default function RulesAdmin({ eventId, initialRules, isAdmin }: { eventId: string, initialRules: any[], isAdmin: boolean }) {
  const [rules, setRules] = useState<{ days: number, price: number }[]>(initialRules);
  const [savedRulesJSON, setSavedRulesJSON] = useState<string>(JSON.stringify(initialRules));
  const [loading, setLoading] = useState<boolean>(false);

  const hasChanges = JSON.stringify(rules) !== savedRulesJSON;

  const handleAddRule = () => {
    const nextDays = rules.length > 0 ? Math.max(...rules.map(r => r.days)) + 1 : 1;
    setRules([...rules, { days: nextDays, price: 0 }]);
  };

  const handleRuleChange = (index: number, field: 'days' | 'price', value: number) => {
    const newRules = [...rules];
    newRules[index][field] = value;
    setRules(newRules);
  };

  const handleRemoveRule = (index: number) => {
    if (window.confirm('¿Seguro que quieres borrar esta regla de precio?')) {
      setRules(rules.filter((_, i) => i !== index));
    }
  };

  const handleSaveRules = async () => {
    if (!window.confirm('¿Seguro que quieres guardar estas reglas? Esto podría recalcular las cuotas de los asistentes.')) {
      return;
    }
    setLoading(true);
    const res = await savePricingRules(eventId, rules);
    if (!res.success) {
      alert(res.error);
    } else {
      setSavedRulesJSON(JSON.stringify(rules));
      alert('Tarifas guardadas correctamente.');
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex flex-col gap-3 mb-4">
        {rules.length === 0 && <p className="text-secondary italic">No hay tarifas configuradas.</p>}
        {rules.map((rule, idx) => (
          <div key={idx} className="flex gap-1 md:gap-3 items-center bg-black/20 p-2 md:p-3 rounded-lg text-sm md:text-base" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
            <span>Si vienes</span>
            {isAdmin ? (
              <input 
                type="number" 
                min="1" 
                className="input-field text-center" 
                style={{ width: '2.5rem', padding: '0.4rem 0.1rem' }}
                value={rule.days}
                onChange={e => handleRuleChange(idx, 'days', Number(e.target.value))}
              />
            ) : (
              <strong className="text-center" style={{ width: '2rem' }}>{rule.days}</strong>
            )}
            <span>días, pagas</span>
            {isAdmin ? (
              <input 
                type="number" 
                min="0" 
                step="0.5"
                className="input-field text-center" 
                style={{ width: '2.5rem', padding: '0.4rem 0.2rem' }}
                value={rule.price}
                onChange={e => handleRuleChange(idx, 'price', Number(e.target.value))}
              />
            ) : (
              <strong className="text-center text-success" style={{ width: '3rem' }}>{rule.price}</strong>
            )}
            <span>€</span>
            
            <div className="flex justify-end" style={{ marginLeft: 'auto', marginRight: '-0.6rem' }}>
              {isAdmin && (
                <button 
                  onClick={() => handleRemoveRule(idx)} 
                  style={{ color: 'var(--accent-danger)', background: 'transparent', border: 'none', padding: '0 0.2rem', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' }}
                  title="Borrar Regla"
                >
                  X
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="flex mobile-col gap-4">
          <button onClick={handleAddRule} className="btn btn-secondary flex-1 py-3">
            + Añadir Regla de Precio
          </button>
          <button 
            onClick={handleSaveRules} 
            className={`btn flex-1 py-3 ${hasChanges ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ opacity: hasChanges ? 1 : 0.5 }}
            disabled={loading || !hasChanges}
          >
            {loading ? 'Guardando...' : hasChanges ? '⚠️ Guardar Tarifas' : '✅ Guardado'}
          </button>
        </div>
      )}
    </div>
  );
}
