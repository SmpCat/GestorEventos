import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const prefix = 'admin_comp_' + Date.now();

test.describe('Componentes Admin y Mantenimiento', () => {
  let adminId: string;
  let testUserId: string;

  test.beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('123456', 10);
    const admin = await prisma.user.create({
      data: { name: 'Admin Comp', username: `${prefix}_admin`, password: hashedPassword, isAdmin: true }
    });
    adminId = admin.id;

    const user = await prisma.user.create({
      data: { name: 'User Delete', username: `${prefix}_user`, password: hashedPassword, isAdmin: false }
    });
    testUserId = user.id;
  });

  test.afterAll(async () => {
    await prisma.user.deleteMany({ where: { username: { startsWith: prefix } } });
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const isLogin = await page.locator('text=Iniciar Sesión').isVisible();
    if (isLogin) {
      await page.fill('input[type="text"]', `${prefix}_admin`);
      await page.fill('input[type="password"]', '123456');
      await Promise.all([page.waitForNavigation(), page.click('button', { hasText: 'Acceder' })]);
    }
  });

  test('Validación de Formularios de Usuario y Bloqueo', async ({ page }) => {
    await page.goto('/admin/users');

    // Localizamos la tarjeta o fila del usuario a borrar. "User Delete" es el nombre que le dimos al crearlo.
    const deleteBtn = page.locator('.mobile-hide button[title="Borrar"]').first();
    
    // Aceptar cualquier dialog de confirmación o alerta que salga
    page.on('dialog', dialog => dialog.accept());
    
    await deleteBtn.click({ force: true });
    
    // Verificar que desapareció
    await expect(page.locator('.glass-panel').filter({ hasText: `${prefix}_user` })).toHaveCount(0);
  });
});
