'use client';

import { useState } from 'react';
import Link from 'next/link';
import EventFormModal from './EventFormModal';
import TrashIcon from './TrashIcon';
import { deleteEvent, setActiveEvent } from '@/actions/events';

export default function EventMaintenance({ events }: { events: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string, isActive: boolean) => {
    if (isActive) {
      alert('No puedes borrar el evento que está activo actualmente. Activa otro primero.');
      return;
    }
    
    if (window.confirm(`¿Estás seguro de que deseas eliminar el evento "${name}"? Se perderán todos sus gastos asociados.`)) {
      setActionLoading(`delete-${id}`);
      const res = await deleteEvent(id);
      if (!res.success) alert(res.error);
      setActionLoading(null);
    }
  };

  const handleActivate = async (id: string, name: string) => {
    if (window.confirm(`¿Quieres marcar "${name}" como el Evento Operativo? Todos los demás eventos pasarán a estar inactivos.`)) {
      setActionLoading(`activate-${id}`);
      const res = await setActiveEvent(id);
      if (!res.success) alert(res.error);
      setActionLoading(null);
    }
  };

  // Helper para pintar fechas
  const renderDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <h1>Mantenimiento</h1>
          <p className="subtitle">Gestión de Eventos / Viajes</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={handleCreate} className="btn btn-primary mobile-w-full">
            + Añadir Evento
          </button>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {events.length === 0 ? (
          <div className="glass-panel text-center col-span-full py-8">
            <p className="text-secondary">No hay eventos creados. Pulsa en Añadir Evento para empezar.</p>
          </div>
        ) : (
          [...events].sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1)).map(event => (
            <div 
              key={event.id} 
              className="glass-panel relative overflow-hidden flex flex-col justify-between"
              style={{
                borderColor: event.isActive ? 'var(--accent-success)' : 'var(--accent-danger)',
                boxShadow: event.isActive ? '0 0 15px rgba(16, 185, 129, 0.2)' : '0 0 15px rgba(239, 68, 68, 0.15)',
                backgroundColor: event.isActive ? '' : 'rgba(100, 116, 139, 0.2)',
                opacity: event.isActive ? 1 : 0.65,
                filter: event.isActive ? 'none' : 'grayscale(60%)',
                transform: event.isActive ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Barra superior de color (Verde para activo, Roja para inactivo) */}
              <div style={{ 
                position: 'absolute', top: 0, left: 0, right: 0, height: '4px', 
                background: event.isActive ? 'var(--accent-success)' : 'var(--accent-danger)' 
              }} />

              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: event.isActive ? 'var(--accent-success)' : 'inherit' }}>
                    {event.name}
                  </h3>
                  {event.isActive && (
                    <span className="badge badge-admin" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981' }}>
                      OPERATIVO
                    </span>
                  )}
                </div>
                
                <div className="text-secondary mb-4" style={{ fontSize: '0.875rem' }}>
                  <p>📅 Inicio: {renderDate(event.startDate)}</p>
                  <p>🏁 Fin: {renderDate(event.endDate)}</p>
                </div>
              </div>

              <div className="flex mobile-col gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                {!event.isActive && (
                  <button 
                    onClick={() => handleActivate(event.id, event.name)} 
                    className="btn btn-primary mobile-w-full" 
                    style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981' }}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === `activate-${event.id}` ? 'Activando...' : 'Hacer Operativo'}
                  </button>
                )}
                
                <button 
                  onClick={() => handleEdit(event)} 
                  className="btn btn-secondary mobile-w-full" 
                  disabled={actionLoading !== null}
                >
                  Editar
                </button>
                
                <button 
                  onClick={() => handleDelete(event.id, event.name, event.isActive)} 
                  className="btn btn-danger mobile-w-full" 
                  title="Borrar"
                  disabled={event.isActive || actionLoading !== null}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <EventFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        event={editingEvent} 
        onSaved={() => {}}
      />
    </div>
  );
}
