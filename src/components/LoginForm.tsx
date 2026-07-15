'use client';

import { useState } from 'react';
import { login } from '@/actions/auth';
import Link from 'next/link';
import styles from './LoginForm.module.css';

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
    <div className={styles.loginWrapper}>
      <div className={styles.loginHeader}>
        <h1 className={styles.loginTitle}>GestorEventos</h1>
        <p className="subtitle" style={{ fontSize: '0.85rem', color: '#ffffff', margin: 0 }}>by Salvador Martínez Palacios</p>
      </div>

      <div className={`glass-panel ${styles.loginFormContainer}`}>
        <div className={styles.innerBlackBox}>
          <h2 className={styles.loginFormTitle}>Iniciar Sesión</h2>
          
          {error && <p className={styles.loginError}>{error}</p>}

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className="input-group">
              <label className="input-label">Usuario</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Tu nombre de usuario"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                suppressHydrationWarning
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
                suppressHydrationWarning
              />
            </div>

            <button type="submit" className={`btn ${styles.loginSubmitBtn}`} disabled={loading}>
              {loading ? 'Entrando...' : 'Acceder'}
            </button>
          </form>

          <div className={styles.loginFooter}>
            <p className={styles.loginFooterText}>¿Es tu primera vez aquí?</p>
            <Link href="/register" className={`btn ${styles.loginRegisterBtn}`}>
              Quiero registrarme
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
