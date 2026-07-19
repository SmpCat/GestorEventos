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
  let deudaRezagados = 0;
  let personasRezagadas = 0;
  
  attendees.forEach((att: any) => {
    const amountPaid = att.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
    const expected = att.expectedPayment !== null ? att.expectedPayment : 0;
    
    totalRecaudado += amountPaid;
    totalBoteEsperado += expected;

    if (expected > amountPaid) {
      deudaRezagados += (expected - amountPaid);
      personasRezagadas++;
    }
  });
  
  const saldoFisico = totalRecaudado - totalGastado;
  const dineroPorCobrar = totalBoteEsperado - totalRecaudado;

  return (
    <>
      <style>{`
        .results-container {
          max-width: 56rem;
          margin: 0 auto;
          padding: 1.5rem 0;
        }
        .results-header {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          margin-bottom: 1.5rem;
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
          gap: 1.5rem;
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
            <h1 className="results-title">Ingresos y Gastos</h1>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="inner-black-box">
            <div className="results-grid">
              <div className="results-card">
                <p className="results-card-title">Bote Total</p>
                <p className="results-card-value">{totalBoteEsperado}€</p>
                <p className="results-card-subtitle">Si todos pagan sus días</p>
              </div>
              
              <div className="results-card">
                <p className="results-card-title">Dinero en Caja</p>
                <p className="results-card-value" style={{ color: 'var(--accent-success)' }}>{totalRecaudado}€</p>
                <p className="results-card-subtitle">Bote físico real disponible</p>
              </div>

              <div className="results-card" style={{ borderColor: deudaRezagados > 0 ? 'rgba(239, 68, 68, 0.5)' : 'inherit', backgroundColor: deudaRezagados > 0 ? 'rgba(239, 68, 68, 0.1)' : 'inherit' }}>
                <p className="results-card-title" style={{ color: deudaRezagados > 0 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>Pendiente</p>
                <p className="results-card-value" style={{ color: deudaRezagados > 0 ? 'var(--accent-danger)' : 'inherit' }}>{deudaRezagados}€</p>
                <p className="results-card-subtitle" style={{ color: deudaRezagados > 0 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                  {deudaRezagados > 0 ? `Deuda de ${personasRezagadas} ${personasRezagadas === 1 ? 'persona' : 'personas'}` : 'Todos están al día'}
                </p>
              </div>
              
              <div className="results-card">
                <p className="results-card-title">Total Gastado</p>
                <p className="results-card-value">{totalGastado}€</p>
                <p className="results-card-subtitle">Suma de todos los tickets</p>
              </div>
              
              <div className="results-card">
                <p className="results-card-title">Saldo Final</p>
                <p className="results-card-value" style={{ color: saldoFisico >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                  {saldoFisico >= 0 ? `+${saldoFisico}€` : `${saldoFisico}€`}
                </p>
                <p className="results-card-subtitle" style={{ color: saldoFisico < 0 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                  {saldoFisico < 0 ? '¡ALERTA! Bote en rojo.' : 'Físicamente sobrante'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
