'use client';

import { useState, useEffect } from 'react';
import { createEvent, updateEvent } from '@/actions/events';

export default function EventFormModal({ isOpen, onClose, event, onSaved }: { isOpen: boolean, onClose: () => void, event?: any, onSaved: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setError('');
  }, [event, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.name) {
      setError('El nombre del evento es obligatorio.');
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
      onSaved();
      onClose();
    } else {
      setError(res.error || 'Ocurrió un error inesperado.');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content">
        <div className="flex justify-between items-center mb-4">
          <h2>{event ? 'Editar Evento' : 'Nuevo Evento'}</h2>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem' }}>✕</button>
        </div>
        
        {error && <p style={{ color: 'var(--accent-danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>}

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

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="input-group flex-1">
              <label className="input-label">Fecha de Inicio (Opcional)</label>
              <input 
                type="date" 
                className="input-field" 
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className="input-group flex-1">
              <label className="input-label">Fecha de Fin (Opcional)</label>
              <input 
                type="date" 
                className="input-field" 
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
