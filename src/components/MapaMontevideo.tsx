import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import { SlidersHorizontal } from 'lucide-react'
import { useModo } from '../contexts/ModoContext'
import MarcadoresLugares from './MarcadoresLugares'
import MarcadoresMediciones, { type PuntoMedicion } from './MarcadoresMediciones'
import Leyenda from './Leyenda'
import MapaCalorRuido from './MapaCalorRuido'
import ControlesMapa from './ControlesMapa'
import ControlesZoom from './ControlesZoom'
import UbicacionUsuario from './UbicacionUsuario'
import PanelResumen from './PanelResumen'
import BuscadorMapa from './BuscadorMapa'
import DetalleZona from './DetalleZona'
import {
  CENTRO_MONTEVIDEO,
  coordsDeZona,
  crearLineaTiempoMapa,
  type TiempoMapa,
} from '../data/contextoRuido'
import { ajustarPuntoPorTiempo, puntosRuido, type TipoRuido } from '../data/ruido'
import { suscribirMediciones, type MedicionGuardada } from '../lib/api'

const ZOOM = 12
const MIN_ZOOM = 11

const SOUTH_WEST: [number, number] = [-34.98, -56.42]
const NORTH_EAST: [number, number] = [-34.70, -55.95]

const TILES: Record<string, { url: string; attribution: string }> = {
  oscuro: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  claro: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
}

function fechaEnPeriodo(fecha: string, tiempo: TiempoMapa): boolean {
  const valor = new Date(fecha).getTime()
  return valor >= new Date(tiempo.desde).getTime() && valor <= new Date(tiempo.hasta).getTime()
}

function jitterEstable(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 997
  }
  return ((hash % 7) - 3) * 0.0018
}

function leerMedicionesUsuario(tiempo: TiempoMapa, mediciones: MedicionGuardada[]): PuntoMedicion[] {
  return mediciones
    .filter((medicion) => fechaEnPeriodo(medicion.fecha, tiempo) && !medicion.simulada)
    .map((medicion) => {
    const conCoordenadas = typeof medicion.lat === 'number' && typeof medicion.lng === 'number'
    const base = conCoordenadas
      ? [medicion.lat as number, medicion.lng as number]
      : coordsDeZona(medicion.zona || 'Centro')
    const jitter = conCoordenadas ? 0 : jitterEstable(medicion.id)

    return {
      id: `medicion-${medicion.id}`,
      nombre: medicion.zona || 'Medición ciudadana',
      coordenadas: [base[0] + jitter, base[1] - jitter],
      decibeles: medicion.decibeles,
      tipo: medicion.fuente || 'transito',
      detalle: `Medición ciudadana del ${new Date(medicion.fecha).toLocaleDateString('es-UY')}.`,
      fecha: medicion.fecha,
      userId: medicion.userId,
      nota: medicion.nota,
    }
    })
}

function MapaMontevideo() {
  const { modo } = useModo()
  const lineaTiempo = useMemo(() => crearLineaTiempoMapa(), [])
  const [tiempoActivo, setTiempoActivo] = useState<TiempoMapa>(lineaTiempo[0])
  const [tipoActivo, setTipoActivo] = useState<TipoRuido | 'todos'>('todos')
  const [mostrarLugares, setMostrarLugares] = useState(true)
  const [controlesAbiertos, setControlesAbiertos] = useState(false)
  const [leyendaAbierta, setLeyendaAbierta] = useState(false)
  const [ubicacionUsuario, setUbicacionUsuario] = useState<[number, number] | null>(null)
  const [seleccionMapa, setSeleccionMapa] = useState<{ posicion: [number, number]; nombre?: string } | null>(null)
  const [mediciones, setMediciones] = useState<MedicionGuardada[]>([])
  const [errorDatos, setErrorDatos] = useState(false)

  useEffect(() => {
    let activo = true
    const desuscribir = suscribirMediciones(
      lista => {
        if (activo) {
          setMediciones(lista)
          setErrorDatos(false)
        }
      },
      () => {
        if (activo) setErrorDatos(true)
      },
    )
    return () => {
      activo = false
      desuscribir()
    }
  }, [])

  const tile = TILES[modo]
  const puntosFiltrados = useMemo(() => {
    const puntosBase = [...puntosRuido, ...leerMedicionesUsuario(tiempoActivo, mediciones)]
    const puntosPorTipo = tipoActivo === 'todos'
      ? puntosBase
      : puntosBase.filter((punto) => punto.tipo === tipoActivo)

    return puntosPorTipo.map((punto) => {
      if (punto.id.startsWith('medicion-')) return punto
      return ajustarPuntoPorTiempo(punto, tiempoActivo)
    })
  }, [tiempoActivo, tipoActivo, mediciones])

  function toggleFiltros() {
    setControlesAbiertos(abierto => !abierto)
    setLeyendaAbierta(false)
  }

  function toggleLeyenda() {
    setLeyendaAbierta(abierta => !abierta)
    setControlesAbiertos(false)
  }

  return (
    <>
      <MapContainer
        center={CENTRO_MONTEVIDEO}
        zoom={ZOOM}
        minZoom={MIN_ZOOM}
        maxBounds={L.latLngBounds(SOUTH_WEST, NORTH_EAST)}
        maxBoundsViscosity={1}
        scrollWheelZoom
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution={tile.attribution}
          url={tile.url}
        />
        <MapaCalorRuido puntos={puntosFiltrados} />
        <BuscadorMapa
          onSeleccion={(posicion, nombre) => setSeleccionMapa({ posicion, nombre })}
        />
        <ControlesZoom />
        <UbicacionUsuario puntos={puntosFiltrados} onPosicionChange={setUbicacionUsuario} />
        {mostrarLugares && <MarcadoresLugares />}
        <MarcadoresMediciones puntos={puntosFiltrados} />
        <ControlesMapa
          abierto={controlesAbiertos}
          lineaTiempo={lineaTiempo}
          tiempoActivo={tiempoActivo}
          tipoActivo={tipoActivo}
          mostrarLugares={mostrarLugares}
          totalPuntos={puntosFiltrados.length}
          onTiempoChange={setTiempoActivo}
          onTipoChange={setTipoActivo}
          onMostrarLugaresChange={setMostrarLugares}
          onCerrar={() => setControlesAbiertos(false)}
        />
        {!seleccionMapa && (
          <Leyenda
            abierta={leyendaAbierta}
            totalPuntos={puntosFiltrados.length}
            onAbiertaChange={toggleLeyenda}
          />
        )}
      </MapContainer>
      {errorDatos && (
        <div className="mapa-datos-error" role="status">
          No se pudieron cargar las mediciones de la comunidad. Revisá tu conexión.
        </div>
      )}
      {!seleccionMapa && (
        <div className="mapa-triggers">
          <button
            type="button"
            className={`mapa-filtros-trigger ${controlesAbiertos ? 'mapa-filtros-trigger--activo' : ''}`}
            onClick={toggleFiltros}
            aria-label="Filtros del mapa"
            aria-pressed={controlesAbiertos}
          >
            <SlidersHorizontal size={18} />
            <span>Filtros</span>
          </button>
        </div>
      )}
      {!seleccionMapa && <PanelResumen puntos={puntosFiltrados} ubicacion={ubicacionUsuario} />}
      <DetalleZona
        posicion={seleccionMapa?.posicion ?? null}
        nombre={seleccionMapa?.nombre}
        puntos={puntosFiltrados}
        onCerrar={() => setSeleccionMapa(null)}
      />
    </>
  )
}

export default MapaMontevideo
