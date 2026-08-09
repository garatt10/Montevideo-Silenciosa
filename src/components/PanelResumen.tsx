import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, FilePlus, MapPin, Mic, X } from 'lucide-react'
import type { PuntoRuido } from '../data/ruido'
import { CENTRO_MONTEVIDEO, zonaMasCercana } from '../data/contextoRuido'
import { estimarRuidoEnUbicacion } from '../data/ruido'
import { colorDB, etiquetaDB } from '../data/coloresRuido'

type PanelResumenProps = {
  puntos: PuntoRuido[]
  ubicacion: [number, number] | null
}

type ZonaRanking = {
  zona: string
  promedio: number
  cantidad: number
}

function rankingZonas(puntos: PuntoRuido[]): ZonaRanking[] {
  const agrupado = new Map<string, { suma: number; cantidad: number }>()

  for (const punto of puntos) {
    const zona = zonaMasCercana(punto.coordenadas)
    const entrada = agrupado.get(zona) ?? { suma: 0, cantidad: 0 }
    entrada.suma += punto.decibeles
    entrada.cantidad += 1
    agrupado.set(zona, entrada)
  }

  return [...agrupado.entries()]
    .map(([zona, { suma, cantidad }]) => ({
      zona,
      promedio: Math.round((suma / cantidad) * 10) / 10,
      cantidad,
    }))
    .sort((a, b) => b.promedio - a.promedio)
    .slice(0, 5)
}

function PanelResumen({ puntos, ubicacion }: PanelResumenProps) {
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)

  const puntoConsulta = ubicacion ?? CENTRO_MONTEVIDEO
  const estimacion = useMemo(
    () => estimarRuidoEnUbicacion(puntoConsulta, puntos),
    [puntoConsulta, puntos],
  )
  const zona = useMemo(() => zonaMasCercana(puntoConsulta), [puntoConsulta])
  const ranking = useMemo(() => rankingZonas(puntos), [puntos])
  const medicionesComunidad = useMemo(
    () => puntos.filter(punto => punto.id.startsWith('medicion-')).length,
    [puntos],
  )
  const puntosOficiales = puntos.length - medicionesComunidad
  const titulo = ubicacion ? 'Tu zona ahora' : 'Montevideo ahora'
  const contexto = ubicacion ? 'Estimación según tu ubicación' : 'Usá tu ubicación para una estimación local'

  if (abierto) {
    return (
      <div className="panel-resumen panel-resumen--abierto">
        <div className="panel-resumen-card">
          <div className="panel-resumen-head">
            <div>
              <strong>{titulo}</strong>
              <span>{contexto}</span>
            </div>
            <button
              className="panel-resumen-close"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar panel"
              type="button"
            >
              <X size={18} />
            </button>
          </div>

          <div className="panel-resumen-ahora">
            <span className="panel-resumen-punto" style={{ background: colorDB(estimacion.decibeles) }} />
            <div>
              <span className="panel-resumen-zona">{zona}</span>
              <strong className="panel-resumen-db" style={{ color: colorDB(estimacion.decibeles) }}>
                {estimacion.decibeles} <small>dB</small>
              </strong>
              <span className="panel-resumen-etiqueta">{etiquetaDB(estimacion.decibeles)}</span>
            </div>
          </div>

          <p className="panel-resumen-nota">
            <MapPin size={14} /> Dato estimado a partir de {puntos.length} puntos visibles.
          </p>
          <div className="panel-resumen-fuentes">
            <span><b>{puntosOficiales}</b> referencia oficial 2025</span>
            <span><b>{medicionesComunidad}</b> mediciones comunitarias verificadas</span>
          </div>

          {ranking.length > 0 ? (
            <div className="panel-resumen-ranking">
              {ranking.map((item, index) => (
                <div className="panel-resumen-fila" key={item.zona}>
                  <span className="panel-resumen-fila-nombre">
                    {index + 1}. {item.zona}
                  </span>
                  <span className="panel-resumen-fila-barra">
                    <span
                      className="panel-resumen-fila-barra-inner"
                      style={{
                        width: `${Math.min(100, (item.promedio / 90) * 100)}%`,
                        background: colorDB(item.promedio),
                      }}
                    />
                  </span>
                  <span className="panel-resumen-fila-db" style={{ color: colorDB(item.promedio) }}>
                    {item.promedio}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="panel-resumen-vacio">Aún no hay mediciones para mostrar.</p>
          )}

          <div className="panel-resumen-acciones">
            <button className="btn-primario" onClick={() => navigate('/medicion')}>
              <Mic size={18} /> Medir
            </button>
            <button className="btn-secundario" onClick={() => navigate('/reportar')}>
              <FilePlus size={18} /> Reportar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="panel-resumen">
      <button className="panel-resumen-pill" onClick={() => setAbierto(true)} type="button">
        <span className="panel-resumen-punto" style={{ background: colorDB(estimacion.decibeles), color: colorDB(estimacion.decibeles) }} />
        <span className="panel-resumen-pill-zona">{ubicacion ? zona : '¿Cómo está tu zona?'}</span>
        <strong className="panel-resumen-pill-db" style={{ color: colorDB(estimacion.decibeles) }}>
          {estimacion.decibeles} dB
        </strong>
        <span className="panel-resumen-pill-etiqueta">Ver detalles</span>
        <ChevronDown size={16} className="panel-resumen-pill-icon" />
      </button>
    </div>
  )
}

export default PanelResumen
