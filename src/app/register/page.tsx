'use client';

import { useState } from 'react';
import { registerPublicUser } from '@/actions/users';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      setSuccess(true);
    } else {
      setError(res.error || 'Ocurrió un error al registrarse.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="glass-panel text-center" style={{ maxWidth: '400px', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2>¡Registro Completado!</h2>
          <p className="text-secondary mt-4">
            Tu cuenta ha sido creada con éxito. Pide al Administrador que te agregue al evento activo para empezar a subir facturas.
          </p>
          <button 
            className="btn btn-primary mt-6 w-full"
            onClick={() => window.location.href = '/'}
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

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

          <div className="input-group mt-2">
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

          <button type="submit" className="btn btn-primary mt-4 w-full" disabled={loading} style={{ padding: '1rem' }}>
            {loading ? 'Creando cuenta...' : 'Unirse al Grupo'}
          </button>
        </form>

        <div className="mt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
          <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>¿Ya tienes una cuenta?</p>
          <Link href="/" className="btn btn-secondary w-full" style={{ padding: '0.8rem', display: 'block' }}>
            Volver al Inicio de Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
