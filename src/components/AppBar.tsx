import { Link } from 'react-router-dom'
import { Info, Moon, Sun, User } from 'lucide-react'
import { useModo } from '../contexts/ModoContext'
import Logo from './Logo'

type AppBarProps = {
  titulo: string
  subtitulo?: string
}

function AppBar({ titulo, subtitulo }: AppBarProps) {
  const { modo, toggleModo } = useModo()
  const esOscuro = modo === 'oscuro'

  return (
    <header className="appbar">
      <div className="appbar-content">
        <div className="appbar-brand">
          <Logo />
          <div className="appbar-titulos">
            <h1 className="appbar-titulo">{titulo}</h1>
            {subtitulo && <p className="appbar-subtitulo">{subtitulo}</p>}
          </div>
        </div>

        <div className="appbar-derecha">
          <button
            className="appbar-accion"
            onClick={toggleModo}
            aria-label={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            type="button"
          >
            {esOscuro ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link
            to="/metodologia"
            className="appbar-accion"
            aria-label="Datos y metodología"
          >
            <Info size={20} />
          </Link>
          <Link
            to="/perfil"
            className={`appbar-accion ${titulo === 'Perfil' ? 'appbar-accion--activo' : ''}`}
            aria-label="Perfil"
          >
            <User size={20} />
          </Link>
        </div>
      </div>
    </header>
  )
}

export default AppBar
