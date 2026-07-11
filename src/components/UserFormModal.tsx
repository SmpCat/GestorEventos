'use client';

import { useState, useEffect } from 'react';
import { createUser, updateUser } from '@/actions/users';

export default function UserFormModal({ isOpen, onClose, user, onSaved }: { isOpen: boolean, onClose: () => void, user?: any, onSaved: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    isAdmin: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        username: user.username,
        password: '', // No cargamos el password por seguridad, si lo deja vacío no lo actualizamos
        email: user.email || '',
        phone: user.phone || '',
        isAdmin: user.isAdmin || false
      });
    } else {
      setFormData({
        name: '',
        username: '',
        password: '',
        email: '',
        phone: '',
        isAdmin: false
      });
    }
    setError('');
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validación básica
    if (!formData.name || !formData.username) {
      setError('Nombre y Usuario son obligatorios.');
      setLoading(false);
      return;
    }
    
    if (!user && !formData.password) {
      setError('La contraseña es obligatoria para nuevos usuarios.');
      setLoading(false);
      return;
    }

    const res = user 
      ? await updateUser(user.id, formData)
      : await createUser(formData);

    if (res.success) {
      onSaved();
      onClose();
    } else {
      setError(res.error || 'Ocurrió un error inesperado.');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content">
        <div className="flex justify-between items-center mb-4">
          <h2>{user ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem' }}>✕</button>
        </div>
        
        {error && <p style={{ color: 'var(--accent-danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="input-group">
            <label className="input-label">Nombre Completo *</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ej. Pepe García"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="flex mobile-col gap-4">
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Usuario *</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="pepe_garcia"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Contraseña {user ? '(Dejar vacía para no cambiar)' : '*'}</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="***"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <div className="flex mobile-col gap-4">
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Email (Opcional)</label>
              <input 
                type="email" 
                className="input-field" 
                placeholder="pepe@email.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Teléfono (Opcional)</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="600123456"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="input-group mt-4">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={formData.isAdmin}
                onChange={e => setFormData({...formData, isAdmin: e.target.checked})}
                style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-primary)' }}
              />
              Otorgar permisos de Administrador
            </label>
            <p className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Los administradores pueden gestionar eventos y facturas de todos.</p>
          </div>

          <div className="flex mobile-col justify-end gap-3 mt-6">
            <button type="submit" className="btn btn-primary mobile-w-full" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Usuario'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary mobile-w-full">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
