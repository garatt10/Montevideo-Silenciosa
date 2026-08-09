import { useState } from 'react'
import { CircleMarker, Popup, useMap } from 'react-leaflet'
import { LocateFixed, MapPin, X } from 'lucide-react'
import type { PuntoRuido } from '../data/ruido'
import { estimarRuidoEnUbicacion } from '../data/ruido'
import { colorDB, etiquetaDB } from '../data/coloresRuido'

type EstadoUbicacion = 'idle' | 'buscando' | 'ok' | 'error'

type UbicacionUsuarioProps = {
  puntos: PuntoRuido[]
  onPosicionChange?: (posicion: [number, number] | null) => void
}

function UbicacionUsuario({ puntos, onPosicionChange }: UbicacionUsuarioProps) {
  const map = useMap()
  const [estado, setEstado] = useState<EstadoUbicacion>('idle')
  const [posicion, setPosicion] = useState<[number, number] | null>(null)
  const [mensaje, setMensaje] = useState('')

  const estimacion = posicion ? estimarRuidoEnUbicacion(posicion, puntos) : null

  function pedirUbicacion() {
    if (!navigator.geolocation) {
      setEstado('error')
      setMensaje('Tu navegador no permite usar la ubicación.')
      return
    }

    setEstado('buscando')
    setMensaje('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const siguiente: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ]
        setPosicion(siguiente)
        onPosicionChange?.(siguiente)
        setEstado('ok')
        map.flyTo(siguiente, Math.max(map.getZoom(), 14), { duration: 0.8 })
      },
      () => {
        setEstado('error')
        setMensaje('No se pudo obtener tu ubicación. Podés seguir usando zona manual.')
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 60000,
      },
    )
  }

  function limpiarUbicacion() {
    setPosicion(null)
    onPosicionChange?.(null)
    setEstado('idle')
    setMensaje('')
  }

  return (
    <>
      <div className="ubicacion-widget">
        <button
          className="ubicacion-boton"
          onClick={estado === 'ok' ? limpiarUbicacion : pedirUbicacion}
          type="button"
          aria-label={estado === 'ok' ? 'Ocultar ubicación actual' : 'Usar ubicación actual'}
        >
          {estado === 'ok' ? <X size={18} /> : <LocateFixed size={18} />}
        </button>

        {(estado === 'buscando' || estado === 'error' || estimacion) && (
          <div className="ubicacion-panel">
            <div className="ubicacion-panel-head">
              <MapPin size={16} />
              <strong>Ubicación actual</strong>
            </div>

            {estado === 'buscando' && <p>Buscando GPS...</p>}
            {estado === 'error' && <p>{mensaje}</p>}
            {estimacion && (
              <>
                <div className="ubicacion-db" style={{ color: colorDB(estimacion.decibeles) }}>
                  {estimacion.decibeles} <span>dB</span>
                </div>
                {estimacion.esReferenciaCercana ? (
                  <p>
                    Ruido {etiquetaDB(estimacion.decibeles)} estimado cerca de {estimacion.referencia}.
                  </p>
                ) : (
                  <p>
                    Ruido {etiquetaDB(estimacion.decibeles)} estimado para esta zona del mapa.
                  </p>
                )}
                <small>
                  Referencia más próxima: {estimacion.referencia} ({estimacion.distanciaReferenciaKm} km).
                  Confianza {estimacion.confianza}. Dato estimado, no medición real.
                </small>
              </>
            )}
          </div>
        )}
      </div>

      {posicion && (
        <CircleMarker
          center={posicion}
          radius={9}
          pathOptions={{
            color: '#ffffff',
            fillColor: colorDB(estimacion?.decibeles || 60),
            fillOpacity: 0.95,
            weight: 3,
          }}
        >
          <Popup>
            <strong>Tu ubicación</strong>
            <br />
            {estimacion ? `${estimacion.decibeles} dB estimados` : 'Estimando ruido...'}
          </Popup>
        </CircleMarker>
      )}
    </>
  )
}

export default UbicacionUsuario
