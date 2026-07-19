# Registro de Sincronización (Mente Colmena)

Este archivo sirve para transferir contexto entre las sesiones del portátil de Windows y del Mac.

## Sesión: Mac (19 Julio 2026)

**Cambios implementados:**
1. **Refactor Financiero**: 
   - Se ha añadido el campo `type` (String, default "INCOME") a la tabla `Payment` de Prisma. (Migración `db push` realizada sin pérdida de datos).
   - Se ha creado una nueva pantalla de **Ingresos y Gastos** en la ruta `/finances` con su propio componente visual (`FinancesAdmin.tsx`) reutilizando estilos oscuros (`actionBox`, `SelectField`).
   - Se ha modificado el `Dashboard.tsx` para incluir el acceso a Finanzas.
   - Se ha modificado el balance global (`results/page.tsx`) para que sólo sume los ingresos (`type === 'INCOME'`) a la hora de calcular el total recaudado.

2. **Limpieza de Asistentes**:
   - En la vista de `AttendeesAdmin.tsx`, se ha eliminado toda la lógica para registrar y eliminar pagos, aislando esta pantalla únicamente para la gestión de los días de asistencia de las personas.

**Trabajo Pendiente / Plan para la siguiente sesión:**
- Existe un plan pendiente de ejecución en el que se propone transformar la información visual de la tarjeta no expandida de `AttendeesAdmin.tsx` en un sistema de **semáforo** (Verde: Al día, Rojo: Pago pendiente, Amarillo: Excedente) y eliminar el desglose numérico detallado de euros para que solo se vea en la sección de Finanzas.

---
*(Por favor, asegúrate de revisar este archivo y mantenerlo actualizado tras tus sesiones importantes)*
