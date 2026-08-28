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

### D. Tareas de Homogeneización Asignadas al Agente (IA)
Para asegurar la cohesión visual, el agente de IA tiene asignadas las siguientes tareas de estandarización en toda la base de código:
1.  **Paleta de colores actual:** Mapear todos los valores de color (hex, rgb, nombres) dispersos por la app a un conjunto unificado de 3 o 4 variables CSS en `:root`.
2.  **Iconos utilizados:** Consolidar todos los emojis e iconos en un catálogo coherente para que cada operación use exclusivamente el mismo elemento gráfico.
3.  **Tipos de botones:** Crear y aplicar un estándar de estilos/variantes de botones (ej. primario, secundario, peligro, icono-acción) eliminando variaciones arbitrarias.
4.  **Tipos de entrada de datos:** Estandarizar componentes de formulario (inputs de texto, checkboxes, áreas de texto y selectores como `SelectField`).
5.  **Tipo de salidas de datos:** Unificar el diseño visual de elementos informativos (tablas, listas, tarjetas, resúmenes, balances, insignias/badges y modales).

---

## 📌 2. Filosofía del Sistema: "Caja Única y Centro de Acción"

El sistema se divide en tres áreas funcionales bien diferenciadas a nivel de lógica de negocio:

1.  **Asistentes (El Centro de Acción)**: El único canal a través del cual el administrador puede introducir datos financieros o registrar compras. Todo movimiento de dinero está de esta forma vinculado a un participante.
2.  **Flujo de Caja (El Libro Contable)**: Un historial unificado en estricto orden cronológico que muestra la evolución del Bote. Únicamente se mostrarán los siguientes tipos de movimientos:
    *   **Bote Anterior (Sobrante de la temporada pasada):** Este valor se configura en la ficha de **Gestión de Eventos** por parte del Administrador (guardado en el modelo `Event` como `previousSurplus`). El Flujo de Caja lo lee automáticamente y lo muestra de solo lectura como la entrada inicial de la línea de tiempo, inicializando el saldo de la caja.
    *   **Alta de Cuota (Ingreso):** Registros de pagos parciales o completos de la cuota de fiesta por parte de los asistentes.
    *   **Alta de Socio (Ingreso):** Registros de pagos de la cuota de socio por parte de los asistentes.
    *   **Gasto (Salida):** Movimientos de salida de caja generados directamente a partir de los **Tickets de Compra** (ya sean escaneados por la IA o añadidos manualmente).
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

## 💶 4. Los Movimientos Financieros del Asistente (Cuotas y Gestión de Deuda)

El sistema contable de cara al participante se simplifica para admitir únicamente dos tipos de movimientos financieros (ingresos):

1.  **Pago Cuota Fiesta:** 
    *   **Cálculo Automático:** Se calcula a partir de las tarifas cargadas en la tabla de precios (`PricingRule`).
    *   **Regla de Ajuste Exacto (Sin Aproximaciones):** No se realizarán aproximaciones de días ni fallbacks si no hay coincidencia exacta. Si el perfil del asistente (días, edad, alcohol, comida, socio) coincide exactamente con alguna tarifa, esta se aplica. En caso contrario, no se calcula cuota esperada y se muestra un mensaje en pantalla indicando que debe **consultar con el Administrador**.
    *   **Cálculo de Deuda / Saldo (Pagos Fraccionados o en Exceso):** El asistente puede realizar múltiples pagos parciales o pagar de más. El saldo se calcula como: `Suma(Pagos de Fiesta) - Cuota de Fiesta`.
        *   Si el resultado es **negativo** (ej. Cuota: 60€ | Pagado: 50€): El asistente **debe** la diferencia al Bote (deuda de 10€).
        *   Si el resultado es **positivo** (ej. Cuota: 60€ | Pagado: 70€): El Bote **debe** la diferencia al asistente (saldo a favor de 10€).
2.  **Pago Cuota Socio:**
    *   **Cálculo del Importe:** Establecido y configurado directamente por el Administrador.
    *   **Cálculo de Deuda / Saldo (Pagos Fraccionados o en Exceso):** El saldo se calcula como: `Suma(Pagos de Socio) - Cuota de Socio`.
        *   Si el resultado es **negativo** (ej. Cuota Socio: 20€ | Pagado: 10€): El asistente **debe** la diferencia al Bote (deuda de 10€).
        *   Si el resultado es **positivo** (ej. Cuota Socio: 20€ | Pagado: 50€): El Bote **debe** la diferencia al asistente (saldo a favor de 30€).
    *   **Automatización de Condición de Socio:** Al registrarse el pago de cuota de socio (ya sea el primer pago fraccionado o el pago completo), el backend actualizará de forma automática la propiedad `isMember: true` en el registro del usuario (`User`).

Estos dos son los únicos tipos de transacciones que pueden alterar la deuda/saldo de un participante o registrar entradas financieras del mismo al Bote.

---

## 🛠️ 5. Impacto en Base de Datos (Prisma Schema)

El modelo de datos para los pagos se simplifica eliminando configuraciones dinámicas innecesarias, basándose en un enumerado estático de tipo de pago:

```prisma
enum PaymentType {
  FIESTA   // Pago de la cuota de fiesta
  SOCIO    // Pago de la cuota de socio
}

enum PaymentMethod {
  EFECTIVO
  BIZUM
}

model Payment {
  id              String         @id @default(uuid())
  amount          Float
  type            PaymentType    @default(FIESTA)
  paymentMethod   PaymentMethod  @default(EFECTIVO)
  description     String?        // Notas opcionales
  date            DateTime       @default(now())
  
  // Relaciones
  eventId         String
  event           Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  attendeeId      String?        // Vinculado al participante
  attendee        EventAttendee? @relation(fields: [attendeeId], references: [id], onDelete: Cascade)
  registeredById  String?        // Auditoría del Administrador
  registeredBy    User?          @relation("PaymentRegisteredBy", fields: [registeredById], references: [id])
}
```
