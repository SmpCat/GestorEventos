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
*   **Registrar Movimientos**: Único usuario capaz de registrar los 7 tipos de movimientos financieros en la ficha de los asistentes.
*   **Gestión de Listas**: Crear, renombrar y borrar listas de la compra, así como añadir y asignar productos.
*   **Gestión de Tarifas**: Configurar y editar las reglas de precios del evento.

---

## 💶 3. Los 7 Tipos de Movimientos de Asistente

Toda transacción se clasificará en uno de estos 7 tipos, cada uno con su comportamiento contable específico:

| # | Tipo de Movimiento | ¿Lleva Ticket? | Impacto en Balance de Asistente | Impacto en Caja Física del Bote |
| :-: | :--- | :---: | :---: | :---: |
| **1** | **Pago Cuota (Ingreso)** | No | **Resta de su deuda** | **Suma al bote** (Efectivo/Bizum) |
| **2** | **Alta Socio (Ingreso)** | No | Ninguno (no afecta a fiesta) | **Suma al bote** (Efectivo/Bizum) |
| **3** | **Compra con su Dinero (Gasto Personal)** | **Sí** (Foto/Manual) | **Saldo a su favor (Bote le debe)** | Ninguno |
| **4** | **Reembolso / Devolución por Compra (Salida)** | No | **Cancela su saldo a favor** | **Resta del bote** (Efectivo/Bizum) |
| **5** | **Adelanto para Compra (Salida)** | No | Ninguno (dinero del bote) | **Resta del bote** (Efectivo/Bizum) |
| **6** | **Justificación de Compra con Bote (Ticket Bote)** | **Sí** (Foto/Manual) | Ninguno | Ninguno (ya restado en paso 5) |
| **7** | **Devolución de Cambio (Ingreso)** | No | Ninguno | **Suma al bote** (Efectivo/Bizum) |

---

## 💡 4. Aportaciones y Mejoras de Usabilidad Real

### A. Diferenciación de Caja: Bizum vs. Efectivo
Para facilitar el cuadre físico de la caja al final del evento, los movimientos que afecten al bote (Pagos, Altas, Reembolsos, Adelantos) tendrán una etiqueta obligatoria del **Método de Pago**:
*   **Efectivo (Hucha física)**
*   **Bizum / Digital (Cuenta bancaria)**
Esto permitirá al panel de Flujo de Caja desglosar el dinero real disponible en metálico frente al dinero virtual.

### B. Desplegable de Conceptos Predefinidos (Motivos)
En lugar de forzar al administrador a escribir textos manuales en el móvil, los motivos de los movimientos se seleccionarán desde un desplegable estándar:
*   Para cuotas: Preseleccionado como `"Cuota Fiesta"` o `"Cuota Peña"`.
*   Para compras/adelantos: Opciones de categoría como `[Carne/Comida]`, `[Bebida]`, `[Hielo/Menaje]`, `[Otros...]` (esta última abre un campo de texto libre).

### C. Soporte Histórico de Temporadas (Historial del Bote)
Dado que la base de datos ya soporta multi-evento mediante la propiedad `isActive: Boolean` en el modelo `Event`, el año que viene se podrá desactivar el evento 2026 y activar el de 2027 sin borrar los datos del año anterior. Se sugiere añadir un **Selector de Evento** en el panel de administrador para poder consultar el histórico contable y de asistencia de años pasados en formato "solo lectura".

---

## 🛠️ 5. Impacto en Base de Datos y Código

### A. Modelo `Payment` (Prisma Schema)
Se expandirá el modelo `Payment` para incluir el tipo específico de movimiento, método de pago y concepto:
```prisma
enum MovementType {
  PAGO_CUOTA
  ALTA_SOCIO
  COMPRA_PERSONAL
  REEMBOLSO_COMPRA
  ADELANTO_COMPRA
  COMPRA_BOTE
  DEVOLUCION_CAMBIO
}

enum PaymentMethod {
  EFECTIVO
  BIZUM
  NINGUNO // Para movimientos virtuales como COMPRA_PERSONAL
}

model Payment {
  id              String         @id @default(uuid())
  amount          Float
  type            String         // "INCOME" o "EXPENSE" (para compatibilidad de caja)
  movementType    MovementType
  paymentMethod   PaymentMethod  @default(EFECTIVO)
  concept         String         // Categoría predefinida o texto libre
  description     String?        // Notas adicionales opcionales
  date            DateTime       @default(now())
  
  // Relaciones
  eventId         String
  attendeeId      String?        // Opcional si es global, requerido para asistente
  registeredById  String?        // Auditoría
  
  // Archivo del ticket asociado (Para movimientos COMPRA_PERSONAL y COMPRA_BOTE)
  ticketUrl       String?      
  ticketItems     String?        // Detalles de productos comprados leídos por IA (JSON)
}
```

### B. Eliminación de Modelos Obsoletos
*   El modelo `Expense` se integrará completamente en `Payment` (los movimientos `COMPRA_PERSONAL` y `COMPRA_BOTE` asumen su rol), eliminando tablas redundantes en la base de datos SQLite y simplificando las migraciones.
