'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { calculateExpectedPayment } from './attendance';

// Obtener todos los usuarios
export async function getUsers() {
  try {
    const { getSession } = require('./auth');
    const session = await getSession();

    // Solo el Superadministrador (admin) ve la cuenta técnica admin
    const whereClause = session?.username === 'admin' 
      ? {} 
      : { username: { not: 'admin' } };

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
    return { success: true, data: users };
  } catch (error: any) {
    return { success: false, error: 'Error al obtener usuarios: ' + error.message };
  }
}

// Crear un nuevo usuario
export async function createUser(data: any) {
  try {
    if (data.age === undefined || data.age === null || String(data.age).trim() === '') {
      return { success: false, error: 'El campo Edad es obligatorio.' };
    }
    const ageNum = parseInt(String(data.age), 10);
    if (isNaN(ageNum) || ageNum <= 0) {
      return { success: false, error: 'Introduce una Edad válida superior a 0.' };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username.trim().toLowerCase(),
        password: hashedPassword,
        email: data.email || null,
        phone: data.phone || null,
        isAdmin: data.isAdmin || false,
        isMember: data.isMember !== undefined ? Boolean(data.isMember) : false,
        age: ageNum,
        canUploadTickets: data.canUploadTickets !== undefined ? Boolean(data.canUploadTickets) : true,
      },
    });
    revalidatePath('/admin/users');
    return { success: true, data: user };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'El nombre de usuario ya existe.' };
    }
    return { success: false, error: 'Error al crear usuario: ' + error.message };
  }
}

// Editar un usuario
export async function updateUser(id: string, data: any) {
  try {
    if (data.age === undefined || data.age === null || String(data.age).trim() === '') {
      return { success: false, error: 'El campo Edad es obligatorio.' };
    }
    const ageNum = parseInt(String(data.age), 10);
    if (isNaN(ageNum) || ageNum <= 0) {
      return { success: false, error: 'Introduce una Edad válida superior a 0.' };
    }

    const updateData: any = {
      name: data.name,
      username: data.username.trim().toLowerCase(),
      email: data.email || null,
      phone: data.phone || null,
      isAdmin: data.isAdmin,
      isMember: data.isMember !== undefined ? Boolean(data.isMember) : false,
      age: ageNum,
    };

    if (data.canUploadTickets !== undefined) {
      updateData.canUploadTickets = Boolean(data.canUploadTickets);
    }

    // Si envía password, lo actualizamos también
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Recalcular cuota esperada en asistentes si ha cambiado su perfil de socio/edad
    const attendees = await prisma.eventAttendee.findMany({
      where: { userId: id, daysAttending: { gt: 0 } }
    });
    for (const att of attendees) {
      const calc = await calculateExpectedPayment(att.eventId, id, att.daysAttending, (att as any).drinkOption ?? 'CON_ALCOHOL', (att as any).eatFood ?? true);
      if (calc.price !== null) {
        await prisma.eventAttendee.update({
          where: { id: att.id },
          data: { expectedPayment: calc.price }
        });
      }
    }

    revalidatePath('/admin/users');
    revalidatePath('/pricing/attendees');
    revalidatePath('/');
    return { success: true, data: user };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'El nombre de usuario ya existe.' };
    }
    return { success: false, error: 'Error al actualizar usuario: ' + error.message };
  }
}

// Eliminar un usuario
export async function deleteUser(id: string) {
  try {
    // CASO 5: Integridad Financiera - Bloqueo si tiene transacciones
    const expensesCount = await prisma.expense.count({ where: { purchaserId: id } });
    if (expensesCount > 0) {
      return { success: false, error: 'No se puede eliminar al usuario porque tiene tickets de gastos a su nombre. Elimina sus gastos primero.' };
    }

    const paymentsCount = await prisma.payment.count({ where: { attendee: { userId: id } } });
    if (paymentsCount > 0) {
      return { success: false, error: 'No se puede eliminar al usuario porque tiene pagos registrados en el bote. Elimina su historial de pagos primero.' };
    }

    await prisma.user.delete({
      where: { id },
    });
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al eliminar usuario: ' + error.message };
  }
}

