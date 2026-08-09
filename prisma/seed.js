const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const adminUsername = 'admin';

  // 1. Comprobar si el usuario admin ya existe para no duplicarlo ni pisarlo
  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername }
  });

  if (!existingAdmin) {
    const hashedPassword = '$2b$10$7WU6H1CVsZkpPnecZ4GzNuhrqUtPGmCyARhygLu21ME.kNZ.0UbhO';
    await prisma.user.create({
      data: {
        name: 'Administrador',
        username: adminUsername,
        password: hashedPassword,
        isAdmin: true,
        isMember: true,
        age: 30
      }
    });
    console.log('✅ Usuario admin creado automáticamente.');
  } else {
    console.log('ℹ️ El usuario admin ya existe. No se ha modificado.');
  }

  // 2. MIGRACIÓN AUTOMÁTICA DE PRODUCCIÓN:
  // Garantizar que todos los usuarios existentes en la BBDD de producción queden configurados
  // como Socios (isMember: true) y mayores de 18 años (age: 18) para conservar su estatus.
  const updatedUsers = await prisma.user.updateMany({
    where: {
      OR: [
        { age: null },
        { isMember: false }
      ]
    },
    data: {
      isMember: true,
      age: 18
    }
  });

  if (updatedUsers.count > 0) {
    console.log(`✅ Migración de Producción: ${updatedUsers.count} usuarios existentes asegurados como Socios (isMember: true) y Mayores de 18 años.`);
  }

  // 3. Recalcular cuotas esperadas en producción para los asistentes de eventos activos
  const activeEvent = await prisma.event.findFirst({ where: { isActive: true } });
  if (activeEvent) {
    const rules = await prisma.pricingRule.findMany({ where: { eventId: activeEvent.id } });
    const attendees = await prisma.eventAttendee.findMany({
      where: { eventId: activeEvent.id, daysAttending: { gt: 0 } },
      include: { user: true }
    });

    for (const att of attendees) {
      if (!rules || rules.length === 0) continue;
      const isMember = att.user.isMember ?? true;
      const age = att.user.age ?? 18;
      const drinkOption = att.drinkOption ?? 'CON_ALCOHOL';
      const eatFood = att.eatFood ?? true;
      const daysAttending = att.daysAttending;

      const matchingRules = rules.filter(rule => {
        const daysMatch = daysAttending >= rule.days && (rule.maxDays === null || rule.maxDays === undefined || daysAttending <= rule.maxDays) || (daysAttending === rule.days);
        if (!daysMatch) return false;
        if (rule.isMember !== null && rule.isMember !== isMember) return false;
        if (rule.minAge !== null && age < rule.minAge) return false;
        if (rule.maxAge !== null && age > rule.maxAge) return false;
        if (rule.drinkOption !== null && rule.drinkOption !== undefined && rule.drinkOption !== drinkOption) return false;
        if (rule.eatFood !== null && rule.eatFood !== undefined && rule.eatFood !== eatFood) return false;
        return true;
      });

      if (matchingRules.length > 0) {
        matchingRules.sort((a, b) => {
          const scoreA = (a.isMember !== null ? 1 : 0) + (a.minAge !== null ? 1 : 0) + (a.drinkOption !== null ? 1 : 0) + (a.eatFood !== null ? 1 : 0);
          const scoreB = (b.isMember !== null ? 1 : 0) + (b.minAge !== null ? 1 : 0) + (b.drinkOption !== null ? 1 : 0) + (b.eatFood !== null ? 1 : 0);
          return scoreB - scoreA;
        });
        await prisma.eventAttendee.update({
          where: { id: att.id },
          data: { expectedPayment: matchingRules[0].price }
        });
      }
    }
    console.log(`✅ Cuotas de producción recalculadas para ${attendees.length} asistentes.`);
  }

  // 4. Eliminar cualquier registro de asistencia del usuario técnico admin
  const adminUser = await prisma.user.findUnique({ where: { username: adminUsername } });
  if (adminUser) {
    await prisma.eventAttendee.deleteMany({
      where: { userId: adminUser.id }
    });
  }
}

main()
  .catch((e) => {
    console.error('Error al poblar la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
