'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div 
        style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
          width: '90%',
          maxWidth: '400px'
        }}
      >
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              backgroundColor: toast.type === 'error' ? 'var(--accent-danger)' : toast.type === 'success' ? 'var(--accent-success)' : 'var(--bg-secondary)',
              color: 'white',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              fontWeight: 'bold',
              textAlign: 'center',
              animation: 'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              pointerEvents: 'auto'
            }}
          >
            {toast.type === 'success' ? '✅ ' : toast.type === 'error' ? '❌ ' : 'ℹ️ '}
            {toast.message}
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
