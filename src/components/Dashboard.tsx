'use client';

import Link from 'next/link';
import { logout } from '@/actions/auth';

export default function Dashboard({ session, activeEvent, attendee }: { session: any, activeEvent: any, attendee?: any }) {

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex flex-col gap-6">
      <div 
        className="glass-panel text-center relative overflow-hidden" 
        style={{ 
          padding: '2.5rem 1rem', 
          borderColor: 'rgba(255,255,255,0.1)', 
          borderBottom: 'none',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%), url('/images/fiestas-valdeganga.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
          borderBottomLeftRadius: '1.5rem',
          borderBottomRightRadius: '1.5rem'
        }}
      >
        <h2 className="relative z-10" style={{ fontSize: '2.8rem', color: '#fff', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.8)', fontWeight: '800', letterSpacing: '-1px' }}>
          {activeEvent ? activeEvent.name : 'Ningún evento activo'}
        </h2>

        {/* Estado de la Cuota del Asistente */}
        {attendee && (
          <div className="mt-8 p-4 rounded-xl flex flex-col md:flex-row items-center justify-center gap-6 relative z-10 mx-auto" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', maxWidth: '600px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
            <p style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>
              Tu cuota estimada: <strong style={{ color: 'var(--accent-primary)', fontSize: '1.3rem', textShadow: '0 0 10px rgba(99,102,241,0.5)' }}>{attendee.expectedPayment !== null ? `${attendee.expectedPayment}€` : 'Calculando...'}</strong>
            </p>
            <div className={`badge ${attendee.hasPaid ? 'bg-success/40 text-white border border-success' : 'bg-danger/40 text-white border border-danger'}`} style={{ padding: '0.6rem 1.2rem', fontSize: '1rem', backdropFilter: 'blur(5px)' }}>
              {attendee.hasPaid ? '✅ Cuota Pagada' : '🔴 Pendiente de pago'}
            </div>
          </div>
        )}
      </div>

      <div className="grid mt-6" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        
        <Link href="/pricing/attendees" className="glass-panel flex items-center justify-between p-6 transition-colors hover:bg-white/5" style={{ textDecoration: 'none', color: 'inherit', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Asistentes</h3>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Ver y editar pagos</p>
          </div>
          <div style={{ fontSize: '2rem' }}>👥</div>
        </Link>

        <Link href="/pricing/rules" className="glass-panel flex items-center justify-between p-6 transition-colors hover:bg-white/5" style={{ textDecoration: 'none', color: 'inherit', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Configurador de Tarifas</h3>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Reglas de precios</p>
          </div>
          <div style={{ fontSize: '2rem' }}>⚙️</div>
        </Link>

        <Link href="/pricing/results" className="glass-panel flex items-center justify-between p-6 transition-colors hover:bg-white/5" style={{ textDecoration: 'none', color: 'inherit', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Ingresos y Gastos</h3>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Resumen financiero</p>
          </div>
          <div style={{ fontSize: '2rem' }}>📈</div>
        </Link>

        <Link href="/shopping" className="glass-panel flex items-center justify-between p-6 transition-colors hover:bg-white/5" style={{ textDecoration: 'none', color: 'inherit', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Lista de la Compra</h3>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Qué falta por comprar</p>
          </div>
          <div style={{ fontSize: '2rem' }}>🛒</div>
        </Link>

        {/* Gastos */}
        {activeEvent ? (
          <Link href="/expenses" className="glass-panel flex items-center justify-between p-6 transition-colors hover:bg-white/5" style={{ textDecoration: 'none', color: 'inherit', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Gastos Registrados</h3>
              <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Ver listado y añadir tickets</p>
            </div>
            <div style={{ fontSize: '2rem' }}>📸</div>
          </Link>
        ) : (
          <div className="glass-panel flex items-center justify-between p-6" style={{ opacity: 0.5, cursor: 'not-allowed', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Añadir Gasto</h3>
              <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Requiere evento activo</p>
            </div>
            <div style={{ fontSize: '2rem' }}>📸</div>
          </div>
        )}
      </div>

      {/* Zona VIP para Administradores */}
      {session.isAdmin && (
        <div style={{ marginTop: '3.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 className="mb-6 text-white">👑 Zona de Administración</h3>
          <div className="grid" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <Link href="/admin/events" className="glass-panel flex flex-col items-center justify-center p-6 transition-colors" style={{ color: 'inherit', textDecoration: 'none', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</span>
              <strong style={{ fontSize: '1.1rem' }}>Gestión de Eventos</strong>
            </Link>
            <Link href="/admin/users" className="glass-panel flex flex-col items-center justify-center p-6 transition-colors" style={{ color: 'inherit', textDecoration: 'none', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</span>
              <strong style={{ fontSize: '1.1rem' }}>Usuarios</strong>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
