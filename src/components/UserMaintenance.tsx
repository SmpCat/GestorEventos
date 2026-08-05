'use client';

import { useState } from 'react';
import Link from 'next/link';
import UserFormModal from './UserFormModal';
import TrashIcon from './TrashIcon';
import { deleteUser, deleteAllNonAdminUsers } from '@/actions/users';
import styles from './UserMaintenance.module.css';

export default function UserMaintenance({ users, session }: { users: any[], session: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [isSelectAll, setIsSelectAll] = useState(false);
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
      } else {
        alert(res.error || 'Error al eliminar usuario.');
      }
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm('🚨 ¿Estás SÚPER SEGURO de que quieres BORRAR a todos los usuarios que no sean Administradores? Esta acción es irreversible y solo borrará a los usuarios que NO tengan pagos ni tickets asociados.')) {
      setActionLoading('bulk');
      const res = await deleteAllNonAdminUsers();
      if (res.success) {
        alert(`¡Limpieza completada! Se borraron ${res.deletedCount} usuarios limpios. Se han conservado ${res.skippedCount} usuarios que tienen pagos o tickets registrados.`);
        setIsSelectAll(false);
      } else {
        alert(res.error || 'Error al realizar el borrado masivo.');
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

      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <button onClick={handleCreate} className={`btn ${styles.addBtn}`} style={{ padding: '1rem', borderRadius: '1rem' }}>
          + Añadir Usuario
        </button>

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

        <div className={styles.userCard} style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input 
              type="checkbox"
              checked={isSelectAll}
              onChange={(e) => setIsSelectAll(e.target.checked)}
              style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer', flexShrink: 0 }}
              title="Selección Maestra de Borrado"
            />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setIsSelectAll(!isSelectAll)}>
              Borrado Masivo
            </span>
          </div>
          {isSelectAll && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={handleBulkDelete}
                disabled={actionLoading === 'bulk'}
                className={styles.deleteBtn}
                style={{ padding: '0.375rem 0', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                title="Borrar Todos los Usuarios No Administradores"
              >
                {actionLoading === 'bulk' ? '⏳' : <TrashIcon />} Borrar a todos
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel">
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
                  style={{ cursor: 'pointer', marginBottom: isExpanded ? '1rem' : '0' }}
                >
                  <div className={styles.userInfo}>
                    <h3 className={styles.userName}>{user.name}</h3>
                    <span className={styles.userHandle}>@{user.username}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {user.isMember ? (
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.18)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#ffffff', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>Socio</span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>No Socio</span>
                    )}
                    {user.age !== null && user.age !== undefined && (
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>{user.age} años</span>
                    )}
                    {user.isAdmin && (
                      <span className={`badge ${styles.adminBadge}`}>Admin</span>
                    )}
                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{isExpanded ? '▲' : '▼'}</span>
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
