'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addTransaction(attendeeId: string, amount: number, type: 'INCOME' | 'EXPENSE', registeredById: string) {
  try {
    const payment = await prisma.payment.create({
      data: {
        amount,
        type,
        attendeeId,
        registeredById
      }
    });

    revalidatePath('/finances');
    revalidatePath('/pricing/results'); // También afectará al balance
    
    return { success: true, data: payment };
  } catch (error: any) {
    return { success: false, error: 'Error al registrar el movimiento: ' + error.message };
  }
}

export async function deleteTransaction(transactionId: string) {
  try {
    await prisma.payment.delete({
      where: { id: transactionId }
    });

    revalidatePath('/finances');
    revalidatePath('/pricing/results');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al eliminar el movimiento: ' + error.message };
  }
}
