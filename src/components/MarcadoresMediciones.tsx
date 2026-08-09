import { CircleMarker, Popup } from 'react-leaflet'
import type { PuntoRuido } from '../data/ruido'
import { useAuth } from '../contexts/AuthContext'
import { colorDB, etiquetaDB } from '../data/coloresRuido'

export type PuntoMedicion = PuntoRuido & {
  fecha?: string
  userId?: string
  nota?: string
}

type MarcadoresMedicionesProps = {
  puntos: PuntoRuido[]
}

function MarcadoresMediciones({ puntos }: MarcadoresMedicionesProps) {
  const { usuario } = useAuth()
  const mediciones = puntos.filter((punto) => punto.id.startsWith('medicion-')) as PuntoMedicion[]

  if (mediciones.length === 0) return null

  return (
    <>
      {mediciones.map((medicion) => {
        const propia = usuario != null && medicion.userId != null && medicion.userId === usuario.id
        const color = colorDB(medicion.decibeles)
        const fechaTexto = medicion.fecha
          ? new Date(medicion.fecha).toLocaleDateString('es-UY', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })
          : ''

        return (
          <CircleMarker
            key={medicion.id}
            center={medicion.coordenadas}
            radius={7}
            pathOptions={{
              color: propia ? '#f5a623' : '#ffffff',
              weight: propia ? 2.5 : 1,
              fillColor: color,
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <div className="marcador-popup">
                <div className="marcador-popup-db" style={{ color }}>
                  {medicion.decibeles} <small>dB</small>
                </div>
                <div className="marcador-popup-etiqueta" style={{ color }}>
                  {etiquetaDB(medicion.decibeles)}
                </div>
                <div className="marcador-popup-zona">{medicion.nombre}</div>
                {medicion.nota && <div className="marcador-popup-nota">{medicion.nota}</div>}
                <div className="marcador-popup-fecha">{fechaTexto}</div>
                {propia ? (
                  <div className="marcador-popup-propia">Tu medición</div>
                ) : (
                  <div className="marcador-popup-comunitaria">Medición comunitaria</div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </>
  )
}

export default MarcadoresMediciones
