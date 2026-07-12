import { getUsers } from '@/actions/users';
import UserMaintenance from '@/components/UserMaintenance';
import { getSession } from '@/actions/auth';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const result = await getUsers();
  const session = await getSession();
  
  const users = result.success && result.data ? result.data : [];

  return (
    <UserMaintenance users={users} session={session} />
  );
}
