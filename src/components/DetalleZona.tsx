import { useMemo } from 'react'
import { FilePlus, MapPin, Mic, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { PuntoRuido } from '../data/ruido'
import { estimarRuidoEnUbicacion } from '../data/ruido'
import { zonaMasCercana } from '../data/contextoRuido'
import { colorDB, etiquetaDB, explicacionDB } from '../data/coloresRuido'

type DetalleZonaProps = {
  posicion: [number, number] | null
  nombre?: string
  puntos: PuntoRuido[]
  onCerrar: () => void
}

function DetalleZona({ posicion, nombre, puntos, onCerrar }: DetalleZonaProps) {
  const navigate = useNavigate()
  const estimacion = useMemo(
    () => (posicion ? estimarRuidoEnUbicacion(posicion, puntos) : null),
    [posicion, puntos],
  )

  if (!posicion) return null
  const zona = nombre ?? zonaMasCercana(posicion)

  return (
    <aside className="detalle-zona" aria-label={`Detalle de ${zona}`}>
      <button type="button" className="detalle-zona-cerrar" onClick={onCerrar} aria-label="Cerrar detalle">
        <X size={17} />
      </button>
      <div className="detalle-zona-origen">
        <MapPin size={14} /> Zona seleccionada
      </div>
      <h2>{zona}</h2>
      {estimacion ? (
        <>
          <div className="detalle-zona-valor" style={{ color: colorDB(estimacion.decibeles) }}>
            {estimacion.decibeles} <span>dB</span>
          </div>
          <p className="detalle-zona-resumen">
            <strong>{etiquetaDB(estimacion.decibeles)}</strong> · {explicacionDB(estimacion.decibeles)}
          </p>
          <div className="detalle-zona-chips">
            <span className="chip-origen">Estimación del mapa</span>
            <span className="detalle-zona-confianza">Confianza {estimacion.confianza}</span>
          </div>
          <p className="detalle-zona-meta">
            Referencia: {estimacion.referencia} a {estimacion.distanciaReferenciaKm} km.
          </p>
        </>
      ) : (
        <p className="detalle-zona-meta">
          Sin datos de ruido para esta zona con los filtros actuales. Ajustá los filtros o el período.
        </p>
      )}
      <div className="detalle-zona-acciones">
        <button type="button" className="btn-primario" onClick={() => navigate('/medicion')}><Mic size={17} /> Medir aquí</button>
        <button type="button" className="btn-secundario" onClick={() => navigate('/reportar')}><FilePlus size={17} /> Reportar</button>
      </div>
    </aside>
  )
}

export default DetalleZona
