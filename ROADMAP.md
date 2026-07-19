# 📋 Roadmap General (GestorEventos & Homelab)

Lista de tareas pendientes que abordaremos en las próximas sesiones para rematar la infraestructura y la aplicación:

### 1. 🎨 Personalización de la App (GestorEventos)
- [x] Diseñar y generar el icono oficial de la aplicación.
- [x] Crear el `favicon`, el `apple-touch-icon` y los iconos para el manifiesto PWA.
- [x] Asegurarnos de que el icono luce profesional y nativo en iOS y Android.

### 2. 🚀 DevOps: Despliegue Automatizado (CI/CD)
- [x] Configurar un sistema de despliegue continuo (ej. Watchtower o Portainer webhooks).
- [x] Conectar el NAS a GitHub para que detecte los `git push`.
- [x] Automatizar la compilación y el redespliegue sin necesidad de lanzar el script `deploy_to_nas.sh` manualmente desde el Mac.

### 3. 🛡️ Infraestructura Doméstica (Homelab)
- [ ] Investigar la API o el panel del router **FritzBox**.
- [ ] Programar un script automático que haga una copia de seguridad periódica de la configuración del router.
- [ ] Guardar esas copias de seguridad de forma segura en el NAS QNAP.
- [x] **Configurar WatchTower globalmente**: Reinstalar y configurar WatchTower a nivel general en el NAS (excluyendo a GestorEventos) para que actualice de forma automática y silenciosa el resto de aplicaciones públicas (Pi-Hole, Plex, etc.).

### 4. 🚀 GestorEventos V2: Funcionalidad Avanzada y Transparencia
- [x] **Modo "No lo sé aún" (Solo Lectura):** Permitir a los usuarios saltar la pantalla de "Únete a la fiesta" seleccionando que no saben sus días. Entrarán a la app con permisos capados (sin poder subir gastos) y un aviso elegante que les invite a confirmar sus días para desbloquear el 100% de la app.
- [x] **Selector de Tarifas Inteligente:** Tanto al unirse como al editar días, sustituir el campo de texto libre por un menú desplegable (`<select>`) que muestre exactamente las tarifas disponibles creadas por el admin (ej: "3 Días - 50€"), para que el usuario no tenga que adivinar.
- [x] **Auditoría y Edición de Días:** Permitir a los usuarios modificar sus propios días a posteriori. Cada vez que lo hagan, el sistema recalculará automáticamente su deuda, el bote global y registrará el cambio con fecha y hora en el historial.
- [ ] **Transparencia Total (El "Ojo" Mágico):** Añadir un icono de un ojo junto a cada asistente en la lista pública. Cualquier usuario normal podrá pinchar y ver el historial detallado de esa persona (cuándo pagó, cuándo cambió de días), replicando el panel de detalle del admin pero en modo "Solo lectura".
- [ ] **Métrica de "Rezagados":** En la pestaña de Ingresos y Gastos, crear un panel de cristal destacado que sume automáticamente cuánto dinero falta por recaudar de la gente que está en números rojos.
- [x] **Contabilidad Blindada (Quitar Ajuste de Cuota):** Eliminar por completo el panel que permite al administrador modificar la cuota de un usuario a mano. La cuota debe calcularse de forma 100% matemática y estricta en base a los días de asistencia para garantizar la transparencia del sistema.

### 5. 💰 Refactor Financiero (Próximamente)
- [ ] **Separación de Responsabilidades:** En la sección "Asistentes" se eliminará toda la gestión de pagos (añadir pago, historial de pagos). Sólo se mantendrá la gestión de los "Días de Asistencia" y su histórico.
- [ ] **Nueva Tarjeta "Ingresos y Gastos":** Se creará una nueva tarjeta en el Dashboard, ubicada justo antes de "Balance".
- [ ] **Ingresos (Ex-Pagos):** Dinero que un asistente aporta al bote común.
- [ ] **Gastos:** Dinero que sale del bote común y se le entrega a un asistente para realizar compras (ej. listas de la compra).
- [ ] **Diseño UI/UX:** Queda pendiente definir la interfaz y funcionalidades exactas de esta nueva pantalla.
