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
