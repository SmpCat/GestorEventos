import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Obtener el primer usuario que haya en base de datos para usarlo de prueba
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No hay usuarios en la BD. Imposible crear asistente de prueba.');
      return;
    }

    // 2. Crear un evento inactivo
    const event = await prisma.event.create({
      data: {
        name: 'Evento Histórico Protegido 2024',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10'),
        isActive: false
      }
    });

    console.log(`✅ Evento creado: ${event.name} (ID: ${event.id})`);

    // 3. Apuntar al usuario al evento
    const attendee = await prisma.eventAttendee.create({
      data: {
        userId: user.id,
        eventId: event.id,
        daysAttending: 5,
        balance: 50
      }
    });
    console.log(`✅ Asistente creado (ID: ${attendee.id}) para el usuario ${user.name}`);

    // 4. Registrar un pago para proteger el evento
    const payment = await prisma.payment.create({
      data: {
        amount: 100,
        attendeeId: attendee.id
      }
    });
    
    console.log(`✅ Pago de ${payment.amount}€ registrado (ID: ${payment.id})`);
    console.log('\n¡Éxito! El evento ahora tiene datos críticos y debería mostrar el Candado Historificado.');
    
  } catch (error) {
    console.error('❌ Error inyectando datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
