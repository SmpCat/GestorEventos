import { getSession } from '@/actions/auth';
import { prisma } from '@/lib/prisma';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';
import JoinEventBanner from '@/components/JoinEventBanner';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getActiveEventCached } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();

  if (!session) {
    return <LoginForm />;
  }

  const activeEvent = await getActiveEventCached();

  let attendee = null;
  let pricingRules: any[] = [];

  try {
    if (activeEvent) {
      // Usamos Promise.all para cargar en paralelo si el usuario no tiene caché
      const [attendeeRes, rulesRes] = await Promise.all([
        prisma.eventAttendee.findUnique({
          where: { userId_eventId: { userId: session.id, eventId: activeEvent.id } },
          include: { payments: true }
        }),
        prisma.pricingRule.findMany({
          where: { eventId: activeEvent.id },
          orderBy: { days: 'asc' }
        })
      ]);
      
      if (attendeeRes) {
        const amountPaid = attendeeRes.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
        const currentQuota = attendeeRes.expectedPayment || 0;
        attendee = {
          ...attendeeRes,
          amountPaid,
          currentQuota
        };
      }
      pricingRules = rulesRes;
    }
  } catch (error) {
    console.error("Error obteniendo datos del dashboard", error);
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Si hay un evento activo y el usuario NO está apuntado, mostrar el Banner de Unión o un Aviso */}
      {activeEvent && !attendee ? (
        pricingRules.length > 0 ? (
          <JoinEventBanner 
            eventId={activeEvent.id} 
            eventName={activeEvent.name} 
            pricingRules={pricingRules}
            userId={session.id}
          />
        ) : (
          <div className="glass-panel text-center py-12" style={{ borderColor: 'var(--accent-warning)', boxShadow: '0 0 20px rgba(234, 179, 8, 0.1)' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--accent-warning)' }}>⚠️ Faltan las Tarifas</h2>
            <p className="text-secondary mb-6" style={{ fontSize: '1.1rem' }}>El evento <strong>{activeEvent.name}</strong> está operativo, pero aún no se han configurado los precios por día.</p>
            {session.isAdmin ? (
              <Link href="/pricing/rules" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', fontSize: '1.1rem', textDecoration: 'none' }}>
                Configurar Tarifas Ahora
              </Link>
            ) : (
              <p className="text-secondary italic">Por favor, vuelve más tarde cuando el administrador haya fijado las cuotas.</p>
            )}
          </div>
        )
      ) : (
        /* De lo contrario, mostrar el Dashboard normal (pasándole el attendee si existe) */
        <Dashboard 
          session={session} 
          activeEvent={activeEvent} 
          attendee={attendee} 
        />
      )}
    </div>
  );
}
