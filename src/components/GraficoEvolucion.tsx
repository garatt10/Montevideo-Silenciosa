import { useId } from 'react'
import { TIPOS_RUIDO } from '../data/contextoRuido'
import type { MedicionGuardada } from '../lib/api'
import type { TipoRuido } from '../data/ruido'
import { colorDB } from '../data/coloresRuido'

const MIN_DB = 35
const MAX_DB = 100
const W = 300
const H = 120
const PAD = 8

export type GraficoEvolucionProps = {
  mediciones: MedicionGuardada[]
}

function ordenarPorFecha(mediciones: MedicionGuardada[]): MedicionGuardada[] {
  return [...mediciones].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
}

function GraficoEvolucion({ mediciones }: GraficoEvolucionProps) {
  const gradienteId = useId()
  const datos = ordenarPorFecha(mediciones)
  const n = datos.length
  if (n <= 1) return null

  const x = (i: number) => PAD + (i / (n - 1)) * (W - 2 * PAD)
  const y = (db: number) => H - PAD - ((Math.max(MIN_DB, Math.min(MAX_DB, db)) - MIN_DB) / (MAX_DB - MIN_DB)) * (H - 2 * PAD)

  const puntos = datos.map((medicion, i) => [x(i), y(medicion.decibeles)] as const)
  const linea = puntos
    .map((punto, i) => `${i === 0 ? 'M' : 'L'}${punto[0].toFixed(2)},${punto[1].toFixed(2)}`)
    .join(' ')
  const area = `${linea} L${x(n - 1).toFixed(2)},${H - PAD} L${x(0).toFixed(2)},${H - PAD} Z`
  const ultimo = datos[n - 1].decibeles
  const color = colorDB(ultimo)

  return (
    <div className="grafico-evolucion">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="grafico-evolucion-svg"
        role="img"
        aria-label="Evolución de decibeles en el tiempo"
      >
        <defs>
          <linearGradient id={gradienteId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[MIN_DB, 55, 70, 80, MAX_DB].map(nivel => (
          <line
            key={nivel}
            className="grafico-evolucion-grid"
            x1={PAD}
            x2={W - PAD}
            y1={y(nivel)}
            y2={y(nivel)}
          />
        ))}
        <path d={area} fill={`url(#${gradienteId})`} />
        <path d={linea} className="grafico-evolucion-linea" style={{ stroke: color }} fill="none" />
        {puntos.map((punto, i) => (
          <circle
            key={datos[i].id}
            cx={punto[0]}
            cy={punto[1]}
            r="2.4"
            fill={color}
            className="grafico-evolucion-punto"
          />
        ))}
      </svg>
      <div className="grafico-evolucion-ejes">
        <span>
          {new Date(datos[0].fecha).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })}
        </span>
        <span>{ultimo} dB</span>
      </div>
    </div>
  )
}

function DistribucionFuentes({ mediciones }: GraficoEvolucionProps) {
  const cuenta = new Map<TipoRuido, number>()
  for (const medicion of mediciones) {
    if (medicion.fuente) {
      cuenta.set(medicion.fuente, (cuenta.get(medicion.fuente) ?? 0) + 1)
    }
  }

  const filas: { label: string; count: number }[] = TIPOS_RUIDO.filter(tipo => cuenta.has(tipo.id)).map(tipo => ({
    label: tipo.label,
    count: cuenta.get(tipo.id) as number,
  }))

  const sinFuente = mediciones.length - mediciones.filter(m => m.fuente != null).length
  if (sinFuente > 0) filas.push({ label: 'Sin contexto', count: sinFuente })

  if (filas.length === 0) return null

  const max = Math.max(1, ...filas.map(fila => fila.count))

  return (
    <div className="distribucion-fuentes">
      {filas.map(fila => (
        <div className="distribucion-fuentes-fila" key={fila.label}>
          <span className="distribucion-fuentes-nombre">{fila.label}</span>
          <span className="distribucion-fuentes-barra">
            <span
              className="distribucion-fuentes-barra-inner"
              style={{ width: `${(fila.count / max) * 100}%` }}
            />
          </span>
          <span className="distribucion-fuentes-count">{fila.count}</span>
        </div>
      ))}
    </div>
  )
}

export { GraficoEvolucion, DistribucionFuentes }
