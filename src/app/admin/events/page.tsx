import { getEvents } from '@/actions/events';
import EventMaintenance from '@/components/EventMaintenance';
import { getSession } from '@/actions/auth';

export const dynamic = 'force-dynamic';

export default async function AdminEventsPage() {
  const result = await getEvents();
  const session = await getSession();
  
  const events = result.success && result.data ? result.data : [];

  return (
    <EventMaintenance events={events} session={session} />
  );
}
