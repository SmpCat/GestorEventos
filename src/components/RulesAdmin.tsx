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
          <div className="flex flex-col gap-4 mb-8">
            {/* Fila 1: Título */}
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white">Configurador de Tarifas</h3>
            </div>

            {/* Fila 2: Botón de Cargar Tarifas Peña (Separado con margen inferior) */}
            <div className="mb-2">
              <button
                type="button"
                onClick={handleLoadPenaPreset}
                className="btn text-sm w-full md:w-auto font-semibold"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.08)', 
                  border: '1px solid rgba(255, 255, 255, 0.25)', 
                  color: '#ffffff', 
                  padding: '0.65rem 1.25rem' 
                }}
              >
                Cargar Tarifas Peña (Valdeganga)
              </button>
            </div>
          </div>
        )}

        <div className={styles.rulesList}>
          {rules.length === 0 && <p className={styles.emptyState}>No hay tarifas configuradas.</p>}
          {rules.map((rule: any, idx) => (
            <div 
              key={idx} 
              className="flex flex-col gap-3 p-4 rounded-xl mb-4 shadow-lg transition-all" 
              style={{ 
                background: 'rgba(15, 23, 42, 0.95)', 
                border: '1px solid rgba(255, 255, 255, 0.15)', 
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)' 
              }}
            >
              {/* Cabecera del Card: Identificador de la Tarifa y Botón Borrar Blanco */}
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: 'rgba(255, 255, 255, 0.12)', color: '#ffffff' }}>
                    Tarifa #{idx + 1}
                  </span>
                  <span className="text-xs text-secondary font-medium">
                    {rule.name ? rule.name : `Regla de ${rule.days} días`}
                  </span>
                </div>
                {isAdmin && (
                  <button 
                    type="button"
                    onClick={() => handleRemoveRule(idx)} 
                    className={styles.deleteBtn}
                    title="Borrar Regla"
                    style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#ffffff' }}
                  >
                    <TrashIcon /> <span className="text-xs ml-1 hidden sm:inline text-white">Eliminar</span>
                  </button>
                )}
              </div>
              
              {/* Fila 1: Nombre de la Tarifa (Ancho completo 100%) */}
              <div className="w-full">
                <label className="text-secondary text-xs uppercase font-bold tracking-wider block mb-1">Nombre de la Tarifa</label>
                {isAdmin ? (
                  <input
                    type="text"
                    placeholder="Ej. Socio Adulto 1 día"
                    className="input-field w-full text-sm font-semibold text-white"
                    style={{ boxSizing: 'border-box' }}
                    value={rule.name || ''}
                    onChange={e => handleRuleChange(idx, 'name', e.target.value)}
                  />
                ) : (
                  <span className="font-bold text-white text-base block">{rule.name || 'Tarifa general'}</span>
                )}
              </div>

              {/* Fila 2: Criterios principales (Socio, Edad, Alcohol) - Adaptables en Móvil */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                
                {/* Socio */}
                <div className="w-full">
                  <label className="text-secondary text-xs font-bold block mb-1">¿Socio/a?</label>
                  {isAdmin ? (
                    <select
                      className="input-field w-full text-sm text-white"
                      style={{ padding: '0.45rem 0.5rem', boxSizing: 'border-box' }}
                      value={rule.isMember === true ? 'true' : rule.isMember === false ? 'false' : 'null'}
                      onChange={e => handleRuleChange(idx, 'isMember', e.target.value)}
                    >
                      <option value="null">Todos (Socios y No Socios)</option>
                      <option value="true">Sí (Solo Socios)</option>
                      <option value="false">No (Solo No Socios)</option>
                    </select>
                  ) : (
                    <span className="text-sm font-medium text-white">{rule.isMember === true ? 'Sí (Socio)' : rule.isMember === false ? 'No Socio' : 'Todos'}</span>
                  )}
                </div>

                {/* Tramo Edad */}
                <div className="w-full">
                  <label className="text-secondary text-xs font-bold block mb-1">Tramo de Edad (Años)</label>
                  {isAdmin ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="input-field text-sm text-center text-white"
                        style={{ width: '50%', padding: '0.45rem 0.2rem', boxSizing: 'border-box' }}
                        value={rule.minAge !== null && rule.minAge !== undefined ? rule.minAge : ''}
                        onChange={e => handleRuleChange(idx, 'minAge', e.target.value)}
                      />
                      <span className="text-xs text-secondary">a</span>
                      <input
                        type="number"
                        placeholder="Max"
                        className="input-field text-sm text-center text-white"
                        style={{ width: '50%', padding: '0.45rem 0.2rem', boxSizing: 'border-box' }}
                        value={rule.maxAge !== null && rule.maxAge !== undefined ? rule.maxAge : ''}
                        onChange={e => handleRuleChange(idx, 'maxAge', e.target.value)}
                      />
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-white">
                      {rule.minAge ? `De ${rule.minAge}a` : 'Desde 0'} {rule.maxAge ? `a ${rule.maxAge}a` : 'en adelante'}
                    </span>
                  )}
                </div>

                {/* Alcohol */}
                <div className="w-full">
                  <label className="text-secondary text-xs font-bold block mb-1">Consumo Alcohol</label>
                  {isAdmin ? (
                    <select
                      className="input-field w-full text-sm text-white"
                      style={{ padding: '0.45rem 0.5rem', boxSizing: 'border-box' }}
                      value={rule.drinksAlcohol === true ? 'true' : rule.drinksAlcohol === false ? 'false' : 'null'}
                      onChange={e => handleRuleChange(idx, 'drinksAlcohol', e.target.value)}
                    >
                      <option value="null">Todos</option>
                      <option value="true">Con Alcohol</option>
                      <option value="false">Sin Alcohol</option>
                    </select>
                  ) : (
                    <span className="text-sm font-medium text-white">{rule.drinksAlcohol === true ? 'Con Alcohol' : rule.drinksAlcohol === false ? 'Sin Alcohol' : 'Todos'}</span>
                  )}
                </div>
              </div>

              {/* Fila 3: Días de Asistencia y Cuota (€) en una franja destacada */}
              <div className="flex flex-wrap items-center justify-between gap-3 w-full pt-3 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: '8px' }}>
                
                {/* Días */}
                <div className="flex items-center gap-2">
                  <label className="text-secondary text-xs font-bold">Días de Asistencia:</label>
                  {isAdmin ? (
                    <input 
                      type="number" 
                      min="1" 
                      placeholder="1"
                      className="input-field text-sm text-center font-bold text-white"
                      style={{ width: '70px', padding: '0.35rem 0.2rem' }}
                      value={rule.days}
                      onChange={e => handleRuleChange(idx, 'days', e.target.value)}
                    />
                  ) : (
                    <strong className="text-white text-sm">{rule.days} días</strong>
                  )}
                </div>

                {/* Precio (€) */}
                <div className="flex items-center gap-2">
                  <label className="text-secondary text-xs font-bold">Cuota a Cobrar:</label>
                  {isAdmin ? (
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" 
                        min="0" 
                        step="0.5"
                        placeholder="0"
                        className="input-field text-sm text-center font-bold text-white"
                        style={{ width: '85px', padding: '0.35rem 0.2rem', color: '#ffffff' }}
                        value={rule.price}
                        onChange={e => handleRuleChange(idx, 'price', e.target.value)}
                      />
                      <span className="font-bold text-sm text-white">€</span>
                    </div>
                  ) : (
                    <strong className="text-white text-sm">{rule.price}€</strong>
                  )}
                </div>

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
