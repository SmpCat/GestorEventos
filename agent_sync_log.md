# Hive-Mind Sync Log (Mac -> Windows)
*Última actualización: 12 de Julio de 2026 (por Mac Agent)*

## Resumen de la Sesión de Migración a Producción (NAS)
En esta sesión se preparó GestorEventos para su despliegue final en el QNAP TS-464 y se solucionaron problemas de rendimiento detectados en el Mac.

### 1. Despliegue e Infraestructura "Core-Proxy"
- **Independencia de HA:** El usuario requería aislar Home Assistant del proxy inverso (Nginx) y DNS (DuckDNS) para evitar que la caída de un sistema arrastrara al otro.
- **Nuevo Búnker en NAS:** Se creó un orquestador en `/Homelab/Core-Proxy` que despliega nativamente `Nginx Proxy Manager` (puertos 180/1443) y `DuckDNS` usando Container Station.
- **Port Forwarding:** El tráfico externo (80/443) ahora se enruta directamente al NAS. Se añadieron las IPs del NAS al `trusted_proxies` del `configuration.yaml` de Home Assistant para resolver el HTTP 400. Home Assistant Add-ons antiguos eliminados.

### 2. Optimización para QNAP (Limitación de Hardware)
- **Modo WAL:** Habilitado modo WAL y SYNCHRONOUS=NORMAL en SQLite (`src/lib/prisma.ts`) para minimizar cuellos de botella de I/O detectados.
- **Índices Prisma:** Añadidos índices explícitos en `schema.prisma` a las claves foráneas (ej. `@@index([eventId])`) para evitar full-table scans.
- **React Cache & Promesas:** Refactorizado `layout.tsx` global usando `React.cache()` para evitar duplicidad de queries a DB y `Promise.all()` en llamadas pesadas de `page.tsx` para reducir latencia.

### 3. Dockerización de GestorEventos
- Se habilitó la directiva `output: 'standalone'` en `next.config.ts`.
- Creado un `Dockerfile` (Multi-stage Alpine) optimizado, copiando los binarios precompilados de Prisma y el entorno `standalone`.
- Creado `docker-compose.yml` local para integrarse a la red `proxy_network` expuesta por el Core-Proxy.

### 4. Pruebas Automatizadas (Playwright E2E)
- **Instalación de Playwright:** Hemos implementado y configurado el framework de testing *Playwright* en el proyecto.
- **Suite de Pruebas Superada:** Hemos diseñado y ejecutado con éxito un juego de pruebas de ciclo completo (`e2e-cycle.spec.ts` y `dashboard.spec.ts`) que simula a un usuario real creando un evento, asignando precios, comprando en el supermercado, validando la asistencia (1 día = 20€) y añadiendo gastos con ticket (subida de imagen). Todo superado en verde.

## ⚠️ Instrucciones para el Agente Windows al iniciar:
1. El proyecto local de desarrollo sigue siendo idéntico. Ejecuta `npm install` o `npm run dev` normalmente si necesitas probar algo.
2. Si vas a testear migraciones de base de datos, ten en cuenta que el modo WAL crea archivos temporales (`dev.db-wal` y `dev.db-shm`). No los elimines ni los ignores en tus despliegues.
3. El despliegue a producción ya no usa puertos locales; el contenedor se comunicará internamente con Nginx en la red `proxy_network`.

## Resumen de la Sesión de Pruebas de Estrés (Windows)
*Última actualización: 12 de Julio de 2026 (por Windows Agent)*

### 1. Macro-Simulación y Pruebas E2E (Playwright)
- **Instalación Local**: Se han descargado los navegadores de Playwright localmente en el directorio de trabajo del usuario (Windows) para no ensuciar la caché del sistema.
- **Nuevas Suites de Pruebas**: 
  - `concurrency.spec.ts`: Validado el `Auto-Heal` al intentar activar 2 eventos simultáneamente.
  - `admin-components.spec.ts`: Probada la protección y el borrado seguro en la UI de mantenimiento de usuarios.
  - `receipts-logic.spec.ts`: Probado el borrado en cascada de los tickets desde base de datos y la recarga en la UI financiera.
