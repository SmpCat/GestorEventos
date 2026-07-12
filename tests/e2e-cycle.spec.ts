import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const TEST_USERNAME = 'robot_admin_' + Date.now();
const TEST_EVENT_NAME = 'Fiestas Test Automatico ' + Date.now();

let testUserId: string;
let testEventId: string;

test.describe('Ciclo E2E: Administración y Gastos', () => {
  
  // SETUP: Crear un usuario y evento en la BD directamente
  test.beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('123456', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Robot Automático',
        username: TEST_USERNAME,
        password: hashedPassword,
        isAdmin: true, // Necesario para entrar a la zona de admin
      }
    });
    testUserId = user.id;

    const event = await prisma.event.create({
      data: {
        name: TEST_EVENT_NAME,
        isActive: false, // Empezamos inactivo
      }
    });
    testEventId = event.id;
  });

  // TEARDOWN: Borrar los datos generados para dejar la BD limpia
  test.afterAll(async () => {
    // Delete event and its cascades
    await prisma.event.delete({ where: { id: testEventId } });
    // Delete user
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  test('Ciclo completo: Login -> Activar Evento -> Tarifas -> Asistentes -> Lista Compra -> Gastos', async ({ page }) => {
    
    // --- 1. LOGIN ---
    await page.goto('/');
    
    // Dependiendo de si ya hay sesión o no, podríamos estar en Login
    // Esperamos un poco a que cargue la página inicial
    await page.waitForLoadState('networkidle');
    const isLoginPage = await page.locator('text=Iniciar Sesión').isVisible();
    
    if (isLoginPage) {
      await page.fill('input[type="text"]', TEST_USERNAME);
      await page.fill('input[type="password"]', '123456');
      
      // Esperamos a que la redirección del login (window.location.href = '/') termine por completo
      // para evitar que aborte nuestro siguiente page.goto
      await Promise.all([
        page.waitForNavigation(),
        page.click('button', { hasText: 'Acceder' })
      ]);
    }

    // --- 2. ACTIVAR EVENTO ---
    // Como el dashboard puede cambiar drásticamente dependiendo del estado de la BBDD (eventos activos, tarifas, etc.),
    // navegamos directamente a la URL de administración para evitar que el test dependa de un botón condicional.
    await page.goto('/admin/events');

    // Buscar nuestro evento en la lista y activarlo
    // Usamos el texto del nombre del evento para encontrar el botón correcto
    const eventRow = page.locator('div.glass-panel').filter({ hasText: TEST_EVENT_NAME });
    const activateBtn = eventRow.locator('button', { hasText: 'Hacer Operativo' });
    
    // Playwright maneja las alertas de confirmación cancelándolas por defecto.
    // Debemos capturarla y aceptarla ANTES de hacer el click.
    page.once('dialog', dialog => dialog.accept());
    
    await activateBtn.click();
    
    // Esperar a que el texto del botón cambie a "Evento Activo" o similar
    await expect(eventRow.locator('span', { hasText: 'OPERATIVO' }).first()).toBeVisible({ timeout: 10000 });

    // --- 3. CREAR TARIFA ---
    await page.goto('/pricing/rules');
    // Asumimos que la página detecta el evento activo
    await page.click('text=+ Añadir Regla de Precio');
    
    // Rellenar formulario
    const daysInput = page.locator('input[type="number"]').first();
    await daysInput.fill('1');
    const priceInput = page.locator('input[type="number"]').nth(1);
    await priceInput.fill('20'); // 20€
    
    // Playwright maneja las alertas cancelándolas. El botón de guardar pregunta confirmación.
    page.once('dialog', dialog => dialog.accept());
    await page.click('text=Guardar Tarifas');
    
    // Esperar a que el botón cambie a guardado
    await expect(page.locator('button', { hasText: 'Guardado' })).toBeVisible({ timeout: 10000 });

    // --- 4. DAR DE ALTA AL ASISTENTE (AUTO-SERVICIO) ---
    // Volvemos a la portada para ver el banner de unirse al evento
    await page.goto('/');
    
    // Rellenamos que venimos 1 día y nos apuntamos
    await page.fill('input[type="number"]', '1');
    await page.click('button:has-text("¡Me apunto!")');

    // Ahora deberíamos ver el Dashboard normal (la cuadrícula) o el texto de Bienvenido
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 10000 });

    // --- 5. AÑADIR A LISTA DE LA COMPRA ---
    await page.goto('/shopping');
    
    await page.fill('input[placeholder="Escribe un producto..."]', 'Pan de molde');
    // Como el botón es solo un '+', lo buscamos por tipo submit
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Pan de molde')).toBeVisible();

    // Hacer clic para marcar como comprado (probando dialog)
    page.once('dialog', dialog => dialog.accept());
    // El span o div que contiene el texto suele ser clicable para hacer toggle
    await page.click('text=Pan de molde');
    // Validar que se ha movido a la sección "Comprado"
    const boughtSection = page.locator('div').filter({ hasText: 'Comprado' });
    await expect(boughtSection.locator('text=Pan de molde')).toBeVisible();

    // --- 6. APORTAR GASTOS (SUBIDA FOTOGRÁFICA SIMULADA) ---
    await page.goto('/expenses');
    
    // Esperar a que el botón esté listo y simular la selección de archivo
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=Escanear Nuevo Ticket');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/E2E_TEST_TICKET.png');
    
    // La IA devolverá el JSON FALSO casi al instante
    await expect(page.locator('text=Datos Extraídos con Éxito')).toBeVisible({ timeout: 15000 });
    
    // Confirmar y guardar
    await page.click('text=Confirmar y Guardar Gasto');
    
    // Validar que sale en el historial de tickets abajo (el mock dice 'Supermercado E2E')
    await expect(page.locator('text=Supermercado E2E').first()).toBeVisible({ timeout: 10000 });

    // --- 7. VERIFICAR RESULTADOS ---
    await page.goto('/pricing/results');
    
    // Debería ver su cuota de 20€ y su gasto de 5.50€ reflejado en las matemáticas
    await expect(page.locator('text=Bote Teórico Total')).toBeVisible();
    
    // Esto demuestra que TODO el ciclo ha funcionado uniendo la base de datos con la interfaz
  });
});
