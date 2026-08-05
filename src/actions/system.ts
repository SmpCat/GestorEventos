'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';
import { revalidatePath } from 'next/cache';

export async function getSystemConfig() {
  try {
    let config = await prisma.systemConfig.findUnique({
      where: { id: 'global' }
    });

    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          id: 'global',
          maintenanceMode: false,
          maintenanceMessage: 'Estamos realizando labores de mantenimiento y optimización en la plataforma. Volveremos muy pronto.'
        }
      });
    }

    return { success: true, data: config };
  } catch (error: any) {
    return { success: false, error: 'Error al obtener configuración del sistema: ' + error.message };
  }
}

export async function toggleMaintenanceMode(enabled: boolean) {
  try {
    const session = await getSession();
    if (!session || session.username !== 'admin') {
      return { success: false, error: 'Solo el Superadministrador (admin) puede cambiar el modo mantenimiento.' };
    }

    const config = await prisma.systemConfig.upsert({
      where: { id: 'global' },
      update: { maintenanceMode: enabled },
      create: {
        id: 'global',
        maintenanceMode: enabled,
        maintenanceMessage: 'Estamos realizando labores de mantenimiento y optimización en la plataforma. Volveremos muy pronto.'
      }
    });

    revalidatePath('/');
    revalidatePath('/admin/events');
    revalidatePath('/maintenance');
    return { success: true, data: config };
  } catch (error: any) {
    return { success: false, error: 'Error al actualizar modo mantenimiento: ' + error.message };
  }
}
