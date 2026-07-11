'use client';

import { useState } from 'react';
import { login } from '@/actions/auth';
import Link from 'next/link';

export default function LoginForm() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await login(formData);

    if (res.success) {
      window.location.href = '/'; // Redirigir explícitamente a la raíz en vez de recargar
    } else {
      setError(res.error || 'Fallo de autenticación.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center mb-8">
        <h1 style={{ fontSize: '3rem', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>GestorEventos</h1>
        <p className="subtitle">La plataforma privada para tu grupo</p>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="text-center mb-6">Iniciar Sesión</h2>
        
        {error && <p style={{ color: 'var(--accent-danger)', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="input-group">
            <label className="input-label">Usuario</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Tu nombre de usuario"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Contraseña</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary mt-2" disabled={loading} style={{ padding: '1rem', fontSize: '1.1rem' }}>
            {loading ? 'Entrando...' : 'Acceder'}
          </button>
        </form>

        <div className="mt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
          <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>¿Es tu primera vez aquí?</p>
          <Link href="/register" className="btn btn-secondary w-full" style={{ padding: '0.8rem', display: 'block' }}>
            Quiero registrarme en el grupo
          </Link>
        </div>
      </div>
    </div>
  );
}
