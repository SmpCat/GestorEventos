import { getSession } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  if (!session.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>⛔</h1>
        <h2>Acceso Denegado</h2>
        <p className="text-secondary mt-2">Esta zona es exclusiva para Administradores.</p>
        <a href="/" className="btn btn-primary mt-6">Volver al Dashboard</a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      {children}
    </div>
  );
}
