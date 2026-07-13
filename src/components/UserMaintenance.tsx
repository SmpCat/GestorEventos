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
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <h1>Mantenimiento</h1>
          <p className="subtitle">Gestión de Usuarios del Sistema</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={handleCreate} className="btn btn-primary mobile-w-full">
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
                <div key={`mobile-${user.id}`} className="bg-black/30 p-4 rounded-lg border flex flex-col gap-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-lg">{user.name}</div>
                      <div className="text-secondary text-sm">@{user.username}</div>
                    </div>
                    <div>
                      {user.isAdmin ? (
                        <span className="badge badge-admin text-xs">Admin</span>
                      ) : (
                        <span className="badge badge-user text-xs">Usuario</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 text-sm bg-black/20 p-2 rounded">
                    {user.email && <span>✉️ {user.email}</span>}
                    {user.phone && <span>📱 {user.phone}</span>}
                    {!user.email && !user.phone && <span className="text-secondary italic">Sin datos de contacto</span>}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleEdit(user)} className="btn btn-secondary flex-1 py-2 text-sm flex items-center justify-center gap-2" disabled={actionLoading !== null}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => handleDelete(user.id, user.name)} style={{ color: 'rgba(255, 255, 255, 0.7)', background: 'transparent', border: 'none', cursor: 'pointer' }} className="flex-1 py-2 text-sm flex items-center justify-center gap-2" disabled={actionLoading !== null}>
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
                          <span className="badge badge-admin">Admin</span>
                        ) : (
                          <span className="badge badge-user">Usuario</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={() => handleEdit(user)} className="btn btn-secondary" style={{ marginRight: '0.5rem' }} disabled={actionLoading !== null}>
                          Editar
                        </button>
                        <button onClick={() => handleDelete(user.id, user.name)} style={{ color: 'rgba(255, 255, 255, 0.7)', padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Borrar" disabled={actionLoading !== null}>
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
