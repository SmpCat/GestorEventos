'use client';

import { useState } from 'react';
import Link from 'next/link';
import UserFormModal from './UserFormModal';
import TrashIcon from './TrashIcon';
import { deleteUser } from '@/actions/users';

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Mantenimiento</h1>
          <p className="subtitle">Gestión de Usuarios del Sistema</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={handleCreate} className="btn mobile-w-full" style={{ backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            + Añadir Usuario
          </button>
        </div>
      </div>

      <div className="glass-panel p-0 md:p-0">
        {users.length === 0 ? (
          <div className="text-center py-8 text-secondary">
            No hay usuarios registrados en el sistema.
          </div>
        ) : (
          <>
            {/* VISTA MÓVIL (Cards) */}
            <div className="desktop-hide flex flex-col gap-4 p-4">
              {users.map(user => (
                <div key={`mobile-${user.id}`} className="p-4 rounded-lg border flex flex-col gap-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-lg">{user.name}</div>
                      <div className="text-secondary text-sm">@{user.username}</div>
                    </div>
                    <div>
                      {user.isAdmin ? (
                        <span className="badge text-xs" style={{ backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)', fontWeight: 'bold' }}>Admin</span>
                      ) : (
                        <span className="badge text-xs" style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Usuario</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 text-sm p-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    {user.email && <span>✉️ {user.email}</span>}
                    {user.phone && <span>📱 {user.phone}</span>}
                    {!user.email && !user.phone && <span className="text-secondary italic">Sin datos de contacto</span>}
                  </div>

                  <div className="flex mobile-col gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button onClick={() => handleEdit(user)} className="btn mobile-w-full" style={{ backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }} disabled={actionLoading !== null}>
                      Editar
                    </button>
                    <button onClick={() => handleDelete(user.id, user.name)} className="btn mobile-w-full" style={{ color: 'var(--accent-danger)', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)' }} title="Borrar" disabled={actionLoading !== null}>
                      {actionLoading === user.id ? '...' : <><TrashIcon /> Borrar</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* VISTA ESCRITORIO (Tabla original) */}
            <div className="table-wrapper mobile-hide p-6">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Usuario</th>
                    <th>Contacto</th>
                    <th>Rol</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={`desktop-${user.id}`}>
                      <td>
                        <strong>{user.name}</strong>
                      </td>
                      <td>@{user.username}</td>
                      <td>
                        <div className="flex flex-col gap-1">
                          {user.email && <span style={{ fontSize: '0.8rem' }}>✉️ {user.email}</span>}
                          {user.phone && <span style={{ fontSize: '0.8rem' }}>📱 {user.phone}</span>}
                          {!user.email && !user.phone && <span className="text-secondary" style={{ fontSize: '0.8rem' }}>Sin contacto</span>}
                        </div>
                      </td>
                      <td>
                        {user.isAdmin ? (
                          <span className="badge" style={{ backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)', fontWeight: 'bold' }}>Admin</span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Usuario</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={() => handleEdit(user)} className="btn" style={{ marginRight: '0.5rem', backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }} disabled={actionLoading !== null}>
                          Editar
                        </button>
                        <button onClick={() => handleDelete(user.id, user.name)} className="btn" style={{ color: 'var(--accent-danger)', padding: '0.5rem', backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Borrar" disabled={actionLoading !== null}>
                          {actionLoading === user.id ? '...' : <TrashIcon />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <UserFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={editingUser} 
        session={session}
        onSaved={() => {
          // El server action ya hace revalidatePath, así que la tabla se actualizará sola
        }}
      />
    </div>
  );
}
