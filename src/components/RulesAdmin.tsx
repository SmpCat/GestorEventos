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
          <div className="flex flex-col gap-3 mb-6">
            {/* Fila 1: Título */}
            <div>
              <h3 className="text-xl font-bold tracking-tight">Configurador de Tarifas</h3>
            </div>

            {/* Fila 2: Botón de Cargar Tarifas Peña */}
            <div>
              <button
                type="button"
                onClick={handleLoadPenaPreset}
                className="btn text-sm w-full md:w-auto"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '0.6rem 1.2rem' }}
              >
                📋 Cargar Tarifas Peña (Valdeganga)
              </button>
            </div>
          </div>
        )}

        <div className={styles.rulesList}>
          {rules.length === 0 && <p className={styles.emptyState}>No hay tarifas configuradas.</p>}
          {rules.map((rule: any, idx) => (
            <div key={idx} className="flex flex-col gap-3 p-4 rounded-xl mb-3" style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              
              {/* Fila 1 del item: Nombre Tarifa que ocupe una sola fila completa */}
              <div className="w-full">
                <label className="text-secondary text-xs uppercase font-bold tracking-wider block mb-1">Nombre Tarifa</label>
                {isAdmin ? (
                  <input
                    type="text"
                    placeholder="Ej. Socio Adulto 1 día"
                    className="input-field w-full text-sm font-semibold"
                    value={rule.name || ''}
                    onChange={e => handleRuleChange(idx, 'name', e.target.value)}
                  />
                ) : (
                  <span className="font-bold text-accent text-base">{rule.name || 'Tarifa general'}</span>
                )}
              </div>

              {/* Fila 2 del item: Resto de campos ordenados con visibilidad perfecta */}
              <div className="flex flex-wrap items-end gap-3 w-full pt-1">
                
                {/* Socio */}
                <div style={{ flex: '1 1 130px', minWidth: '130px' }}>
                  <label className="text-secondary text-xs font-bold block mb-1">¿Socio/a?</label>
                  {isAdmin ? (
                    <select
                      className="input-field w-full text-sm"
                      style={{ padding: '0.4rem 0.5rem' }}
                      value={rule.isMember === true ? 'true' : rule.isMember === false ? 'false' : 'null'}
                      onChange={e => handleRuleChange(idx, 'isMember', e.target.value)}
                    >
                      <option value="null">Todos</option>
                      <option value="true">Sí (Socio)</option>
                      <option value="false">No Socio</option>
                    </select>
                  ) : (
                    <span className="text-sm font-medium">{rule.isMember === true ? 'Sí (Socio)' : rule.isMember === false ? 'No Socio' : 'Todos'}</span>
                  )}
                </div>

                {/* Tramo Edad */}
                <div style={{ flex: '1 1 140px', minWidth: '140px' }}>
                  <label className="text-secondary text-xs font-bold block mb-1">Tramo Edad</label>
                  {isAdmin ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        placeholder="Min"
                        className="input-field text-sm text-center"
                        style={{ width: '48%', padding: '0.4rem 0.2rem' }}
                        value={rule.minAge !== null && rule.minAge !== undefined ? rule.minAge : ''}
                        onChange={e => handleRuleChange(idx, 'minAge', e.target.value)}
                      />
                      <span className="text-xs text-secondary">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        className="input-field text-sm text-center"
                        style={{ width: '48%', padding: '0.4rem 0.2rem' }}
                        value={rule.maxAge !== null && rule.maxAge !== undefined ? rule.maxAge : ''}
                        onChange={e => handleRuleChange(idx, 'maxAge', e.target.value)}
                      />
                    </div>
                  ) : (
                    <span className="text-sm font-medium">
                      {rule.minAge ? `De ${rule.minAge}a` : ''} {rule.maxAge ? `a ${rule.maxAge}a` : ''} {!rule.minAge && !rule.maxAge ? 'Cualquiera' : ''}
                    </span>
                  )}
                </div>

                {/* Alcohol */}
                <div style={{ flex: '1 1 140px', minWidth: '140px' }}>
                  <label className="text-secondary text-xs font-bold block mb-1">Alcohol</label>
                  {isAdmin ? (
                    <select
                      className="input-field w-full text-sm"
                      style={{ padding: '0.4rem 0.5rem' }}
                      value={rule.drinksAlcohol === true ? 'true' : rule.drinksAlcohol === false ? 'false' : 'null'}
                      onChange={e => handleRuleChange(idx, 'drinksAlcohol', e.target.value)}
                    >
                      <option value="null">Todos</option>
                      <option value="true">Con Alcohol</option>
                      <option value="false">Sin Alcohol</option>
                    </select>
                  ) : (
                    <span className="text-sm font-medium">{rule.drinksAlcohol === true ? 'Con Alcohol' : rule.drinksAlcohol === false ? 'Sin Alcohol' : 'Todos'}</span>
                  )}
                </div>

                {/* Días */}
                <div style={{ flex: '0 1 80px', minWidth: '70px' }}>
                  <label className="text-secondary text-xs font-bold block mb-1">Días</label>
                  {isAdmin ? (
                    <input 
                      type="number" 
                      min="1" 
                      placeholder="1"
                      className="input-field w-full text-sm text-center"
                      style={{ padding: '0.4rem 0.2rem' }}
                      value={rule.days}
                      onChange={e => handleRuleChange(idx, 'days', e.target.value)}
                    />
                  ) : (
                    <strong className={styles.daysValue}>{rule.days} d</strong>
                  )}
                </div>

                {/* Precio (€) */}
                <div style={{ flex: '0 1 90px', minWidth: '80px' }}>
                  <label className="text-secondary text-xs font-bold block mb-1">Precio (€)</label>
                  {isAdmin ? (
                    <input 
                      type="number" 
                      min="0" 
                      step="0.5"
                      placeholder="0"
                      className="input-field w-full text-sm text-center font-bold"
                      style={{ padding: '0.4rem 0.2rem' }}
                      value={rule.price}
                      onChange={e => handleRuleChange(idx, 'price', e.target.value)}
                    />
                  ) : (
                    <strong className={styles.priceValue}>{rule.price}€</strong>
                  )}
                </div>

                {/* Botón Borrar */}
                {isAdmin && (
                  <div className="flex items-center justify-end pb-1 ml-auto">
                    <button 
                      onClick={() => handleRemoveRule(idx)} 
                      className={styles.deleteBtn}
                      title="Borrar Regla"
                    >
                      <TrashIcon />
                    </button>
                  </div>
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