// Borrar a todos los usuarios NO administradores que no tengan ataduras (Solo Superadmin)
export async function deleteAllNonAdminUsers() {
  try {
    const { getSession } = require('./auth');
    const session = await getSession();
    if (session?.username !== 'admin') {
      return { success: false, error: 'Solo el Superadministrador (admin) puede ejecutar el borrado masivo.' };
    }

    const nonAdmins = await prisma.user.findMany({
      where: { 
        username: { not: 'admin' },
        isAdmin: false 
      },
      include: {
        expenses: true,
        eventAttendances: {
          include: { payments: true }
        },
        assignedShoppingLists: true
      }
    });

    let deletedCount = 0;
    let skippedCount = 0;

    for (const user of nonAdmins) {
      const hasExpenses = user.expenses.length > 0;
      const hasPayments = user.eventAttendances.some((att: any) => att.payments.length > 0);
      const hasShoppingLists = user.assignedShoppingLists && user.assignedShoppingLists.length > 0;

      if (!hasExpenses && !hasPayments && !hasShoppingLists) {
        await prisma.eventAttendee.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
        deletedCount++;
      } else {
        skippedCount++;
      }
    }

    revalidatePath('/admin/users');
    return { success: true, deletedCount, skippedCount };
  } catch (error: any) {
    return { success: false, error: 'Error al hacer limpieza de usuarios: ' + error.message };
  }
}

export type FilterType = 'ALL' | 'UNDER_18' | 'OVER_18' | 'MEMBERS' | 'NON_MEMBERS' | 'ADMINS' | 'NON_ADMINS';
export type BulkActionType = 
  | 'SET_MEMBER' 
  | 'SET_NON_MEMBER' 
  | 'GRANT_ADMIN' 
  | 'REVOKE_ADMIN' 
  | 'SET_AGE_18' 
  | 'DISABLE_TICKET_UPLOAD'
  | 'ENABLE_TICKET_UPLOAD'
  | 'EXPEL_CLEAN_ATTENDEES' 
  | 'DELETE_CLEAN';

export async function bulkUpdateUsersFiltered(filterType: FilterType, actionType: BulkActionType) {
  try {
    const { getSession } = require('./auth');
    const session = await getSession();
    if (session?.username !== 'admin') {
      return { success: false, error: 'Solo el Superadministrador (admin) puede realizar modificaciones masivas.' };
    }

    // Construir la condición de filtrado (siempre excluyendo al usuario técnico admin)
    const baseWhere: any = { username: { not: 'admin' } };

    if (filterType === 'UNDER_18') {
      baseWhere.OR = [{ age: { lt: 18 } }, { age: null }];
    } else if (filterType === 'OVER_18') {
      baseWhere.age = { gte: 18 };
    } else if (filterType === 'MEMBERS') {
      baseWhere.isMember = true;
    } else if (filterType === 'NON_MEMBERS') {
      baseWhere.isMember = false;
    } else if (filterType === 'ADMINS') {
      baseWhere.isAdmin = true;
    } else if (filterType === 'NON_ADMINS') {
      baseWhere.isAdmin = false;
    }

    // Si la acción es expulsar asistentes limpios del evento activo (sin borrar sus cuentas)
    if (actionType === 'EXPEL_CLEAN_ATTENDEES') {
      const activeEvent = await prisma.event.findFirst({ where: { isActive: true } });
      if (!activeEvent) {
        return { success: false, error: 'No hay ningún evento activo actualmente.' };
      }

      const attendees = await prisma.eventAttendee.findMany({
        where: {
          eventId: activeEvent.id,
          user: baseWhere
        },
        include: {
          payments: true,
          user: {
            include: {
              expenses: { where: { eventId: activeEvent.id } },
              assignedShoppingLists: { where: { eventId: activeEvent.id } }
            }
          }
        }
      });

      let deletedCount = 0;
      let skippedCount = 0;

      for (const att of attendees) {
        const hasExpenses = att.user.expenses.length > 0;
        const hasPayments = att.payments.length > 0;
        const hasShoppingLists = att.user.assignedShoppingLists && att.user.assignedShoppingLists.length > 0;

        if (!hasExpenses && !hasPayments && !hasShoppingLists) {
          await prisma.eventAttendee.delete({ where: { id: att.id } });
          deletedCount++;
        } else {
          skippedCount++;
        }
      }

      revalidatePath('/admin/users');
      revalidatePath('/pricing/attendees');
      revalidatePath('/pricing/results');
      return { success: true, isExpel: true, deletedCount, skippedCount };
    }

    // Si la acción es borrado masivo de limpios
    if (actionType === 'DELETE_CLEAN') {
      const targetUsers = await prisma.user.findMany({
        where: baseWhere,
        include: {
          expenses: true,
          eventAttendances: { include: { payments: true } },
          assignedShoppingLists: true
        }
      });

      let deletedCount = 0;
      let skippedCount = 0;

      for (const user of targetUsers) {
        const hasExpenses = user.expenses.length > 0;
        const hasPayments = user.eventAttendances.some((att: any) => att.payments.length > 0);
        const hasShoppingLists = user.assignedShoppingLists && user.assignedShoppingLists.length > 0;

        if (!hasExpenses && !hasPayments && !hasShoppingLists) {
          await prisma.eventAttendee.deleteMany({ where: { userId: user.id } });
          await prisma.user.delete({ where: { id: user.id } });
          deletedCount++;
        } else {
          skippedCount++;
        }
      }

      revalidatePath('/admin/users');
      return { success: true, isDelete: true, deletedCount, skippedCount };
    }

    // Acciones de actualización masiva
    let updateData: any = {};
    if (actionType === 'SET_MEMBER') updateData = { isMember: true };
    if (actionType === 'SET_NON_MEMBER') updateData = { isMember: false };
    if (actionType === 'GRANT_ADMIN') updateData = { isAdmin: true };
    if (actionType === 'REVOKE_ADMIN') updateData = { isAdmin: false };
    if (actionType === 'SET_AGE_18') updateData = { age: 18 };
    if (actionType === 'DISABLE_TICKET_UPLOAD') updateData = { canUploadTickets: false };
    if (actionType === 'ENABLE_TICKET_UPLOAD') updateData = { canUploadTickets: true };

    const res = await prisma.user.updateMany({
      where: baseWhere,
      data: updateData
    });

    revalidatePath('/admin/users');
    return { success: true, isDelete: false, count: res.count };
  } catch (error: any) {
    return { success: false, error: 'Error en la actualización masiva: ' + error.message };
  }
}

