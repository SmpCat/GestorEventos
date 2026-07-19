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
          {users.length === 0 ? (
            <div className={`glass-panel ${styles.emptyState}`}>
              <p>No hay usuarios registrados en el sistema.</p>
            </div>
          ) : (
            users.map(user => {
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {user.isAdmin ? (
                      <span className={`badge ${styles.adminBadge}`}>Admin</span>
                    ) : (
                      <span className={`badge ${styles.userBadge}`}>Usuario</span>
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
