'use client';

import Link from 'next/link';
import { logout } from '@/actions/auth';

export default function Dashboard({ session, activeEvent, attendee }: { session: any, activeEvent: any, attendee?: any }) {

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-black/30 p-4 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-full border border-primary/30">
            👤
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bienvenido/a</p>
            <p style={{ fontWeight: 'bold' }}>{session.name}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
          Salir
        </button>
      </div>

      <div className="glass-panel text-center" style={{ padding: '2rem 1rem', borderColor: 'var(--accent-primary)', boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)' }}>
        <p className="text-secondary mb-1" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Evento Operativo Actual</p>
        <h2 style={{ fontSize: '2rem', color: 'var(--accent-primary)', margin: 0 }}>
          {activeEvent ? activeEvent.name : 'Ningún evento activo'}
        </h2>
        {activeEvent && activeEvent.endDate && (
          <p className="mt-2 text-secondary" style={{ fontSize: '0.85rem' }}>
            Termina el: {new Date(activeEvent.endDate).toLocaleDateString('es-ES')}
          </p>
        )}

        {/* Estado de la Cuota del Asistente */}
        {attendee && (
          <div className="mt-6 p-4 rounded-lg flex flex-col md:flex-row items-center justify-center gap-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
              Tu cuota estimada: <strong className="text-white">{attendee.expectedPayment !== null ? `${attendee.expectedPayment}€` : 'Calculando...'}</strong>
            </p>
            <div className={`badge ${attendee.hasPaid ? 'bg-success/20 text-success border border-success' : 'bg-danger/20 text-danger border border-danger'}`}>
              {attendee.hasPaid ? '✅ Cuota Pagada' : '🔴 Pendiente de pago'}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 mt-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        
        {/* Acción Principal: Subir Gasto */}
        <div className="glass-panel text-center flex flex-col justify-center gap-4" style={{ padding: '3rem 2rem', background: 'rgba(99, 102, 241, 0.05)' }}>
          <div style={{ fontSize: '3rem' }}>📸</div>
          <div>
            <h3 style={{ marginBottom: '0.5rem' }}>Añadir Gasto</h3>
            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Sube una foto del ticket o la lista del carnicero para registrarlo.</p>
          </div>
          <button className="btn btn-primary mt-2" style={{ padding: '1rem', fontSize: '1.1rem' }} disabled={!activeEvent}>
            Subir Ticket
          </button>
        </div>

        {/* Acciones Secundarias */}
        <div className="flex flex-col gap-4">
          <Link href="/shopping" className="glass-panel flex items-center justify-between p-6 transition-colors hover:bg-white/5" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Lista de la Compra</h3>
              <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Qué falta por comprar</p>
            </div>
            <div style={{ fontSize: '2rem' }}>🛒</div>
          </Link>

          <Link href="/pricing" className="glass-panel flex items-center justify-between p-6 transition-colors hover:bg-white/5" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Asistentes y Cuotas</h3>
              <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Consulta quién viene a la fiesta</p>
            </div>
            <div style={{ fontSize: '2rem' }}>👥</div>
          </Link>

          <div className="glass-panel flex items-center justify-between p-6">
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Balance / Gastos</h3>
              <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Quién debe a quién</p>
            </div>
            <div style={{ fontSize: '2rem' }}>⚖️</div>
          </div>
        </div>
      </div>

      {/* Zona VIP para Administradores */}
      {session.isAdmin && (
        <div className="mt-8 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 className="mb-4" style={{ color: 'var(--accent-warning)' }}>👑 Zona de Administración</h3>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <Link href="/admin/events" className="glass-panel flex flex-col items-center justify-center p-6 transition-colors" style={{ color: 'inherit', textDecoration: 'none', background: 'rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</span>
              <strong style={{ fontSize: '1.1rem' }}>Gestión de Eventos</strong>
            </Link>
            <Link href="/admin/users" className="glass-panel flex flex-col items-center justify-center p-6 transition-colors" style={{ color: 'inherit', textDecoration: 'none', background: 'rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</span>
              <strong style={{ fontSize: '1.1rem' }}>Usuarios</strong>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
