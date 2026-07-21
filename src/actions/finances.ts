'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getEventPayments(eventId: string) {
  try {
    const payments = await prisma.payment.findMany({
      where: { eventId },
      include: {
        attendee: { include: { user: { select: { name: true, username: true } } } },
        registeredBy: { select: { name: true, username: true } }
      },
      orderBy: { date: 'desc' }
    });
    return { success: true, data: payments };
  } catch (error: any) {
    return { success: false, error: 'Error al obtener movimientos: ' + error.message };
  }
}

export async function addTransaction(
  eventId: string,
  amount: number,
  type: 'INCOME' | 'EXPENSE',
  description: string,
  registeredById: string,
  attendeeId?: string | null
) {
  try {
    const payment = await prisma.payment.create({
      data: {
        amount,
        type,
        description: description || null,
        eventId,
        attendeeId: attendeeId || null,
        registeredById
      }
    });

    revalidatePath('/finances');
    revalidatePath('/pricing/results');
    revalidatePath('/pricing/attendees');
    
    return { success: true, data: payment };
  } catch (error: any) {
    return { success: false, error: 'Error al registrar el movimiento: ' + error.message };
  }
}

export async function updateTransaction(
  transactionId: string,
  amount: number,
  type: 'INCOME' | 'EXPENSE',
  description: string,
  attendeeId?: string | null
) {
  try {
    const payment = await prisma.payment.update({
      where: { id: transactionId },
      data: {
        amount,
        type,
        description: description || null,
        attendeeId: attendeeId || null
      }
    });

    revalidatePath('/finances');
    revalidatePath('/pricing/results');
    revalidatePath('/pricing/attendees');
    
    return { success: true, data: payment };
  } catch (error: any) {
    return { success: false, error: 'Error al actualizar el movimiento: ' + error.message };
  }
}

export async function deleteTransaction(transactionId: string) {
  try {
    await prisma.payment.delete({
      where: { id: transactionId }
    });

    revalidatePath('/finances');
    revalidatePath('/pricing/results');
    revalidatePath('/pricing/attendees');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al eliminar el movimiento: ' + error.message };
  }
}
