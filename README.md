# Montevideo Silenciosa

Montevideo Silenciosa es una aplicación web colaborativa para visualizar, medir y reportar contaminación sonora en Montevideo.

El proyecto muestra un mapa interactivo con lugares de interés, un mapa de calor de ruido estimado, filtros por tipo de fuente sonora y una línea de tiempo histórica. Permite registrar usuarios, iniciar sesión (con correo o con Google), guardar mediciones, enviar reportes con contexto y consultar el historial desde el perfil. Los datos de usuarios, mediciones, reportes y noticias viven en la nube con Firebase y se sincronizan en tiempo real entre dispositivos.

## Funcionalidades

- Mapa interactivo de Montevideo.
- Mapa de calor de contaminación sonora.
- Filtros por tipo de ruido: tránsito, comercial, obra, nocturno, terminal y zonas verdes.
- Línea de tiempo con actualidad, meses anteriores y años anteriores.
- Marcadores de lugares de interés con datos específicos de ruido.
- Mediciones ciudadanas mostradas en el mapa en tiempo real.
- Registro e inicio de sesión con correo o con Google.
- Mediciones de ruido con contexto: fuente, zona y nota.
- Reportes con contexto: zona, horario, intensidad, fuente, recurrencia y foto.
- Historial de mediciones y reportes en Perfil.
- Noticias y página de datos y metodología.
- Modo claro y oscuro.

> El mapa de calor usa mediciones de campo del Mapa Acústico de Montevideo 2025 (IMFIA - Facultad de Ingeniería, Udelar, e Intendencia de Montevideo): 246 puntos recuperados de la versión pública del estudio. Los valores mostrados por ubicación y por hora son estimaciones sobre esos datos; no son mediciones en tiempo real. Más detalle en la página "Datos y metodología" de la app.

## Tecnologías usadas

- React
- TypeScript
- Vite
- React Router
- Leaflet y React Leaflet
- Lucide React
- Firebase (Authentication y Cloud Firestore)
- CSS puro para estilos responsivos

> La app usa Firebase para autenticación y datos. Para que funcione es necesario configurar las variables `VITE_FIREBASE_*` en un archivo `.env` (ver `.env.example`). El `.env` no se sube al repositorio.

## Cómo correr el proyecto

Instalá las dependencias:

```powershell
npm install
```

Iniciá el servidor de desarrollo:

```powershell
npm run dev
```

Abrí la app en el navegador:

```text
https://localhost:5173
```

El servidor usa HTTPS con un certificado local de desarrollo. La primera vez, el navegador puede pedir aceptar el certificado (Avanzado → Continuar).

## Ver la app desde otro dispositivo en la misma red

El servidor de desarrollo ya escucha en toda la red. Abrí desde el otro dispositivo:

```text
https://TU_IP_LOCAL:5173
```

Como el certificado es de desarrollo, en el celular u otra computadora también hay que aceptarlo. Si no carga, revisá que ambos dispositivos estén en la misma red y que Windows Firewall permita el acceso a Node/Vite en redes privadas.

## Compilar para producción

```powershell
npm run build
```

Los archivos compilados quedan en la carpeta `dist/`.

## Estructura principal

```text
src/
  components/   Componentes reutilizables: mapa, navegación, leyenda, controles
  contexts/     Contextos de modo claro/oscuro y autenticación
  data/         Datos de lugares, ruido y opciones de contexto
  lib/          Cliente de Firebase y funciones de datos (api)
  pages/        Pantallas principales de la aplicación
```

## Seguridad

El repositorio incluye `firestore.rules`, listo para aplicar en la consola de Firebase cuando se quiera salir del modo de prueba (test mode).

## Estado del proyecto

Prototipo funcional con autenticación real y datos en la nube. Las mediciones y reportes requieren sesión iniciada y perfil completo. Las fotos de los reportes se guardan dentro de Firestore como base64 para mantenerse en el plan gratuito de Firebase (Spark); si en el futuro se usa el plan de pago (Blaze), se pueden migrar a Cloud Storage sin cambiar la interfaz.
