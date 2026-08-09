'use client';

import { useState } from 'react';
import SelectField from './SelectField';
import { bulkUpdateUsersFiltered, FilterType, BulkActionType } from '@/actions/users';
import styles from './Dashboard.module.css';

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
  EXPEL_CLEAN_ATTENDEES: 'Borrar asistentes limpios (sin historial del evento)',
  DELETE_CLEAN: 'Borrar usuarios limpios (sin historial de cuenta)'
};

export default function BulkUserEditCard({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('ALL');
  const [selectedAction, setSelectedAction] = useState<BulkActionType>('SET_NON_MEMBER');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  if (!isSuperAdmin) return null;

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
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${styles.menuItem} ${styles.adminMenuItem}`}
        style={{ 
          textAlign: 'left', 
          background: open ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)', 
          border: open ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'pointer'
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Edición Masiva</h3>
          <p className={styles.menuItemSubtitle}>
            {open ? '▲ Plegar panel' : 'Cambios masivos por filtro'}
          </p>
        </div>
        <div style={{ fontSize: '2rem' }}>👑</div>
      </button>

      {open && (
        <div 
          style={{ 
            gridColumn: '1 / -1',
            marginTop: '0.5rem',
            padding: '1.25rem', 
            border: '1px solid rgba(255, 255, 255, 0.15)', 
            background: 'rgba(15, 23, 42, 0.65)', 
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 'bold' }}>
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
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 'bold' }}>
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
                <option value="EXPEL_CLEAN_ATTENDEES">🧹 Borrar asistentes limpios (sin historial del evento)</option>
                <option value="DELETE_CLEAN">🗑️ Borrar usuarios limpios (sin historial de cuenta)</option>
              </SelectField>
            </div>
          </div>

          <button
            onClick={handleExecuteFilteredBulk}
            disabled={actionLoading}
            className="btn"
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              fontSize: '0.9rem', 
              fontWeight: 'bold',
              backgroundColor: (selectedAction === 'DELETE_CLEAN' || selectedAction === 'EXPEL_CLEAN_ATTENDEES') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: (selectedAction === 'DELETE_CLEAN' || selectedAction === 'EXPEL_CLEAN_ATTENDEES') ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
              color: (selectedAction === 'DELETE_CLEAN' || selectedAction === 'EXPEL_CLEAN_ATTENDEES') ? '#fca5a5' : '#ffffff',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            {actionLoading ? '⏳ Aplicando cambios masivos...' : '⚡ Aplicar Cambio Masivo'}
          </button>
        </div>
      )}
    </>
  );
}
