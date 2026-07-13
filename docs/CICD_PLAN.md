# Plan de Implementación CI/CD: Despliegue por Versiones

Este plan describe la arquitectura que vamos a montar para que la aplicación se compile y publique en tu NAS **automáticamente**, pero **solo cuando nosotros le pongamos una etiqueta de versión oficial** (ej. `v1.2.0`).

## Resumen del Flujo de Trabajo
1. Programaremos nuevas funciones en la rama `main` de GitHub.
2. Cuando queramos publicar, ejecutaremos `git tag vX.X.X` y lo subiremos a GitHub.
3. **GitHub Actions** detectará la etiqueta, ejecutará los tests de estrés, compilará el contenedor Docker y lo guardará en tu registro privado (**GHCR**).
4. El NAS (**Watchtower**) detectará la nueva imagen en GHCR, detendrá la versión antigua, instalará la nueva y la encenderá sin perder datos.

## Cambios Propuestos

### 1. Modificación de la Infraestructura en QNAP
Actualmente tu NAS compila el código a mano (con `deploy_to_nas.sh`). Vamos a transformar esto.
- **[MODIFY]** `docker-compose.yml`: Eliminaremos la orden `build: .` y en su lugar le diremos que descargue la imagen oficial `image: ghcr.io/smpcat/gestoreventos:latest`.
- Añadiremos un nuevo servicio `watchtower` a tu archivo docker-compose (o te daré el comando para arrancarlo) que vigilará esa imagen cada X minutos.

### 2. Creación del Pipeline de Compilación en GitHub
- **[NEW]** `.github/workflows/release.yml`: Un script YAML que le dará las instrucciones a los servidores de Microsoft/GitHub.
  - Paso 1: Levantar entorno Node.js e instalar dependencias.
  - Paso 2: Pasar las pruebas E2E de Playwright (nuestra muralla de seguridad).
  - Paso 3: Iniciar sesión en GitHub Container Registry usando un Token de Seguridad.
  - Paso 4: Construir la imagen Docker usando nuestro `Dockerfile`.
  - Paso 5: Etiquetar la imagen como `latest` y como `vX.X.X` y empujarla al registro.

## Requisitos Pendientes (Acción del Usuario)

> [!WARNING]
> Para que esto funcione, vas a necesitar generar un **Personal Access Token (PAT)** en GitHub. El NAS (Watchtower) necesitará este token para tener permiso de descargar tu imagen privada. 

> [!IMPORTANT]
> El servicio *Watchtower* se configurará para que vigile **solo** el contenedor de GestorEventos, evitando reinicios accidentales de Home Assistant u otros servicios del NAS.
