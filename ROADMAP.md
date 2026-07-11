# Roadmap y Futuras Mejoras 🚀

Este documento sirve como registro de ideas, características y mejoras que se han planteado para implementar en futuras versiones de la aplicación Gestor de Eventos.

## 📌 Historial de Eventos (Modo Solo Lectura)
**Objetivo:** Permitir a los usuarios estándar consultar la información de eventos pasados sin riesgo de que modifiquen datos.
**Descripción:** 
- En el futuro, un usuario (no administrador) podrá ver una lista con el historial de eventos a los que ha asistido en años anteriores (ej. Fiestas 2024, Viaje 2025).
- Al seleccionar uno de esos eventos antiguos, la aplicación cargará el "contexto" de ese evento.
- El usuario podrá navegar por todas las pestañas (Lista de Compra, Gastos, Cuotas, etc.) para consultar la información, pero la interfaz aplicará un modo de **Solo Lectura**.
- En modo Solo Lectura, los botones de acción (Añadir gasto, subir ticket, marcar como pagado, borrar elemento) estarán ocultos o deshabilitados.
- **Viabilidad Técnica:** Muy alta. La arquitectura ya es *Multi-Tenant* (basada en la ID del evento), por lo que solo se requiere añadir un conmutador de evento en la interfaz y pasar un flag booleano (`isReadOnly`) a los componentes para ocultar los controles de edición.
