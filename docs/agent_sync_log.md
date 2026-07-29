# Registro de Sincronización (Mente Colmena)

Este archivo sirve para transferir contexto entre las sesiones del portátil de Windows y del Mac.

## Sesión: Mac (20 Julio 2026)

**Cambios implementados:**
1. **Restauración en Asistentes:** 
   - Se ha vuelto a incorporar la funcionalidad de añadir pagos y ver el historial dentro de la tarjeta de cada usuario en la pantalla de Asistentes (`AttendeesAdmin.tsx`), a petición del usuario.
   - La lógica matemática de esta pantalla se ha adaptado para que sólo sume los registros de tipo `INCOME` (Ingresos) y muestre visualmente si un movimiento fue un gasto (con un signo `-`).
2. **Buscador de Asistentes:**
   - Se ha implementado una barra de búsqueda en la pantalla de Asistentes que permite filtrar la lista en tiempo real por nombre o nick. Incluye un botón "✕" para limpiar la búsqueda rápidamente.
3. **Limpieza de UI:**
   - Se ha eliminado por completo la funcionalidad y el botón rojo de "Expulsión Masiva" para evitar accidentes.
4. **Renombrado y Reordenación (Dashboard y Pantallas):**
   - El apartado que antes era "Balance" ahora se llama **"Resumen de caja"** y aparece primero.
   - El apartado que antes era "Ingresos y Gastos" ahora se llama **"Flujo de Caja"** y aparece después.

**Estado actual:**
- Todo optimizado, sin errores críticos de build, y subido a la rama principal (Producción).

---
*(Por favor, asegúrate de revisar este archivo y mantenerlo actualizado tras tus sesiones importantes)*

## Sesión: Windows (24 Julio 2026)

**Mensaje del Agente de Windows para el Agente de Mac:**
¡Hola compañero! El usuario ha movido la carpeta del proyecto a una nueva ubicación hoy, pero ya me he encargado de restaurar el índice de Git y dejarlo todo perfectamente sincronizado.
No hemos implementado ninguna funcionalidad nueva en esta corta sesión, simplemente nos hemos asomado para comprobar que todo esté en orden. ¡Gran trabajo con el buscador en tiempo real y la limpieza de UI en la pantalla de Asistentes! 

El usuario y yo te mandamos un saludo. Te pasamos el testigo. 🚀

---

## Sesión: Mac (28 Julio 2026)

**Mensaje del Agente de Mac para el Agente de Windows:**
¡Hola compañero!
He cerrado con éxito el proyecto de la Barra de Sonido en Home Assistant (limpieza de Lovelace, diseño híbrido del botón de encendido centrado en rectángulo transparente, optimizaciones para móviles con tamaño de botones a 80px, alineación vertical de iconos, purga de 15 entidades antiguas e inválidas y corrección de la pulsación de presets de volumen). Todo eso ha quedado subido a producción en Home Assistant y en su respectivo repositorio git.

Acabo de hacer `git pull` en este proyecto (`GestorEventos`) y he comprobado que todo está al día. El usuario prefiere dejar las modificaciones para mañana. Te dejo el testigo aquí con el entorno preparado y limpio para lo que nos pida mañana. ¡Un saludo! 🚀

---

## Sesión: Mac (29 Julio 2026)

**Mensaje del Agente de Mac para el Agente de Windows:**
¡Hola compañero!
Hoy hemos rematado las tareas de Home Assistant de forma definitiva antes de iniciar GestorEventos:
1. **Lógica de colores y regleta del Salón:** Configurada la lógica en Mushroom y Bubble Card para pintar de gris los iconos del salón (TV, Barra de sonido, Apple TV) si el Google TV Streamer está en `unavailable` (ya que comparten regleta física). Esto soluciona el retardo del router.
2. **Encendido TV Cocina:** Corregido el bug en la automatización de encendido de la TV Cocina; ahora usa la llamada WoL nativa y directa de Home Assistant con su MAC en vez del botón del Fritzbox, haciendo que funcione al instante.
3. **Roadmap:** Añadido recordatorio en `ROADMAP.md` (Sección 3: Infraestructura) para configurar las Opciones de Desarrollo y mantener el Wi-Fi activo en la TV de Paula para que no se quede gris al entrar en standby.
4. **Estilo para botones desactivados (`globals.css`):** Se ha definido una regla CSS global para los botones con estado `:disabled` y `.btn:disabled`, aplicando opacidad 0.4, cursor `not-allowed` y `pointer-events: none`. Esto soluciona la falta de feedback visual en el botón `+` cuando no hay texto introducido en la entrada de producto.
5. **Consistencia en Gastos Registrados (`ExpenseList.tsx` / `ExpenseList.module.css`):** Se han replicado de manera análoga las etiquetas `Manualmente` y `Fotográficamente` en la sección de Añadir Gasto, manteniendo la misma alineación perfecta en ordenadores y adaptabilidad en dispositivos móviles.
6. **Texto del botón de escaneo (`ExpenseList.tsx`):** Se ha cambiado el texto del botón en Gastos de `Escanear Nuevo Ticket` a `Subir o hacer foto a un ticket`, homogeneizándolo con la lista de la compra.
7. **Resiliencia en Carga de Fotos (Evidencias):**
   - *Lista de Compra:* Modificado `scanShoppingListAI` para guardar físicamente y registrar la imagen en la BBDD al inicio. Si la IA falla, la imagen no se pierde y aparece en la galería.
   - *Gastos Registrados:* Modificado `processReceiptAction` para capturar fallos de Gemini y retornar un fallback con la imagen guardada. El componente `ExpenseList.tsx` muestra un panel amarillo de advertencia, permitiendo rellenar los datos a mano sobre la previsualización del ticket guardado.
8. **Re-escaneo de tickets y listas con IA:**
   - *Base de Datos:* Añadido campo `isScanned Boolean @default(true)` en `ShoppingListEvidence` y `Expense`. Sincronizado mediante `npx prisma db push`.
   - *Acciones:* Creadas `reScanShoppingListAI` y `reScanExpenseAI` para re-procesar los archivos locales y rellenar productos/datos financieros de forma automática si falló en el primer intento.
   - *UI:* Añadidas marcas visuales (`✅` para éxito, `⚠️` para no digitalizados), botones `🔄` dedicados a re-escaneo, e interacción al hacer clic en las imágenes no procesadas que pregunta al usuario si desea volver a intentarlo.

Queda el entorno listo y sincronizado. ¡Un saludo! 🚀










