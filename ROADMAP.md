# Roadmap GestorEventos 2027: Arquitectura Simplificada de Caja Única

Este documento contiene las especificaciones conceptuales y de desarrollo para la reestructuración de la base de datos, lógica de negocio y experiencia de usuario (UI/UX) de cara a la temporada 2027.

---

## 📌 1. Filosofía del Sistema: "Caja Única y Centro de Acción"

Para evitar la redundancia y simplificar el uso de la aplicación, el sistema se dividirá en tres áreas funcionales bien diferenciadas:

1.  **Asistentes (El Centro de Acción)**: El único canal a través del cual el administrador puede introducir datos financieros o registrar compras. Todo movimiento de dinero está de esta forma vinculado a un participante.
2.  **Flujo de Caja (El Libro Contable de Solo Lectura)**: Un historial cronológico unificado de todas las entradas, salidas, tickets y movimientos. Desaparece la sección independiente de "Tickets de Compra", integrándose la visualización de los mismos en esta línea de tiempo.
3.  **Lista de la Compra (La Coordinación)**: Se mantiene como organizador de productos necesarios para el evento, gestionada por el administrador y consultable por todos.

---

## 👥 2. Definición Estricta de Roles

### A. El Asistente (Usuario Normal)
Interfaz de usuario simplificada pero con total transparencia:
*   **Gestión de Asistencia (Escritura)**: Apuntarse/desapuntarse del evento activo, indicando días de asistencia (1, 2, 3+), opción de bebida (Con Alcohol, Sin Alcohol, No Bebida) y comida (Sí/No).
*   **Visibilidad Completa (Solo lectura)**:
    *   Ver sus propios saldos y balances del evento.
    *   Ver los saldos y balances de todos los demás asistentes (para máxima transparencia grupal).
    *   Consultar el historial del **Flujo de Caja** completo en modo lectura.
    *   Consultar todas las **Listas de la Compra** y marcar como "comprados" los productos que tenga asignados.
*   *Restricción*: No tiene permisos para crear movimientos, alterar la contabilidad, ni subir o escanear tickets.

### B. El Administrador
Control absoluto del evento:
*   **Registrar Movimientos**: Único usuario capaz de registrar los tipos de movimientos financieros en la ficha de los asistentes.
*   **Gestión de Listas**: Crear, renombrar y borrar listas de la compra, así como añadir y asignar productos.
*   **Gestión de Tarifas**: Configurar y editar las reglas de precios del evento.

---

## 💶 3. Los Movimientos Parametrizables de Asistente (Base de Datos)

En lugar de programar de forma rígida los tipos de movimientos en el código, estos serán **100% parametrizables desde la base de datos** a través de la zona de administración. Esto permite que la lógica de cálculo y los formularios se adapten dinámicamente.

Cada movimiento en la base de datos se configurará mediante el modelo `MovementConfig`:

| Concepto de Configuración | Tipo / Opciones | Descripción |
| :--- | :---: | :--- |
| **Nombre** | Texto | Nombre del movimiento (ej. "Pago Cuota", "Alta Socio", "Adelanto"). |
| **Efecto en Asistente** | `NONE` / `INCOME` / `EXPENSE` | Cómo repercute en su cuota de fiesta (ej: `INCOME` resta lo que debe, `EXPENSE` suma). |
| **Efecto en Bote** | `NONE` / `INCOME` / `EXPENSE` | Cómo repercute en la caja física (ej: `INCOME` suma dinero real, `EXPENSE` lo resta). |
| **Requiere Ticket** | `Boolean` (Sí/No) | Si está activo, el formulario exigirá escanear o subir un ticket de compra. |

### Configuración por Defecto (Los 7 Movimientos Iniciales)

Bajo esta lógica parametrizable, los 7 movimientos del sistema se definen por base de datos de esta forma:

1.  **Pago Cuota (Ingreso)**:
    *   Efecto Asistente: `INCOME` (resta deuda) | Efecto Bote: `INCOME` (suma dinero) | Requiere Ticket: `No`.
2.  **Alta Socio (Ingreso)**:
    *   Efecto Asistente: `NONE` | Efecto Bote: `INCOME` (suma dinero) | Requiere Ticket: `No`.
3.  **Compra con su Dinero (Gasto Personal)**:
    *   Efecto Asistente: `INCOME` (le genera saldo a favor) | Efecto Bote: `NONE` | Requiere Ticket: `Sí`.
