import { getSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { getAttendees } from '@/actions/attendance';
import { getActiveEventCached } from '@/lib/cache';
import FinancesAdmin from '@/components/FinancesAdmin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function FinancesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  // Comprobar evento activo
  const activeEvent = await getActiveEventCached();

  if (!activeEvent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>📅</h1>
        <h2>No hay ningún evento activo</h2>
        <p className="text-secondary mt-2">Dile al Administrador que marque un evento como Operativo antes de gestionar las finanzas.</p>
      </div>
    );
  }

  // Obtener los datos (usamos la misma lógica que asistentes porque incluye los payments)
  const result = await getAttendees(activeEvent.id);
  const attendees = result.success && result.data ? result.data : [];

  return (
    <div className="px-4 space-y-10">
      <Link href="/dashboard" className="text-secondary" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
        ← Volver al Dashboard
      </Link>
      
      <FinancesAdmin 
        attendees={attendees} 
        eventId={activeEvent.id} 
        currentUser={session}
      />
    </div>
  );
}
