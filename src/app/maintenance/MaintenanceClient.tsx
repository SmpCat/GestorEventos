'use client';

import { useState } from 'react';
import LoginForm from '@/components/LoginForm';

export default function MaintenanceClient({ message }: { message?: string }) {
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div 
        className="glass-panel max-w-lg w-full p-8 text-center animate-scale-in flex flex-col items-center gap-6"
        style={{ 
          backgroundColor: 'rgba(15, 23, 42, 0.9)', 
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '1.5rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}
      >
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-2"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
        >
          🛠️
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Aplicación en Mantenimiento
        </h1>

        <p className="text-gray-300 text-base md:text-lg leading-relaxed">
          {message || 'Estamos realizando labores de optimización y mantenimiento en la plataforma. Volveremos en breve.'}
        </p>

        <div className="w-full pt-6 border-t border-white/10 flex flex-col items-center gap-3 mt-2">
          {!showAdminLogin ? (
            <button
              onClick={() => setShowAdminLogin(true)}
              className="text-xs text-gray-400 hover:text-white transition-colors underline"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              🔒 Acceso Administrador
            </button>
          ) : (
            <div className="w-full text-left">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Acceso Exclusivo Superadmin
                </span>
                <button
                  onClick={() => setShowAdminLogin(false)}
                  className="text-xs text-gray-400 hover:text-white"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Ocultar
                </button>
              </div>
              <LoginForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
