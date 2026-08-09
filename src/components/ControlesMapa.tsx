import type { SyntheticEvent } from 'react'
import { Filter, Layers } from 'lucide-react'
import { TIPOS_RUIDO, type TiempoMapa } from '../data/contextoRuido'
import type { TipoRuido } from '../data/ruido'

type ControlesMapaProps = {
  abierto: boolean
  lineaTiempo: TiempoMapa[]
  tiempoActivo: TiempoMapa
  tipoActivo: TipoRuido | 'todos'
  mostrarLugares: boolean
  totalPuntos: number
  onTiempoChange: (tiempo: TiempoMapa) => void
  onTipoChange: (tipo: TipoRuido | 'todos') => void
  onMostrarLugaresChange: (mostrar: boolean) => void
}

function detenerGestoMapa(event: SyntheticEvent) {
  event.stopPropagation()
}

function ControlesMapa({
  abierto,
  lineaTiempo,
  tiempoActivo,
  tipoActivo,
  mostrarLugares,
  totalPuntos,
  onTiempoChange,
  onTipoChange,
  onMostrarLugaresChange,
}: ControlesMapaProps) {
  if (!abierto) return null

  return (
    <div
      className="mapa-controles"
      onPointerDown={detenerGestoMapa}
      onPointerMove={detenerGestoMapa}
      onTouchStart={detenerGestoMapa}
      onTouchMove={detenerGestoMapa}
      onWheel={detenerGestoMapa}
    >
      <div className="mapa-panel">
        <div className="mapa-panel-head">
          <strong>Mapa de ruido</strong>
          <span>{tiempoActivo.label} · {totalPuntos} puntos</span>
        </div>

        <div className="mapa-control-bloque">
          <div className="mapa-control-titulo">Línea de tiempo</div>
          <div className="timeline-opciones">
            {lineaTiempo.map((item) => (
              <button
                key={item.id}
                className={`timeline-opcion ${tiempoActivo.id === item.id ? 'timeline-opcion--activa' : ''}`}
                onClick={() => onTiempoChange(item)}
                type="button"
              >
                <span>{item.label}</span>
                <small>{item.detalle}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="mapa-control-bloque">
          <div className="mapa-control-titulo">
            <Filter size={15} />
            Filtros
          </div>
          <div className="filtro-chips">
            <button
              className={`filtro-chip ${tipoActivo === 'todos' ? 'filtro-chip--activo' : ''}`}
              onClick={() => onTipoChange('todos')}
              type="button"
            >
              Todos
            </button>
            {TIPOS_RUIDO.map((tipo) => (
              <button
                key={tipo.id}
                className={`filtro-chip ${tipoActivo === tipo.id ? 'filtro-chip--activo' : ''}`}
                onClick={() => onTipoChange(tipo.id)}
                type="button"
              >
                {tipo.label}
              </button>
            ))}
          </div>
        </div>

        <button
          className={`mapa-toggle ${mostrarLugares ? 'mapa-toggle--activo' : ''}`}
          onClick={() => onMostrarLugaresChange(!mostrarLugares)}
          type="button"
        >
          <Layers size={16} />
          <span>{mostrarLugares ? 'Ocultar lugares' : 'Mostrar lugares'}</span>
        </button>
      </div>
    </div>
  )
}

export default ControlesMapa
