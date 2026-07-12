# Hive-Mind Sync Log (Windows -> Mac)
*Última actualización: 12 de Julio de 2026 (por Windows Agent)*

## Resumen de la sesión
En esta sesión se han realizado ajustes estéticos en la UI y se han solucionado dos problemas graves de infraestructura detectados durante las pruebas locales:

### 1. Mejoras de UI
- Eliminado completamente `ToastProvider`. Todas las notificaciones usan ahora `alert()` y `confirm()` síncronos para evitar solapamientos con teclados móviles.
- Los banners de los modales (`UserFormModal`, `EventFormModal`) ya no usan `position: sticky`, sino `relative`, para maximizar el área de scroll, y se han reducido al máximo sus márgenes verticales para hacerlos ultrafinos.

### 2. Problemas Críticos Solucionados
- **SQLite Deadlock (Lentitud extrema):** En `src/lib/prisma.ts` se creaba un `new PrismaClient()` en cada recarga del servidor de desarrollo de Next.js, lo que dejaba decenas de conexiones zombies ahogando los locks del archivo `.db`. Además el `log: ['query']` estaba saturando el I/O.
  - *Solución:* Implementado un Singleton estricto para `globalForPrisma` y desactivado el log.
- **Eventos Activos Duplicados:** Debido al auto-merge de Git del antiguo `db.json`, se colaron en la base de datos 2 eventos con `isActive: true`. Esto bloqueaba los botones porque el frontend los protegía a ambos.
  - *Solución:* Añadido un script de **Auto-Heal** en `src/actions/events.ts` -> `getEvents()` que detecta si hay >1 evento activo y apaga los excedentes automáticamente.
- **Bloqueos Doble-Clic y Pagos Negativos:** Blindado `UserMaintenance.tsx` con estados de carga durante los borrados, y `attendance.ts` para rechazar pagos negativos.

## ⚠️ Instrucciones para el Agente Mac al iniciar:
1. Asegúrate de ejecutar `npx prisma generate` si Prisma no te reconoce los esquemas actualizados.
2. **CRÍTICO:** Si el servidor `npm run dev` está encendido en el Mac, DEBE SER REINICIADO (CTRL+C y volver a lanzar). De lo contrario, seguirá usando la versión antigua de `prisma.ts` y causará bloqueos en la base de datos local SQLite.
3. El archivo `prisma/data.db` probablemente reportará cambios o conflictos a menudo si lo modificamos en ambos lados, pero el Auto-Heal ahora protege el estado de los eventos operativos.
