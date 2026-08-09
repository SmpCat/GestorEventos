import { getSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import BulkUserEditPage from '@/components/BulkUserEditPage';

export const dynamic = 'force-dynamic';

export default async function AdminBulkEditPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  const isSuperAdmin = session.username === 'admin';

  return (
    <BulkUserEditPage isSuperAdmin={isSuperAdmin} />
  );
}
