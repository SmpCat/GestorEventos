import { getSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getPricingRules } from '@/actions/attendance';
import Link from 'next/link';
import RulesAdmin from '@/components/RulesAdmin';

export const dynamic = 'force-dynamic';

export default async function RulesPage() {
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
  const rulesRes = await getPricingRules(activeEvent.id);
  const rules = rulesRes.success && rulesRes.data ? rulesRes.data : [];

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.2rem' }}>Configurador de Tarifas</h1>
          <p className="text-secondary">Evento Operativo: <strong style={{ color: 'var(--accent-primary)' }}>{activeEvent.name}</strong></p>
        </div>
        <Link href="/" className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          ← Volver al Dashboard
        </Link>
      </div>

      <RulesAdmin 
        eventId={activeEvent.id} 
        initialRules={rules} 
        isAdmin={session.isAdmin}
      />
    </div>
  );
}
