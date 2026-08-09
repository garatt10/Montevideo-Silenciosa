import { ModoProvider } from './contexts/ModoContext'
import { AuthProvider } from './contexts/AuthContext'
import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import { useModo } from './contexts/ModoContext'

const Medicion = lazy(() => import('./pages/Medicion'))
const Reportar = lazy(() => import('./pages/Reportar'))
const Noticias = lazy(() => import('./pages/Noticias'))
const Metodologia = lazy(() => import('./pages/Metodologia'))
const Perfil = lazy(() => import('./pages/Perfil'))
const NotFound = lazy(() => import('./pages/NotFound'))

function AppInner() {
  const { modo } = useModo()
  return (
    <div className={modo === 'claro' ? 'modo-claro' : 'modo-oscuro'}>
      <Suspense fallback={<div className="app-cargando">Cargando…</div>}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/medicion" element={<Medicion />} />
            <Route path="/reportar" element={<Reportar />} />
            <Route path="/noticias" element={<Noticias />} />
            <Route path="/metodologia" element={<Metodologia />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </div>
  )
}

function App() {
  return (
    <ModoProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ModoProvider>
  )
}

export default App
