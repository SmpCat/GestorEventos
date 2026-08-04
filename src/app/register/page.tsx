'use client';

import { useState } from 'react';
import { registerPublicUser } from '@/actions/users';
import { login } from '@/actions/auth';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    isMember: false,
    age: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.name || !formData.username || !formData.password) {
      setError('Por favor, rellena los campos obligatorios (*).');
      setLoading(false);
      return;
    }

    const res = await registerPublicUser(formData);

    if (res.success) {
      // Hacemos auto-login con los datos recién creados
      await login({ username: formData.username, password: formData.password });
      // Redirección instantánea al Dashboard en lugar de mostrar mensaje intermedio
      window.location.href = '/';
    } else {
      setError(res.error || 'Ocurrió un error al registrarse.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center mb-8">
        <h1 style={{ fontSize: '2.5rem', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>GestorEventos</h1>
        <p className="text-secondary">Registro para nuevos asistentes</p>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px' }}>
        {error && <p style={{ color: 'var(--accent-danger)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}

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

          <div className="input-group">
            <label className="input-label">Usuario *</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="pepe_garcia"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Contraseña *</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Crea una contraseña"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {/* Selector binario prominente para Socio/a */}
          <div className="input-group">
            <label className="input-label mb-1.5 block">¿Es Socio/a de la Peña? *</label>
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl" style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isMember: true })}
                className="py-2.5 px-3 rounded-lg text-sm font-bold transition-all text-center"
                style={{
                  backgroundColor: formData.isMember ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  border: formData.isMember ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid transparent',
                  color: formData.isMember ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                  boxShadow: formData.isMember ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                Sí (Socio)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isMember: false })}
                className="py-2.5 px-3 rounded-lg text-sm font-bold transition-all text-center"
                style={{
                  backgroundColor: !formData.isMember ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  border: !formData.isMember ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid transparent',
                  color: !formData.isMember ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                  boxShadow: !formData.isMember ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                No (No Socio)
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Edad (años)</label>
            <input 
              type="number" 
              className="input-field" 
              placeholder="Ej. 25"
              min="0"
              max="120"
              value={formData.age}
              onChange={e => setFormData({...formData, age: e.target.value})}
            />
          </div>

          {/* Sección de Campos Opcionales al final */}
          <div className="pt-2 mt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <p className="text-secondary text-xs uppercase font-bold tracking-wider mb-3">Campos Opcionales</p>

            <div className="flex flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Email (Opcional, para recuperar cuenta)</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="pepe@email.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Teléfono (Opcional, para pagos de Bizum)</label>
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

          <button type="submit" className="btn mt-4 w-full" disabled={loading} style={{ backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '1rem' }}>
            {loading ? 'Creando cuenta...' : 'Unirse al Grupo'}
          </button>
        </form>

        <div className="mt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
          <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>¿Ya tienes una cuenta?</p>
          <Link href="/" className="btn w-full" style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.8rem', display: 'block' }}>
            Volver al Inicio de Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
