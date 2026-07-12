'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Obtener todos los eventos
export async function getEvents() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // AUTO-HEAL: Detectar si hay más de un evento activo (causado por conflictos de Git)
    const activeEvents = events.filter(e => e.isActive);
    if (activeEvents.length > 1) {
      // Dejamos solo el primero activo, apagamos el resto
      for (let i = 1; i < activeEvents.length; i++) {
        await prisma.event.update({ where: { id: activeEvents[i].id }, data: { isActive: false } });
        const eventIndex = events.findIndex(e => e.id === activeEvents[i].id);
        if (eventIndex !== -1) events[eventIndex].isActive = false;
      }
    }

    return { success: true, data: events };
  } catch (error: any) {
    return { success: false, error: 'Error al obtener eventos: ' + error.message };
  }
}

// Crear un evento
export async function createEvent(data: { name: string, startDate?: Date | null, endDate?: Date | null }) {
  try {
    const count = await prisma.event.count();
    const isFirstEvent = count === 0;

    const event = await prisma.event.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: isFirstEvent, // Si es el primero, se activa automáticamente
      },
    });
    revalidatePath('/admin/events');
    return { success: true, data: event };
  } catch (error: any) {
    return { success: false, error: 'Error al crear el evento: ' + error.message };
  }
}

// Editar un evento
export async function updateEvent(id: string, data: { name: string, startDate?: Date | null, endDate?: Date | null }) {
  try {
    const event = await prisma.event.update({
      where: { id },
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });
    revalidatePath('/admin/events');
    return { success: true, data: event };
  } catch (error: any) {
    return { success: false, error: 'Error al actualizar el evento: ' + error.message };
  }
}

// Transacción CRÍTICA: Activar un evento y apagar el resto
export async function setActiveEvent(id: string) {
  try {
    // Usamos una transacción para garantizar que no haya inconsistencias
    await prisma.$transaction(async (tx) => {
      // 1. Apagar todos
      await tx.event.updateMany({
        data: { isActive: false },
      });
      // 2. Encender el seleccionado
      await tx.event.update({
        where: { id },
        data: { isActive: true },
      });
    });

    revalidatePath('/admin/events');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al cambiar el evento activo: ' + error.message };
  }
}

// Eliminar un evento (Protegido si está activo)
export async function deleteEvent(id: string) {
  try {
    const event = await prisma.event.findUnique({ where: { id } });
    if (event?.isActive) {
      return { success: false, error: 'No puedes borrar el evento que está activo. Activa otro primero.' };
    }

    await prisma.event.delete({ where: { id } });
    revalidatePath('/admin/events');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al borrar el evento: ' + error.message };
  }
}