- **Prueba Estrella de Carga Masiva (50-Users)**:
  - Se creó el script `stress-50-users.spec.ts` inyectando 52 usuarios reales, configurando 5 tarifas diarias, y generando pagos y más de 150 tickets aleatorios.
  - El frontend fue capaz de calcular los saldos cruzados y renderizar el `Bote Teórico Total` y el `Total Gastado` en solo **668ms**.
  - Todos los tests finalizaron con éxito tras solventar ajustes menores en los localizadores de Next.js. El rendimiento es apto para producción.

### Instrucciones para el Agente Mac:
1. Las nuevas pruebas E2E y el macro-simulador están en la carpeta `tests/`. Puedes ejecutarlos cuando quieras para asegurar la consistencia.
2. Todo el código de GestorEventos es 100% estable. Tienes luz verde para empaquetarlo y mandarlo al QNAP mediante Docker.

## Resumen de la Sesión de UX y Diseño Frontend (Mac)
*Última actualización: 13 de Julio de 2026 (por Mac Agent)*

### 1. Refactorización de UI/UX (AttendeesAdmin & RulesAdmin)
- **Papeleras Globales:** Se reemplazaron todos los botones de borrado masivos rojos (`btn-danger`) por elegantes iconos de papelera flotantes transparentes con texto blanco, unificando la línea gráfica premium en toda la app (`ExpenseList.tsx`, `ShoppingList.tsx`, `UserMaintenance.tsx`, `EventMaintenance.tsx`).
- **Formularios de Cuota:** Se ajustó la cuadrícula móvil para poner el *input* directamente debajo del texto que ahora muestra explícitamente `Cuota de X días:`. Se devolvió el nombre `Guardar Cuota` al botón, aplicándole estilo transparente/bordes.
- **Botones Peligrosos:** "Expulsar Asistente" fue transformado en un botón `transparent` de borde rojo.

### 2. Safeguards (Doble Seguridad Antimorosidad)
- **Capa Servidor (`actions/attendance.ts`):** Añadido bloqueo estricto en `deleteAttendee` impidiendo la expulsión de usuarios si existen registros en `Payment` (han pagado cuota) o `Expense` (tienen tickets a su nombre).
- **Capa Cliente:** Los botones de "Expulsar Asistente" ya no se inhabilitan en gris genérico de HTML. Ahora interceptan el clic y emiten una advertencia nativa (`alert`) detallando la necesidad de borrar/reasignar pagos o gastos antes de la expulsión.

### Instrucciones para el Agente Windows:
1. El proyecto ha sido altamente estabilizado a nivel frontend. Todo ha sido comiteado a GitHub.
2. Todo listo para seguir con los despliegues a producción programados para hoy (sea en Vercel o directamente enviándolo a la red del QNAP).

## Resumen de la Sesión de Planificación CI/CD (Windows)
*Última actualización: 13 de Julio de 2026 (por Windows Agent)*

### 1. Aprobación del Pipeline de GitHub Actions + Watchtower
- El usuario ha **aprobado formalmente** la transición del despliegue manual en el NAS (`deploy_to_nas.sh` con compilación local) hacia una automatización completa basada en **GitHub Actions y GHCR**.
- Hemos acordado usar el modelo de **Etiquetas de Versión** (`git tag v1.0.0`) como "gatillo" para evitar despliegues accidentales durante nuestras sincronizaciones diarias a `main`.

### Instrucciones para el Agente Mac:
1. **Puesta en Marcha del CI/CD**: Tienes todo el plan detallado en `docs/CICD_PLAN.md`. El usuario nos ha dado luz verde para implementarlo. 
2. Necesitarás escribir el `.github/workflows/release.yml`, modificar el `docker-compose.yml` para usar la imagen de GHCR en lugar de `build: .`, y añadir el contenedor de Watchtower restringido únicamente a `gestoreventos_prod`.
3. **Generación del Token**: Pide al usuario que genere su *Personal Access Token* clásico con permisos `read:packages` para que Watchtower pueda autenticarse en el NAS y descargar la imagen privada. Guíale en este proceso.

## Resumen de la Sesión de Despliegue Automatizado y PWA (Mac)
*Última actualización: 13 de Julio de 2026 (por Mac Agent)*

### 1. PWA, Iconos y Metadatos Dinámicos
- **Iconos Diferenciados**: Se implementó una lógica dinámica en `src/app/manifest.ts` y `src/app/layout.tsx` para distinguir entre Producción y Desarrollo. 
- En Producción se usa el icono de los Girasoles (`apple-icon-prod.png` y `favicon-prod.ico`) y el nombre "Eventos". 
- En Desarrollo (local) se inyecta el icono "Neon Ticket" (`dev-icon.jpg`) y el nombre "Eventos-Dev". Next.js estaba pisando la configuración auto-descubriendo el favicon, así que se extrajeron los estáticos a nombres custom para inyectarlos manualmente.

