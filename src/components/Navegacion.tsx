import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Mic, FilePlus, Newspaper, User } from 'lucide-react'

const TABS = [
  { path: '/', icon: MapPin, label: 'Mapa' },
  { path: '/medicion', icon: Mic, label: 'Medición' },
  { path: '/reportar', icon: FilePlus, label: 'Reportar' },
  { path: '/noticias', icon: Newspaper, label: 'Noticias' },
  { path: '/perfil', icon: User, label: 'Perfil' },
]

function Navegacion() {
  const location = useLocation()

  return (
    <nav className="nav" aria-label="Navegación principal">
      {TABS.map(tab => {
        const activo = location.pathname === tab.path
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`nav-item ${activo ? 'nav-item--activo' : ''}`}
            aria-current={activo ? 'page' : undefined}
          >
            {activo && (
              <motion.span
                layoutId="nav-indicador"
                className="nav-indicador"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <tab.icon size={22} strokeWidth={activo ? 2.4 : 2} aria-hidden="true" />
            <span className="nav-label">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export default Navegacion
