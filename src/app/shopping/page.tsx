import { getSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ShoppingList from '@/components/ShoppingList';
import { getShoppingList, getShoppingListEvidences } from '@/actions/shopping';
import { getActiveEventCached } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export default async function ShoppingPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  // Comprobar evento activo
  const activeEvent = await getActiveEventCached();

  if (!activeEvent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>📅</h1>
        <h2>No hay ningún evento activo</h2>
        <p className="text-secondary mt-2">Dile al Administrador que marque un evento como Operativo antes de planificar las compras.</p>
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

  // Obtener las evidencias (listas escaneadas)
  const evidencesResult = await getShoppingListEvidences(activeEvent.id);
  const evidences = evidencesResult.success && evidencesResult.data ? evidencesResult.data : [];

  return (
    <div className="px-4 space-y-10">

      {/* Lista de la compra interactiva */}
      <ShoppingList 
        items={items} 
        evidences={evidences}
        eventId={activeEvent.id} 
        users={users} 
        currentUser={session}
      />
    </div>
  );
}
