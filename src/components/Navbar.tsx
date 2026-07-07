'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function Navbar({ session }: { session: any }) {
  const pathname = usePathname();
  const router = useRouter();

  // Si no hay sesión (pantalla de login) o estamos en el Dashboard, no mostramos esta barra superior
  if (!session || pathname === '/') return null;

  return (
    <nav className="sticky top-0 z-50 pt-4 px-4 max-w-[1200px] mx-auto w-full mb-2">
      <div className="flex justify-end items-center bg-black/30 p-4 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
        <button 
          onClick={() => router.push('/')}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', fontWeight: 'bold' }}
        >
          Volver
        </button>
      </div>
    </nav>
  );
}
