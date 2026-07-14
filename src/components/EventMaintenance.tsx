'use client';

import { useState } from 'react';
import Link from 'next/link';
import EventFormModal from './EventFormModal';
import TrashIcon from './TrashIcon';
import { deleteEvent, setActiveEvent } from '@/actions/events';
import { useRouter } from 'next/navigation';

export default function EventMaintenance({ events, session }: { events: any[], session: any }) {
  const router = useRouter();
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
      if (!res.success) {
        alert(res.error || 'Error al eliminar evento.');
      } else {
        alert(`Evento "${name}" eliminado correctamente.`);
        router.refresh();
      }
      setActionLoading(null);
    }
  };

  const handleActivate = async (id: string, name: string) => {
    if (window.confirm(`¿Quieres marcar "${name}" como el Evento Operativo? Todos los demás eventos pasarán a estar inactivos.`)) {
      setActionLoading(`activate-${id}`);
      const res = await setActiveEvent(id);
      if (!res.success) {
        alert(res.error || 'Error al activar evento.');
      } else {
        alert(`Evento "${name}" marcado como operativo.`);
        router.refresh();
      }
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
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>Gestión de Eventos</h1>
          <p className="subtitle">Eventos</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={handleCreate} className="btn mobile-w-full" style={{ backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            + Añadir Evento
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
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
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: 'none',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                transition: 'all 0.3s ease',
              }}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: event.isActive ? 'var(--accent-success)' : 'inherit' }}>
                    {event.name}
                  </h3>
                  {event.isActive && (
                    <span className="badge" style={{ backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)', fontWeight: 'bold' }}>
                      OPERATIVO
                    </span>
                  )}
                </div>
                
                <div className="mb-4" style={{ color: '#fff', fontSize: '0.875rem' }}>
                  <p>📅 Inicio: {renderDate(event.startDate)}</p>
                  <p>🏁 Fin: {renderDate(event.endDate)}</p>
                </div>
              </div>

              <div className="flex mobile-col gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                {(!event.isActive && event.isProtected) ? (
                  <button 
                    onClick={() => handleActivate(event.id, event.name)}
                    className="btn w-full text-center flex items-center justify-center gap-2" 
                    style={{ backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}
                    title="Clic para volver a hacer operativo este evento"
                    disabled={actionLoading !== null}
                  >
                    🔒 Evento Historificado
                  </button>
                ) : (
                  <>
                    {!event.isActive && (
                      <button 
                        onClick={() => handleActivate(event.id, event.name)} 
                        className="btn mobile-w-full" 
                        style={{ backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 'bold' }}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === `activate-${event.id}` ? 'Activando...' : 'Hacer Operativo'}
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleEdit(event)} 
                      className="btn mobile-w-full" 
                      style={{ backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                      disabled={actionLoading !== null}
                    >
                      Editar
                    </button>
                    
                    {!event.isActive && (
                      <button 
                        onClick={() => handleDelete(event.id, event.name, event.isActive)} 
                        className="btn"
                        style={{ color: 'var(--accent-danger)', padding: '0.5rem', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Borrar"
                        disabled={actionLoading !== null}
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <EventFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        event={editingEvent} 
        session={session}
        onSaved={() => {}}
      />
    </div>
  );
}
