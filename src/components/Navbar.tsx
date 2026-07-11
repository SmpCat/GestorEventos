'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function Navbar({ session }: { session: any }) {
  const pathname = usePathname();
  const router = useRouter();

  // Si no hay sesión (pantalla de login), no mostramos esta barra superior
  if (!session) return null;

  const isDashboard = pathname === '/';

  return (
    <nav className="sticky top-0 z-50 pt-4 px-4 max-w-[1200px] mx-auto w-full mb-2">
      <div className="flex justify-between items-center bg-black/30 p-4 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
        
        {isDashboard ? (
           <div className="flex items-center gap-3">
             <div className="bg-primary/20 p-2 rounded-full border border-primary/30 text-xl flex items-center justify-center">👤</div>
             <div>
               <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bienvenido/a</p>
               <p style={{ fontWeight: 'bold' }}>{session.name}</p>
             </div>
           </div>
        ) : (
           <div />
        )}

        {isDashboard ? (
          <button 
            onClick={async () => {
              const { logout } = await import('@/actions/auth');
              await logout();
            }}
            className="btn btn-danger"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', fontWeight: 'bold' }}
          >
            Salir
          </button>
        ) : (
          <button 
            onClick={() => router.push('/')}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', fontWeight: 'bold' }}
          >
            Volver
          </button>
        )}
      </div>
    </nav>
  );
}
