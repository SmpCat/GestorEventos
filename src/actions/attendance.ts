'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
        user: { select: { id: true, name: true, username: true } },
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

    // Si no hay regla exacta, buscar la mayor inferior o dejar a 0 (el admin puede ajustar luego)
    let expectedPayment = 0;
    if (rule) {
      expectedPayment = rule.price;
    } else {
      // Intento heurístico: si no hay regla de N días, coger la máxima disponible
      const maxRule = await prisma.pricingRule.findFirst({
        where: { eventId },
        orderBy: { days: 'desc' }
      });
      if (maxRule) expectedPayment = maxRule.price;
    }

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
export async function updateAttendeeAdmin(attendeeId: string, hasPaid: boolean, customPrice: number | null, adminComment: string | null) {
  try {
    await prisma.eventAttendee.update({
      where: { id: attendeeId },
      data: {
        hasPaid,
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
