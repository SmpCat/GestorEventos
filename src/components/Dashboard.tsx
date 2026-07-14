'use client';

import Link from 'next/link';
import { logout } from '@/actions/auth';
import styles from './Dashboard.module.css';

export default function Dashboard({ session, activeEvent, attendee }: { session: any, activeEvent: any, attendee?: any }) {

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={`glass-panel ${styles.heroBanner}`}>
        <h2 className={styles.heroTitle}>
          {activeEvent ? activeEvent.name : 'Ningún evento activo'}
        </h2>

        {/* Estado de la Cuota del Asistente */}
        {attendee && (
          <div className={styles.attendeeQuotaBox}>
            <p className={styles.quotaStatusText} style={{ fontSize: '1.1rem', margin: 0 }}>
              Tu cuota es: <strong style={{ fontSize: '1.3rem', textShadow: '0 2px 15px rgba(0,0,0,0.9), 0 0 5px rgba(255,255,255,0.3)' }}>{attendee.expectedPayment !== null ? `${attendee.expectedPayment}€` : 'Calculando...'}</strong>
            </p>
            {(() => {
              const amountPaid = attendee.amountPaid || 0;
              const quota = attendee.currentQuota || 0;
              const diff = amountPaid - quota; 
              
              let saldoColor = '#fff';
              if (diff < 0) saldoColor = 'var(--accent-danger)'; // Debe dinero
              else if (diff > 0) saldoColor = 'var(--accent-success)'; // Le deben dinero
              else saldoColor = 'var(--accent-success)'; // Clavado

              return (
                <div className={styles.quotaStatus}>
                  <div className={styles.quotaStatusText}>
                    <span className={styles.quotaStatusLabel} style={{ color: 'rgba(255,255,255,0.9)' }}>Pagado:</span> <strong className={styles.quotaStatusValue}>{amountPaid}€</strong>
                  </div>
                  <div className={styles.quotaDivider}></div>
                  <div style={{ color: saldoColor, textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
                    <span className={styles.quotaStatusLabel} style={{ color: 'rgba(255,255,255,0.9)', marginRight: '0.25rem' }}>Saldo:</span>
                    <strong className={styles.saldoValue}>{diff === 0 ? '0€' : `${diff > 0 ? '+' : ''}${diff}€`}</strong>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <div className={styles.menuGrid}>
        
        <Link href="/pricing/attendees" className={`glass-panel ${styles.menuItem}`}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Asistentes</h3>
            <p className={styles.menuItemSubtitle}>Ver y editar pagos</p>
          </div>
          <div style={{ fontSize: '2rem' }}>👥</div>
        </Link>

        <Link href="/pricing/rules" className={`glass-panel ${styles.menuItem}`}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Configurador de Tarifas</h3>
            <p className={styles.menuItemSubtitle}>Reglas de precios</p>
          </div>
          <div style={{ fontSize: '2rem' }}>⚙️</div>
        </Link>

        <Link href="/pricing/results" className={`glass-panel ${styles.menuItem}`}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Ingresos y Gastos</h3>
            <p className={styles.menuItemSubtitle}>Resumen financiero</p>
          </div>
          <div style={{ fontSize: '2rem' }}>📈</div>
        </Link>

        <Link href="/shopping" className={`glass-panel ${styles.menuItem}`}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Lista de la Compra</h3>
            <p className={styles.menuItemSubtitle}>Qué falta por comprar</p>
          </div>
          <div style={{ fontSize: '2rem' }}>🛒</div>
        </Link>

        {/* Gastos */}
        {activeEvent ? (
          <Link href="/expenses" className={`glass-panel ${styles.menuItem}`}>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Gastos Registrados</h3>
              <p className={styles.menuItemSubtitle}>Ver listado y añadir tickets</p>
            </div>
            <div style={{ fontSize: '2rem' }}>📸</div>
          </Link>
        ) : (
          <div className={`glass-panel ${styles.menuItem} ${styles.menuItemDisabled}`}>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Añadir Gasto</h3>
              <p className={styles.menuItemSubtitle}>Requiere evento activo</p>
            </div>
            <div style={{ fontSize: '2rem' }}>📸</div>
          </div>
        )}
      </div>

      {/* Zona VIP para Administradores */}
      {session.isAdmin && (
        <div className={styles.adminZone}>
          <h3 className={styles.adminTitle}>👑 Zona de Administración</h3>
          <div className={styles.menuGrid}>
            <Link href="/admin/events" className={`glass-panel ${styles.menuItem} ${styles.adminMenuItem}`}>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Gestión de Eventos</h3>
                <p className={styles.menuItemSubtitle}>Crear y editar eventos</p>
              </div>
              <div style={{ fontSize: '2rem' }}>📅</div>
            </Link>
            <Link href="/admin/users" className={`glass-panel ${styles.menuItem} ${styles.adminMenuItem}`}>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Usuarios</h3>
                <p className={styles.menuItemSubtitle}>Mantenimiento y roles</p>
              </div>
              <div style={{ fontSize: '2rem' }}>👥</div>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
