import { getSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAttendees } from '@/actions/attendance';
import { getActiveEventCached } from '@/lib/cache';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ResultsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  // Buscar Evento Activo
  const activeEvent = await getActiveEventCached();

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
  let totalBoteEsperado = 0;
  
  attendees.forEach((att: any) => {
    const amountPaid = att.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
    totalRecaudado += amountPaid;
    
    const expected = att.expectedPayment !== null ? att.expectedPayment : 0;
    totalBoteEsperado += expected;
  });
  
  const saldoFisico = totalRecaudado - totalGastado;
  const dineroPorCobrar = totalBoteEsperado - totalRecaudado;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.2rem' }}>Ingresos y Gastos</h1>
        </div>
      </div>

      {/* Resumen Financiero Global */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="glass-panel p-6 text-center">
          <p className="text-secondary text-sm font-bold uppercase tracking-wider mb-2">Bote Teórico Total</p>
          <p className="text-3xl font-bold">{totalBoteEsperado}€</p>
          <p className="text-xs text-secondary mt-2">Suma de las cuotas asignadas</p>
        </div>
        
        <div className="glass-panel p-6 text-center">
          <p className="text-secondary text-sm font-bold uppercase tracking-wider mb-2">Dinero en Caja (Real)</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--accent-success)' }}>{totalRecaudado}€</p>
          <p className="text-xs text-secondary mt-2">Falta cobrar: <span className="text-warning font-bold">{dineroPorCobrar > 0 ? `${dineroPorCobrar}€` : 'Nada'}</span></p>
        </div>
        
        <div className="glass-panel p-6 text-center">
          <p className="text-secondary text-sm font-bold uppercase tracking-wider mb-2">Total Gastado</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--accent-danger)' }}>{totalGastado}€</p>
          <p className="text-xs text-secondary mt-2">Suma de todos los tickets</p>
        </div>
        
        <div className="glass-panel p-6 text-center" style={{ backgroundColor: saldoFisico >= 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.1)' }}>
          <p className="text-secondary text-sm font-bold uppercase tracking-wider mb-2">Saldo Final Disponible</p>
          <p className="text-4xl font-bold" style={{ color: saldoFisico >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
            {saldoFisico >= 0 ? `+${saldoFisico}€` : `${saldoFisico}€`}
          </p>
          <p className="text-xs mt-2" style={{ color: saldoFisico < 0 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
            {saldoFisico < 0 ? '¡ALERTA! El Bote está en números rojos. Faltan fondos para devolver gastos.' : 'Dinero físico sobrante tras gastos.'}
          </p>
        </div>
      </div>
    </div>
  );
}
