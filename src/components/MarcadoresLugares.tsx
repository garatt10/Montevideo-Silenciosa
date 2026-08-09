import type { Categoria } from '../data/lugares'
import lugares from '../data/lugares'
import { svgForCategoria } from '../data/iconos'
import { CATEGORIA_CONFIG } from './Leyenda'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

function crearIcono(categoria: Categoria): L.DivIcon {
  const cfg = CATEGORIA_CONFIG[categoria]
  return L.divIcon({
    html: `<div class="marcador-lugar" style="--c:${cfg.color}">${svgForCategoria(categoria)}</div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  })
}

function MarcadoresLugares() {
  return (
    <>
      {lugares.map((lugar) => (
        <Marker
          key={lugar.id}
          position={lugar.coordenadas}
          icon={crearIcono(lugar.categoria)}
        >
          <Popup>
            <strong>{lugar.nombre}</strong>
            <br />
            <span className="popup-categoria">
              {CATEGORIA_CONFIG[lugar.categoria].label}
            </span>
            <div className="popup-ruido">
              <strong>{lugar.ruido.promedioDb} dB promedio</strong>
              <span>Pico estimado: {lugar.ruido.picoDb} dB</span>
              <span>Periodo critico: {lugar.ruido.periodoCritico}</span>
              <span>Fuentes: {lugar.ruido.fuentes.join(', ')}</span>
              <em>{lugar.ruido.recomendacion}</em>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

export default MarcadoresLugares
