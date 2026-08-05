'use client';

import { useState, useEffect } from 'react';
import SelectField from './SelectField';
import { updateMyProfile } from '@/actions/users';

export default function UserProfileModal({ 
  user, 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  user: any; 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess?: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    isMember: 'true',
    age: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        isMember: user.isMember ? 'true' : 'false',
        age: user.age !== null && user.age !== undefined ? String(user.age) : '',
        email: user.email || '',
        phone: user.phone || '',
        currentPassword: '',
        newPassword: '',
      });
    }
    setShowPasswordSection(false);
    setShowPasswordText(false);
    setError('');
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.username.trim()) {
      setError('El nombre y el usuario son obligatorios.');
      return;
    }

    if (showPasswordSection) {
      if (!formData.currentPassword) {
        setError('Debes introducir tu contraseña actual para cambiarla.');
        return;
      }
      if (!formData.newPassword) {
        setError('Debes introducir la nueva contraseña.');
        return;
      }
    }

    setLoading(true);
    const res = await updateMyProfile({
      name: formData.name,
      username: formData.username,
      isMember: formData.isMember === 'true',
      age: formData.age ? parseInt(formData.age, 10) : undefined,
      email: formData.email,
      phone: formData.phone,
      currentPassword: showPasswordSection ? formData.currentPassword : undefined,
      newPassword: showPasswordSection ? formData.newPassword : undefined,
    });

    setLoading(false);

    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(res.error || 'Error al guardar los datos del perfil.');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="glass-panel modal-content max-w-lg w-full p-6 animate-scale-in" style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
        
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>👤</span> Mi Perfil
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-xl font-bold p-1 rounded-lg transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl text-sm font-medium bg-red-500/20 text-red-200 border border-red-500/40">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="input-group">
            <label className="input-label">Nombre Completo *</label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Nombre de Usuario (@nick) *</label>
              <input 
                type="text" 
                className="input-field" 
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Edad (años)</label>
              <input 
                type="number" 
                className="input-field" 
                placeholder="Ej. 25"
                min={0}
                max={120}
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: e.target.value })}
              />
            </div>
          </div>

          <SelectField
            label="¿Es Socio/a de la Peña?"
            value={formData.isMember}
            onChange={e => setFormData({ ...formData, isMember: e.target.value })}
          >
            <option value="true">Sí (Socio/a)</option>
            <option value="false">No (No Socio/a)</option>
          </SelectField>

          <div className="pt-2 border-t border-white/5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Datos de Contacto (Opcionales)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">Email</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="ejemplo@email.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Teléfono</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="600123456"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Sección de Cambio de Contraseña */}
          <div className="pt-3 border-t border-white/10 mt-2">
            {!showPasswordSection ? (
              <button
                type="button"
                onClick={() => setShowPasswordSection(true)}
                className="btn w-full py-2.5 text-sm font-medium flex items-center justify-center gap-2"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)' }}
              >
                🔐 Cambiar Contraseña
              </button>
            ) : (
              <div className="p-4 rounded-xl flex flex-col gap-3" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    🔐 Cambiar Contraseña
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setFormData({ ...formData, currentPassword: '', newPassword: '' });
                    }}
                    className="text-xs text-gray-400 hover:text-white underline"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Ocultar
                  </button>
                </div>

                <div className="input-group">
                  <label className="input-label">Contraseña Actual *</label>
                  <input 
                    type={showPasswordText ? 'text' : 'password'}
                    className="input-field" 
                    placeholder="Introduce tu contraseña actual"
                    value={formData.currentPassword}
                    onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Nueva Contraseña *</label>
                  <input 
                    type={showPasswordText ? 'text' : 'password'}
                    className="input-field" 
                    placeholder="Introduce la nueva contraseña"
                    value={formData.newPassword}
                    onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer mt-1">
                  <input 
                    type="checkbox" 
                    checked={showPasswordText} 
                    onChange={e => setShowPasswordText(e.target.checked)} 
                    className="rounded bg-black/40 border-white/20 text-white"
                  />
                  <span>👁️ Mostrar contraseñas</span>
                </label>
              </div>
            )}
          </div>

          {/* Botones del Formulario */}
          <div className="flex mobile-col justify-end gap-3 mt-4 pt-3 border-t border-white/10">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn mobile-w-full py-3 text-base" 
              disabled={loading} 
              style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid rgba(255, 255, 255, 0.15)' }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn mobile-w-full py-3 text-base font-bold" 
              disabled={loading} 
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.3)' }}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
