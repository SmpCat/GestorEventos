# Roadmap GestorEventos: Conexión de Caja Única y Estandarización de Diseño

Este documento contiene las especificaciones conceptuales, de desarrollo y de diseño para la reestructuración del sistema de cara a la nueva versión. El objetivo principal es lograr una arquitectura financiera robusta junto con una base de código visualmente unificada, limpia de estilos inline y consistente en su iconografía.

---

## 🎨 1. Estandarización de Diseño (UI/UX) y CSS Puro

Para corregir la discrepancia de estilos inline y la mezcla de componentes visuales en la aplicación, se establecen las siguientes directrices estrictas de diseño:

### A. Paleta de Colores Reducida y Centralizada
Toda la aplicación se regirá exclusivamente por una paleta de **3 o 4 colores base**, configurados como variables CSS en `:root` dentro de [`globals.css`](file:///Volumes/Orico/IA/Proyectos/GestorEventos/src/app/globals.css). Se prohíbe el uso de códigos de color `#hex` o `rgb` embebidos en los componentes React.
*   **Fondo Principal (Background):** Fondo ultra-oscuro / negro para el tema oscuro.
*   **Texto (Primary Text):** Tono claro de alta legibilidad (blanco / gris claro).
*   **Acento (Accent):** Un único color de acento y realce (ej. azul eléctrico o violeta).
*   **Contraste/Alerta (Contrast/Alert):** Color complementario para errores, borrados o advertencias críticas de forma muy dosificada.

### B. Eliminación Total de Estilos Inline
Se realizará una refactorización completa de todos los archivos `.tsx` para eliminar el atributo `style={{ ... }}`.
*   Toda propiedad de maquetación, espaciado, fuentes y colores debe definirse mediante clases globales en `globals.css` o a través de **CSS Modules** (`*.module.css`).
*   Los componentes reutilizables como `SelectField` o botones recibirán únicamente clases CSS para sus variantes, manteniendo el marcado HTML completamente limpio.

### C. Consistencia de Iconografía por Operación
Se evitará la duplicidad y variación de iconos (tanto emojis como vectores) para las mismas acciones de usuario. Se define una relación unívoca de iconografía:
*   **Editar / Modificar:** Un único elemento visual consistente (ej. siempre el mismo lápiz ✏️ o `PencilIcon`).
*   **Eliminar / Cancelar:** Un único elemento visual consistente (ej. siempre la papelera 🗑️ o `TrashIcon`).
*   **Añadir / Registrar:** Un único icono estándar (ej. `+`).
*   **Acciones de Estado (Éxito / Fallo / Carga):** Estandarización de checkmarks, alertas e indicadores de carga.

---

## 📌 2. Filosofía del Sistema: "Caja Única y Centro de Acción"

El sistema se divide en tres áreas funcionales bien diferenciadas a nivel de lógica de negocio:

1.  **Asistentes (El Centro de Acción)**: El único canal a través del cual el administrador puede introducir datos financieros o registrar compras. Todo movimiento de dinero está de esta forma vinculado a un participante.
2.  **Flujo de Caja (El Libro Contable de Solo Lectura)**: Un historial cronológico unificado de todas las entradas, salidas, tickets y movimientos. Desaparece la sección independiente de "Tickets de Compra", integrándose la visualización de los mismos en esta línea de tiempo.
3.  **Lista de la Compra (La Coordinación)**: Se mantiene como organizador de productos necesarios para el evento, gestionada por el administrador y consultable por todos.

---

## 👥 3. Definición Estricta de Roles

### A. El Asistente (Usuario Normal)
Interfaz de usuario simplificada pero con total transparencia:
*   **Gestión de Asistencia (Escritura)**: Apuntarse/desapuntarse del evento activo, indicando días de asistencia, opción de bebida y comida.
*   **Visibilidad Completa (Solo lectura)**:
    *   Ver sus propios saldos y balances del evento.
    *   Ver los saldos y balances de todos los demás asistentes.
    *   Consultar el historial del **Flujo de Caja** completo.
    *   Consultar todas las **Listas de la Compra** y marcar como "comprados" los productos asignados.
*   *Restricción*: No tiene permisos para crear movimientos directos, alterar la contabilidad global, ni subir o escanear tickets.

### B. El Administrador
Control absoluto del evento:
*   **Registrar Movimientos**: Único usuario capaz de registrar los tipos de movimientos financieros en la ficha de los asistentes.
*   **Gestión de Listas**: Crear, renombrar y borrar listas de la compra, así como añadir y asignar productos.
*   **Gestión de Tarifas**: Configurar y editar las reglas de precios del evento.

---

## 💶 4. Los Movimientos Parametrizables de Asistente (Base de Datos)

En lugar de programar de forma rígida los tipos de movimientos en el código, estos serán **100% parametrizables desde la base de datos** a través de la zona de administración.

Cada movimiento en la base de datos se configurará mediante el modelo `MovementConfig`:

| Concepto de Configuración | Tipo / Opciones | Descripción |
| :--- | :---: | :--- |
| **Nombre** | Texto | Nombre del movimiento (ej. "Pago Cuota", "Alta Socio", "Adelanto"). |
| **Efecto en Asistente** | `NONE` / `INCOME` / `EXPENSE` | Cómo repercute en su cuota de fiesta (ej: `INCOME` resta lo que debe, `EXPENSE` suma). |
| **Efecto en Bote** | `NONE` / `INCOME` / `EXPENSE` | Cómo repercute en la caja física (ej: `INCOME` suma dinero real, `EXPENSE` lo resta). |
| **Requiere Ticket** | `Boolean` (Sí/No) | Si está activo, el formulario exigirá escanear o subir un ticket de compra. |

### Configuración por Defecto (Los 7 Movimientos Iniciales)
1.  **Pago Cuota (Ingreso)**: Asistente: `INCOME` | Bote: `INCOME` | Requiere Ticket: `No`.
2.  **Alta Socio (Ingreso)**: Asistente: `NONE` | Bote: `INCOME` | Requiere Ticket: `No`.
3.  **Compra con su Dinero (Gasto Personal)**: Asistente: `INCOME` | Bote: `NONE` | Requiere Ticket: `Sí`.
4.  **Reembolso / Devolución por Compra (Salida)**: Asistente: `EXPENSE` | Bote: `EXPENSE` | Requiere Ticket: `No`.
5.  **Adelanto para Compra (Salida)**: Asistente: `NONE` | Bote: `EXPENSE` | Requiere Ticket: `No`.
6.  **Justificación de Compra con Bote (Ticket Bote)**: Asistente: `NONE` | Bote: `NONE` | Requiere Ticket: `Sí`.
7.  **Devolución de Cambio (Ingreso)**: Asistente: `NONE` | Bote: `INCOME` | Requiere Ticket: `No`.

---

## 🛠️ 5. Impacto en Base de Datos (Prisma Schema)

La base de datos utilizará un sistema dinámico cargando la configuración de movimientos:
```prisma
enum AffectsDirection {
  NONE
  INCOME
  EXPENSE
}

enum PaymentMethod {
  EFECTIVO
  BIZUM
  NINGUNO // Para movimientos sin movimiento físico (ej. Compra Personal)
}

model MovementConfig {
  id              String           @id @default(uuid())
  name            String
  affectsAttendee AffectsDirection @default(NONE)
  affectsPot      AffectsDirection @default(NONE)
  requiresTicket  Boolean          @default(false)
  payments        Payment[]
}

model Payment {
  id              String         @id @default(uuid())
  amount          Float
  paymentMethod   PaymentMethod  @default(EFECTIVO)
  concept         String         // Categoría predefinida o texto libre
  description     String?        // Notas adicionales opcionales
  date            DateTime       @default(now())
  
  // Relaciones
  eventId         String
  attendeeId      String?        // Opcional si es global
  registeredById  String?        // Auditoría
  
  movementConfigId String
  movementConfig   MovementConfig @relation(fields: [movementConfigId], references: [id])
  
  ticketUrl       String?      
  ticketItems     String?        // Detalles de productos (JSON)
}
```
