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

### 9. Auto-Gestión de Perfil & Modo Mantenimiento Superadmin
- **Modal "Mi Perfil":** Disponible desde la barra superior (`👤 Mi Perfil`). Permite al usuario editar su Nombre, Nick, Edad, Socio (`Sí`/`No`), Email y Teléfono.
- **Cambio de Contraseña:** Sub-sección con verificación de contraseña actual, nueva contraseña y casilla `👁️ Mostrar contraseñas`.
- **Privilegios Exclusivos del Superadministrador (`admin`):**
  1. **Control de Mantenimiento:** Tarjeta integrada en la Zona de Administración para pausar o abrir la web a usuarios no admin.
  2. **Carga de Tarifas Peña (Valdeganga):** Botón `👑 Cargar Tarifas Peña (Valdeganga)` en `/pricing/rules` visible de forma exclusiva para el Superadmin.

### 10. Refinamiento de Interfaz (Cabecera Limpia & Corrección de Scroll)
- **Cabecera Ultra-Limpia:** Eliminados botones sobrantes de la barra superior. La propia tarjeta del usuario (`👤 Bienvenido/a [Nombre]`) es interactiva y al clicarla abre directamente "Mi Perfil".
- **Fijado Bug de Scroll:** Aplicado bloqueo de scroll en `document.body` y fondo oscuro transparente completo al abrir el modal de perfil para evitar el desbordamiento de pantalla en móviles.
- **Mantenimiento en Zona Admin:** Movida la tarjeta de control de Mantenimiento a la Zona de Administración del Superadministrador.
- **Texto Mantenimiento:** Actualizada la pantalla de bloqueo con el texto exacto `🔒 Acceso Superadministrador`.

### 11. Aislamiento de Cuenta Técnica Superadmin (`admin`)
- **Exclusión de Asistentes:** La cuenta técnica `admin` queda 100% excluida de auto-registrarse como asistente a eventos, listas de asistentes (`/pricing/attendees`) y balances/estadísticas.
- **Privacidad y Protección:** La cuenta `admin` solo es visible en `/admin/users` cuando el usuario logueado es el propio `admin` (Superadministrador) y cuenta con protección contra borrado accidental.

### 12. Enfoque 100% Financiero en Asistentes
- **Eliminado Historial de Días:** Retirada la tabla y relaciones de `AttendanceHistory` para centrar la vista y auditoría exclusivamente en el historial de pagos y cobros reales del bote.

### 13. Buscadores en Vivo en Gestión de Usuarios y Flujo de Caja
- **Buscador en Usuarios (`/admin/users`):** Añadido campo `🔍 Buscar usuario por nombre o nick...` para filtrar al instante la cuadrícula de 31+ miembros.
- **Buscador en Flujo de Caja (`/finances`):** Añadido filtro rápido en el selector de asistente al crear transacciones y buscador global en el historial de movimientos de caja.

### 14. Acciones Masivas Exclusivas del Superadministrador (`admin`)
- **Control Restringido:** Panel `👑 Acciones Masivas (Superadministrador)` disponible exclusivamente para el rol Superadmin.
- **Protección Root Inviolable:** Todas las operaciones filtran implícitamente `username !== 'admin'`, garantizando que la cuenta del Superadministrador nunca sufra modificaciones involuntarias.

### 15. Edición Masiva Personalizada por Filtros Dinámicos
- **Diseño Glassmorphic Oscuro Integrado:** Eliminados los tonos amarillos por un panel oscuro translúcido con desenfoque de cristal.
- **Filtros Dinámicos Seleccionables:** Filtro objetivo configurable (*Todos los usuarios*, *Menores de 18 años*, *Mayores de 18 años*, *Solo Socios*, *Solo No Socios*, *Solo Admins*, *Solo Usuarios Normales*).
- **Acciones Flexibles:** Ejecución masiva parametrizable (*Marcar como Socio*, *Marcar como No Socio*, *Otorgar Admin*, *Quitar Admin*, *Fijar Edad 18*, *Borrado Masivo Limpio*).

### 16. Alineación de Flechas de Despliegue en Tarjetas de Usuario
- **Anclaje al Margen Derecho:** Reestructurado el layout de `userHeader` con Flexbox para fijar la flecha indicador de despliegue (`▼`/`▲`) 100% anclada al extremo derecho en todas las tarjetas independientemente de la longitud del nombre o los badges.

### 17. Alineación Global de Flechas de Despliegue en Todas las Pantallas
- **Consistencia Multipantalla:** Aplicada la misma estructura Flexbox aislante en `EventMaintenance.tsx` (Gestión de Eventos) para fijar las flechas `▼`/`▲` al margen derecho simétrico en toda la plataforma.

### 18. Edición de Productos en la Lista de la Compra (`/shopping`)
- **Icono de Edición (Lápiz):** Añadido el componente `PencilIcon.tsx` posicionado exactamente al lado de la papelera en cada fila de artículo de la lista de la compra.
- **Edición Inline Interactiva:** Al pulsar el lápiz se activa un formulario inline con un campo de texto enfocado automáticamente, botón de guardar (`✓` / Enter) y botón de cancelar (`✕` / Escape).
- **Acción Servidor (`updateShoppingItem`):** Creada la server action en `src/actions/shopping.ts` para actualizar el nombre en la base de datos SQLite y revalidar en tiempo real la ruta `/shopping`.

### 19. Exclusión de Administrador y Buscador Principal al Inicio (`/shopping`)
- **Exclusión Técnica del Superadministrador:** Filtrada la cuenta `admin` / `Administrador` en la consulta `prisma.user.findMany` y en `assignableUsers` para garantizar que la cuenta técnica nunca aparezca en los desplegables de asignación.
- **Buscador Principal al Principio de Todo:** Ubicado el buscador `🔍 Buscador de personas a asignar / productos` arriba del todo (justo debajo del título principal y antes de los formularios).
- **Filtrado Doble en Tiempo Real:** Al escribir un nombre (ej. "Ana", "Eva", "Daniel"), se filtra tanto el listado de productos de la pantalla como las opciones del desplegable de asignación de cada tarjeta.




