import { getSession } from '@/actions/auth';
import { prisma } from '@/lib/prisma';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';
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
      } else {
        // Auto-registro: si hay evento activo y el usuario no tiene registro, lo creamos con 0 días
        const newAttendee = await prisma.eventAttendee.create({
          data: {
            userId: session.id,
            eventId: activeEvent.id,
            daysAttending: 0,
            expectedPayment: 0,
          },
          include: { payments: true }
        });
        attendee = { ...newAttendee, amountPaid: 0, currentQuota: 0 };
      }
      pricingRules = rulesRes;
    }
  } catch (error) {
    console.error("Error obteniendo datos del dashboard", error);
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Dashboard
        session={session}
        activeEvent={activeEvent}
        attendee={attendee}
        pricingRules={pricingRules}
      />
    </div>
  );
}
