'use client';

import { useState } from 'react';
import Link from 'next/link';
import UserFormModal from './UserFormModal';
import TrashIcon from './TrashIcon';
import { deleteUser } from '@/actions/users';
import styles from './UserMaintenance.module.css';

export default function UserMaintenance({ users, session }: { users: any[], session: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1>Mantenimiento</h1>
          <p className="subtitle">Gestión de Usuarios del Sistema</p>
        </div>
        <div>
          <button onClick={handleCreate} className={`btn ${styles.addBtn}`}>
            + Añadir Usuario
          </button>
        </div>
      </div>

      <div className="glass-panel">
        <div className={styles.usersGrid}>
          {users.length === 0 ? (
            <div className={`glass-panel ${styles.emptyState}`}>
              <p>No hay usuarios registrados en el sistema.</p>
            </div>
          ) : (
            users.map(user => (
              <div key={user.id} className={styles.userCard}>
                <div>
                  <div className={styles.userHeader}>
                    <div className={styles.userInfo}>
                      <h3 className={styles.userName}>{user.name}</h3>
                      <span className={styles.userHandle}>@{user.username}</span>
                    </div>
                    <div>
                      {user.isAdmin ? (
                        <span className={`badge ${styles.adminBadge}`}>Admin</span>
                      ) : (
                        <span className={`badge ${styles.userBadge}`}>Usuario</span>
                      )}
                    </div>
                  </div>
                  
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
                </div>

                <div className={styles.actionsContainer}>
                  <button 
                    onClick={() => handleEdit(user)} 
                    className={`btn ${styles.editBtn}`}
                    disabled={actionLoading !== null}
                  >
                    Editar
                  </button>
                  
                  <button 
                    onClick={() => handleDelete(user.id, user.name)} 
                    className={styles.deleteBtn}
                    title="Borrar"
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === user.id ? '⏳' : <TrashIcon />}
                  </button>
                </div>
              </div>
            ))
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
