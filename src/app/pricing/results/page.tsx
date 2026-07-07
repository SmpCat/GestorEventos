import { getSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAttendees } from '@/actions/attendance';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ResultsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  // Buscar Evento Activo
  const activeEvent = await prisma.event.findFirst({
    where: { isActive: true }
  });

  if (!activeEvent) {
    return (
      <div className="text-center py-12">
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</h1>
        <h2>Ningún evento operativo</h2>
        <p className="text-secondary mt-2">No hay evento encendido.</p>
      </div>
    );
  }

  // Cargar datos
  const attRes = await getAttendees(activeEvent.id);
  const attendees = attRes.success && attRes.data ? attRes.data : [];

  // Obtener total gastado
  const expensesAgg = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: { eventId: activeEvent.id }
  });
  const totalGastado = expensesAgg._sum.amount || 0;

  // Calcular lo recaudado y lo pendiente en base a los asistentes
  let totalRecaudado = 0;
  let totalPendiente = 0;
  attendees.forEach((att: any) => {
    if (att.expectedPayment !== null) {
      if (att.hasPaid) totalRecaudado += att.expectedPayment;
      else totalPendiente += att.expectedPayment;
    }
  });
  
  const saldoCaja = totalRecaudado - totalGastado;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.2rem' }}>Cuentas</h1>
        </div>
      </div>

      {/* Resumen Financiero Global */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="glass-panel p-6 text-center">
          <p className="text-secondary text-lg mb-2">Total Teórico</p>
          <p className="text-4xl font-bold">{totalRecaudado + totalPendiente}€</p>
        </div>
        <div className="glass-panel p-6 text-center" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <p className="text-secondary text-lg mb-2">Recaudado (Caja)</p>
          <p className="text-4xl font-bold" style={{ color: 'var(--accent-success)' }}>{totalRecaudado}€</p>
        </div>
        <div className="glass-panel p-6 text-center" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <p className="text-secondary text-lg mb-2">Total Gastado</p>
          <p className="text-4xl font-bold" style={{ color: 'var(--accent-danger)' }}>{totalGastado}€</p>
        </div>
        <div className="glass-panel p-6 text-center" style={{ backgroundColor: saldoCaja >= 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)' }}>
          <p className="text-secondary text-lg mb-2">Saldo Final</p>
          <p className="text-4xl font-bold" style={{ color: saldoCaja >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
            {saldoCaja >= 0 ? `+${saldoCaja}€` : `${saldoCaja}€`}
          </p>
        </div>
      </div>
    </div>
  );
}
