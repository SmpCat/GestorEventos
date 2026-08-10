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
  let totalRecaudadoCuotas = 0; // solo pagos de asistentes, para calcular pendiente de cuota
  let totalBoteEsperado = 0;
  let deudaRezagados = 0;
  let personasRezagadas = 0;

  attendees.forEach((att: any) => {
    const amountPaid = att.payments?.reduce((acc: number, p: any) => {
      return p.type === 'INCOME' ? acc + p.amount : acc;
    }, 0) || 0;
    const expected = att.expectedPayment !== null ? att.expectedPayment : 0;
    totalRecaudado += amountPaid;
    totalRecaudadoCuotas += amountPaid;
    totalBoteEsperado += expected;
    if (expected > amountPaid) {
      deudaRezagados += (expected - amountPaid);
      personasRezagadas++;
    }
  });

  // Pagos globales del flujo de caja (sin asistente vinculado, ej: sobrante año anterior)
  const globalIncomeAgg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { eventId: activeEvent.id, attendeeId: null, type: 'INCOME' }
  });
  const globalExpenseAgg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { eventId: activeEvent.id, attendeeId: null, type: 'EXPENSE' }
  });
  totalRecaudado += globalIncomeAgg._sum.amount || 0;
  const totalSalidasGlobales = globalExpenseAgg._sum.amount || 0;

  // Restar también las devoluciones a asistentes (salidas físicas del bote)
  const attendeeExpenseAgg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { eventId: activeEvent.id, attendeeId: { not: null }, type: 'EXPENSE' }
  });
  const totalDevoluciones = attendeeExpenseAgg._sum.amount || 0;

  // Tickets pagados de bolsillo propio NO salen del bote → excluirlos de totalGastado
  const pocketExpensesAgg = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: { eventId: activeEvent.id, contributorAttendeeId: { not: null } }
  });
  const totalGastadoBote = totalGastado - (pocketExpensesAgg._sum.amount || 0);

  const saldoFisico = totalRecaudado - totalGastadoBote - totalSalidasGlobales - totalDevoluciones;
  // Pendiente de pago = solo cuotas (los ingresos globales no son cuotas de asistentes)
  const dineroPorCobrar = Math.max(0, totalBoteEsperado - totalRecaudadoCuotas);

  // Pendiente de reembolso: lo que el bote debe a asistentes (balances negativos)
  let pendienteReembolso = 0;
  attendees.forEach((att: any) => {
    const amountPaid = att.payments?.reduce((acc: number, p: any) => p.type === 'INCOME' ? acc + p.amount : acc, 0) || 0;
    const reimbursed = att.payments?.reduce((acc: number, p: any) => p.type === 'EXPENSE' ? acc + p.amount : acc, 0) || 0;
    const contributed = att.contributedExpenses?.reduce((acc: number, e: any) => acc + e.amount, 0) || 0;
    const quota = att.expectedPayment !== null ? att.expectedPayment : 0;
    const balance = quota - amountPaid - contributed + reimbursed;
    if (balance < 0) pendienteReembolso += Math.abs(balance);
  });
  const pendienteReembolsoRounded = Math.round(pendienteReembolso * 100) / 100;

  return (
    <>
      <style>{`
        .results-container {
          max-width: 56rem;
          margin: 0 auto;
          padding: 0.25rem 0 1.5rem 0;
        }
        .results-header {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          margin-bottom: 1rem;
          gap: 1rem;
        }
        @media (min-width: 768px) {
          .results-header {
            flex-direction: row;
            align-items: center;
          }
        }
        .results-title {
          font-size: 2.5rem;
          margin-bottom: 0.2rem;
          margin-top: 0;
        }
        .inner-black-box {
          background-color: rgba(0,0,0,0.3);
          padding: 1rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        @media (min-width: 768px) {
          .inner-black-box {
            padding: 1.5rem;
          }
        }
        .results-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }
        @media (min-width: 768px) {
          .results-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .results-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }
        .results-card {
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 1rem !important;
          background-color: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          border-radius: 0.5rem;
        }
        .results-card-title {
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 0.5rem 0;
        }
        .results-card-value {
          font-size: 1.875rem;
          font-weight: bold;
          line-height: 1;
          margin: 0.25rem 0;
        }
        .results-card-subtitle {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin: 0;
        }
      `}</style>
      <div className="results-container">
        <div className="results-header">
          <div>
            <h1 className="results-title">Resumen de caja</h1>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="inner-black-box">
            <div className="results-grid">
              <div className="results-card">
                <p className="results-card-title">Dinero en Caja</p>
                <p className="results-card-value" style={{ color: saldoFisico >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                  {saldoFisico >= 0 ? `+${saldoFisico.toFixed(2)}` : saldoFisico.toFixed(2)}€
                </p>
                <p className="results-card-subtitle">Saldo físico actual del bote</p>
              </div>

              <div className="results-card">
                <p className="results-card-title">Total Gastado</p>
                <p className="results-card-value">{totalGastado.toFixed(2)}€</p>
                <p className="results-card-subtitle">Suma de todos los tickets</p>
              </div>

              <div className="results-card" style={{ borderColor: dineroPorCobrar > 0 ? 'rgba(239,68,68,0.5)' : 'inherit', backgroundColor: dineroPorCobrar > 0 ? 'rgba(239,68,68,0.1)' : 'inherit' }}>
                <p className="results-card-title" style={{ color: dineroPorCobrar > 0 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>Pendiente de Pago</p>
                <p className="results-card-value" style={{ color: dineroPorCobrar > 0 ? 'var(--accent-danger)' : 'inherit' }}>{dineroPorCobrar.toFixed(2)}€</p>
                <p className="results-card-subtitle" style={{ color: dineroPorCobrar > 0 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                  {dineroPorCobrar > 0 ? `Cuotas por cobrar` : 'Todos al día'}
                </p>
              </div>

              <div className="results-card" style={{ borderColor: pendienteReembolsoRounded > 0 ? 'rgba(251,191,36,0.5)' : 'inherit', backgroundColor: pendienteReembolsoRounded > 0 ? 'rgba(251,191,36,0.07)' : 'inherit' }}>
                <p className="results-card-title" style={{ color: pendienteReembolsoRounded > 0 ? '#fbbf24' : 'var(--text-secondary)' }}>Pendiente de Reembolso</p>
                <p className="results-card-value" style={{ color: pendienteReembolsoRounded > 0 ? '#fbbf24' : 'inherit' }}>{pendienteReembolsoRounded.toFixed(2)}€</p>
                <p className="results-card-subtitle" style={{ color: pendienteReembolsoRounded > 0 ? '#fbbf24' : 'var(--text-secondary)' }}>
                  {pendienteReembolsoRounded > 0 ? 'El bote debe a asistentes' : 'Sin reembolsos pendientes'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
