'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/actions/auth';

// --- GESTIÓN DE TARIFAS (ADMIN) ---

export async function getPricingRules(eventId: string) {
  try {
    const rules = await prisma.pricingRule.findMany({
      where: { eventId },
      orderBy: { days: 'asc' },
    });
    return { success: true, data: rules };
  } catch (error: any) {
    return { success: false, error: 'Error al obtener tarifas: ' + error.message };
  }
}

export async function savePricingRules(eventId: string, rules: { days: number, price: number }[]) {
  // Validate uniqueness of days and > 0
  const daysSet = new Set<number>();
  for (const rule of rules) {
    if (rule.days <= 0) {
      return { success: false, error: 'No se pueden crear tarifas de 0 días.' };
    }
    if (daysSet.has(rule.days)) {
      return { success: false, error: `No puedes tener varias reglas para el mismo número de días (tiene repetido: ${rule.days} días).` };
    }
    daysSet.add(rule.days);
  }

  // CASO 4: Bloqueo Estricto si se intentan borrar tarifas en uso
  const attendees = await prisma.eventAttendee.findMany({ where: { eventId } });
  for (const att of attendees) {
    if (att.daysAttending > 0 && !daysSet.has(att.daysAttending)) {
      return { 
        success: false, 
        error: `No puedes borrar la tarifa de ${att.daysAttending} días porque hay asistentes apuntados con esos días. Por favor, cambia a esas personas primero.` 
      };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Borrar anteriores
      await tx.pricingRule.deleteMany({ where: { eventId } });
      // Crear nuevas
      if (rules.length > 0) {
        await tx.pricingRule.createMany({
          data: rules.map(r => ({ ...r, eventId })),
        });
      }
    });
    revalidatePath('/pricing/rules');
    revalidatePath('/pricing/attendees');
    revalidatePath('/pricing/results');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al guardar tarifas: ' + error.message };
  }
}

// --- GESTIÓN DE ASISTENTES (USUARIOS Y ADMIN) ---

export async function getAttendees(eventId: string) {
  try {
    const attendees = await prisma.eventAttendee.findMany({
      where: { eventId },
      include: {
        user: { 
          select: { 
            id: true, 
            name: true, 
            username: true,
            expenses: { where: { eventId } }
          } 
        },
        payments: { orderBy: { date: 'desc' } },
      },
      orderBy: { user: { name: 'asc' } },
    });
    return { success: true, data: attendees };
  } catch (error: any) {
    return { success: false, error: 'Error al obtener asistentes: ' + error.message };
  }
}

export async function checkAttendance(eventId: string, userId: string) {
  try {
    const attendee = await prisma.eventAttendee.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    return { success: true, data: attendee };
  } catch (error: any) {
    return { success: false, error: 'Error al comprobar asistencia: ' + error.message };
  }
}

// Cuando un usuario se une al evento
export async function joinEvent(eventId: string, userId: string, daysAttending: number) {
  try {
    // Buscar la tarifa aplicable
    const rule = await prisma.pricingRule.findUnique({
      where: { eventId_days: { eventId, days: daysAttending } }
    });

    if (!rule) {
      return { success: false, error: `No hay una tarifa configurada para ${daysAttending} días. Por favor, revisa los días o contacta al administrador.` };
    }

    const expectedPayment = rule.price;

    const attendee = await prisma.eventAttendee.create({
      data: {
        userId,
        eventId,
        daysAttending,
        expectedPayment,
      }
    });

    revalidatePath('/'); // Para actualizar el Dashboard
    return { success: true, data: attendee };
  } catch (error: any) {
    return { success: false, error: 'Error al unirte al evento: ' + error.message };
  }
}

// Admin actualiza a un asistente
export async function updateAttendeeAdmin(attendeeId: string, customPrice: number | null, adminComment: string | null) {
  try {
    await prisma.eventAttendee.update({
      where: { id: attendeeId },
      data: {
        expectedPayment: customPrice,
        adminComment,
      }
    });
    revalidatePath('/pricing/rules');
    revalidatePath('/pricing/attendees');
    revalidatePath('/pricing/results');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al actualizar asistente: ' + error.message };
  }
}

// --- GESTIÓN DE PAGOS ---

export async function addPayment(attendeeId: string, amount: number) {
  if (amount <= 0) {
    return { success: false, error: 'El importe del pago debe ser mayor que 0.' };
  }
  try {
    await prisma.payment.create({
      data: { attendeeId, amount }
    });
    revalidatePath('/pricing/attendees');
    revalidatePath('/pricing/results');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al registrar pago: ' + error.message };
  }
}

export async function deletePayment(paymentId: string) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) return { success: false, error: 'No autorizado' };

    await prisma.payment.delete({
      where: { id: paymentId }
    });

    revalidatePath('/pricing/attendees');
    revalidatePath('/pricing/results');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al eliminar pago: ' + error.message };
  }
}

export async function deleteAttendee(attId: string) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) return { success: false, error: 'No autorizado' };

    const attendee = await prisma.eventAttendee.findUnique({ where: { id: attId } });
    if (!attendee) return { success: false, error: 'Asistente no encontrado' };

    const paymentsCount = await prisma.payment.count({
      where: { attendeeId: attId }
    });
    if (paymentsCount > 0) {
      return { success: false, error: 'No se puede expulsar porque tiene pagos registrados. Borra sus pagos primero.' };
    }

    const expensesCount = await prisma.expense.count({
      where: { purchaserId: attendee.userId, eventId: attendee.eventId }
    });
    if (expensesCount > 0) {
      return { success: false, error: 'No se puede expulsar porque tiene tickets registrados. Borra o reasigna sus tickets primero.' };
    }

    await prisma.eventAttendee.delete({
      where: { id: attId }
    });

    revalidatePath('/pricing/attendees');
    revalidatePath('/pricing/rules');
    revalidatePath('/pricing/results');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al eliminar asistente: ' + error.message };
  }
}
