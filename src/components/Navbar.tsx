'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function Navbar({ session }: { session: any }) {
  const pathname = usePathname();
  const router = useRouter();

  // Si no hay sesión (pantalla de login), no mostramos esta barra superior
  if (!session) return null;

  const isDashboard = pathname === '/';

  return (
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

        {isDashboard ? (
          <button 
            onClick={async () => {
              const { logout } = await import('@/actions/auth');
              await logout();
            }}
            className="btn btn-danger"
            style={{ padding: '0.3rem 0.8rem', fontSize: '0.9rem', fontWeight: 'bold' }}
          >
            Salir
          </button>
        ) : (
          <button 
            onClick={() => router.push('/')}
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.8rem', fontSize: '0.9rem', fontWeight: 'bold' }}
          >
            Volver
          </button>
        )}
      </div>
    </nav>
  );
}
