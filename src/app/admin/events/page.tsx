import { getEvents } from '@/actions/events';
import EventMaintenance from '@/components/EventMaintenance';

export const dynamic = 'force-dynamic';

export default async function AdminEventsPage() {
  const result = await getEvents();
  
  // En caso de error, pasamos un array vacío
  const events = result.success && result.data ? result.data : [];

  return (
    <EventMaintenance events={events} />
  );
}
