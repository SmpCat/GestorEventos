# Registro de Sincronización Mente Colmena V2 - GestorArranque & Homelab

**Fecha de Sincronización:** 2026-07-25  
**Dispositivo Origen:** Mac Mini M4 (macOS) ➔ **Dispositivo Destino:** Portátil Windows (Hive Mind Sync)

---

## 📌 Estado de Servicios & Homelab

### 1. GestorArranque.app
- **Geometría y Centrado:** Ventana ajustada a `980x820` centrada automáticamente en pantalla al iniciar para evitar parpadeos en macOS/Windows.
- **Monitoreo Asíncrono:** Todas las comprobaciones de red se ejecutan en un hilo secundario (`threading.Thread`) con feedback visual instantáneo (`⏳ Actualizando...`).
- **Botón Global Header:** Ubicado en la cabecera del tab superior (`🔄 Actualizar Todos los Servicios`).

### 2. GestorEventos DEV (Desarrollo)
- **Puerto:** `3000` (Binding: `0.0.0.0`)
- **Dominio Proxy:** `https://eventos-dev.duckdns.org`
- **Controlador:** Botón interruptor dinámico (*Toggle Switch*):
  - 🟢 `🟢 Arrancar Servicio Dev (3000)`
  - 🔴 `🔴 Detener Servicio Dev (3000)`
- **Aislamiento de Proceso:** Se lanza con `start_new_session=True`, inyección de `PATH` de Homebrew (`/opt/homebrew/bin`) y redirección de salida a `next_dev.log` para prevenir fallos por `EPIPE`.
- **Apagado Seguro:** Utiliza `lsof -ti:3000 -sTCP:LISTEN` excluyendo el PID de la propia app (`os.getpid()`) para que el apagado del servidor Dev no cierre jamás la ventana del Gestor de Arranque.

### 3. GestorEventos PRO (Producción)
- **Host:** Contenedor Docker `gestoreventos` en NAS QNAP (`192.168.178.60`).
- **Dominio Proxy:** `https://eventos-pro.duckdns.org`
- **Comprobación:** Consulta estrictamente `https://eventos-pro.duckdns.org` (o IP NAS) requiriendo `HTTP 200 OK` (evita falsos positivos con localhost).
- **Acceso:** Botón verde **`🚀 Abrir Container Station (QNAP)`** (`https://192.168.178.60:8444/container-station/`).

### 4. Monitor DNS FRITZ!Box & Pi-hole
- **IP Pi-hole:** `192.168.178.101`
- **Diagnóstico Semafórico de 5 Niveles:**
  - 🟢 **100% Protegido:** Ambas DNS = `.101` + Pi-hole Online.
  - 🟢 **Modo Emergencia Correcto:** DNS Públicas (`8.8.8.8`) + Pi-hole Offline.
  - ⚠️ **Advertencia Filtrado Parcial:** DNS Mixta (Preferida `.101`, Secundaria `1.1.1.1`).
  - ⚠️ **Advertencia Navegación Sin Filtrado:** DNS Públicas + Pi-hole Online.
  - 🔴 **Error Crítico / Corte Total:** DNS = `.101` + Pi-hole Offline.
- **Refresco RJ-45:** El botón **`🧹 Refrescar Caché RJ-45`** incluye un ciclo de interfaz Ethernet (`off` ➔ `on`) para renovar la concesión DHCP en macOS/Windows al cambiar de DNS en el router.

---

## 🚀 Repositorios Sincronizados a GitHub
- `/Volumes/Orico/IA/Proyectos/GestorArranque` (`main`)
- `/Volumes/Orico/IA/Proyectos/GestorEventos` (`main`)
- `/Volumes/Orico/IA/Proyectos/Sistemas` (`main`)
- `/Volumes/Orico/IA/Proyectos/TelegramBot` (`main`)
- `~/.gemini/config` (`main`)
