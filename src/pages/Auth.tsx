import { FormEvent, useState } from 'react'
import { CheckCircle2, Loader2, LogIn, Mail, Lock, UserPlus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { esCedulaUruguayaValida } from '../lib/cedula'

type ModoAuth = 'registro' | 'login'

type AuthProps = {
  onSuccess?: () => void
}

const ERRORES_AUTH: Record<string, string> = {
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-credential': 'Los datos ingresados no coinciden con una cuenta registrada.',
  'auth/user-not-found': 'Los datos ingresados no coinciden con una cuenta registrada.',
  'auth/wrong-password': 'Los datos ingresados no coinciden con una cuenta registrada.',
  'auth/popup-closed-by-user': 'Se canceló el ingreso con Google.',
  'auth/network-request-failed': 'No hay conexión. Revisá tu internet e intentá de nuevo.',
}

function mensajeDeError(error: unknown): string {
  if ((error as Error)?.message === 'CEDULA_INVALIDA') return 'Ingresá una cédula uruguaya válida.'
  if ((error as { code?: string })?.code === 'permission-denied') {
    return 'La cuenta fue creada, pero no se pudo guardar el perfil. Ingresá de nuevo e intentá completarlo.'
  }
  const codigo = (error as { code?: string })?.code
  return (codigo && ERRORES_AUTH[codigo]) || 'Ocurrió un error. Intentá de nuevo.'
}

function Auth({ onSuccess }: AuthProps) {
  const { login, loginGoogle, registrar } = useAuth()
  const [modo, setModo] = useState<ModoAuth>('registro')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [cedula, setCedula] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [exito, setExito] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const esRegistro = modo === 'registro'
  const cedulaValida = esCedulaUruguayaValida(cedula)
  const formularioCompleto = esRegistro
    ? correo.trim() && password.trim() && nombre.trim() && apellido.trim() && cedulaValida
    : correo.trim() && password.trim()

  function cambiarModo(nuevoModo: ModoAuth) {
    setModo(nuevoModo)
    setMensaje('')
    setExito(false)
  }

  function finalizarExitoso(completar: () => void) {
    setExito(true)
    setMensaje(esRegistro ? 'Cuenta creada.' : 'Listo.')
    setTimeout(() => {
      setEnviando(false)
      onSuccess?.()
      completar()
    }, 450)
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (enviando) return
    setEnviando(true)
    setMensaje('')

    try {
      if (esRegistro) {
        await registrar(correo.trim().toLowerCase(), password, nombre.trim(), apellido.trim(), cedula)
        finalizarExitoso(() => {})
      } else {
        await login(correo.trim().toLowerCase(), password)
        finalizarExitoso(() => {})
      }
    } catch (error) {
      setEnviando(false)
      setExito(false)
      setMensaje(mensajeDeError(error))
    }
  }

  async function entrarConGoogle() {
    if (enviando) return
    setEnviando(true)
    setMensaje('')
    try {
      await loginGoogle()
      finalizarExitoso(() => {})
    } catch (error) {
      setEnviando(false)
      setExito(false)
      setMensaje(mensajeDeError(error))
    }
  }

  return (
    <div className="auth-panel">
      <button
        type="button"
        className="auth-google"
        onClick={entrarConGoogle}
        disabled={enviando}
      >
        <svg className="auth-google-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Continuar con Google
      </button>

      <div className="auth-divisor">o</div>

      <div className="auth-tabs" role="tablist" aria-label="Seleccionar acción">
        <button
          type="button"
          id="auth-tab-registro"
          role="tab"
          aria-selected={esRegistro}
          aria-controls="auth-panel"
          className={`auth-tab ${esRegistro ? 'auth-tab--activo' : ''}`}
          onClick={() => cambiarModo('registro')}
        >
          <UserPlus size={17} />
          Registro
        </button>
        <button
          type="button"
          id="auth-tab-login"
          role="tab"
          aria-selected={!esRegistro}
          aria-controls="auth-panel"
          className={`auth-tab ${!esRegistro ? 'auth-tab--activo' : ''}`}
          onClick={() => cambiarModo('login')}
        >
          <LogIn size={17} />
          Login
        </button>
      </div>

      <form className="auth-form" onSubmit={enviar} id="auth-panel" role="tabpanel" aria-labelledby={esRegistro ? 'auth-tab-registro' : 'auth-tab-login'}>
        <label className="auth-field">
          <span>Correo</span>
          <div className="auth-input-wrap">
            <Mail size={18} />
            <input
              type="email"
              value={correo}
              onChange={event => setCorreo(event.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>
        </label>

        <label className="auth-field">
          <span>Contraseña</span>
          <div className="auth-input-wrap">
            <Lock size={18} />
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              autoComplete={esRegistro ? 'new-password' : 'current-password'}
            />
          </div>
        </label>

        {esRegistro && (
          <>
            <label className="auth-field">
              <span>Nombre</span>
              <div className="auth-input-wrap">
                <input value={nombre} onChange={event => setNombre(event.target.value)} placeholder="Ej: Ana" autoComplete="given-name" />
              </div>
            </label>

            <label className="auth-field">
              <span>Apellido</span>
              <div className="auth-input-wrap">
                <input value={apellido} onChange={event => setApellido(event.target.value)} placeholder="Ej: Rodríguez" autoComplete="family-name" />
              </div>
            </label>

            <label className="auth-field">
              <span>Cédula uruguaya</span>
              <div className="auth-input-wrap">
                <input
                  value={cedula}
                  onChange={event => setCedula(event.target.value)}
                  placeholder="Ej: 1.234.567-8"
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>
              {cedula && !cedulaValida && <small className="auth-aviso">Ingresá una cédula uruguaya válida.</small>}
            </label>
          </>
        )}

        {esRegistro && (
          <p className="auth-aviso">
            Tu cédula se valida antes de crear la cuenta.
          </p>
        )}

        {mensaje && (
          <p
            className={`auth-mensaje ${exito ? 'auth-mensaje--exito' : ''}`}
            role={exito ? 'status' : 'alert'}
          >
            {exito && <CheckCircle2 size={16} />}
            {mensaje}
          </p>
        )}

        <button
          className={`btn-primario auth-submit ${enviando ? 'btn-primario--cargando' : ''}`}
          disabled={!formularioCompleto || enviando}
        >
          {enviando ? (
            <Loader2 className="btn-spinner" size={19} />
          ) : esRegistro ? (
            <UserPlus size={19} />
          ) : (
            <LogIn size={19} />
          )}
          {enviando ? 'Un momento...' : esRegistro ? 'Crear cuenta' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}

export default Auth
