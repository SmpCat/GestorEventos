'use client';

import { useState } from 'react';
import { savePricingRules } from '@/actions/attendance';
import TrashIcon from './TrashIcon';

export default function RulesAdmin({ eventId, initialRules = [], isAdmin, inUseDays = [] }: { eventId: string, initialRules: any[], isAdmin: boolean, inUseDays?: number[] }) {
  const [rules, setRules] = useState<{ days: number | '', price: number | '' }[]>(initialRules);
  const [savedRulesJSON, setSavedRulesJSON] = useState<string>(JSON.stringify(initialRules));
  const [loading, setLoading] = useState<boolean>(false);

  const hasChanges = JSON.stringify(rules) !== savedRulesJSON;

  const handleRuleChange = (index: number, field: 'days' | 'price', value: string) => {
    const newRules = [...rules];
    newRules[index][field] = value === '' ? '' : Number(value);
    setRules(newRules);
  };

  const handleRemoveRule = (index: number) => {
    const ruleToDelete = rules[index];
    if (ruleToDelete.days !== '' && inUseDays.includes(Number(ruleToDelete.days))) {
      alert(`No puedes borrar la tarifa de ${ruleToDelete.days} días porque hay asistentes apuntados a ella. Cambia la tarifa de esas personas primero.`);
      return;
    }

    if (window.confirm('¿Seguro que quieres borrar esta regla de precio?')) {
      setRules(rules.filter((_, i) => i !== index));
    }
  };

  const handleSaveAndAddRule = async () => {
    // Validar que las reglas actuales están completas
    if (rules.some(r => r.days === '' || r.price === '')) {
      alert('Por favor, rellena la tarifa que tienes a medias (o bórrala) antes de añadir otra nueva.');
      return;
    }
    if (rules.some(r => Number(r.days) <= 0)) {
      alert('Corrije el error: no se pueden crear tarifas de 0 días.');
      return;
    }

    // Si hay cambios sin guardar, guardarlos primero en base de datos
    if (hasChanges) {
      if (!window.confirm('Se van a guardar los cambios antes de añadir una nueva tarifa. ¿Continuar?')) {
        return;
      }
      setLoading(true);
      const validRules = rules as { days: number, price: number }[];
      const res = await savePricingRules(eventId, validRules);
      setLoading(false);
      
      if (!res.success) {
        alert(res.error || 'Error al guardar las tarifas.');
        return; // Detenemos la ejecución, no abrimos la nueva fila
      }
      setSavedRulesJSON(JSON.stringify(validRules));
    }

    // Si todo está correcto y guardado (o no había cambios), abrimos una nueva fila vacía
    setRules(prev => [...prev, { days: '', price: '' }]);
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
                placeholder="-"
                className="input-field text-center" 
                style={{ width: '3rem', padding: '0.4rem 0.1rem', borderBottom: '2px solid rgba(255,255,255,0.3)' }}
                value={rule.days}
                onChange={e => handleRuleChange(idx, 'days', e.target.value)}
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
                placeholder="-"
                className="input-field text-center" 
                style={{ width: '3.5rem', padding: '0.4rem 0.2rem', borderBottom: '2px solid rgba(255,255,255,0.3)' }}
                value={rule.price}
                onChange={e => handleRuleChange(idx, 'price', e.target.value)}
              />
            ) : (
              <strong className="text-center text-success" style={{ width: '3rem' }}>{rule.price}</strong>
            )}
            <span>€</span>
            
            <div className="flex justify-end" style={{ marginLeft: 'auto', marginRight: '-0.6rem' }}>
              {isAdmin && (
                <button 
                  onClick={() => handleRemoveRule(idx)} 
                  className="text-red-400/70 hover:text-red-400 transition-colors bg-transparent border-none outline-none p-1 flex items-center justify-center"
                  title="Borrar Regla"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="flex mobile-col gap-4">
          <button 
            onClick={handleSaveAndAddRule} 
            className="btn btn-secondary mobile-w-full py-3" 
            disabled={loading}
          >
            {loading ? 'Guardando...' : '+ Añadir Regla de Precio'}
          </button>
        </div>
      )}
    </div>
  );
}
