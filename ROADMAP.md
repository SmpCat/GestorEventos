# 📋 Roadmap General (GestorEventos & Homelab)

Lista de tareas pendientes que abordaremos en las próximas sesiones para rematar la infraestructura y la aplicación:

### 1. 🎨 Personalización de la App (GestorEventos)
- [ ] Diseñar y generar el icono oficial de la aplicación.
- [ ] Crear el `favicon`, el `apple-touch-icon` y los iconos para el manifiesto PWA.
- [ ] Asegurarnos de que el icono luce profesional y nativo en iOS y Android.

### 2. 🚀 DevOps: Despliegue Automatizado (CI/CD)
- [x] Configurar un sistema de despliegue continuo (ej. Watchtower o Portainer webhooks).
- [x] Conectar el NAS a GitHub para que detecte los `git push`.
- [x] Automatizar la compilación y el redespliegue sin necesidad de lanzar el script `deploy_to_nas.sh` manualmente desde el Mac.

### 3. 🛡️ Infraestructura Doméstica (Homelab)
- [ ] Investigar la API o el panel del router **FritzBox**.
- [ ] Programar un script automático que haga una copia de seguridad periódica de la configuración del router.
- [ ] Guardar esas copias de seguridad de forma segura en el NAS QNAP.
