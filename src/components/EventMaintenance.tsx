'use client';

import { useState } from 'react';
import Link from 'next/link';
import EventFormModal from './EventFormModal';
import TrashIcon from './TrashIcon';
import { deleteEvent, setActiveEvent } from '@/actions/events';
import { useRouter } from 'next/navigation';
import styles from './EventMaintenance.module.css';

export default function EventMaintenance({ events, session }: { events: any[], session: any }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedEventId(prev => prev === id ? null : id);
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string, isActive: boolean) => {
    if (isActive) {
      alert('No puedes borrar el evento que está activo actualmente. Activa otro primero.');
      return;
    }

    if (window.confirm(`¿Estás seguro de que deseas eliminar el evento "${name}"? Se perderán todos sus gastos asociados.`)) {
      setActionLoading(`delete-${id}`);
      deleteEvent(id).then(res => {
        if (!res.success) {
          alert(res.error || 'Error al eliminar evento.');
        } else {
          alert(`Evento "${name}" eliminado correctamente.`);
          router.refresh();
        }
        setActionLoading(null);
      });
    }
  };

  const handleActivate = (id: string, name: string) => {
    if (window.confirm(`¿Quieres marcar "${name}" como el Evento Operativo? Todos los demás eventos pasarán a estar inactivos.`)) {
      setActionLoading(`activate-${id}`);
      setActiveEvent(id).then(res => {
        if (!res.success) {
          alert(res.error || 'Error al activar evento.');
        } else {
          alert(`Evento "${name}" marcado como operativo.`);
          router.refresh();
        }
        setActionLoading(null);
      });
    }
  };

  // Helper para pintar fechas
  const renderDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1>Gestión de Eventos</h1>
          <p className="subtitle">Eventos</p>
        </div>
        <div>
          <button onClick={handleCreate} className={`btn ${styles.addBtn}`}>
            + Añadir Evento
          </button>
        </div>
      </div>

      <div className="glass-panel">
        <div className={styles.eventsGrid}>
          {events.length === 0 ? (
            <div className={`glass-panel ${styles.emptyState}`}>
              <p>No hay eventos creados. Pulsa en Añadir Evento para empezar.</p>
            </div>
          ) : (
            [...events].sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1)).map(event => {
              const isExpanded = expandedEventId === event.id;
              return (
              <div 
                key={event.id} 
                className={`${styles.eventCard} ${event.isActive ? styles.eventCardActive : ''}`}
              >
                <div 
                  className={styles.eventHeader}
                  onClick={() => toggleExpand(event.id)}
                  style={{ cursor: 'pointer', marginBottom: isExpanded ? '1rem' : '0' }}
                >
                  <div className={styles.eventInfo}>
                    <h3 className={`${styles.eventTitle} ${event.isActive ? styles.eventTitleActive : ''}`}>
                      {event.name}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {event.isActive && (
                      <span className={`badge ${styles.activeBadge}`}>
                        OPERATIVO
                      </span>
                    )}
                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className={styles.expandedContent}>
                    <div className={styles.eventDates}>
                      <p>📅 Inicio: {renderDate(event.startDate)}</p>
                      <p>🏁 Fin: {renderDate(event.endDate)}</p>
                    </div>

                    <div className={styles.actionsContainer}>
                      {(!event.isActive && event.isProtected) ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleActivate(event.id, event.name); }}
                          className={`btn ${styles.historifiedBtn}`}
                          title="Clic para volver a hacer operativo este evento"
                          disabled={actionLoading !== null}
                        >
                          🔒 Evento Historificado
                        </button>
                      ) : (
                        <>
                          {!event.isActive && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleActivate(event.id, event.name); }} 
                              className={`btn ${styles.actionBtn} ${styles.actionBtnActive}`}
                              disabled={actionLoading !== null}
                            >
                              {actionLoading === `activate-${event.id}` ? 'Activando...' : 'Hacer Operativo'}
                            </button>
                          )}
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(event); }} 
                            className={`btn ${styles.actionBtn}`}
                            disabled={actionLoading !== null}
                          >
                            Editar
                          </button>
                          
                          {!event.isActive && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(event.id, event.name, event.isActive); }} 
                              className={styles.deleteBtn}
                              title="Borrar"
                              disabled={actionLoading !== null}
                            >
                              {actionLoading === `delete-${event.id}` ? '⏳' : <TrashIcon />}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )})
          )}
        </div>
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
