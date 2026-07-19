'use client';

import { useEffect, useCallback } from 'react';
import { logout } from '@/actions/auth';

export default function SessionTimeout() {
  const handleTimeout = useCallback(async () => {
    await logout();
    alert("Tu sesión ha caducado por inactividad. Vuelve a iniciar sesión.");
    window.location.href = '/';
  }, []);

  useEffect(() => {
    let lastActivity = Date.now();
    const INACTIVITY_LIMIT = 2 * 60 * 60 * 1000; // 2 horas en milisegundos
    
    const updateActivity = () => {
      lastActivity = Date.now();
    };

    // Escuchar eventos de actividad del usuario
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    // Comprobar la inactividad cada minuto
    const intervalId = setInterval(() => {
      if (Date.now() - lastActivity > INACTIVITY_LIMIT) {
        handleTimeout();
      }
    }, 60000); 

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      clearInterval(intervalId);
    };
  }, [handleTimeout]);

  return null; // Es un componente puramente lógico, no renderiza nada visible
}
