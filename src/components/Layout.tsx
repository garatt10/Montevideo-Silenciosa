import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import AppBar from './AppBar'
import Navegacion from './Navegacion'

const METADATA: Record<string, { titulo: string; subtitulo?: string }> = {
  '/': {
    titulo: 'Montevideo Silenciosa',
    subtitulo: 'Medí, reportá y visualizá la contaminación sonora',
  },
  '/medicion': {
    titulo: 'Medición',
    subtitulo: 'Medí el ruido con tu micrófono y GPS',
  },
  '/reportar': {
    titulo: 'Reportar',
    subtitulo: 'Contá un problema de ruido con contexto y foto',
  },
  '/noticias': {
    titulo: 'Noticias',
    subtitulo: 'Novedades sobre el ruido en Montevideo',
  },
  '/perfil': {
    titulo: 'Perfil',
    subtitulo: 'Tu historial y tus datos',
  },
}

const METADATA_DEFAULT = { titulo: 'Montevideo Silenciosa' }

function Layout() {
  const { pathname } = useLocation()
  const meta = METADATA[pathname] ?? METADATA_DEFAULT

  return (
    <div className="layout">
      <AppBar titulo={meta.titulo} subtitulo={meta.subtitulo} />
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="layout-content pagina-transicion"
      >
        <Outlet />
      </motion.main>
      <Navegacion />
    </div>
  )
}

export default Layout
