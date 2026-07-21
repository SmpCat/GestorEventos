import { getSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { getAttendees } from '@/actions/attendance';
import { getEventPayments } from '@/actions/finances';
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

  // Obtener los datos 
  const attendeesResult = await getAttendees(activeEvent.id);
  const attendees = attendeesResult.success && attendeesResult.data ? attendeesResult.data : [];

  const paymentsResult = await getEventPayments(activeEvent.id);
  const payments = paymentsResult.success && paymentsResult.data ? paymentsResult.data : [];

  return (
    <div className="px-4 space-y-10">
      <Link href="/dashboard" className="text-secondary" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
        ← Volver al Dashboard
      </Link>
      
      <FinancesAdmin 
        attendees={attendees} 
        payments={payments}
        eventId={activeEvent.id} 
        currentUser={session}
      />
    </div>
  );
}
