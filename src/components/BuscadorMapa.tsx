import { useMemo, useState } from 'react'
import { ChevronRight, Search, X } from 'lucide-react'
import { useMap, useMapEvents } from 'react-leaflet'
import lugares from '../data/lugares'
import { ZONAS_COORDS } from '../data/contextoRuido'

type BuscadorMapaProps = {
  onSeleccion: (posicion: [number, number], nombre?: string) => void
}

const CLASES_INTERFAZ =
  '.buscador-mapa, .mapa-controls-flotantes, .mapa-triggers, .mapa-controles, .leyenda, .ubicacion-widget, .panel-resumen, .detalle-zona, .leaflet-interactive, .leaflet-popup'

function CapturarToqueMapa({ onSeleccion }: BuscadorMapaProps) {
  useMapEvents({
    click(event) {
      const objetivo = event.originalEvent.target as HTMLElement | null
      if (objetivo?.closest?.(CLASES_INTERFAZ)) return
      onSeleccion([event.latlng.lat, event.latlng.lng])
    },
  })
  return null
}

function BuscadorMapa({ onSeleccion }: BuscadorMapaProps) {
  const map = useMap()
  const [consulta, setConsulta] = useState('')
  const resultados = useMemo(() => {
    const texto = consulta.trim().toLocaleLowerCase('es-UY')
    if (texto.length < 2) return []

    const zonas = Object.entries(ZONAS_COORDS)
      .filter(([nombre]) => nombre.toLocaleLowerCase('es-UY').includes(texto))
      .map(([nombre, coordenadas]) => ({ nombre, coordenadas, tipo: 'Barrio' }))
    const lugaresCoincidentes = lugares
      .filter((lugar) => lugar.nombre.toLocaleLowerCase('es-UY').includes(texto))
      .map((lugar) => ({ nombre: lugar.nombre, coordenadas: lugar.coordenadas, tipo: 'Lugar' }))

    return [...zonas, ...lugaresCoincidentes].slice(0, 6)
  }, [consulta])

  function elegir(resultado: { nombre: string; coordenadas: [number, number] }) {
    setConsulta('')
    map.flyTo(resultado.coordenadas, Math.max(map.getZoom(), 14), { duration: 0.55 })
    onSeleccion(resultado.coordenadas, resultado.nombre)
  }

  return (
    <>
      <div className="buscador-mapa" onPointerDown={event => event.stopPropagation()}>
        <Search size={18} aria-hidden="true" />
        <input
          value={consulta}
          onChange={event => setConsulta(event.target.value)}
          placeholder="Buscar barrio o lugar..."
          aria-label="Buscar barrio o lugar"
        />
        {consulta && (
          <button
            type="button"
            className="buscador-limpiar"
            onClick={() => setConsulta('')}
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
        {resultados.length > 0 && (
          <div className="buscador-resultados">
            {resultados.map(resultado => (
              <button key={`${resultado.tipo}-${resultado.nombre}`} type="button" onClick={() => elegir(resultado)}>
                <span className="buscador-resultado-nombre">
                  {resultado.nombre}
                  <small>{resultado.tipo}</small>
                </span>
                <ChevronRight size={16} className="buscador-resultado-chevron" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </div>
      <CapturarToqueMapa onSeleccion={onSeleccion} />
    </>
  )
}

export default BuscadorMapa