// Registro público (Fuerza isAdmin = false por seguridad)
export async function registerPublicUser(data: any) {
  try {
    if (data.age === undefined || data.age === null || String(data.age).trim() === '') {
      return { success: false, error: 'El campo Edad es obligatorio.' };
    }
    const ageNum = parseInt(String(data.age), 10);
    if (isNaN(ageNum) || ageNum <= 0) {
      return { success: false, error: 'Introduce una Edad válida superior a 0.' };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username.trim().toLowerCase(),
        password: hashedPassword,
        email: data.email || null,
        phone: data.phone || null,
        isAdmin: false, // <-- RESTRICCIÓN DE SEGURIDAD BLINDADA
        isMember: data.isMember !== undefined ? Boolean(data.isMember) : false,
        age: ageNum,
      },
    });
    return { success: true, data: user };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'El nombre de usuario ya existe. Por favor, elige otro.' };
    }
    return { success: false, error: 'Error al registrarse: ' + error.message };
  }
}

// Editar propio perfil (Cualquier usuario logueado)
export async function updateMyProfile(data: {
  name: string;
  username: string;
  isMember: boolean;
  age: number | string;
  email?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  try {
    const { getSession } = require('./auth');
    const session = await getSession();
    if (!session) return { success: false, error: 'No has iniciado sesión.' };

    if (data.age === undefined || data.age === null || String(data.age).trim() === '') {
      return { success: false, error: 'El campo Edad es obligatorio.' };
    }
    const ageNum = parseInt(String(data.age), 10);
    if (isNaN(ageNum) || ageNum <= 0) {
      return { success: false, error: 'Introduce una Edad válida superior a 0.' };
    }

    const currentUser = await prisma.user.findUnique({ where: { id: session.id } });
    if (!currentUser) return { success: false, error: 'Usuario no encontrado.' };

    const updateData: any = {
      name: data.name,
      username: data.username.trim().toLowerCase(),
      isMember: Boolean(data.isMember),
      age: ageNum,
      email: data.email || null,
      phone: data.phone || null,
    };

    // Si el usuario quiere cambiar contraseña
    if (data.newPassword) {
      if (!data.currentPassword) {
        return { success: false, error: 'Debes introducir tu contraseña actual para cambiarla.' };
      }
      const isValid = await bcrypt.compare(data.currentPassword, currentUser.password);
      if (!isValid) {
        return { success: false, error: 'La contraseña actual es incorrecta.' };
      }
      updateData.password = await bcrypt.hash(data.newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
    });

    // Recalcular cuota si es asistente a un evento activo
    const attendees = await prisma.eventAttendee.findMany({
      where: { userId: session.id, daysAttending: { gt: 0 } }
    });
    for (const att of attendees) {
      const calc = await calculateExpectedPayment(att.eventId, session.id, att.daysAttending, (att as any).drinkOption ?? 'CON_ALCOHOL', (att as any).eatFood ?? true);
      if (calc.price !== null) {
        await prisma.eventAttendee.update({
          where: { id: att.id },
          data: { expectedPayment: calc.price }
        });
      }
    }

    revalidatePath('/');
    revalidatePath('/pricing/attendees');
    return { success: true, data: updatedUser };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'El nombre de usuario ya está en uso.' };
    }
    return { success: false, error: 'Error al actualizar perfil: ' + error.message };
  }
}
