import { Minus, Plus } from 'lucide-react'
import { useMap } from 'react-leaflet'

function ControlesZoom() {
  const map = useMap()

  return (
    <div className="mapa-controls-flotantes" role="group" aria-label="Zoom del mapa">
      <button
        type="button"
        className="mapa-flotante-boton"
        onClick={() => map.zoomIn()}
        aria-label="Acercar mapa"
      >
        <Plus size={18} />
      </button>
      <button
        type="button"
        className="mapa-flotante-boton"
        onClick={() => map.zoomOut()}
        aria-label="Alejar mapa"
      >
        <Minus size={18} />
      </button>
    </div>
  )
}

export default ControlesZoom
