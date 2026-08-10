import { getSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ExpenseList from '@/components/ExpenseList';
import { getActiveEventCached } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  const activeEvent = await getActiveEventCached();
  const isSuperAdmin = session.username === 'admin';

  const currentUser = await prisma.user.findUnique({ where: { id: session.id }, select: { canUploadTickets: true } });
  const canUploadTickets = isSuperAdmin ? true : (currentUser?.canUploadTickets ?? true);

  if (!activeEvent) {
    return (
      <div className="text-center py-12">
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</h1>
        <h2>Ningún evento operativo</h2>
        <p className="text-secondary mt-2">No hay evento encendido.</p>
      </div>
    );
  }

  const [expenses, groups, shoppingLists] = await Promise.all([
    prisma.expense.findMany({
      where: { eventId: activeEvent.id },
      include: {
        purchaser: { select: { name: true } },
        items: true,
        images: true,
        group: true,
      },
      orderBy: { date: 'desc' }
    }),
    prisma.expenseGroup.findMany({
      where: { eventId: activeEvent.id },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.shoppingList.findMany({
      where: { eventId: activeEvent.id },
      select: { name: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);
  const shoppingListNames = shoppingLists.map((l: any) => l.name);

  return (
    <div>
      <ExpenseList
        expenses={expenses}
        groups={groups}
        shoppingListNames={shoppingListNames}
        isAdmin={session.isAdmin}
        isSuperAdmin={isSuperAdmin}
        currentUserId={session.id}
        canUploadTickets={canUploadTickets}
      />
    </div>
  );
}
