'use client';

import { useState } from 'react';
import { joinEvent } from '@/actions/attendance';
import styles from './JoinEventBanner.module.css';

export default function JoinEventBanner({ eventId, eventName, pricingRules, userId }: { eventId: string, eventName: string, pricingRules: any[], userId: string }) {
  const [days, setDays] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  // Calcular precio estimado en vivo
  let estimatedPrice: number | null = null;
  if (days !== '') {
    const d = Number(days);
    const exactRule = pricingRules.find(r => r.days === d);
    if (exactRule) {
      estimatedPrice = exactRule.price;
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!days) return;
    
    setLoading(true);
    const res = await joinEvent(eventId, userId, Number(days));
    if (!res.success) {
      alert(res.error);
      setLoading(false);
    }
    // El servidor recargará automáticamente la página por el revalidatePath
  };

  return (
    <div className={`glass-panel ${styles.bannerContainer}`}>
      <h2>¡Únete a la Fiesta!</h2>
      <p className={`subtitle ${styles.bannerSubtitle}`}>El evento <strong>{eventName}</strong> ya está operativo.</p>
      <p className={`subtitle ${styles.bannerSubtitleLast}`}>Para poder subir tickets de gasto o ver la lista de la compra, primero dinos cuántos días vas a venir.</p>

      <form onSubmit={handleJoin} className={styles.bannerForm}>
        <div className={`input-group ${styles.bannerInputGroup}`}>
          <label className="input-label">¿Cuántos días vas a asistir?</label>
          <input 
            type="number" 
            min="1" 
            className={`input-field ${styles.bannerInputField}`} 
            placeholder="Ej: 3"
            value={days}
            onChange={e => setDays(e.target.value ? Number(e.target.value) : '')}
            required
          />
        </div>

        {days !== '' && (
          <div className={styles.bannerEstimateBox}>
            {estimatedPrice !== null ? (
              <>
                <p className={styles.bannerEstimateLabel}>Tu cuota estimada será de:</p>
                <p className={styles.bannerEstimateValue}>{estimatedPrice}€</p>
              </>
            ) : (
              <p className={styles.bannerEstimateError}>⚠️ No hay tarifa configurada para {days} días. No podrás apuntarte. Contacta con el administrador.</p>
            )}
          </div>
        )}

        <button type="submit" className={`btn btn-primary ${styles.bannerSubmitBtn}`} disabled={loading || !days || estimatedPrice === null}>
          {loading ? 'Apuntándote...' : '¡Me apunto!'}
        </button>
      </form>
    </div>
  );
}
