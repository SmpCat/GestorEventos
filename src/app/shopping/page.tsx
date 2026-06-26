import { getSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ShoppingList from '@/components/ShoppingList';
import { getShoppingList } from '@/actions/shopping';

export const dynamic = 'force-dynamic';

export default async function ShoppingPage() {
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>📅</h1>
        <h2>No hay ningún evento activo</h2>
        <p className="text-secondary mt-2">Dile al Administrador que marque un evento como Operativo antes de planificar las compras.</p>
        <a href="/" className="btn btn-primary mt-6">Volver al Dashboard</a>
      </div>
    );
  }

  // Obtener Usuarios para el desplegable de asignación
  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

  // Obtener los productos
  const result = await getShoppingList(activeEvent.id);
  const items = result.success && result.data ? result.data : [];

  return (
    <div className="px-4">
      <ShoppingList 
        items={items} 
        eventId={activeEvent.id} 
        users={users} 
        currentUser={session}
      />
    </div>
  );
}
