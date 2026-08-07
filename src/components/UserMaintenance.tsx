'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  DELETE_CLEAN: 'Borrar usuarios limpios (sin pagos/tickets)'
};

export default function UserMaintenance({ users, session }: { users: any[], session: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('ALL');
  const [selectedAction, setSelectedAction] = useState<BulkActionType>('SET_NON_MEMBER');

  const isSuperAdmin = session?.username === 'admin';

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
      } else {
        alert(res.error || 'Error al eliminar usuario.');
      }
      setActionLoading(null);
    }
  };

  const handleExecuteFilteredBulk = async () => {
    const filterText = FILTER_LABELS[selectedFilter];
    const actionText = ACTION_LABELS[selectedAction];

    const confirmMessage = selectedAction === 'DELETE_CLEAN'
      ? `🚨 ¿SÚPER SEGURO? Se van a BORRAR permanentemente los usuarios coincidentes con "${filterText}" que no tengan pagos ni tickets asociados.`
      : `¿Estás seguro de aplicar la acción "${actionText}" a los usuarios coincidentes con "${filterText}"?\n(La cuenta Superadmin nunca se verá afectada).`;

    if (!window.confirm(confirmMessage)) return;

    setActionLoading('bulk_filtered');
    const res = await bulkUpdateUsersFiltered(selectedFilter, selectedAction);
    setActionLoading(null);

    if (!res.success) {
      alert(res.error || 'Error al ejecutar la acción masiva.');
      return;
    }

    if (res.isDelete) {
      alert(`¡Borrado masivo completado! Se han eliminado ${res.deletedCount} usuarios limpios (${res.skippedCount} conservados por tener historial).`);
    } else {
      alert(`¡Actualización masiva completada! Se han modificado ${res.count} usuarios.`);
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

      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <button onClick={handleCreate} className={`btn ${styles.addBtn}`} style={{ padding: '1rem', borderRadius: '1rem' }}>
          + Añadir Usuario
        </button>

        {isSuperAdmin && (
          <div 
            className={styles.userCard} 
            style={{ 
              padding: '1.25rem', 
              border: '1px solid rgba(255, 255, 255, 0.15)', 
              background: 'rgba(15, 23, 42, 0.65)', 
              backdropFilter: 'blur(10px)',
              borderRadius: '16px' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input 
                type="checkbox"
                checked={isSelectAll}
                onChange={(e) => setIsSelectAll(e.target.checked)}
                style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer', flexShrink: 0 }}
                title="Edición Masiva Personalizada por Filtro"
              />
              <span style={{ color: '#ffffff', fontSize: '0.95rem', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setIsSelectAll(!isSelectAll)}>
                👑 Edición Masiva Personalizada (Superadmin)
              </span>
            </div>

            {isSelectAll && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 'bold' }}>
                      1. Filtrar Usuarios Objetivo:
                    </label>
                    <SelectField
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value as FilterType)}
                      disabled={actionLoading !== null}
                      containerStyle={{ marginBottom: 0 }}
                    >
                      <option value="ALL">👥 Todos los usuarios</option>
                      <option value="UNDER_18">👶 Menores de 18 años (&lt; 18)</option>
                      <option value="OVER_18">👴 Mayores de 18 años (18+)</option>
                      <option value="MEMBERS">🎗️ Solo Socios</option>
                      <option value="NON_MEMBERS">👤 Solo No Socios</option>
                      <option value="ADMINS">🛡️ Solo Administradores</option>
                      <option value="NON_ADMINS">👤 Solo Usuarios Normales</option>
                    </SelectField>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 'bold' }}>
                      2. Acción Masiva a Ejecutar:
                    </label>
                    <SelectField
                      value={selectedAction}
                      onChange={(e) => setSelectedAction(e.target.value as BulkActionType)}
                      disabled={actionLoading !== null}
                      containerStyle={{ marginBottom: 0 }}
                    >
                      <option value="SET_MEMBER">🎗️ Marcar como Socio/a (isMember: Sí)</option>
                      <option value="SET_NON_MEMBER">👤 Marcar como No Socio/a (isMember: No)</option>
                      <option value="GRANT_ADMIN">👑 Otorgar rol de Administrador</option>
                      <option value="REVOKE_ADMIN">🛡️ Quitar rol de Administrador</option>
                      <option value="SET_AGE_18">🎂 Fijar Edad en 18 años</option>
                      <option value="DELETE_CLEAN">🗑️ Borrar usuarios limpios (sin historial)</option>
                    </SelectField>
                  </div>
                </div>

                <button
                  onClick={handleExecuteFilteredBulk}
                  disabled={actionLoading !== null}
                  className="btn"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    fontSize: '0.9rem', 
                    fontWeight: 'bold',
                    backgroundColor: selectedAction === 'DELETE_CLEAN' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    border: selectedAction === 'DELETE_CLEAN' ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                    color: selectedAction === 'DELETE_CLEAN' ? '#fca5a5' : '#ffffff',
                    borderRadius: '10px',
                    cursor: 'pointer'
                  }}
                >
                  {actionLoading === 'bulk_filtered' ? '⏳ Aplicando cambios masivos...' : '⚡ Aplicar Cambio Masivo'}
                </button>

              </div>
            )}
          </div>
        )}
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
        onSaved={() => {}}
      />
    </div>
  );
}
