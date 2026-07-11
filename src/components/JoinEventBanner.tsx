'use client';

import { useState } from 'react';
import { joinEvent } from '@/actions/attendance';

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
    <div className="glass-panel text-center p-8 mt-6" style={{ borderColor: 'var(--accent-primary)', boxShadow: '0 0 30px rgba(99, 102, 241, 0.2)' }}>
      <h2>¡Únete a la Fiesta!</h2>
      <p className="subtitle mb-2">El evento <strong>{eventName}</strong> ya está operativo.</p>
      <p className="subtitle mb-8">Para poder subir tickets de gasto o ver la lista de la compra, primero dinos cuántos días vas a venir.</p>

      <form onSubmit={handleJoin} className="max-w-sm mx-auto flex flex-col gap-6">
        <div className="input-group text-left">
          <label className="input-label">¿Cuántos días vas a asistir?</label>
          <input 
            type="number" 
            min="1" 
            className="input-field text-center text-xl" 
            placeholder="Ej: 3"
            value={days}
            onChange={e => setDays(e.target.value ? Number(e.target.value) : '')}
            required
          />
        </div>

        {days !== '' && (
          <div className="p-4 bg-black/20 rounded-lg border border-white/5">
            {estimatedPrice !== null ? (
              <>
                <p className="text-secondary text-sm">Tu cuota estimada será de:</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-success)' }}>{estimatedPrice}€</p>
              </>
            ) : (
              <p className="text-red-400 font-bold text-sm">⚠️ No hay tarifa configurada para {days} días. No podrás apuntarte. Contacta con el administrador.</p>
            )}
          </div>
        )}

        <button type="submit" className="btn btn-primary mobile-w-full py-4 text-xl mt-2" disabled={loading || !days || estimatedPrice === null}>
          {loading ? 'Apuntándote...' : '¡Me apunto!'}
        </button>
      </form>
    </div>
  );
}
