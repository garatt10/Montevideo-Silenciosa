import type { Categoria } from '../data/lugares'
import { Bus, Building2, Cross, GraduationCap, Info, ShoppingBag, TreePine, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FUENTE_ACUSTICO_2025 } from '../data/mapaAcustico2025'

export const CATEGORIA_CONFIG: Record<Categoria, { label: string; color: string }> = {
  shopping: { label: 'Shopping', color: '#f59e0b' },
  plaza: { label: 'Plaza', color: '#10b981' },
  parque: { label: 'Parque', color: '#059669' },
  hospital: { label: 'Hospital', color: '#ef4444' },
  centro_educativo: { label: 'Centro educativo', color: '#8b5cf6' },
  terminal: { label: 'Terminal', color: '#3b82f6' },
}

export const CATEGORIA_ICONO: Record<Categoria, LucideIcon> = {
  shopping: ShoppingBag,
  plaza: Building2,
  parque: TreePine,
  hospital: Cross,
  centro_educativo: GraduationCap,
  terminal: Bus,
}

const CATEGORIAS = Object.entries(CATEGORIA_CONFIG) as [Categoria, typeof CATEGORIA_CONFIG[Categoria]][]

type LeyendaProps = {
  abierta: boolean
  totalPuntos: number
  onAbiertaChange: (abierta: boolean) => void
}

function Leyenda({ abierta, totalPuntos, onAbiertaChange }: LeyendaProps) {
  return (
    <div className={`leyenda ${abierta ? 'leyenda--abierta' : ''}`}>
      <button
        className="leyenda-trigger"
        onClick={() => onAbiertaChange(!abierta)}
        aria-label={abierta ? 'Cerrar leyenda del mapa' : 'Abrir leyenda del mapa'}
        type="button"
      >
        {abierta ? <X size={18} /> : <Info size={18} />}
      </button>

      {abierta && (
        <div className="leyenda-panel">
          <strong className="leyenda-titulo">Ruido estimado</strong>
          <div className="leyenda-calor">
            <span className="leyenda-calor-barra" />
            <div className="leyenda-calor-labels">
              <span>45 dB</span>
              <span>60 dB</span>
              <span>75 dB</span>
              <span>85+ dB</span>
            </div>
            <span className="leyenda-calor-total">{totalPuntos} puntos visibles</span>
          </div>

          <strong className="leyenda-titulo">Lugares de interés</strong>
          <ul className="leyenda-lista">
            {CATEGORIAS.map(([key, cfg]) => {
              const Icono = CATEGORIA_ICONO[key]
              return (
                <li key={key} className="leyenda-item">
                  <span className="leyenda-marcador" style={{ background: cfg.color }}>
                    <Icono size={13} color="#ffffff" strokeWidth={2.4} />
                  </span>
                  <span>{cfg.label}</span>
                </li>
              )
            })}
          </ul>

          <p className="leyenda-fuente">
            Datos del {FUENTE_ACUSTICO_2025.titulo}: {FUENTE_ACUSTICO_2025.institucion}. Mediciones{' '}
            {FUENTE_ACUSTICO_2025.periodo}, {FUENTE_ACUSTICO_2025.publicacion}.{' '}
            <Link to="/metodologia" className="leyenda-metodologia">
              Ver metodología →
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}

export default Leyenda
