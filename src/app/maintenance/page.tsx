import { getSystemConfig } from '@/actions/system';
import { getSession } from '@/actions/auth';
import MaintenanceClient from './MaintenanceClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MaintenancePage() {
  const [configRes, session] = await Promise.all([
    getSystemConfig(),
    getSession()
  ]);

  const maintenanceMode = configRes.data?.maintenanceMode ?? false;

  // Si el mantenimiento está desactivado, redirigir a la home
  if (!maintenanceMode) {
    redirect('/');
  }

  // Si ya es superadmin, redirigir a la home o admin
  if (session?.username === 'admin') {
    redirect('/');
  }

  return <MaintenanceClient message={configRes.data?.maintenanceMessage || undefined} />;
}
