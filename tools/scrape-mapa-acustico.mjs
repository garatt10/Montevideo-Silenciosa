import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { VectorTile } = require('@mapbox/vector-tile')
const { PbfReader } = require('pbf')

const ACCESS_TOKEN =
  'pk.eyJ1IjoiZmF1c3RpbmFiYXJ0YWJ1cnUiLCJhIjoiY2s1cXU0NnljMDZjczNucXdydjhiY2p2MCJ9.wJEebyFrfIhu46jRL-GwVA'
const SOURCE = 'faustinabartaburu.rgnqgto011rs'
const SOURCE_LAYER = 'f48422d5269bd27e4140'
const TILE_URL =
  `https://api.mapbox.com/v4/${SOURCE}/{z}/{x}/{y}.vector.pbf?access_token=${ACCESS_TOKEN}`

const BOUNDS = { west: -56.43, south: -34.98, east: -55.95, north: -34.7 }
const ZOOMS = [14, 13, 12]

function tileXY(lon, lat, zoom) {
  const n = 2 ** zoom
  const x = Math.floor(((lon + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  )
  return { x, y }
}

function latLngFromTile({ x, y, zoom }) {
  const n = 2 ** zoom
  const lon = (x / n) * 360 - 180
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)))
  const lat = (latRad * 180) / Math.PI
  return { lat, lon }
}

function round(value, decimals) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

async function descargarTile(z, x, y) {
  const url = TILE_URL.replace('{z}', z).replace('{x}', x).replace('{y}', y)
  const respuesta = await fetch(url)
  if (!respuesta.ok) return null
  let datos = Buffer.from(await respuesta.arrayBuffer())
  if (datos.length > 2 && datos[0] === 0x1f && datos[1] === 0x8b) {
    datos = zlib.gunzipSync(datos)
  }
  const tile = new VectorTile(new PbfReader(datos))
  return tile
}

async function* escanearZoom(zoom) {
  const { x: xMin, y: yMin } = tileXY(BOUNDS.west, BOUNDS.north, zoom)
  const { x: xMax, y: yMax } = tileXY(BOUNDS.east, BOUNDS.south, zoom)
  const total = (xMax - xMin + 1) * (yMax - yMin + 1)
  let procesados = 0

  for (let x = xMin; x <= xMax; x += 1) {
    for (let y = yMin; y <= yMax; y += 1) {
      procesados += 1
      let tile
      try {
        tile = await descargarTile(zoom, x, y)
      } catch {
        tile = null
      }
      if (tile == null) continue

      const layer = tile.layers[SOURCE_LAYER]
      if (!layer) continue

      for (let i = 0; i < layer.length; i += 1) {
        const feature = layer.feature(i)
        const geo = feature.toGeoJSON(x, y, zoom)
        const props = feature.properties
        if (geo.type !== 'Feature' || geo.geometry.type !== 'Point') continue
        yield {
          lat: geo.geometry.coordinates[1],
          lon: geo.geometry.coordinates[0],
          db: Number(props.laeq_2025_db ?? props.laeq_2025 ?? props.db ?? NaN),
          direccion: String(props.direccion ?? props.Direccion ?? props.dirección ?? ''),
          circuito: String(props.circuito ?? props.Circuito ?? ''),
        }
      }
    }
  }
  console.log(`  zoom ${zoom}: ${procesados}/${total} tiles procesadas`)
}

const vistos = new Set()
const puntos = []

for (const zoom of ZOOMS) {
  console.log(`Escaneando zoom ${zoom}…`)
  for await (const punto of escanearZoom(zoom)) {
    if (!Number.isFinite(punto.db)) continue
    const lat = round(punto.lat, 5)
    const lon = round(punto.lon, 5)
    const clave = `${lat},${lon}`
    if (vistos.has(clave)) continue
    vistos.add(clave)
    puntos.push({
      lat,
      lon,
      db: punto.db,
      direccion: punto.direccion,
      circuito: punto.circuito,
    })
  }
}

puntos.sort((a, b) => a.lat - b.lat || a.lon - b.lon)

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const salida = join(root, 'src', 'data', 'mapa-acustico-2025.json')
mkdirSync(dirname(salida), { recursive: true })
writeFileSync(salida, JSON.stringify({ fuente: 'mapa-acustico-2025', puntos }, null, 2))

const bandas = { '<55': 0, '55-59': 0, '60-64': 0, '65-69': 0, '70-74': 0, '75-79': 0, '>=80': 0 }
for (const p of puntos) {
  if (p.db < 55) bandas['<55'] += 1
  else if (p.db < 60) bandas['55-59'] += 1
  else if (p.db < 65) bandas['60-64'] += 1
  else if (p.db < 70) bandas['65-69'] += 1
  else if (p.db < 75) bandas['70-74'] += 1
  else if (p.db < 80) bandas['75-79'] += 1
  else bandas['>=80'] += 1
}

console.log(`\nTotal puntos únicos: ${puntos.length}`)
console.log('Distribución por banda (LAeq 2025):')
for (const [banda, cantidad] of Object.entries(bandas)) {
  console.log(`  ${banda}: ${cantidad}`)
}
const dbs = puntos.map((p) => p.db)
if (dbs.length > 0) {
  console.log(`Rango: ${Math.min(...dbs)}–${Math.max(...dbs)} dB`)
  console.log('Muestra (3):', JSON.stringify(puntos.slice(0, 3), null, 2))
}
console.log(`Guardado en: ${salida}`)
