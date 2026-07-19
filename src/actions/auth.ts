'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const secretKey = process.env.JWT_SECRET || 'super-secret-key-para-desarrollo-gestor-eventos';
const key = new TextEncoder().encode(secretKey);

// Tiempo de sesión inactiva: 2 horas
const SESSION_DURATION = 2 * 60 * 60 * 1000;

export async function login(data: any) {
  try {
    const normalizedUsername = data.username.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (!user) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    const isValid = await bcrypt.compare(data.password, user.password);

    if (!isValid) {
      return { success: false, error: 'Contraseña incorrecta.' };
    }

    // Crear el JWT Payload
    const expires = new Date(Date.now() + SESSION_DURATION);
    const sessionToken = await new SignJWT({ 
      id: user.id, 
      username: user.username, 
      name: user.name, 
      isAdmin: user.isAdmin 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('2h')
      .sign(key);

    // Guardar en Cookie HttpOnly
    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      expires,
      httpOnly: true,
      secure: false, // Forzar a false para que funcione en móviles por HTTP local
      sameSite: 'lax',
      path: '/',
    });

    return { success: true };
  } catch (error: any) {
    console.error("LOGIN ERROR DETAILED: ", error);
    return { success: false, error: 'Error interno en el login.' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  
  // 1. Borrar sesión
  cookieStore.set('session', '', {
    expires: new Date(0),
    path: '/',
  });

  revalidatePath('/');
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, key);
    return payload as { id: string, username: string, name: string, isAdmin: boolean };
  } catch (error) {
    return null; // JWT Inválido o caducado
  }
}
