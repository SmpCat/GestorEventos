# Registro de Sincronización Mente Colmena V2 - Cierre de Sesión Completo

**Fecha:** 2026-07-26  
**Dispositivo Origen:** Mac Mini M4 (macOS) ➔ **Dispositivo Destino:** Portátil Windows (Hive Mind Sync)

---

## 📌 Resumen de Cambios & Hitos Alcanzados en esta Sesión

### 1. Home Assistant - Integración Avanzada Barra de Sonido Samsung (SmartThings)
- **Grabado directamente en el servidor activo (`192.168.178.111 / /Volumes/config`):**
  - **`configuration.yaml`:** Añadidos los switches de plantilla `switch.barrasonido_private_rear_sound` y `switch.barrasonido_sound_grouping` mediante llamados `smartthings.execute`.
  - **`lovelace.hogar_premium`:** Enriquecida la tarjeta pop-up `#barrasonido` con controles de *Private Rear Sound*, *Sound Grouping* y selección de *Modo Surround (Delantero/Trasero)*.

### 2. Limpieza & Optimización de Home Assistant
- **Archivos Obsoletos Removidos:** 10 archivos viejos de copia `.bak` del Dashboard (de junio) archivados localmente en `HomeAssistant_Backup/legacy_backups/` y eliminados de la carpeta activa `.storage/` para maximizar la velocidad de respuesta del frontend Lovelace.
- **Limpieza de Logs:** Eliminado registro `home-assistant.log.fault` (0 bytes).

### 3. Mente Colmena V2 - Barrido de los 10 Repositorios
- Sincronizados todos los proyectos en `/Volumes/Orico/IA/Proyectos/`:
  - `GestorArranque`, `GestorEventos`, `Sistemas`, `HomeAssistant`, `TelegramBot`, `MusicManager`, `ConvertFiles`, `URLAudioConverter`, `RestauradorVideos`, `FotosManager` y `~/.gemini/config`.

---
## Sesión 04/08/2026 — Sistema de Tarifas Parametrizado (Socio, Edad, Alcohol y Días)

### Cambios Implementados
- **Schema Prisma (`schema.prisma`):**
  - Campos `isMember` y `age` añadidos al modelo `User`.
  - Atributos `isMember`, `age`, `drinksAlcohol` añadidos al modelo `EventAttendee`.
  - Modelo `PricingRule` expandido con filtros por Socio, Rangos de Edad (minAge/maxAge), Alcohol y Nombre de regla.
- **Servicio de Usuarios (`users.ts`):** `createUser`, `updateUser` y `registerPublicUser` actualizados con `isMember` y `age`.
- **Cálculo de Tarifas (`attendance.ts`):** Creado helper `calculateExpectedPayment()` para seleccionar automáticamente la regla de tarifa más específica.
- **UI:** 
  - Formulario de Registro Público y Modal de Usuario actualizados con Edad y casilla "Es Socio/a".
  - Añadido botón "📋 Cargar Tarifas Peña (Valdeganga)" en el panel de administración de reglas (`RulesAdmin.tsx`).

- **Selector de Alcohol en Pantalla Principal:**
  - Campo `drinksAlcohol` guardado en la tabla de asistentes (`EventAttendee`).
  - Rediseñado el selector de alcohol en el Dashboard utilizando dos componentes `SelectField` gemelos con simetría 100% idéntica entre Asistencia y Consumo de Alcohol.
  - Al cambiar de días o preferencia de alcohol, la cuota esperada se recalcula en tiempo real.

### 4. Perfeccionamiento del Configurador de Tarifas (`/pricing/rules`)
- **Estética Monocromática:** Paleta estricta basada exclusivamente en tonos blanco, gris y negro. Icono de papelera blanca sin etiquetas de texto sobrantes.
- **Formato Responsivo:** Tarjetas de tarifas delimitadas individualmente con borde sutil y sombras. En dispositivos móviles los campos no desbordan a la derecha.
- **Campos Estructurados:** Tramo de Edad y Días de Asistencia configurables mediante pares `[ Min ] a [ Max ]`.
- **Filtro Socio Binario:** Campo `¿Socio/a?` configurado como binario estricto (`Sí (Socio)` / `No (No Socio)`), eliminando la opción redundante.
- **Preset de Tarifas Peña Valdeganga:** 8 reglas precargadas optimizadas a 1 solo clic que traducen de forma 1:1 la libreta de precios manuscrita del evento.

### 5. Correcciones y Administración de Usuarios (`/admin/users`)
- **Deduplicación de Opciones de Asistencia:** Corregido el selector de días en el Dashboard para mostrar únicamente días únicos (`1 día`, `2 días`, `3 días`), evitando repeticiones.
- **Gestión de Perfil en Administración:** Añadida la visualización clara de `Socio`/`No Socio` (monocromático) y `Edad` en la lista de usuarios.
- **Recálculo Dinámico de Cuotas:** Al modificar la edad o condición de socio de un usuario desde la administración, el sistema recalcula automáticamente sus cuotas esperadas en los eventos activos.

### 6. Formularios de Registro de Usuarios (`/register` y Modal Admin)
- **Reordenación de Campos:** Campos obligatorios (Nombre, Nick, Password, Socio, Edad) arriba del todo; campos opcionales (Email, Teléfono) desplazados al final.
- **Selector de Socio:** Implementado mediante `SelectField` premium con valor por defecto `No (No Socio/a)`.
- **Desglose en Asistentes (`/pricing/attendees`):** Añadido panel informativo transparente de tarifa por asistente y controles de edición por parte del administrador.

### 7. Despliegue en Producción & Tolerancia a Fallos
- **Migración de Producción:** Preservados todos los usuarios existentes en producción e iniciados como Socios (18+) de forma transparente.
- **Fallback de Días:** Si las tarifas en producción aún no han sido precargadas, el selector de Asistencia ofrece por defecto `1 día`, `2 días`, `3 días` evitando estados bloqueados o vacíos.

### 8. Pulido Estético de Administración de Usuarios (`/admin/users`)
- **Papelera Blanco Monocromático:** El botón/icono de eliminación de usuario es 100% blanco cristalino alineado con el diseño global.
- **Botón Cancelar en Formulario:** Añadido un botón **"Cancelar"** claro al lado de **"Guardar Usuario"** en la edición y creación de usuarios.
