'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { calculateExpectedPayment } from './attendance';

// Obtener todos los usuarios
export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
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
        age: data.age ? parseInt(data.age, 10) : null,
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
    const updateData: any = {
      name: data.name,
      username: data.username.trim().toLowerCase(),
      email: data.email || null,
      phone: data.phone || null,
      isAdmin: data.isAdmin,
      isMember: data.isMember !== undefined ? Boolean(data.isMember) : false,
      age: data.age ? parseInt(data.age, 10) : null,
    };

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
      const calc = await calculateExpectedPayment(att.eventId, id, att.daysAttending, att.drinksAlcohol);
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

// Borrar a todos los usuarios NO administradores que no tengan ataduras
export async function deleteAllNonAdminUsers() {
  try {
    const nonAdmins = await prisma.user.findMany({
      where: { isAdmin: false },
      include: {
        expenses: true,
        eventAttendances: {
          include: { payments: true }
        },
        shoppingTasks: true
      }
    });

    let deletedCount = 0;
    let skippedCount = 0;

    for (const user of nonAdmins) {
      const hasExpenses = user.expenses.length > 0;
      const hasPayments = user.eventAttendances.some((att: any) => att.payments.length > 0);
      const hasShoppingItems = user.shoppingTasks && user.shoppingTasks.length > 0;

      if (!hasExpenses && !hasPayments && !hasShoppingItems) {
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

// Registro público (Fuerza isAdmin = false por seguridad)
export async function registerPublicUser(data: any) {
  try {
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
        age: data.age ? parseInt(data.age, 10) : null,
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
  age?: number | string;
  email?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  try {
    const { getSession } = require('./auth');
    const session = await getSession();
    if (!session) return { success: false, error: 'No has iniciado sesión.' };

    const currentUser = await prisma.user.findUnique({ where: { id: session.id } });
    if (!currentUser) return { success: false, error: 'Usuario no encontrado.' };

    const updateData: any = {
      name: data.name,
      username: data.username.trim().toLowerCase(),
      isMember: Boolean(data.isMember),
      age: data.age ? parseInt(String(data.age), 10) : null,
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
      const calc = await calculateExpectedPayment(att.eventId, session.id, att.daysAttending, att.drinksAlcohol);
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
