import { useMemo } from 'react'
import { FilePlus, MapPin, Mic, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { PuntoRuido } from '../data/ruido'
import { estimarRuidoEnUbicacion } from '../data/ruido'
import { zonaMasCercana } from '../data/contextoRuido'
import { colorDB, etiquetaDB } from '../data/coloresRuido'

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

  if (!posicion || !estimacion) return null
  const zona = nombre ?? zonaMasCercana(posicion)

  return (
    <aside className="detalle-zona" aria-label={`Detalle de ${zona}`}>
      <button type="button" className="detalle-zona-cerrar" onClick={onCerrar} aria-label="Cerrar detalle">
        <X size={17} />
      </button>
      <div className="detalle-zona-origen"><MapPin size={14} /> Zona seleccionada</div>
      <h2>{zona}</h2>
      <div className="detalle-zona-valor" style={{ color: colorDB(estimacion.decibeles) }}>
        {estimacion.decibeles} <span>dB</span>
      </div>
      <p><strong>{etiquetaDB(estimacion.decibeles)}</strong> · estimación para esta ubicación.</p>
      <p className="detalle-zona-meta">
        Referencia: {estimacion.referencia} a {estimacion.distanciaReferenciaKm} km · confianza {estimacion.confianza}.
      </p>
      <div className="detalle-zona-acciones">
        <button type="button" className="btn-primario" onClick={() => navigate('/medicion')}><Mic size={17} /> Medir aquí</button>
        <button type="button" className="btn-secundario" onClick={() => navigate('/reportar')}><FilePlus size={17} /> Reportar</button>
      </div>
    </aside>
  )
}

export default DetalleZona
