'use client';

import { useState, useEffect } from 'react';
import { createUser, updateUser } from '@/actions/users';
import SelectField from './SelectField';

export default function UserFormModal({ isOpen, onClose, user, onSaved, session }: { isOpen: boolean, onClose: () => void, user?: any, onSaved: () => void, session?: any }) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    isAdmin: false,
    isMember: false,
    age: '',
    canUploadTickets: true
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        username: user.username,
        password: '', // No cargamos el password por seguridad, si lo deja vacío no lo actualizamos
        email: user.email || '',
        phone: user.phone || '',
        isAdmin: user.isAdmin || false,
        isMember: user.isMember || false,
        age: user.age !== null && user.age !== undefined ? String(user.age) : '',
        canUploadTickets: user.canUploadTickets !== undefined ? user.canUploadTickets : true
      });
    } else {
      setFormData({
        name: '',
        username: '',
        password: '',
        email: '',
        phone: '',
        isAdmin: false,
        isMember: false,
        age: '',
        canUploadTickets: true
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validación básica
    if (!formData.name || !formData.username || !formData.age) {
      alert('Nombre, Usuario y Edad son obligatorios.');
      setLoading(false);
      return;
    }
    
    if (!user && !formData.password) {
      alert('La contraseña es obligatoria para nuevos usuarios.');
      setLoading(false);
      return;
    }

    const res = user 
      ? await updateUser(user.id, formData)
      : await createUser(formData);

    if (res.success) {
      alert(user ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
      onSaved();
      onClose();
    } else {
      alert(res.error || 'Ocurrió un error inesperado.');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" style={{ paddingBottom: '2rem', flexDirection: 'column' }}>
      
      {/* Banner extraído fuera del panel para que ocupe el mismo ancho que el Navbar */}
      <div style={{ position: 'relative', zIndex: 10, paddingTop: '0.25rem', paddingBottom: '0.25rem', width: '100%', maxWidth: '1200px', margin: '0 auto', flexShrink: 0 }}>
        <div className="flex justify-between items-center rounded-xl" style={{ padding: '0.25rem 1rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
           <div className="flex items-center gap-3">
             <div className="bg-black/30 p-1 px-2 rounded-full border border-white/5 text-xl flex items-center justify-center opacity-70">👤</div>
             <div>
               <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{session?.name || 'Admin'}</p>
               <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>@{session?.username || 'admin'}</p>
             </div>
           </div>
           <button type="button" onClick={onClose} className="btn" style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.3rem 0.8rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
             Volver
           </button>
        </div>
      </div>

      <div className="glass-panel modal-content" style={{ paddingBottom: '2rem', marginTop: '1rem' }}>

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

          {/* Selector desplegable premium para Socio/a (por defecto No Socio) */}
          <SelectField
            label="¿Es Socio/a de la Peña?"
            value={formData.isMember ? 'true' : 'false'}
            onChange={e => setFormData({ ...formData, isMember: e.target.value === 'true' })}
          >
            <option value="false">No (No Socio/a)</option>
            <option value="true">Sí (Socio/a)</option>
          </SelectField>

          <div className="input-group">
            <label className="input-label">Edad (años) *</label>
            <input 
              type="number" 
              className="input-field" 
              placeholder="Ej. 25"
              min="1"
              max="120"
              value={formData.age}
              onChange={e => setFormData({...formData, age: e.target.value})}
              required
            />
          </div>

          <div className="input-group">
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

          <div className="input-group">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={formData.canUploadTickets}
                onChange={e => setFormData({...formData, canUploadTickets: e.target.checked})}
                style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-primary)' }}
              />
              Permitir subida de tickets de compra
            </label>
            <p className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Permite a este usuario registrar gastos fotográficos o manuales.</p>
          </div>

          {/* Sección de Campos Opcionales al final */}
          <div className="pt-2 mt-1" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <p className="text-secondary text-xs uppercase font-bold tracking-wider mb-3">Campos Opcionales</p>

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
          </div>

          <div className="flex mobile-col justify-end gap-3 mt-4">
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
              {loading ? 'Guardando...' : 'Guardar Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
