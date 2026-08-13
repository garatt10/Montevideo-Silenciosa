import { useEffect, useState } from 'react'
import { BarChart3, CheckCircle2, FileText, Info, LogOut, Moon, Sun } from 'lucide-react'
import Auth from './Auth'
import { TIPOS_RUIDO } from '../data/contextoRuido'
import type { TipoRuido } from '../data/ruido'
import { useAuth } from '../contexts/AuthContext'
import { useModo } from '../contexts/ModoContext'
import { esCedulaUruguayaValida } from '../lib/cedula'
import {
  obtenerMediciones,
  obtenerReportes,
  type MedicionGuardada,
  type ReporteGuardado,
} from '../lib/api'
import { GraficoEvolucion, DistribucionFuentes } from '../components/GraficoEvolucion'

function labelFuente(fuente?: TipoRuido): string {
  return TIPOS_RUIDO.find((tipo) => tipo.id === fuente)?.label || 'Sin contexto'
}

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function CompletarPerfil() {
  const { completarPerfil } = useAuth()
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [cedula, setCedula] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cedulaValida = esCedulaUruguayaValida(cedula)
  const completo = nombre.trim() && apellido.trim() && cedulaValida

  async function guardar() {
    if (!completo || guardando) return
    setGuardando(true)
    setError('')
    try {
      await completarPerfil(nombre.trim(), apellido.trim(), cedula.trim())
    } catch {
      setError('No se pudo guardar el perfil. Intentá de nuevo.')
      setGuardando(false)
    }
  }

  return (
    <section className="perfil-cuenta perfil-completar-card">
      <div className="perfil-auth-intro">
        <p className="perfil-cuenta-nombre">Completá tu perfil</p>
        <p className="perfil-cuenta-dato">
          Para medir y enviar reportes necesitamos tu nombre, apellido y cédula.
        </p>
      </div>
      <div className="perfil-completar">
        <label className="form-field">
          <span>Nombre</span>
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Ana" required />
        </label>
        <label className="form-field">
          <span>Apellido</span>
          <input value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Ej: Rodriguez" required />
        </label>
        <label className="form-field">
          <span>Cédula</span>
          <input
            value={cedula}
            onChange={e => setCedula(e.target.value)}
            placeholder="Ej: 12345678"
            inputMode="numeric"
            required
          />
        </label>
        {cedula && !cedulaValida && <p className="auth-mensaje" role="alert">Ingresá una cédula uruguaya válida.</p>}
        {error && <p className="auth-mensaje" role="alert">{error}</p>}
        <button className="btn-primario" onClick={guardar} disabled={!completo || guardando}>
          <CheckCircle2 size={19} /> {guardando ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </div>
    </section>
  )
}

function Perfil() {
  const { usuario, logout, cargando: cargandoSesion, perfilCompleto } = useAuth()
  const { modo, toggleModo } = useModo()
  const [mediciones, setMediciones] = useState<MedicionGuardada[]>([])
  const [reportes, setReportes] = useState<ReporteGuardado[]>([])
  const [cargandoDatos, setCargandoDatos] = useState(true)

  useEffect(() => {
    let activo = true

    if (!usuario) {
      setMediciones([])
      setReportes([])
      setCargandoDatos(false)
      return () => {
        activo = false
      }
    }

    setCargandoDatos(true)
    Promise.all([obtenerMediciones(), obtenerReportes()])
      .then(([listaMediciones, listaReportes]) => {
        if (!activo) return
        setMediciones(listaMediciones.filter(medicion => medicion.userId === usuario.id))
        setReportes(listaReportes.filter(reporte => reporte.userId === usuario.id))
      })
      .catch(() => {
        if (activo) {
          setMediciones([])
          setReportes([])
        }
      })
      .finally(() => {
        if (activo) setCargandoDatos(false)
      })

    return () => {
      activo = false
    }
  }, [usuario])

  if (cargandoSesion) {
    return (
      <div className="page">
        <div className="page-body-center">
          <p className="perfil-vacio">Cargando...</p>
        </div>
      </div>
    )
  }

  const ultimaDB = mediciones.length > 0 ? mediciones[0].decibeles : null
  const iniciales = [usuario?.nombre, usuario?.apellido].filter(Boolean).map(n => n![0]).join('').toUpperCase() || '?'

  return (
    <div className="page">
      <div className="perfil-body">
        <section className="perfil-grupo">
          <h2 className="perfil-grupo-head">Cuenta</h2>

          {!usuario ? (
            <div className="perfil-auth">
              <div className="perfil-auth-intro">
                <p className="perfil-cuenta-nombre">Sin cuenta activa</p>
                <p className="perfil-cuenta-dato">Registrate o ingresa para guardar tus datos.</p>
              </div>
              <Auth />
            </div>
          ) : !perfilCompleto ? (
            <>
              <div className="perfil-cuenta perfil-cuenta--slim">
                <div className="perfil-cuenta-avatar">{iniciales}</div>
                <div>
                  <p className="perfil-cuenta-nombre">{usuario.email}</p>
                  <p className="perfil-cuenta-dato">Perfil incompleto</p>
                </div>
                <button className="perfil-logout" onClick={logout} aria-label="Cerrar sesión">
                  <LogOut size={18} />
                </button>
              </div>
              <CompletarPerfil />
            </>
          ) : (
            <div className="perfil-cuenta">
              <div className="perfil-cuenta-avatar">{iniciales}</div>
              <div>
                <p className="perfil-cuenta-nombre">
                  {[usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || usuario.email}
                </p>
                <p className="perfil-cuenta-dato">CI {usuario.cedula}</p>
                <p className="perfil-cuenta-dato">{usuario.email}</p>
              </div>
              <button className="perfil-logout" onClick={logout} aria-label="Cerrar sesión">
                <LogOut size={18} />
              </button>
            </div>
          )}
        </section>

        <section className="perfil-grupo">
          <h2 className="perfil-grupo-head">Actividad</h2>

          {!usuario ? (
            <p className="perfil-vacio">Ingresá para ver tus mediciones y reportes.</p>
          ) : (
            <>
              <div className="perfil-stats">
                <div className="perfil-stat">
                  <BarChart3 size={22} />
                  <span className="perfil-stat-num">{mediciones.length}</span>
                  <span className="perfil-stat-label">Mediciones</span>
                </div>
                <div className="perfil-stat">
                  <FileText size={22} />
                  <span className="perfil-stat-num">{reportes.length}</span>
                  <span className="perfil-stat-label">Reportes</span>
                </div>
              </div>

              {ultimaDB !== null && (
                <div className="perfil-ultima">
                  <strong>Última medición:</strong> {ultimaDB} dB
                </div>
              )}

              {mediciones.length > 1 && (
                <section className="perfil-historial">
                  <div className="perfil-seccion-head">
                    <h2>Evolución</h2>
                    <span>{mediciones.length}</span>
                  </div>
                  <GraficoEvolucion mediciones={mediciones} />
                </section>
              )}

              {mediciones.length > 0 && (
                <section className="perfil-historial">
                  <div className="perfil-seccion-head">
                    <h2>Por fuente</h2>
                    <span>{mediciones.length}</span>
                  </div>
                  <DistribucionFuentes mediciones={mediciones} />
                </section>
              )}

              <section className="perfil-historial">
                <div className="perfil-seccion-head">
                  <h2>Historial de mediciones</h2>
                  <span>{mediciones.length}</span>
                </div>
                {mediciones.length === 0 ? (
                  <p className="perfil-vacio">
                    {cargandoDatos ? 'Cargando...' : 'Todavía no hay mediciones guardadas.'}
                  </p>
                ) : (
                  <div className="historial-lista">
                    {mediciones.slice(0, 6).map((medicion) => (
                      <article className="historial-card" key={medicion.id}>
                        <div>
                          <strong>{medicion.decibeles} dB</strong>
                          <span>{medicion.zona || 'Sin zona'} - {labelFuente(medicion.fuente)}</span>
                          {medicion.nota && <em>{medicion.nota}</em>}
                        </div>
                        <time>{formatearFecha(medicion.fecha)}</time>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="perfil-historial">
                <div className="perfil-seccion-head">
                  <h2>Reportes con contexto</h2>
                  <span>{reportes.length}</span>
                </div>
                {reportes.length === 0 ? (
                  <p className="perfil-vacio">
                    {cargandoDatos ? 'Cargando...' : 'Todavía no hay reportes enviados.'}
                  </p>
                ) : (
                  <div className="historial-lista">
                    {reportes.slice(0, 4).map((reporte) => (
                      <article className="historial-card" key={reporte.id}>
                        {reporte.fotoUrl && (
                          <img className="historial-foto" src={reporte.fotoUrl} alt="Foto del reporte" />
                        )}
                        <div>
                          <strong>{reporte.zona || 'Sin zona'} - {reporte.intensidad || 'sin intensidad'}</strong>
                          <span>{labelFuente(reporte.fuente)} - {reporte.periodo || 'sin horario'}</span>
                          <em>{reporte.descripcion}</em>
                        </div>
                        <time>{formatearFecha(reporte.fecha)}</time>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </section>

        <section className="perfil-grupo">
          <h2 className="perfil-grupo-head">Configuración</h2>

          <div className="perfil-config">
            <div className="perfil-config-fila">
              <span>Tema de la app</span>
              <button className="perfil-config-boton" onClick={toggleModo} type="button">
                {modo === 'oscuro' ? <Moon size={16} /> : <Sun size={16} />}
                {modo === 'oscuro' ? 'Oscuro' : 'Claro'}
              </button>
            </div>
            {usuario && (
              <div className="perfil-config-fila">
                <span>Cerrar sesión</span>
                <button className="perfil-config-boton perfil-config-boton--peligro" onClick={logout} type="button">
                  <LogOut size={16} /> Salir
                </button>
              </div>
            )}
          </div>

          <div className="perfil-info">
            <Info size={18} />
            <div>
              <p className="perfil-info-titulo">Montevideo Silenciosa</p>
              <p className="perfil-info-version">v0.1.0</p>
              <p className="perfil-info-desc">
                App colaborativa para medir, reportar y visualizar la contaminación sonora en Montevideo.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Perfil
