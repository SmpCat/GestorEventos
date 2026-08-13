'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserFormModal from './UserFormModal';
import TrashIcon from './TrashIcon';
import SelectField from './SelectField';
import { deleteUser, bulkUpdateUsersFiltered, FilterType, BulkActionType } from '@/actions/users';
import styles from './UserMaintenance.module.css';

const FILTER_LABELS: Record<FilterType, string> = {
  ALL: 'Todos los usuarios',
  UNDER_18: 'Menores de 18 años (< 18)',
  OVER_18: 'Mayores de 18 años (18+)',
  MEMBERS: 'Solo Socios',
  NON_MEMBERS: 'Solo No Socios',
  ADMINS: 'Solo Administradores',
  NON_ADMINS: 'Solo Usuarios Normales'
};

const ACTION_LABELS: Record<BulkActionType, string> = {
  SET_MEMBER: 'Marcar como Socio/a (isMember: Sí)',
  SET_NON_MEMBER: 'Marcar como No Socio/a (isMember: No)',
  GRANT_ADMIN: 'Otorgar rol de Administrador',
  REVOKE_ADMIN: 'Quitar rol de Administrador',
  SET_AGE_18: 'Establecer Edad en 18 años',
  DISABLE_TICKET_UPLOAD: 'Deshabilitar subida de tickets',
  ENABLE_TICKET_UPLOAD: 'Habilitar subida de tickets',
  DELETE_CLEAN: 'Borrar usuarios limpios (sin pagos/tickets)',
  EXPEL_CLEAN_ATTENDEES: 'Borrar asistentes limpios (sin historial del evento)'
};

export default function UserMaintenance({ users, session }: { users: any[], session: any }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter((user: any) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedUserId(prev => prev === id ? null : id);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al usuario "${name}"? Esta acción no se puede deshacer.`)) {
      setActionLoading(id);
      const res = await deleteUser(id);
      if (res.success) {
        alert(`Usuario "${name}" eliminado correctamente.`);
        router.refresh();
      } else {
        alert(res.error || 'Error al eliminar usuario.');
      }
      setActionLoading(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1>Usuarios</h1>
          <p className="subtitle">Gestión de Usuarios del Sistema</p>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '0.75rem' }}>
        <button onClick={handleCreate} className={`btn ${styles.addBtn}`} style={{ padding: '1rem', borderRadius: '1rem', width: '100%' }}>
          + Añadir Usuario
        </button>
      </div>

      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Buscar usuario por nombre o nick..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '2.5rem', borderRadius: '12px' }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.5rem' }}
              title="Borrar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
        <div className={styles.usersGrid}>
          {filteredUsers.length === 0 ? (
            <div className={`glass-panel ${styles.emptyState}`}>
              <p>{searchQuery ? 'No se encontraron usuarios coincidentes.' : 'No hay usuarios registrados en el sistema.'}</p>
            </div>
          ) : (
            filteredUsers.map(user => {
              const isExpanded = expandedUserId === user.id;
              return (
              <div key={user.id} className={styles.userCard}>
                <div 
                  className={styles.userHeader} 
                  onClick={() => toggleExpand(user.id)}
                  style={{ cursor: 'pointer', marginBottom: isExpanded ? '1rem' : '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}
                >
                  <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <h3 className={styles.userName} style={{ margin: 0 }}>{user.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {user.isMember ? (
                          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.18)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#ffffff', fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '6px', fontWeight: 600 }}>Socio</span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '6px' }}>No Socio</span>
                        )}
                        {user.age !== null && user.age !== undefined && (
                          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '6px' }}>{user.age} años</span>
                        )}
                        {user.isAdmin && (
                          <span className={`badge ${styles.adminBadge}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>Admin</span>
                        )}
                      </div>
                    </div>
                    <span className={styles.userHandle}>@{user.username}</span>
                  </div>

                  <div style={{ flexShrink: 0, paddingLeft: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <span style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 'bold' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className={styles.expandedContent}>
                    <div className={styles.contactBox}>
                      {user.email && (
                        <div className={styles.contactRow}>
                          <span className={styles.contactIcon}>✉️</span>
                          <span>{user.email}</span>
                        </div>
                      )}
                      {user.phone && (
                        <div className={styles.contactRow}>
                          <span className={styles.contactIcon}>📱</span>
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {!user.email && !user.phone && (
                        <span className={styles.noContact}>Sin datos de contacto</span>
                      )}
                    </div>

                    <div className={styles.actionsContainer}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(user); }} 
                        className={`btn ${styles.editBtn}`}
                        disabled={actionLoading !== null}
                      >
                        Editar
                      </button>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(user.id, user.name); }} 
                        className={styles.deleteBtn}
                        title="Borrar"
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === user.id ? '⏳' : <TrashIcon />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )})
          )}
        </div>
      </div>

      <UserFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={editingUser} 
        session={session}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
