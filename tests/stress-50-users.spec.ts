import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const prefix = 'macro_' + Date.now();
const NUM_USERS = 50;
const NUM_TICKETS = 150;

test.describe('Macro-Simulación: 50 Asistentes', () => {
  let adminId: string;
  let eventId: string;
  let userIds: string[] = [];
  
  // Guardaremos la suma teórica de todo para compararla con la interfaz visual
  let theoreticalTotalPot = 0;
  let theoreticalTotalExpenses = 0;

  test.beforeAll(async () => {
    // 1. Crear el Evento
    const event = await prisma.event.create({
      data: { name: `Mega Festival ${prefix}`, isActive: true }
    });
    eventId = event.id;

    // Asegurarnos que es el único activo
    await prisma.event.updateMany({
      where: { id: { not: eventId }, isActive: true },
      data: { isActive: false }
    });

    // 2. Crear Reglas de Precio (5 días)
    const pricingRules = [];
    for (let i = 1; i <= 5; i++) {
      const rule = await prisma.pricingRule.create({
        data: { eventId, days: i, price: i * 15 } // 15€/día
      });
      pricingRules.push(rule);
    }

    // 3. Crear 2 Administradores
    const hashedPassword = await bcrypt.hash('123456', 10);
    const admin = await prisma.user.create({
      data: { name: 'Admin Macro', username: `${prefix}_admin`, password: hashedPassword, isAdmin: true }
    });
    adminId = admin.id;

    const admin2 = await prisma.user.create({
      data: { name: 'Admin Macro 2', username: `${prefix}_admin2`, password: hashedPassword, isAdmin: true }
    });
    userIds.push(adminId, admin2.id);

    // 4. Crear 50 Usuarios Estándar
    const usersData = Array.from({ length: NUM_USERS }).map((_, i) => ({
      name: `User ${i}`,
      username: `${prefix}_user_${i}`,
      password: hashedPassword,
      isAdmin: false
    }));
    await prisma.user.createMany({ data: usersData });

    // Recuperar los IDs reales de los usuarios recién creados
    const createdUsers = await prisma.user.findMany({ where: { username: { startsWith: `${prefix}_user_` } } });
    userIds.push(...createdUsers.map(u => u.id));

    // 5. Unir a todos al evento con días aleatorios
    const attendeesData = [];
    const paymentsData = [];

    for (const uId of userIds) {
      const days = Math.floor(Math.random() * 5) + 1; // 1 a 5 días
      const expected = days * 15;
      theoreticalTotalPot += expected;

      attendeesData.push({
        userId: uId,
        eventId,
        daysAttending: days,
        expectedPayment: expected
      });
    }
    await prisma.eventAttendee.createMany({ data: attendeesData });

    // 6. Generar Pagos (algunos pagan todo, otros nada)
    for (const uId of userIds) {
      const isPaying = Math.random() > 0.5;
      if (isPaying) {
        const attendee = await prisma.eventAttendee.findUnique({
          where: { userId_eventId: { userId: uId, eventId } }
        });
        if (attendee && attendee.expectedPayment) {
          paymentsData.push({
            attendeeId: attendee.id,
            amount: attendee.expectedPayment // paga todo
          });
        }
      }
    }
    await prisma.payment.createMany({ data: paymentsData });

    // 7. Generar Tickets de Gasto Masivos
    const expensesData = [];
    for (let i = 0; i < NUM_TICKETS; i++) {
      const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
      const amount = Math.floor(Math.random() * 100) + 10; // de 10 a 109€
      theoreticalTotalExpenses += amount;

      expensesData.push({
        description: `Ticket Aleatorio ${i}`,
        store: `Supermercado ${i}`,
        amount,
        purchaserId: randomUserId,
        eventId
      });
    }
    await prisma.expense.createMany({ data: expensesData });
  });

  test.afterAll(async () => {
    // BORRADO Y LIMPIEZA ABSOLUTA
    // Borramos el evento, lo que activa el borrado en cascada de attendees, payments y expenses
    await prisma.event.delete({ where: { id: eventId } }).catch(() => {});
    
    // Borramos los 52 usuarios
    await prisma.user.deleteMany({ where: { username: { startsWith: prefix } } }).catch(() => {});
    
    await prisma.$disconnect();
  });

  test('Validación UI y Cuadre Matemático de Rendimiento', async ({ page }) => {
    // Login
    await page.goto('/');
    const isLogin = await page.locator('text=Iniciar Sesión').isVisible();
    if (isLogin) {
      await page.fill('input[type="text"]', `${prefix}_admin`);
      await page.fill('input[type="password"]', '123456');
      await Promise.all([page.waitForNavigation(), page.click('button', { hasText: 'Acceder' })]);
    }

    // 1. Validar Rendimiento del Dashboard (Asistentes)
    const startTime = Date.now();
    await page.goto('/admin/users'); // Solo para forzar el paso
    await page.goto('/pricing/results'); // Vamos directo a la zona pesada de matemáticas
    await expect(page.locator('text=Ingresos y Gastos')).toBeVisible({ timeout: 15000 });
    const endTime = Date.now();
    
    console.log(`Renderizado de Finanzas Masivas: ${endTime - startTime}ms`);

    // 2. Validar que las matemáticas del sistema en pantalla cuadran con nuestro cálculo en frío
    await expect(page.locator(`text=${theoreticalTotalPot}€`).first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text=${theoreticalTotalExpenses}€`).first()).toBeVisible({ timeout: 5000 });
  });
});
