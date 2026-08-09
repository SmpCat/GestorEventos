import { getSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ExpenseList from '@/components/ExpenseList';
import { getActiveEventCached } from '@/lib/cache';
import { getSystemConfig } from '@/actions/system';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  // Buscar Evento Activo y Datos del Usuario Actual
  const [activeEvent, currentUser] = await Promise.all([
    getActiveEventCached(),
    prisma.user.findUnique({ where: { id: session.id }, select: { canUploadTickets: true } })
  ]);

  const canUploadTickets = currentUser?.canUploadTickets ?? true;

  if (!activeEvent) {
    return (
      <div className="text-center py-12">
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</h1>
        <h2>Ningún evento operativo</h2>
        <p className="text-secondary mt-2">No hay evento encendido.</p>
      </div>
    );
  }

  // Cargar Gastos
  const expenses = await prisma.expense.findMany({
    where: { eventId: activeEvent.id },
    include: {
      purchaser: { select: { name: true } },
      items: true,
      images: true,
    },
    orderBy: { date: 'desc' }
  });

  return (
    <div>
      <ExpenseList 
        expenses={expenses} 
        isAdmin={session.isAdmin} 
        isSuperAdmin={session.username === 'admin'}
        currentUserId={session.id} 
        canUploadTickets={canUploadTickets}
      />
    </div>
  );
}