4.  **Reembolso / Devolución por Compra (Salida)**:
    *   Efecto Asistente: `EXPENSE` (cancela su saldo a favor) | Efecto Bote: `EXPENSE` (sale dinero) | Requiere Ticket: `No`.
5.  **Adelanto para Compra (Salida)**:
    *   Efecto Asistente: `NONE` | Efecto Bote: `EXPENSE` (sale dinero) | Requiere Ticket: `No`.
6.  **Justificación de Compra con Bote (Ticket Bote)**:
    *   Efecto Asistente: `NONE` | Efecto Bote: `NONE` (ya salió en paso 5) | Requiere Ticket: `Sí`.
7.  **Devolución de Cambio (Ingreso)**:
    *   Efecto Asistente: `NONE` | Efecto Bote: `INCOME` (entra cambio) | Requiere Ticket: `No`.

---

## 💡 4. Aportaciones y Mejoras de Usabilidad Real

### A. Diferenciación de Caja: Bizum vs. Efectivo
Para facilitar el cuadre físico de la caja al final del evento, los movimientos que afecten al bote (donde `affectsPot !== NONE`) tendrán una etiqueta obligatoria del **Método de Pago**:
*   **Efectivo (Hucha física)**
*   **Bizum / Digital (Cuenta bancaria)**
Esto permitirá al panel de Flujo de Caja desglosar el dinero real disponible en metálico frente al dinero virtual.

### B. Desplegable de Conceptos Predefinidos (Motivos)
En lugar de forzar al administrador a escribir textos manuales en el móvil, los motivos de los movimientos se seleccionarán desde un desplegable estándar:
*   Para cuotas: Preseleccionado como `"Cuota Fiesta"` o `"Cuota Peña"`.
*   Para compras/adelantos: Opciones de categoría como `[Carne/Comida]`, `[Bebida]`, `[Hielo/Menaje]`, `[Otros...]` (esta última abre un campo de texto libre).

### C. Categorías Parametrizables para Gastos y Listas
Se propone crear una tabla `Category` en la base de datos para que el administrador pueda añadir, editar y eliminar categorías directamente desde el panel de control. Estas categorías alimentarán los desplegables de las Listas de la Compra y del Flujo de Caja.
*   *Nota de diseño:* Las categorías iniciales y la estructura final de esta tabla se definirán y estudiarán analizando detalladamente los datos de la base de datos real al finalizar el evento de la presente temporada.

### D. Registro Explícito y Manual
El sistema no realizará divisiones contables automáticas ni deducciones implícitas (por ejemplo, si un ticket supera un adelanto). Todo movimiento (adelantos, justificaciones, compras de bolsillo y reembolsos) debe ser registrado de forma explícita y manual por el administrador para garantizar un control total de la caja y evitar comportamientos "mágicos" del software.

### E. Soporte Histórico de Temporadas (Historial del Bote)
Dado que la base de datos ya soporta multi-evento mediante la propiedad `isActive: Boolean` en el modelo `Event`, la temporada 2027 partirá completamente de cero a nivel contable (caja, listas y pagos limpios). 
*   **Usuarios Persistentes**: El registro global de usuarios (`User`) se conserva intacto para que no tengan que volver a registrarse.
*   **Consulta Histórica**: El evento de 2026 pasará a estar inactivo (`isActive: false`) y quedará bloqueado en formato "solo consulta" para revisar el histórico del bote de ese año sin riesgo de modificaciones. Las nuevas reglas de movimientos dinámicos solo aplicarán de forma activa a partir de los eventos creados para 2027 en adelante.

---

## 🛠️ 5. Impacto en Base de Datos y Código

### A. Modelo de Datos de Movimientos (Prisma Schema)
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
  attendeeId      String?        // Opcional si es global, requerido para asistente
  registeredById  String?        // Auditoría
  
  // Configuración del movimiento (Cargado dinámicamente)
  movementConfigId String
  movementConfig   MovementConfig @relation(fields: [movementConfigId], references: [id])
  
  // Archivo del ticket asociado (Se habilita si movementConfig.requiresTicket es true)
  ticketUrl       String?      
  ticketItems     String?        // Detalles de productos comprados leídos por IA (JSON)
}
```

### B. Eliminación de Modelos Obsoletos
*   El modelo `Expense` se integrará completamente en `Payment` (los movimientos `COMPRA_PERSONAL` y `COMPRA_BOTE` asumen su rol), eliminando tablas redundantes en la base de datos SQLite y simplificando las migraciones.
