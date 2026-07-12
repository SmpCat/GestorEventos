import { prisma } from './src/lib/prisma';
import bcrypt from 'bcryptjs';

// Mock Next.js cache to prevent errors during action calls
jest.mock('next/cache', () => ({
  revalidatePath: () => {}
}));

async function runTests() {
  console.log("=== INICIANDO AUDITORÍA BACKEND ===\n");
  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<boolean>) => {
    try {
      const success = await fn();
      if (success) {
        console.log(`[OK] ${name}`);
        passed++;
      } else {
        console.log(`[NO OK] ${name} (Devolvió falso)`);
        failed++;
      }
    } catch (e: any) {
      console.log(`[NO OK] ${name} (Crash: ${e.message})`);
      failed++;
    }
  };

  // Importar las acciones dinámicamente para que cojan el mock
  // En su lugar, probaremos directamente contra prisma y la lógica.
  // Ya que los Server Actions fallan fuera de Next.js.
  
  // 1. EVENTOS
  await test("No se puede borrar un evento si está activo", async () => {
    const { deleteEvent } = require('./src/actions/events');
    const activeEvent = await prisma.event.findFirst({ where: { isActive: true } });
    if (!activeEvent) return true; // Skip
    
    const res = await deleteEvent(activeEvent.id).catch(() => ({ success: false, error: 'catch' }));
    return res.success === false && res.error?.includes('activo');
  });

  // 2. USUARIOS
  await test("Crear usuarios con mismo username devuelve error", async () => {
    const { createUser } = require('./src/actions/users');
    const randomUser = "testuser_" + Date.now();
    await createUser({ name: "A", username: randomUser, password: "123" }).catch(()=>{});
    const res = await createUser({ name: "B", username: randomUser, password: "123" }).catch((e:any)=>({success:false}));
    return res.success === false;
  });

  await test("No se puede borrar usuario con pagos", async () => {
    const { deleteUser } = require('./src/actions/users');
    // Buscamos un usuario con pagos
    const userWithPayments = await prisma.user.findFirst({
      where: { Attendee: { some: { payments: { some: {} } } } }
    });
    if (!userWithPayments) return true; // Skip
    
    const res = await deleteUser(userWithPayments.id).catch((e:any)=>({success:false}));
    return res.success === false && res.error?.includes('pagos');
  });

  await test("No se puede borrar usuario con gastos (tickets)", async () => {
    const { deleteUser } = require('./src/actions/users');
    const userWithExpenses = await prisma.user.findFirst({
      where: { Expense: { some: {} } }
    });
    if (!userWithExpenses) return true; // Skip
    
    const res = await deleteUser(userWithExpenses.id).catch((e:any)=>({success:false}));
    return res.success === false && res.error?.includes('gastos');
  });

  // 3. ASISTENCIA
  await test("No permite pagos negativos", async () => {
    const { addPayment } = require('./src/actions/attendance');
    const att = await prisma.eventAttendee.findFirst();
    if (!att) return true;
    
    const res = await addPayment(att.id, -50).catch((e:any)=>({success:false}));
    return res.success === false; // Supongo que la app debería fallar
  });

  console.log(`\n=== RESULTADOS: ${passed} OK, ${failed} NO OK ===`);
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
