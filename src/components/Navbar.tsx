'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/actions/auth';
import UserProfileModal from './UserProfileModal';

export default function Navbar({ session }: { session: any }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [fullUser, setFullUser] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

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

  if (!session) return null;

  const isDashboard = pathname === '/';

  return (
    <>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, paddingTop: '0.25rem', paddingBottom: '0.25rem', paddingLeft: '1rem', paddingRight: '1rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="flex justify-between items-center bg-black/30 rounded-xl" style={{ padding: '0.25rem 1rem', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)' }}>
          
          {/* Identidad de usuario interactiva (Al clicar abre Mi Perfil) */}
          <button
            onClick={fetchAndOpenProfile}
            disabled={loadingProfile}
            className="flex items-center gap-3 text-left transition-all hover:opacity-80 active:scale-95"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0.4rem', borderRadius: '0.5rem' }}
            title="Haz clic para editar tu perfil"
          >
            <div className="bg-primary/20 p-1 px-2 rounded-full border border-primary/30 text-xl flex items-center justify-center">
              {loadingProfile ? '⏳' : '👤'}
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {isDashboard ? 'Bienvenido/a (Mi Perfil)' : session.name}
              </p>
              <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                {isDashboard ? session.name : `@${session.username}`}
              </p>
            </div>
          </button>

          {/* Botón Salir / Volver */}
          <div>
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
