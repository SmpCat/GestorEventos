'use client';

import { useState } from 'react';
import Link from 'next/link';
import SelectField from './SelectField';
import { bulkUpdateUsersFiltered, FilterType, BulkActionType } from '@/actions/users';

const FILTER_LABELS: Record<FilterType, string> = {
  ALL: 'Todos los usuarios',
  UNDER_18: 'Menores de 18 años (< 18)',
  OVER_18: 'Mayores de 18 años (18+)',
  MEMBERS: 'Solo Socios',
  NON_MEMBERS: 'Solo No Socios',
  ADMINS: 'Solo Administradores',
  NON_ADMINS: 'Solo Usuarios Normales'
};

const ACTION_LABELS: Record<BulkActionType, string> = {
  SET_MEMBER: 'Marcar como Socio/a (isMember: Sí)',
  SET_NON_MEMBER: 'Marcar como No Socio/a (isMember: No)',
  GRANT_ADMIN: 'Otorgar rol de Administrador',
  REVOKE_ADMIN: 'Quitar rol de Administrador',
  SET_AGE_18: 'Establecer Edad en 18 años',
  DISABLE_TICKET_UPLOAD: 'Deshabilitar subida de tickets',
  ENABLE_TICKET_UPLOAD: 'Habilitar subida de tickets',
  EXPEL_CLEAN_ATTENDEES: 'Borrar asistentes limpios (sin historial del evento)',
  DELETE_CLEAN: 'Borrar usuarios limpios (sin historial de cuenta)'
};

export default function BulkUserEditPage({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('ALL');
  const [selectedAction, setSelectedAction] = useState<BulkActionType>('SET_NON_MEMBER');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  if (!isSuperAdmin) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#fca5a5', maxWidth: '600px', margin: '3rem auto' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>⛔ Acceso Restringido</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Solo el Superadministrador (admin) tiene permiso para acceder a la edición masiva.
        </p>
        <Link href="/" className="btn" style={{ padding: '0.75rem 1.5rem', display: 'inline-block' }}>
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const handleExecuteFilteredBulk = async () => {
    const filterText = FILTER_LABELS[selectedFilter];
    const actionText = ACTION_LABELS[selectedAction];

    const confirmMessage = selectedAction === 'DELETE_CLEAN'
      ? `🚨 ¿SÚPER SEGURO? Se van a BORRAR permanentemente de la base de datos los usuarios coincidentes con "${filterText}" que no tengan pagos ni tickets asociados.`
      : selectedAction === 'EXPEL_CLEAN_ATTENDEES'
      ? `🚨 ¿SEGURO? Se van a EXPULSAR del evento activo los asistentes coincidentes con "${filterText}" que no tengan pagos ni tickets asociados en este evento.`
      : `¿Estás seguro de aplicar la acción "${actionText}" a los usuarios coincidentes con "${filterText}"?\n(La cuenta Superadmin nunca se verá afectada).`;

    if (!window.confirm(confirmMessage)) return;

    setActionLoading(true);
    const res = await bulkUpdateUsersFiltered(selectedFilter, selectedAction);
    setActionLoading(false);

    if (!res.success) {
      alert(res.error || 'Error al ejecutar la acción masiva.');
      return;
    }

    if (res.isDelete) {
      alert(`¡Borrado masivo completado! Se han eliminado ${res.deletedCount} usuarios limpios (${res.skippedCount} conservados por tener historial).`);
    } else if (res.isExpel) {
      alert(`¡Expulsión masiva completada! Se han retirado del evento ${res.deletedCount} asistentes limpios (${res.skippedCount} conservados por tener pagos o tickets).`);
    } else {
      alert(`¡Actualización masiva completada! Se han modificado ${res.count} usuarios.`);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Botón de volver */}
      <Link 
        href="/" 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          color: 'var(--text-secondary)', 
          textDecoration: 'none', 
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          fontWeight: 'bold'
        }}
      >
        ← Volver al Dashboard
      </Link>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          👑 Edición Masiva Personalizada
        </h1>
        <p className="subtitle" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Aplica modificaciones y permisos masivos por filtro a los usuarios del sistema.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: '#ffffff', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                1. Filtrar Usuarios Objetivo:
              </label>
              <SelectField
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as FilterType)}
                disabled={actionLoading}
                containerStyle={{ marginBottom: 0 }}
              >
                <option value="ALL">👥 Todos los usuarios</option>
                <option value="UNDER_18">👶 Menores de 18 años (&lt; 18)</option>
                <option value="OVER_18">👴 Mayores de 18 años (18+)</option>
                <option value="MEMBERS">🎗️ Solo Socios</option>
                <option value="NON_MEMBERS">👤 Solo No Socios</option>
                <option value="ADMINS">🛡️ Solo Administradores</option>
                <option value="NON_ADMINS">👤 Solo Usuarios Normales</option>
              </SelectField>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: '#ffffff', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                2. Acción Masiva a Ejecutar:
              </label>
              <SelectField
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value as BulkActionType)}
                disabled={actionLoading}
                containerStyle={{ marginBottom: 0 }}
              >
                <option value="SET_MEMBER">🎗️ Marcar como Socio/a (isMember: Sí)</option>
                <option value="SET_NON_MEMBER">👤 Marcar como No Socio/a (isMember: No)</option>
                <option value="GRANT_ADMIN">👑 Otorgar rol de Administrador</option>
                <option value="REVOKE_ADMIN">🛡️ Quitar rol de Administrador</option>
                <option value="SET_AGE_18">🎂 Fijar Edad en 18 años</option>
                <option value="DISABLE_TICKET_UPLOAD">🔒 Deshabilitar subida de tickets</option>
                <option value="ENABLE_TICKET_UPLOAD">🔓 Habilitar subida de tickets</option>
                <option value="EXPEL_CLEAN_ATTENDEES">🧹 Borrar asistentes limpios (sin historial del evento)</option>
                <option value="DELETE_CLEAN">🗑️ Borrar usuarios limpios (sin historial de cuenta)</option>
              </SelectField>
            </div>
          </div>

          <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: '0.5rem' }}>
            <button
              onClick={handleExecuteFilteredBulk}
              disabled={actionLoading}
              className="btn"
              style={{ 
                width: '100%', 
                padding: '1rem', 
                fontSize: '1rem', 
                fontWeight: 'bold',
                backgroundColor: (selectedAction === 'DELETE_CLEAN' || selectedAction === 'EXPEL_CLEAN_ATTENDEES') ? 'rgba(239, 68, 68, 0.25)' : 'var(--accent-primary, #3b82f6)',
                border: (selectedAction === 'DELETE_CLEAN' || selectedAction === 'EXPEL_CLEAN_ATTENDEES') ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(255, 255, 255, 0.2)',
                color: (selectedAction === 'DELETE_CLEAN' || selectedAction === 'EXPEL_CLEAN_ATTENDEES') ? '#fca5a5' : '#ffffff',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              {actionLoading ? '⏳ Aplicando cambios masivos...' : '⚡ Aplicar Cambio Masivo'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
