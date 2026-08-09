# Montevideo Silenciosa

Montevideo Silenciosa es una aplicacion web colaborativa para visualizar, medir y reportar contaminacion sonora en Montevideo.

El proyecto muestra un mapa interactivo con lugares de interes, un mapa de calor de ruido estimado, filtros por tipo de fuente sonora y una linea de tiempo historica. Tambien permite registrar usuarios, iniciar sesion, guardar mediciones, enviar reportes con contexto y consultar el historial desde el perfil.

## Funcionalidades

- Mapa interactivo de Montevideo.
- Mapa de calor de contaminacion sonora.
- Filtros por tipo de ruido: transito, comercial, obra, nocturno, terminal y zonas verdes.
- Linea de tiempo con actualidad, meses anteriores y anos anteriores.
- Marcadores de lugares de interes con datos especificos de ruido.
- Registro e inicio de sesion dentro de la pestana Perfil.
- Mediciones de ruido con contexto: fuente, zona y nota.
- Reportes con contexto: zona, horario, intensidad, fuente y recurrencia.
- Historial de mediciones y reportes en Perfil.
- Modo claro y oscuro.

> El mapa de calor usa mediciones de campo del [Mapa Acústico de Montevideo 2025](https://idm.fing.edu.uy/es/node/52928) (IMFIA - Facultad de Ingenieria, Udelar, e Intendencia de Montevideo): 246 puntos recuperados de la version publica del estudio. Los valores mostrados por ubicacion y por hora son estimaciones sobre esos datos; no son mediciones en tiempo real. Mas detalle en la pagina "Datos y metodologia" de la app.

## Tecnologias usadas

- React
- TypeScript
- Vite
- React Router
- Leaflet
- React Leaflet
- Lucide React
- LocalStorage para persistencia local del prototipo
- CSS puro para estilos responsivos

## Como correr el proyecto

Primero instalá las dependencias:

```powershell
npm install
```

Luego iniciá el servidor de desarrollo:

```powershell
npm.cmd run dev
```

Abrí la app en el navegador:

```text
http://localhost:5173
```

## Ver la app desde otro dispositivo en la misma red

Para que un celular u otra computadora conectada a la misma red pueda ver la app, corré Vite escuchando en toda la red:

```powershell
npm.cmd run dev -- --host 0.0.0.0
```

Luego abrí desde el otro dispositivo:

```text
http://TU_IP_LOCAL:5173
```

Ejemplo:

```text
http://10.13.2.228:5173
```

Si no carga, revisá que ambos dispositivos estén en la misma red y que Windows Firewall permita el acceso a Node/Vite en redes privadas.

## Compilar para produccion

Para generar la version final:

```powershell
npm.cmd run build
```

Los archivos compilados quedan en la carpeta:

```text
dist/
```

## Estructura principal

```text
src/
  components/   Componentes reutilizables como mapa, navegacion, leyenda y controles
  contexts/     Contexto de modo claro/oscuro
  data/         Datos de lugares, ruido y opciones de contexto
  pages/        Pantallas principales de la aplicacion
```

## Estado del proyecto

Este proyecto esta en etapa de prototipo. La app ya incluye navegacion, mapa, datos estimados, registro/login local, mediciones, reportes e historial. Para una version real seria necesario conectar una base de datos, autenticacion segura y fuentes verificables de datos sonoros.
