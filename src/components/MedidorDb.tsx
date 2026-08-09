import { colorDB, etiquetaDB } from '../data/coloresRuido'

type MedidorDbProps = {
  decibeles: number
  size?: number
  midiendo?: boolean
}

const MIN_DB = 35
const MAX_DB = 100
const RADIO = 80
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

function MedidorDb({ decibeles, size = 210, midiendo = false }: MedidorDbProps) {
  const progreso = Math.max(0, Math.min(1, (decibeles - MIN_DB) / (MAX_DB - MIN_DB)))
  const color = colorDB(decibeles)

  return (
    <div className={`medidor-db${midiendo ? ' medidor-db--midiendo' : ''}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={`${decibeles} decibeles`}>
        <circle className="medidor-db-track" cx="100" cy="100" r={RADIO} />
        <circle
          className="medidor-db-aro"
          cx="100"
          cy="100"
          r={RADIO}
          stroke={color}
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={CIRCUNFERENCIA * (1 - progreso)}
        />
      </svg>
      <div className="medidor-db-valor">
        <strong className="medidor-db-num" style={{ color }}>{decibeles}</strong>
        <span className="medidor-db-unit">dB</span>
        <span className="medidor-db-etiqueta" style={{ color }}>{etiquetaDB(decibeles)}</span>
      </div>
    </div>
  )
}

export default MedidorDb
