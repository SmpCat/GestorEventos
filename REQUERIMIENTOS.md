# Documento de Requerimientos (GestorEventos)

*Este documento es un ser vivo. Iremos actualizándolo conforme definamos nuevas reglas, pantallas o necesidades antes de empezar a programar.*

## 1. Objetivo del Proyecto
Crear una aplicación web ultraligera para gestionar la tesorería (ingresos y gastos) de un grupo de aproximadamente 50 personas.

## 2. Multi-Evento (Arquitectura Global)
La aplicación será capaz de gestionar **múltiples eventos históricos y futuros de forma simultánea** (ej. "Fiestas Valdeganga 2026", "Fiestas Valdeganga 2027", "Nochevieja 2028"). 
- Todos los datos del sistema (gastos, tarifas, cuotas pagadas) estarán aislados y vinculados al evento que esté seleccionado en ese momento.

## 3. Gestión de Usuarios, Roles y Asistencia
El sistema contará con un acceso seguro diferenciando dos roles principales:
- **Administrador**: Puede crear eventos, dar de alta usuarios y conceder roles de administrador.
- **Usuario Estándar**: Acceso limitado a ver el bote y subir tickets del evento activo.
- **Participación por Evento**: Un usuario (ej. Pepe) existe globalmente en el sistema con su Email y Password, pero su estado de *"Asiste 5 días y ya ha pagado"* es único para cada evento.
- **Importación Rápida**: Al crear un nuevo evento, el Administrador dispondrá de una herramienta para "Copiar/Importar" automáticamente a los asistentes del evento anterior, evitando tener que darlos de alta uno a uno cada año.

## 4. Gestión de Cuotas y Tarifas
- **Tabla de Tarifas por Evento**: Cada evento tendrá sus propias reglas de precio (ej. en 2026: 5 días = 60€, pero en 2027: 5 días = 70€).
- El sistema calculará automáticamente la cuota que debe aportar el usuario en el evento actual cruzando sus días con la tabla de ese año.
- **Saldo a favor**: Contador interno para cada usuario (por evento) que refleje el dinero que el Bote le debe por haber adelantado compras.

## 5. Gestión de Gastos (Compras y Tickets)
- Interfaz para registrar una nueva compra vinculada al evento activo.
- Campos obligatorios:
  - **Comprador** (quién ha adelantado el dinero).
  - **Establecimiento** (ej. Consum, Mercadona).
  - **Importe total**.
  - **Fotografías del ticket**: Posibilidad de adjuntar varias imágenes si el ticket de compra es muy largo (almacenadas físicamente en el NAS sin saturar la BD).
- *Lógica interna*: Al registrar el gasto, ese importe pasa automáticamente al "Saldo a favor" del comprador en el Evento Activo.

## 6. Lógica de Inteligencia Artificial (Lectura OCR e Inventario)
- Se integrará una API externa en la nube (Opción A: OpenAI/Google Vision) para analizar automáticamente la fotografía (o fotografías) de los tickets.
- **Extracción de datos**: La IA extraerá automáticamente el *Establecimiento*, el *Importe Total* y una **lista detallada de todos los productos adquiridos** (nombre, cantidad y precio).
- El usuario solo tendrá que verificar visualmente que los datos son correctos antes de guardar, sin tener que teclear nada a mano.

## 7. Panel Principal (Dashboard)
Pantalla resumen para ver de un vistazo la salud económica del evento activo:
- **Bote Total Recaudado**.
- **Total Gastado**.
- **Saldo Disponible**.

## 8. Arquitectura y Diseño (UX/UI)
- **Diseño Responsive (Mobile-First)**: Interfaz diseñada para **Móviles**, adaptable a **Escritorio**.
- **Tecnologías**: Next.js (Frontend/Backend) + Base de Datos SQLite (Relacional).
- **Despliegue Final**: QNAP TS-464 vía Container Station (Docker).
- **Control de Versiones**: Git + GitHub.
