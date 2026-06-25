# Documento de Requerimientos (GestorEventos)

*Este documento es un ser vivo. Iremos actualizándolo conforme definamos nuevas reglas, pantallas o necesidades antes de empezar a programar.*

## 1. Objetivo del Proyecto
Crear una aplicación web ultraligera para gestionar la tesorería (ingresos y gastos) de un grupo de aproximadamente 50 personas durante unas fiestas o eventos. 

## 2. Parámetros Globales (Configuración)
La aplicación debe ser reutilizable año tras año sin tocar código. Para ello, contará con:
- **Título Dinámico**: Parámetro para definir el nombre del evento (ej. *"Fiestas Valdeganga 2026"*).
- **Tabla de Tarifas**: Reglas de precios basadas en la asistencia (ej. 5 días = 60€, 2 días = 30€).

## 3. Gestión de Usuarios y Cuotas
- Cada usuario tendrá asignado el número de días que asiste.
- El sistema calculará automáticamente la cuota que debe aportar cruzando sus días con la Tabla de Tarifas.
- Seguimiento del estado: **Pagado** o **Pendiente**.
- **Saldo a favor**: Contador interno para cada usuario que refleje el dinero que el Bote le debe por haber adelantado compras.

## 4. Gestión de Gastos (Compras y Tickets)
- Interfaz para registrar una nueva compra que reste dinero del Bote Común.
- Campos obligatorios:
  - **Comprador** (quién ha adelantado el dinero).
  - **Establecimiento** (ej. Consum, Mercadona).
  - **Concepto / Descripción**.
  - **Importe total**.
  - **Fotografía del ticket** (almacenada en el NAS).
- *Lógica interna*: Al registrar el gasto, ese importe pasa automáticamente al "Saldo a favor" del comprador para saber que hay que devolverle el dinero.

## 5. Panel Principal (Dashboard)
Pantalla resumen para ver de un vistazo la salud económica del grupo:
- **Bote Total Recaudado** (Suma de cuotas pagadas).
- **Total Gastado** (Suma de todos los tickets).
- **Saldo Disponible** (El dinero que queda físicamente en la caja).

## 6. Arquitectura y Diseño (UX/UI)
- **Diseño Responsive (Mobile-First)**: La interfaz estará diseñada primordialmente para **Teléfonos Móviles**, ya que los usuarios subirán los tickets directamente desde el supermercado. La interfaz se adaptará fluidamente a **Escritorio** para la gestión del Administrador.
- **Tecnologías**: Next.js (Frontend/Backend) + Base de Datos SQLite.
- **Despliegue Final**: QNAP TS-464 vía Container Station (Docker).
- **Control de Versiones**: Se utilizará Git y se sincronizará con un repositorio en GitHub.

## 7. Módulo de Autenticación y Perfiles
El sistema contará con un acceso seguro diferenciando dos roles principales:
- **Administrador**: Puede crear y dar de alta a otros usuarios, definiendo además si el nuevo usuario tendrá rol de administrador o no.
- **Usuario Estándar**: Acceso limitado a las funciones operativas de la aplicación.
- **Campos de Información del Usuario**:
  - *Nombre y Apellidos* (Obligatorio)
  - *Usuario* (Obligatorio)
  - *Password* (Obligatorio)
  - *Email* (Opcional)
  - *Número de Móvil* (Opcional)
