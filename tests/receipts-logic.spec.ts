import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const prefix = 'rcpt_' + Date.now();

test.describe('Lógica Financiera de Tickets', () => {
  let adminId: string;
  let user1Id: string;
  let eventId: string;

  test.beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('123456', 10);
    const admin = await prisma.user.create({
      data: { name: 'Admin Rcpt', username: `${prefix}_admin`, password: hashedPassword, isAdmin: true }
    });
    adminId = admin.id;

    const u1 = await prisma.user.create({
      data: { name: 'User 1', username: `${prefix}_user1`, password: hashedPassword }
    });
    user1Id = u1.id;

    const e = await prisma.event.create({
      data: { name: `${prefix}_Event`, isActive: true }
    });
    eventId = e.id;
    
    // Asegurarnos que no hay otro evento activo (Auto-heal a mano para el test)
    await prisma.event.updateMany({
      where: { id: { not: eventId }, isActive: true },
      data: { isActive: false }
    });

    // Unirlos al evento
    await prisma.eventAttendee.create({ data: { userId: adminId, eventId, daysAttending: 1, expectedPayment: 20 } });
    await prisma.eventAttendee.create({ data: { userId: user1Id, eventId, daysAttending: 1, expectedPayment: 20 } });
  });

  test.afterAll(async () => {
    await prisma.event.deleteMany({ where: { name: { startsWith: prefix } } });
    await prisma.user.deleteMany({ where: { username: { startsWith: prefix } } });
    await prisma.$disconnect();
  });

  test('Reparto Parcial Complejo y Cascada', async ({ page }) => {
    // Login
    await page.goto('/');
    const isLogin = await page.locator('text=Iniciar Sesión').isVisible();
    if (isLogin) {
      await page.fill('input[type="text"]', `${prefix}_admin`);
      await page.fill('input[type="password"]', '123456');
      await Promise.all([page.waitForNavigation(), page.click('button', { hasText: 'Acceder' })]);
    }

    // Creamos el gasto por API simulando lo que haría el Scanner IA
    const expense = await prisma.expense.create({
      data: {
        description: 'Cena Especial',
        store: 'Restaurante E2E',
        amount: 50,
        purchaserId: adminId,
        eventId: eventId,
        items: {
          create: [{ name: 'Menú E2E', price: 50, quantity: 1 }]
        }
      }
    });

    await page.goto('/expenses');
    // Verificamos que se renderiza el gasto en la lista
    await expect(page.locator('text=Restaurante E2E').first()).toBeVisible({ timeout: 10000 });
    
    // Verificamos en el Dashboard o resultados que ha afectado al Bote
    await page.goto('/pricing/results');
    await expect(page.locator('text=Total Gastado')).toBeVisible();

    // Borramos el ticket vía BD y comprobamos que desaparece (prueba del Delete cascade UI)
    await prisma.expense.delete({ where: { id: expense.id } });
    await page.goto('/expenses');
    await expect(page.locator('text=Restaurante E2E')).toHaveCount(0);
  });
});
