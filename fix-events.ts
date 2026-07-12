import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEvents() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const activeEvents = events.filter(e => e.isActive);

  if (activeEvents.length > 1) {
    console.log(`Found ${activeEvents.length} active events. Fixing...`);
    
    // Keep the first one active, deactivate the rest
    const [keepActive, ...toDeactivate] = activeEvents;

    for (const event of toDeactivate) {
      await prisma.event.update({
        where: { id: event.id },
        data: { isActive: false }
      });
      console.log(`Deactivated event ${event.name}`);
    }
  } else {
    console.log('No duplicate active events found.');
  }
}

fixEvents()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
