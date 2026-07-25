# Registro de Sincronización Mente Colmena V2 - Cierre de Sesión Completo

**Fecha:** 2026-07-26  
**Dispositivo Origen:** Mac Mini M4 (macOS) ➔ **Dispositivo Destino:** Portátil Windows (Hive Mind Sync)

---

## 📌 Resumen de Cambios & Hitos Alcanzados en esta Sesión

### 1. Router FRITZ!Box 5690 Pro - Protección contra Revinculación DNS (DNS Rebind Protection)
- **Causa Raíz Diagnosticada:** El FRITZ!Box bloqueaba peticiones de dominios públicos que apuntaban a IPs locales (`192.168.178.60`), devolviendo `DNS_PROBE_FINISHED_NXDOMAIN`.
- **Excepciones Configuradas & Confirmadas en FRITZ!Box:**
  - `myqnapcloud.com` (Acceso seguro NAS QNAP: `nasts4648.myqnapcloud.com`)
  - `duckdns.org` (Dominios públicos: `eventos-pro.duckdns.org`, `eventos-dev.duckdns.org`, `smpha.duckdns.org`)
  - `plex.direct` (Conexiones locales directas HTTPS en 4K sin ralentizaciones para la app de Plex, Smart TV, iPhone y Apple TV)

### 2. Estabilidad de IP & MAC de Pi-hole en FRITZ!Box (Solución PC-XXXXXXX)
- **Problema Solucionado:** Docker generaba una MAC aleatoria tras actualizar o reiniciar el contenedor de Pi-hole, lo que provocaba que el FRITZ!Box lo detectase como equipo nuevo (`PC-XXXXXXX`) y desmarcase "Asignar dirección IPv4 permanentemente".
- **Solución Aplicada en Compose/QNAP:** Fijada la dirección MAC estática `"02:42:1a:2b:31:79"` en la red `qnet-net` (IP `.101`), garantizando que Pi-hole conserve su nombre y su IP estática fija tras cualquier reinicio o actualización con Watchtower.

### 3. GestorArranque.app & GestorEventos (DEV & PRO)
- **GestorEventos DEV (Desarrollo):**
  - Configurado en puerto `3000` (`0.0.0.0`) mapeado con `eventos-dev.duckdns.org` en Nginx Proxy Manager.
  - Botón conmutador dinámico (*Toggle Switch*): `🟢 Arrancar` / `🔴 Detener`.
  - Daemonizado con `start_new_session=True` e inyección de `PATH` de Homebrew para prevenir cierres por `EPIPE`.
  - Apagado seguro con `lsof -ti:3000 -sTCP:LISTEN` excluyendo el PID propio (`os.getpid()`) para no cerrar jamás la ventana de la app.
- **GestorEventos PRO (Producción):**
  - Monitoreo mediante consulta HTTPS a `https://eventos-pro.duckdns.org` (excluyendo `localhost`).
  - Botón directo **`🚀 Abrir Container Station (QNAP)`** (`https://192.168.178.60:8444/container-station/`).

### 4. Documentación de Sistemas & Respaldos
- Confirmada la existencia del archivo completo de capturas en `Sistemas/docs/assets/`:
  - `duckdns_dashboard.png` (Token privado & subdominios)
  - `nginx_proxy_hosts.png` (Configuración de Proxy Hosts)
  - `container_station_contenedores.png` (Contenedores QNAP)
  - `pihole_local_dns.png` (DNS locales)
  - `fritz_dyndns.png`, `fritz_dns_fallback.png`, `fritz_port80.png`, `fritz_port443.png`

---

## 🚀 Estado de Repositorios Sincronizados a GitHub (`main`)
- `/Volumes/Orico/IA/Proyectos/GestorArranque`
- `/Volumes/Orico/IA/Proyectos/GestorEventos`
- `/Volumes/Orico/IA/Proyectos/Sistemas`
- `/Volumes/Orico/IA/Proyectos/TelegramBot`
- `~/.gemini/config`
