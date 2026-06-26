'use client';

import { useState } from 'react';
import Link from 'next/link';
import UserFormModal from './UserFormModal';
import { deleteUser } from '@/actions/users';

export default function UserMaintenance({ users }: { users: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

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
      await deleteUser(id);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.2rem' }}>Mantenimiento de Usuarios</h1>
          <p className="text-secondary">Gestiona los perfiles y permisos de la aplicación.</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={handleCreate} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem' }}>
            + Añadir Usuario
          </button>
          <Link href="/" className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            ← Volver al Dashboard
          </Link>
        </div>
      </div>

      <div className="glass-panel">
        <div className="table-wrapper">
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
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-secondary">
                    No hay usuarios registrados en el sistema.
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id}>
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
                      <button onClick={() => handleEdit(user)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', marginRight: '0.5rem', fontSize: '0.875rem' }}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(user.id, user.name)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={editingUser} 
        onSaved={() => {
          // El server action ya hace revalidatePath, así que la tabla se actualizará sola
        }}
      />
    </div>
  );
}
