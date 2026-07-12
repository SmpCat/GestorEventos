import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const prefix = 'conc_' + Date.now();

test.describe('Concurrencia Pura', () => {
  let adminId: string;
  let eventId1: string;
  let eventId2: string;

  test.beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('123456', 10);
    const admin = await prisma.user.create({
      data: { name: 'Admin Concurrente', username: `${prefix}_admin`, password: hashedPassword, isAdmin: true }
    });
    adminId = admin.id;

    const e1 = await prisma.event.create({ data: { name: `${prefix}_Evento_1`, isActive: false } });
    const e2 = await prisma.event.create({ data: { name: `${prefix}_Evento_2`, isActive: false } });
    eventId1 = e1.id;
    eventId2 = e2.id;
  });

  test.afterAll(async () => {
    await prisma.event.deleteMany({ where: { name: { startsWith: prefix } } });
    await prisma.user.deleteMany({ where: { username: { startsWith: prefix } } });
    await prisma.$disconnect();
  });

  test('Doble Activación Simultánea (Auto-Heal)', async ({ browser }) => {
    // Usamos dos contextos aislados simulando dos administradores distintos
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login Admin 1
    await page1.goto('/');
    await page1.fill('input[type="text"]', `${prefix}_admin`);
    await page1.fill('input[type="password"]', '123456');
    await Promise.all([page1.waitForNavigation(), page1.click('button', { hasText: 'Acceder' })]);

    // Login Admin 2
    await page2.goto('/');
    await page2.fill('input[type="text"]', `${prefix}_admin`);
    await page2.fill('input[type="password"]', '123456');
    await Promise.all([page2.waitForNavigation(), page2.click('button', { hasText: 'Acceder' })]);

    await page1.goto('/admin/events');
    await page2.goto('/admin/events');

    // Admin 1 intenta activar Evento 1
    const row1 = page1.locator('div.glass-panel').filter({ hasText: `${prefix}_Evento_1` });
    const btn1 = row1.locator('button', { hasText: 'Hacer Operativo' });
    page1.once('dialog', dialog => dialog.accept());

    // Admin 2 intenta activar Evento 2
    const row2 = page2.locator('div.glass-panel').filter({ hasText: `${prefix}_Evento_2` });
    const btn2 = row2.locator('button', { hasText: 'Hacer Operativo' });
    page2.once('dialog', dialog => dialog.accept());

    // DISPARO CONCURRENTE
    await Promise.all([
      btn1.click(),
      btn2.click()
    ]);

    // Esperar a que pase la tormenta
    await page1.waitForTimeout(2000);

    // Verificar en BD (el Auto-Heal solo permite 1 evento activo, nunca 2)
    const activeEventsCount = await prisma.event.count({ where: { isActive: true } });
    expect(activeEventsCount).toBeLessThanOrEqual(1);

    await context1.close();
    await context2.close();
  });
});
