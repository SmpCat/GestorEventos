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
    // 1. Auto-registrar a cualquier usuario que no tenga registro para este evento
    const usersWithoutAttendance = await prisma.user.findMany({
      where: {
        eventAttendances: {
          none: { eventId }
        }
      }
    });

    if (usersWithoutAttendance.length > 0) {
      await prisma.eventAttendee.createMany({
        data: usersWithoutAttendance.map(u => ({
          userId: u.id,
          eventId: eventId,
          daysAttending: 0,
          expectedPayment: 0
        }))
      });
    }

    // 2. Obtener la lista completa
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
        payments: { 
          orderBy: { date: 'desc' },
          include: { registeredBy: { select: { name: true, username: true } } }
        },
        history: { 
          orderBy: { date: 'desc' },
          include: { changedBy: { select: { name: true, username: true } } }
        }
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
    let expectedPayment = 0;

    if (daysAttending > 0) {
      // Buscar la tarifa aplicable
      const rule = await prisma.pricingRule.findUnique({
        where: { eventId_days: { eventId, days: daysAttending } }
      });

      if (!rule) {
        return { success: false, error: `No hay una tarifa configurada para ${daysAttending} días. Por favor, revisa los días o contacta al administrador.` };
      }
      expectedPayment = rule.price;
    }

    const attendee = await prisma.eventAttendee.create({
      data: {
        userId,
        eventId,
        daysAttending,
        expectedPayment,
        history: {
          create: {
            oldDays: 0,
            newDays: daysAttending,
            changedById: userId
          }
        }
      }
    });

    revalidatePath('/'); // Para actualizar el Dashboard
    return { success: true, data: attendee };
  } catch (error: any) {
    return { success: false, error: 'Error al unirte al evento: ' + error.message };
  }
}


export async function updateAttendeeDays(attendeeId: string, newDays: number) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'No autorizado' };

    const attendee = await prisma.eventAttendee.findUnique({ where: { id: attendeeId } });
    if (!attendee) return { success: false, error: 'Asistente no encontrado' };

    // Solo el propio usuario o un admin puede cambiar sus días
    if (attendee.userId !== session.id && !session.isAdmin) {
      return { success: false, error: 'No tienes permiso para modificar a este asistente' };
    }

    if (attendee.daysAttending === newDays) {
      return { success: true }; // Nada que cambiar
    }

    let expectedPayment = 0;
    if (newDays > 0) {
      const rule = await prisma.pricingRule.findUnique({
        where: { eventId_days: { eventId: attendee.eventId, days: newDays } }
      });

      if (!rule) {
        return { success: false, error: `No hay una tarifa configurada para ${newDays} días.` };
      }
      expectedPayment = rule.price;
    }

    await prisma.eventAttendee.update({
      where: { id: attendeeId },
      data: {
        daysAttending: newDays,
        expectedPayment,
        history: {
          create: {
            oldDays: attendee.daysAttending,
            newDays: newDays,
            changedById: session.id
          }
        }
      }
    });

    revalidatePath('/'); // For dashboard
    revalidatePath('/pricing/rules');
    revalidatePath('/pricing/attendees');
    revalidatePath('/pricing/results');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al actualizar días: ' + error.message };
  }
}

// --- GESTIÓN DE PAGOS ---

export async function addPayment(attendeeId: string, amount: number) {
  if (amount <= 0) {
    return { success: false, error: 'El importe del pago debe ser mayor que 0.' };
  }
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) return { success: false, error: 'No autorizado' };

    await prisma.payment.create({
      data: { 
        attendeeId, 
        amount,
        registeredById: session.id
      }
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

// Expulsar masivamente a todos los asistentes NO administradores (sin borrarlos del sistema global)
export async function expelAllNonAdminAttendees(eventId: string) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) return { success: false, error: 'No autorizado' };

    const attendees = await prisma.eventAttendee.findMany({
      where: { 
        eventId,
        user: { isAdmin: false } 
      },
      include: {
        payments: true,
        user: {
          include: {
            expenses: { where: { eventId } },
            shoppingTasks: { where: { eventId } }
          }
        }
      }
    });

    let deletedCount = 0;
    let skippedCount = 0;

    for (const att of attendees) {
      const hasExpenses = att.user.expenses.length > 0;
      const hasPayments = att.payments.length > 0;
      const hasShoppingItems = att.user.shoppingTasks && att.user.shoppingTasks.length > 0;

      if (!hasExpenses && !hasPayments && !hasShoppingItems) {
        await prisma.eventAttendee.delete({ where: { id: att.id } });
        deletedCount++;
      } else {
        skippedCount++;
      }
    }

    revalidatePath('/pricing/attendees');
    revalidatePath('/pricing/rules');
    revalidatePath('/pricing/results');
    return { success: true, deletedCount, skippedCount };
  } catch (error: any) {
    return { success: false, error: 'Error al expulsar asistentes: ' + error.message };
  }
}
