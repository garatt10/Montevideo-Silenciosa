import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, FilePlus, MapPin } from 'lucide-react'
import MedidorDb from './MedidorDb'
import { COLORES_DB } from '../data/coloresRuido'
import { CENTRO_MONTEVIDEO } from '../data/contextoRuido'
import { estimarRuidoEnUbicacion, puntosRuido } from '../data/ruido'
import { obtenerReportes, suscribirReportes, type ReporteGuardado } from '../lib/api'

const NIVELES = [
  { color: COLORES_DB.bajo, label: 'Silencioso', rango: '< 55 dB' },
  { color: COLORES_DB.moderado, label: 'Moderado', rango: '55–69 dB' },
  { color: COLORES_DB.alto, label: 'Alto', rango: '70–79 dB' },
  { color: COLORES_DB.critico, label: 'Muy alto', rango: '≥ 80 dB' },
]

const INTENSIDADES: Record<string, { label: string; color: string }> = {
  media: { label: 'Media', color: COLORES_DB.moderado },
  alta: { label: 'Alta', color: COLORES_DB.alto },
  critica: { label: 'Crítica', color: COLORES_DB.critico },
}

function formatearHora(fecha: string): string {
  const fechaLocal = new Date(fecha)
  const ahora = new Date()
  const diffMin = Math.max(0, Math.round((ahora.getTime() - fechaLocal.getTime()) / 60000))
  if (diffMin < 60) return `Hace ${Math.max(1, diffMin)} min`
  if (diffMin < 1440) return `Hace ${Math.floor(diffMin / 60)} h`
  return fechaLocal.toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })
}

function Sidebar() {
  const estimacion = useMemo(
    () => estimarRuidoEnUbicacion(CENTRO_MONTEVIDEO, puntosRuido),
    [],
  )
  const [reportes, setReportes] = useState<ReporteGuardado[]>([])

  useEffect(() => {
    let activo = true
    obtenerReportes()
      .then(lista => {
        if (activo) setReportes(lista.slice(0, 4))
      })
      .catch(() => {})
    const desuscribir = suscribirReportes(lista => {
      if (activo) setReportes(lista.slice(0, 4))
    })
    return () => {
      activo = false
      desuscribir()
    }
  }, [])

  return (
    <aside className="home-sidebar" aria-label="Panel de información">
      <section className="sidebar-card">
        <h2 className="sidebar-card-titulo">Nivel de ruido · Montevideo</h2>
        <div className="sidebar-medidor">
          <MedidorDb decibeles={estimacion.decibeles} size={188} />
        </div>
      </section>

      <section className="sidebar-card">
        <h2 className="sidebar-card-titulo">Escala</h2>
        <div className="sidebar-leyenda">
          {NIVELES.map(nivel => (
            <div className="sidebar-leyenda-fila" key={nivel.label}>
              <span className="sidebar-leyenda-punto" style={{ background: nivel.color }} />
              <span className="sidebar-leyenda-label">{nivel.label}</span>
              <span className="sidebar-leyenda-rango">{nivel.rango}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sidebar-card">
        <h2 className="sidebar-card-titulo">Reportes recientes</h2>
        <div className="sidebar-reportes">
          {reportes.length === 0 && (
            <p className="perfil-vacio">Todavía no hay reportes de la comunidad.</p>
          )}
          {reportes.map(reporte => {
            const intensidad = INTENSIDADES[reporte.intensidad ?? 'alta'] ?? INTENSIDADES.alta
            return (
              <div className="sidebar-reporte" key={reporte.id}>
                <span className="sidebar-reporte-icono">
                  <MapPin size={16} />
                </span>
                <div className="sidebar-reporte-info">
                  <span className="sidebar-reporte-titulo">
                    {reporte.descripcion || 'Reporte de ruido'}
                  </span>
                  <span className="sidebar-reporte-meta">
                    <Clock size={11} style={{ verticalAlign: '-1px' }} /> {reporte.zona || 'Zona sin definir'} ·{' '}
                    {formatearHora(reporte.fecha)}
                  </span>
                </div>
                <span className="sidebar-reporte-nivel" style={{ color: intensidad.color }}>
                  {intensidad.label}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <Link to="/reportar" className="btn-primario sidebar-cta">
        <FilePlus size={20} /> Reportar ruido
      </Link>
    </aside>
  )
}

export default Sidebar