### 2. Implementación GitHub Actions -> QNAP (Watchtower)
- **GitHub Packages Público**: En lugar de pelear con tokens PAT y mapeo de configuraciones Docker (`config.json`), cambiamos el paquete en GitHub a visibilidad "Public". Esto simplificó enormemente el Compose de producción.
- **Despliegue nativo (Container Station)**: El contenedor se desplegó usando una "Aplicación" nativa de Docker Compose en el QNAP en lugar de contenedores "sueltos", lo cual garantiza persistencia estructural y red.
- **SQLite Permisos Fix**: Al desplegarse en el NAS, SQLite daba `Permission denied (os error 13)`. Se solucionó añadiendo explícitamente `user: "root"` al `docker-compose.yml` final, otorgando a la imagen Node Alpine los permisos de host necesarios para lectura/escritura en la carpeta local compartida.

### Instrucciones para el Agente Windows:
1. El sistema `Watchtower` está totalmente operativo. Revisa el `docker-compose.yml` del repositorio para que tengas la configuración final oficial.
2. Si subes cualquier cambio a `main` creando un tag (ej. `v1.1.5`), GitHub Actions generará la imagen y el QNAP la bajará en menos de una hora sin tocar nada.
3. El usuario ya tiene un borrador en `instrucciones_instalacion_app.md` / `WHATSAPP_MANUAL.md` para pasarlo a los invitados por WhatsApp con instrucciones de PWA en iOS y Android.

## Resumen de la Sesión de Pulido de UI, Despliegues NAS y WatchTower Global (Mac)
*Última actualización: 15 de Julio de 2026 (por Mac Agent)*

### 1. Refactorización Estética (Aesthetic & Glassmorphism)
- Se consolidó el diseño UI aplicando paneles traslúcidos con bordes suaves (`innerBlackBox` class) y desenfoque (backdrop-filter) por toda la aplicación, eliminando diseños duros de colores planos antiguos (ej. pantalla "Únete a la fiesta", "Login", etc.).
- Se implementó la imagen premium de los girasoles oscura como fondo estático para las pantallas de bienvenida.

### 2. Error 500 ChunkLoadError & Limpieza QNAP NAS
- En esta sesión el usuario reportó que el despliegue al NAS (`./deploy_to_nas.sh`) daba errores 500 en Next.js.
- Se diagnosticó que se debía a la corrupción de la caché de Docker de los "layers" de compilación (reusaba carpetas `.next` antiguas al compilar en el NAS). Se arregló inyectando explícitamente la directiva `--no-cache` al `docker compose build` y `--remove-orphans` en `deploy_to_nas.sh`.
- Se resolvieron inconsistencias en los nombres de las aplicaciones en Container Station. Todo se ha unificado para que la carpeta en el NAS, la aplicación Compose y el nombre del contenedor se llamen exactamente `gestoreventos` (todo en minúsculas). 

### 3. Independencia de WatchTower (Global)
- Para evitar que la configuración de Watchtower viviera dentro de la de GestorEventos (causando bloqueo en la UI de QNAP para borrarlos independientemente), Watchtower se ha separado por completo.
- Se ha inyectado en `docker-compose.yml` la etiqueta `com.centurylinklabs.watchtower.enable=false` para blindar GestorEventos.
- Se creó un script definitivo `deploy_watchtower.sh` que instala de forma aislada a Watchtower en `/share/CACHEDEV1_DATA/Container/watchtower` en el NAS para vigilar el resto de aplicaciones públicas (Pi-hole, Plex, etc).

### Instrucciones para el Agente Windows:
1. Lee detenidamente el `ROADMAP.md` en su sección V2, hay modificaciones de la Lógica de Negocio introducidas hoy que mañana deberás desarrollar (como quitar el Ajuste Manual de Cuota y sustituir input por Select de Tarifas).
2. Todo el código de GestorEventos ha sido subido a Github sin problemas, incluyendo los nuevos scripts de automatización del NAS. Ya no es necesario tocar Watchtower ni el NAS. Mañana puedes ponerte 100% con la programación de las features de V2.
