'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/actions/auth';
import { getSystemConfig, toggleMaintenanceMode } from '@/actions/system';
import UserProfileModal from './UserProfileModal';

export default function Navbar({ session }: { session: any }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [fullUser, setFullUser] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);

  const isSuperAdmin = session?.username === 'admin';

  useEffect(() => {
    if (isSuperAdmin) {
      getSystemConfig().then(res => {
        if (res.success && res.data) {
          setMaintenanceActive(res.data.maintenanceMode);
        }
      });
    }
  }, [isSuperAdmin]);

  const fetchAndOpenProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/user-profile?id=${session.id}`).then(r => r.json()).catch(() => null);
      if (res && res.user) {
        setFullUser(res.user);
      } else {
        setFullUser({
          id: session.id,
          name: session.name,
          username: session.username,
          isMember: session.isMember ?? true,
          age: session.age ?? 18,
          email: session.email || '',
          phone: session.phone || '',
        });
      }
    } catch {
      setFullUser({
        id: session.id,
        name: session.name,
        username: session.username,
        isMember: session.isMember ?? true,
        age: session.age ?? 18,
        email: session.email || '',
        phone: session.phone || '',
      });
    }
    setLoadingProfile(false);
    setIsProfileModalOpen(true);
  };

  const handleToggleMaintenance = async () => {
    const nextState = !maintenanceActive;
    const confirmText = nextState 
      ? '¿Estás seguro de ACTIVAR el modo mantenimiento? Los usuarios no podrán acceder a la app.' 
      : '¿Estás seguro de DESACTIVAR el modo mantenimiento? La app volverá a estar pública.';
    
    if (!confirm(confirmText)) return;

    setLoadingMaintenance(true);
    const res = await toggleMaintenanceMode(nextState);
    setLoadingMaintenance(false);
    if (res.success) {
      setMaintenanceActive(nextState);
      alert(nextState ? '🔴 Mantenimiento activado' : '🟢 Mantenimiento desactivado. La app vuelve a estar activa.');
      router.refresh();
    } else {
      alert(res.error || 'Error al cambiar mantenimiento');
    }
  };

  if (!session) return null;

  const isDashboard = pathname === '/';

  return (
    <>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, paddingTop: '0.25rem', paddingBottom: '0.25rem', paddingLeft: '1rem', paddingRight: '1rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="flex justify-between items-center bg-black/30 rounded-xl" style={{ padding: '0.25rem 1rem', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)' }}>
          
          {isDashboard ? (
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-1 px-2 rounded-full border border-primary/30 text-xl flex items-center justify-center">👤</div>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bienvenido/a</p>
                <p style={{ fontWeight: 'bold' }}>{session.name}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="bg-black/30 p-1 px-2 rounded-full border border-white/5 text-xl flex items-center justify-center opacity-70">👤</div>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{session.name}</p>
                <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>@{session.username}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAndOpenProfile}
              className="btn"
              disabled={loadingProfile}
              style={{ 
                padding: '0.3rem 0.75rem', 
                fontSize: '0.85rem', 
                fontWeight: 'bold',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              {loadingProfile ? '⏳' : '👤 Mi Perfil'}
            </button>

            {isSuperAdmin && (
              <button
                onClick={handleToggleMaintenance}
                disabled={loadingMaintenance}
                className="btn"
                title="Superadmin: Control de Mantenimiento"
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  backgroundColor: maintenanceActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: maintenanceActive ? '#fca5a5' : '#94a3b8',
                  border: maintenanceActive ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {loadingMaintenance ? '⏳' : (maintenanceActive ? '🔴 Mantenimiento ON' : '⚙️ Mantenimiento')}
              </button>
            )}

            {isDashboard ? (
              <button 
                onClick={async () => {
                  await logout();
                  window.location.href = '/';
                }}
                className="btn btn-danger"
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.9rem', fontWeight: 'bold' }}
              >
                Salir
              </button>
            ) : (
              <button 
                onClick={() => {
                  const event = new CustomEvent('navbar-volver', { cancelable: true });
                  window.dispatchEvent(event);
                  if (!event.defaultPrevented) {
                    router.push('/');
                  }
                }}
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.9rem', fontWeight: 'bold' }}
              >
                Volver
              </button>
            )}
          </div>
        </div>
      </nav>

      {fullUser && (
        <UserProfileModal 
          user={fullUser}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </>
  );
}
