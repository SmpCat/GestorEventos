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

export interface PricingRuleInput {
  id?: string;
  name?: string | null;
  days: number;
  price: number;
  isMember?: boolean | null;
  minAge?: number | null;
  maxAge?: number | null;
  drinksAlcohol?: boolean | null;
}

export async function savePricingRules(eventId: string, rules: PricingRuleInput[]) {
  for (const rule of rules) {
    if (rule.days <= 0) {
      return { success: false, error: 'No se pueden crear tarifas de 0 días.' };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Borrar anteriores
      await tx.pricingRule.deleteMany({ where: { eventId } });
      // Crear nuevas
      if (rules.length > 0) {
        await tx.pricingRule.createMany({
          data: rules.map(r => ({
            name: r.name || null,
            days: r.days,
            price: r.price,
            isMember: r.isMember !== undefined ? r.isMember : null,
            minAge: r.minAge !== undefined ? r.minAge : null,
            maxAge: r.maxAge !== undefined ? r.maxAge : null,
            drinksAlcohol: r.drinksAlcohol !== undefined ? r.drinksAlcohol : null,
            eventId
          })),
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
            isMember: true,
            age: true,
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

// Helper para calcular la tarifa esperada basada en Socio, Edad, Alcohol y Días
export async function calculateExpectedPayment(
  eventId: string,
  userId: string,
  daysAttending: number,
  overrideDrinksAlcohol: boolean = true
): Promise<{ price: number | null, error?: string }> {
  if (daysAttending <= 0) return { price: 0 };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { price: null, error: 'Usuario no encontrado' };

  const isMember = user.isMember ?? false;
  const age = user.age ?? 18;
  const drinksAlcohol = overrideDrinksAlcohol;

  const rules = await prisma.pricingRule.findMany({
    where: { eventId },
  });

  if (rules.length === 0) {
    return { price: null, error: 'No hay tarifas configuradas para este evento.' };
  }

  // Filtrar reglas compatibles
  const matchingRules = rules.filter(rule => {
    // Días: coincide exactamente o si tiene 3+ días y la regla es >= 3
    const daysMatch = rule.days === daysAttending || (daysAttending >= 3 && rule.days === 3);
    if (!daysMatch) return false;

    // Filtro Socio
    if (rule.isMember !== null && rule.isMember !== isMember) return false;

    // Filtro Edad
    if (rule.minAge !== null && age < rule.minAge) return false;
    if (rule.maxAge !== null && age > rule.maxAge) return false;

    // Filtro Alcohol
    if (rule.drinksAlcohol !== null && rule.drinksAlcohol !== drinksAlcohol) return false;

    return true;
  });

  if (matchingRules.length > 0) {
    // Ordenar por especificidad (la regla con más criterios definidos gana)
    matchingRules.sort((a, b) => {
      const scoreA = (a.isMember !== null ? 1 : 0) + (a.minAge !== null ? 1 : 0) + (a.drinksAlcohol !== null ? 1 : 0);
      const scoreB = (b.isMember !== null ? 1 : 0) + (b.minAge !== null ? 1 : 0) + (b.drinksAlcohol !== null ? 1 : 0);
      return scoreB - scoreA;
    });
    return { price: matchingRules[0].price };
  }

  // Fallback: coincidencia por días si existe alguna regla general
  const fallbackDaysRule = rules.find(r => r.days === daysAttending || (daysAttending >= 3 && r.days === 3));
  if (fallbackDaysRule) return { price: fallbackDaysRule.price };

  return { price: null, error: `No hay una tarifa configurada para ${daysAttending} días con las características del usuario.` };
}

// Cuando un usuario se une al evento
export async function joinEvent(eventId: string, userId: string, daysAttending: number, drinksAlcohol: boolean = true) {
  try {
    let expectedPayment = 0;

    if (daysAttending > 0) {
      const calc = await calculateExpectedPayment(eventId, userId, daysAttending, drinksAlcohol);
      if (calc.price === null) {
        return { success: false, error: calc.error || `No hay una tarifa aplicable.` };
      }
      expectedPayment = calc.price;
    }

    const attendee = await prisma.eventAttendee.create({
      data: {
        userId,
        eventId,
        daysAttending,
        drinksAlcohol,
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


export async function updateAttendeeDays(attendeeId: string, newDays: number, drinksAlcohol?: boolean) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'No autorizado' };

    const attendee = await prisma.eventAttendee.findUnique({ where: { id: attendeeId } });
    if (!attendee) return { success: false, error: 'Asistente no encontrado' };

    // Solo el propio usuario o un admin puede cambiar sus días
    if (attendee.userId !== session.id && !session.isAdmin) {
      return { success: false, error: 'No tienes permiso para modificar a este asistente' };
    }

    const updatedDrinks = drinksAlcohol !== undefined ? drinksAlcohol : attendee.drinksAlcohol;

    if (attendee.daysAttending === newDays && attendee.drinksAlcohol === updatedDrinks) {
      return { success: true }; // Nada que cambiar
    }

    let expectedPayment = 0;
    if (newDays > 0) {
      const calc = await calculateExpectedPayment(attendee.eventId, attendee.userId, newDays, updatedDrinks);
      if (calc.price === null) {
        return { success: false, error: calc.error || `No hay una tarifa aplicable.` };
      }
      expectedPayment = calc.price;
    }

    await prisma.eventAttendee.update({
      where: { id: attendeeId },
      data: {
        daysAttending: newDays,
        drinksAlcohol: updatedDrinks,
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

    const attendee = await prisma.eventAttendee.findUnique({
      where: { id: attendeeId },
      select: { eventId: true }
    });

    if (!attendee) return { success: false, error: 'Asistente no encontrado' };

    await prisma.payment.create({
      data: { 
        attendeeId, 
        eventId: attendee.eventId,
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
