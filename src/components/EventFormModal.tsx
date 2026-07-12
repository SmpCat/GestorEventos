'use client';

import { useState, useEffect } from 'react';
import { createEvent, updateEvent } from '@/actions/events';

export default function EventFormModal({ isOpen, onClose, event, onSaved, session }: { isOpen: boolean, onClose: () => void, event?: any, onSaved: () => void, session?: any }) {
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: ''
  });
  
  const [loading, setLoading] = useState(false);

  // Helper to format Date to YYYY-MM-DD for input[type="date"]
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        startDate: formatDateForInput(event.startDate),
        endDate: formatDateForInput(event.endDate)
      });
    } else {
      setFormData({
        name: '',
        startDate: '',
        endDate: ''
      });
    }
  }, [event, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name) {
      alert('El nombre del evento es obligatorio.');
      setLoading(false);
      return;
    }

    const payload = {
      name: formData.name,
      startDate: formData.startDate ? new Date(formData.startDate) : null,
      endDate: formData.endDate ? new Date(formData.endDate) : null,
    };

    const res = event 
      ? await updateEvent(event.id, payload)
      : await createEvent(payload);

    if (res.success) {
      alert(event ? 'Evento actualizado correctamente.' : 'Evento creado correctamente.');
      onSaved();
      onClose();
    } else {
      alert(res.error || 'Ocurrió un error inesperado.');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" style={{ paddingBottom: '2rem', flexDirection: 'column' }}>
      
      {/* Banner extraído fuera del panel para que ocupe el mismo ancho que el Navbar */}
      <div style={{ position: 'relative', zIndex: 10, paddingTop: '0.25rem', paddingBottom: '0.25rem', width: '100%', maxWidth: '1200px', margin: '0 auto', flexShrink: 0 }}>
        <div className="flex justify-between items-center rounded-xl" style={{ padding: '0.25rem 1rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
           <div className="flex items-center gap-3">
             <div className="bg-black/30 p-1 px-2 rounded-full border border-white/5 text-xl flex items-center justify-center opacity-70">👤</div>
             <div>
               <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{session?.name || 'Admin'}</p>
               <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>@{session?.username || 'admin'}</p>
             </div>
           </div>
           <button type="button" onClick={onClose} className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
             Volver
           </button>
        </div>
      </div>

      <div className="glass-panel modal-content" style={{ paddingBottom: '2rem', marginTop: '1rem' }}>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="input-group">
            <label className="input-label">Nombre del Evento *</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ej. Fiestas Valdeganga 2026"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="flex mobile-col gap-4">
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Fecha de Inicio (Opcional)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="date" 
                  className="input-field" 
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                  style={{ colorScheme: 'dark', flex: 1 }}
                />
                {formData.startDate && (
                  <button type="button" onClick={() => setFormData({...formData, startDate: ''})} className="btn btn-secondary" style={{ padding: '0 0.75rem' }} title="Borrar fecha">✕</button>
                )}
              </div>
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Fecha de Fin (Opcional)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="date" 
                  className="input-field" 
                  value={formData.endDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                  style={{ colorScheme: 'dark', flex: 1 }}
                />
                {formData.endDate && (
                  <button type="button" onClick={() => setFormData({...formData, endDate: ''})} className="btn btn-secondary" style={{ padding: '0 0.75rem' }} title="Borrar fecha">✕</button>
                )}
              </div>
            </div>
          </div>

          <div className="flex mobile-col justify-end gap-3 mt-2">
            <button type="submit" className="btn btn-primary mobile-w-full py-3 text-lg" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
