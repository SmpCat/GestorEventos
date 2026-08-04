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
    const validRules = (rules as { days: number, price: number }[]).sort((a, b) => a.days - b.days);
    const res = await savePricingRules(eventId, validRules);
    setLoading(false);
    
    if (!res.success) {
      alert(res.error || 'Error al guardar las tarifas.');
      return;
    }
    setSavedRulesJSON(JSON.stringify(validRules));
    setRules(validRules);
    alert('Tarifas guardadas correctamente y ordenadas por días.');
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
      const validRules = (rules as { days: number, price: number }[]).sort((a, b) => a.days - b.days);
      const res = await savePricingRules(eventId, validRules);
      setLoading(false);
      
      if (!res.success) {
        alert(res.error || 'Error al guardar las tarifas.');
        return;
      }
      setSavedRulesJSON(JSON.stringify(validRules));
      
      // Si todo está correcto y guardado, abrimos una nueva fila vacía con las reglas ya ordenadas
      setRules([...validRules, { days: '', price: '' }]);
    } else {
      // Si no había cambios, simplemente abrimos una nueva fila vacía
      setRules(prev => [...prev, { days: '', price: '' }]);
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
          <div className="flex justify-end mb-4">
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
            <div key={idx} className={styles.ruleRow} style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              {rule.name && (
                <span className="font-bold text-accent" style={{ color: 'var(--accent-primary)', marginRight: '0.5rem' }}>
                  [{rule.name}]
                </span>
              )}
              <span>Si vienes</span>
              {isAdmin ? (
                <input 
                  type="number" 
                  min="1" 
                  placeholder="-"
                  className={`input-field ${styles.daysInput}`}
                  value={rule.days}
                  onChange={e => handleRuleChange(idx, 'days', e.target.value)}
                />
              ) : (
                <strong className={styles.daysValue}>{rule.days}</strong>
              )}
              <span>días ({rule.isMember === true ? 'Socio' : rule.isMember === false ? 'No Socio' : 'Todos'}), pagas</span>
              {isAdmin ? (
                <input 
                  type="number" 
                  min="0" 
                  step="0.5"
                  placeholder="-"
                  className={`input-field ${styles.priceInput}`}
                  value={rule.price}
                  onChange={e => handleRuleChange(idx, 'price', e.target.value)}
                />
              ) : (
                <strong className={styles.priceValue}>{rule.price}</strong>
              )}
              <span>€</span>
              
              <div className={styles.actionContainer}>
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
