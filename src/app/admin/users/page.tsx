import { getUsers } from '@/actions/users';
import UserMaintenance from '@/components/UserMaintenance';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const result = await getUsers();
  
  // En caso de error, podríamos mostrar un mensaje, pero para el MVP pasamos array vacío
  const users = result.success && result.data ? result.data : [];

  return (
    <UserMaintenance users={users} />
  );
}
