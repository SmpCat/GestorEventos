'use client';

import { useState } from 'react';
import { savePricingRules } from '@/actions/attendance';
import TrashIcon from './TrashIcon';
import styles from './RulesAdmin.module.css';

export default function RulesAdmin({ eventId, initialRules = [], isAdmin, inUseDays = [] }: { eventId: string, initialRules: any[], isAdmin: boolean, inUseDays?: number[] }) {
  const [rules, setRules] = useState<{ days: number | '', price: number | '' }[]>(initialRules);
  const [savedRulesJSON, setSavedRulesJSON] = useState<string>(JSON.stringify(initialRules));
  const [loading, setLoading] = useState<boolean>(false);

  const hasChanges = JSON.stringify(rules) !== savedRulesJSON;

  const handleRuleChange = (index: number, field: string, value: any) => {
    const newRules = [...rules] as any[];
    if (field === 'days' || field === 'price' || field === 'minAge' || field === 'maxAge') {
      newRules[index][field] = value === '' ? '' : Number(value);
    } else if (field === 'isMember' || field === 'drinksAlcohol') {
      newRules[index][field] = value === 'null' ? null : value === 'true';
    } else {
      newRules[index][field] = value;
    }
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

  const handleSaveOnly = async () => {
    if (rules.some(r => r.days === '' || r.price === '')) {
      alert('Por favor, rellena la tarifa que tienes a medias (o bórrala) antes de guardar.');
      return;
    }
    if (rules.some(r => Number(r.days) <= 0)) {
      alert('Corrije el error: no se pueden crear tarifas de 0 días.');
      return;
    }

    if (!window.confirm('¿Seguro que quieres guardar estas reglas? Esto podría recalcular las cuotas de los asistentes.')) {
      return;
    }
    
    setLoading(true);
    const validRules = (rules as any[]).sort((a, b) => a.days - b.days);
    const res = await savePricingRules(eventId, validRules);
    setLoading(false);
    
    if (!res.success) {
      alert(res.error || 'Error al guardar las tarifas.');
      return;
    }
    setSavedRulesJSON(JSON.stringify(validRules));
    setRules(validRules);
    alert('Tarifas guardadas correctamente.');
  };

  const handleSaveAndAddRule = async () => {
    if (rules.some(r => r.days === '' || r.price === '')) {
      alert('Por favor, rellena la tarifa que tienes a medias (o bórrala) antes de añadir otra nueva.');
      return;
    }

    if (hasChanges) {
      if (!window.confirm('Se van a guardar los cambios antes de añadir una nueva tarifa. ¿Continuar?')) {
        return;
      }
      setLoading(true);
      const validRules = (rules as any[]).sort((a, b) => a.days - b.days);
      const res = await savePricingRules(eventId, validRules);
      setLoading(false);
      
      if (!res.success) {
        alert(res.error || 'Error al guardar las tarifas.');
        return;
      }
      setSavedRulesJSON(JSON.stringify(validRules));
      setRules([...validRules, { name: '', days: 1, price: 0, isMember: null, minAge: null, maxAge: null, drinksAlcohol: null }]);
    } else {
      setRules(prev => [...prev, { name: '', days: 1, price: 0, isMember: null, minAge: null, maxAge: null, drinksAlcohol: null }]);
    }
  };

  const handleLoadPenaPreset = () => {
    if (window.confirm('¿Quieres cargar la tabla estándar de tarifas de la Peña? Reemplazará las reglas actuales.')) {
      const penaRules: any[] = [
        { name: 'Socio 1 día', days: 1, price: 25, isMember: true, minAge: 18, drinksAlcohol: null },
        { name: 'Socio 2 días', days: 2, price: 45, isMember: true, minAge: 18, drinksAlcohol: null },
        { name: 'Socio 3+ días', days: 3, price: 60, isMember: true, minAge: 18, drinksAlcohol: null },
        { name: 'Socio 14-17 Sin Alcohol', days: 1, price: 15, isMember: true, minAge: 14, maxAge: 17, drinksAlcohol: false },
        { name: 'No Socio 1 día', days: 1, price: 30, isMember: false, minAge: 18, drinksAlcohol: null },
        { name: 'No Socio 2 días', days: 2, price: 50, isMember: false, minAge: 18, drinksAlcohol: null },
        { name: 'No Socio 3+ días', days: 3, price: 70, isMember: false, minAge: 18, drinksAlcohol: null },
        { name: 'No Socio 14-17 Sin Alcohol', days: 1, price: 20, isMember: false, minAge: 14, maxAge: 17, drinksAlcohol: false },
      ];
      setRules(penaRules);
    }
  };

  return (
    <div className={`glass-panel ${styles.adminPanel}`}>
      <div className={styles.innerBlackBox}>
        {isAdmin && (
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Configurador de Tarifas del Evento</h3>
            <button
              type="button"
              onClick={handleLoadPenaPreset}
              className="btn text-sm"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '0.5rem 1rem' }}
            >
              📋 Cargar Tarifas Peña (Valdeganga)
            </button>
          </div>
        )}

        <div className={styles.rulesList}>
          {rules.length === 0 && <p className={styles.emptyState}>No hay tarifas configuradas.</p>}
          {rules.map((rule: any, idx) => (
            <div key={idx} className={styles.ruleRow} style={{ flexWrap: 'wrap', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem' }}>
              
              {/* Nombre de la regla */}
              <div style={{ flex: '1 1 150px' }}>
                <label className="text-secondary text-xs block mb-1">Nombre Tarifa</label>
                {isAdmin ? (
                  <input
                    type="text"
                    placeholder="Ej. Socio Adulto 1 día"
                    className="input-field w-full text-sm"
                    value={rule.name || ''}
                    onChange={e => handleRuleChange(idx, 'name', e.target.value)}
                  />
                ) : (
                  <span className="font-bold text-accent">{rule.name || 'Tarifa general'}</span>
                )}
              </div>

              {/* Socio */}
              <div style={{ flex: '0 1 110px' }}>
                <label className="text-secondary text-xs block mb-1">¿Socio/a?</label>
                {isAdmin ? (
                  <select
                    className="input-field w-full text-sm"
                    value={rule.isMember === true ? 'true' : rule.isMember === false ? 'false' : 'null'}
                    onChange={e => handleRuleChange(idx, 'isMember', e.target.value)}
                  >
                    <option value="null">Todos</option>
                    <option value="true">Sí (Socio)</option>
                    <option value="false">No Socio</option>
                  </select>
                ) : (
                  <span className="text-sm">{rule.isMember === true ? 'Sí' : rule.isMember === false ? 'No' : 'Todos'}</span>
                )}
              </div>

              {/* Edad (Desde / Hasta) */}
              <div style={{ flex: '0 1 120px' }}>
                <label className="text-secondary text-xs block mb-1">Tramo Edad</label>
                {isAdmin ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="Min"
                      className="input-field text-sm w-12"
                      value={rule.minAge !== null && rule.minAge !== undefined ? rule.minAge : ''}
                      onChange={e => handleRuleChange(idx, 'minAge', e.target.value)}
                    />
                    <span className="text-xs text-secondary">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      className="input-field text-sm w-12"
                      value={rule.maxAge !== null && rule.maxAge !== undefined ? rule.maxAge : ''}
                      onChange={e => handleRuleChange(idx, 'maxAge', e.target.value)}
                    />
                  </div>
                ) : (
                  <span className="text-sm">
                    {rule.minAge ? `Desde ${rule.minAge}a` : ''} {rule.maxAge ? `hasta ${rule.maxAge}a` : ''} {!rule.minAge && !rule.maxAge ? 'Cualquiera' : ''}
                  </span>
                )}
              </div>

              {/* Alcohol */}
              <div style={{ flex: '0 1 110px' }}>
                <label className="text-secondary text-xs block mb-1">Alcohol</label>
                {isAdmin ? (
                  <select
                    className="input-field w-full text-sm"
                    value={rule.drinksAlcohol === true ? 'true' : rule.drinksAlcohol === false ? 'false' : 'null'}
                    onChange={e => handleRuleChange(idx, 'drinksAlcohol', e.target.value)}
                  >
                    <option value="null">Todos</option>
                    <option value="true">Con Alcohol</option>
                    <option value="false">Sin Alcohol</option>
                  </select>
                ) : (
                  <span className="text-sm">{rule.drinksAlcohol === true ? 'Con Alcohol' : rule.drinksAlcohol === false ? 'Sin Alcohol' : 'Todos'}</span>
                )}
              </div>

              {/* Días */}
              <div style={{ flex: '0 1 80px' }}>
                <label className="text-secondary text-xs block mb-1">Días</label>
                {isAdmin ? (
                  <input 
                    type="number" 
                    min="1" 
                    placeholder="Días"
                    className="input-field w-full text-sm"
                    value={rule.days}
                    onChange={e => handleRuleChange(idx, 'days', e.target.value)}
                  />
                ) : (
                  <strong className={styles.daysValue}>{rule.days} d</strong>
                )}
              </div>

              {/* Precio */}
              <div style={{ flex: '0 1 90px' }}>
                <label className="text-secondary text-xs block mb-1">Precio (€)</label>
                {isAdmin ? (
                  <input 
                    type="number" 
                    min="0" 
                    step="0.5"
                    placeholder="€"
                    className="input-field w-full text-sm"
                    value={rule.price}
                    onChange={e => handleRuleChange(idx, 'price', e.target.value)}
                  />
                ) : (
                  <strong className={styles.priceValue}>{rule.price}€</strong>
                )}
              </div>

              <div className="flex items-end pb-1">
                {isAdmin && (
                  <button 
                    onClick={() => handleRemoveRule(idx)} 
                    className={styles.deleteBtn}
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
          <div className={styles.actionsFooter}>
            <button 
              onClick={handleSaveAndAddRule} 
              className={`btn ${styles.addBtn}`}
              disabled={loading}
            >
              {loading ? 'Guardando...' : '+ Añadir Tarifa'}
            </button>
            <button 
              onClick={handleSaveOnly} 
              className={`btn ${styles.saveBtn} ${hasChanges ? styles.saveBtnHasChanges : styles.saveBtnNoChanges}`}
              disabled={loading || !hasChanges}
            >
              {loading ? 'Guardando...' : hasChanges ? '⚠️ Guardar Tarifas' : '✅ Guardado'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
