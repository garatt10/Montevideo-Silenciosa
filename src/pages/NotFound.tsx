import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'

function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="page-body-center">
        <div className="medicion-check"><Compass size={48} /></div>
        <p className="medicion-desc">Página no encontrada</p>
        <button className="btn-primario" onClick={() => navigate('/')}>
          Volver al mapa
        </button>
      </div>
    </div>
  )
}

export default NotFound
