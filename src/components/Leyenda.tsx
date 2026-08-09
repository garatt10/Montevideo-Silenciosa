import type { Categoria } from '../data/lugares'
import { Bus, Building2, Cross, GraduationCap, Info, ShoppingBag, TreePine, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FUENTE_ACUSTICO_2025 } from '../data/mapaAcustico2025'
import { COLORES_DB } from '../data/coloresRuido'

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

const NIVELES = [
  { color: COLORES_DB.bajo, label: 'Bajo', rango: '< 55 dB' },
  { color: COLORES_DB.moderado, label: 'Moderado', rango: '55–69 dB' },
  { color: COLORES_DB.alto, label: 'Alto', rango: '70–79 dB' },
  { color: COLORES_DB.critico, label: 'Crítico', rango: '≥ 80 dB' },
]

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
        aria-expanded={abierta}
        type="button"
      >
        {abierta ? <X size={18} /> : <Info size={18} />}
      </button>

      {abierta && (
        <div className="leyenda-panel">
          <strong className="leyenda-titulo">Escala de ruido</strong>
          <div className="leyenda-calor">
            <div className="leyenda-calor-rango">
              <span className="leyenda-calor-barra" aria-hidden="true" />
              <div className="leyenda-calor-labels" aria-hidden="true">
                <span style={{ left: '0%' }}>55</span>
                <span style={{ left: '37.5%' }}>70</span>
                <span style={{ left: '62.5%' }}>80</span>
                <span style={{ left: '100%' }}>95</span>
              </div>
            </div>
            <ul className="leyenda-niveles">
              {NIVELES.map(nivel => (
                <li className="leyenda-nivel" key={nivel.label}>
                  <span className="leyenda-nivel-punto" style={{ background: nivel.color }} aria-hidden="true" />
                  <span>{nivel.label}</span>
                  <span className="leyenda-nivel-rango">{nivel.rango}</span>
                </li>
              ))}
            </ul>
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

          <p className="leyenda-aviso">
            Estimaciones basadas en el mapa acústico 2025 · no es ruido en tiempo real.
          </p>
          <p className="leyenda-fuente">
            Datos del {FUENTE_ACUSTICO_2025.titulo}: {FUENTE_ACUSTICO_2025.institucion}. Mediciones{' '}
            {FUENTE_ACUSTICO_2025.periodo}, {FUENTE_ACUSTICO_2025.publicacion}. {totalPuntos} puntos
            visibles.{' '}
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
