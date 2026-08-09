import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Camera, Check, ChevronRight, ChevronLeft, LocateFixed, Lock, MapPin, Send, X } from 'lucide-react'
import { PERIODOS_RUIDO, TIPOS_RUIDO, ZONAS_MONTEVIDEO, coordsDeZona, zonaMasCercana, type PeriodoRuido } from '../data/contextoRuido'
import { useAuth } from '../contexts/AuthContext'
import { useModo } from '../contexts/ModoContext'
import { guardarReporte } from '../lib/api'
import type { TipoRuido } from '../data/ruido'
import Pasos from '../components/Pasos'

const MAX_ANCHO_ALTO = 900
const CALIDAD_JPEG = 0.72
const MAX_ANCHO_ALTO_SEGURO = 640
const CALIDAD_SEGURA = 0.5
const MAX_TAMANO_FOTO = 700000
const TOTAL_PASOS = 5

const PASOS = [
  { titulo: 'Ubicación', descripcion: 'Dónde sucede el ruido' },
  { titulo: 'Qué pasa', descripcion: 'Descripción y fuente' },
  { titulo: '¿Cuándo?', descripcion: 'Horario y frecuencia' },
  { titulo: 'Evidencia', descripcion: 'Foto opcional' },
  { titulo: 'Resumen', descripcion: 'Revisá y enviá' },
]

const TILES: Record<string, string> = {
  oscuro: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  claro: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
}

const ICONO_REPORTE = L.divIcon({
  className: '',
  html: '<div style="width:17px;height:17px;background:#f97316;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.38)"></div>',
  iconSize: [17, 17],
  iconAnchor: [8, 8],
})

function CentrarMapa({ posicion }: { posicion: [number, number] }) {
  const map = useMap()
  const anterior = useRef<[number, number] | null>(null)
  useEffect(() => {
    if (anterior.current && (anterior.current[0] !== posicion[0] || anterior.current[1] !== posicion[1])) {
      map.flyTo(posicion, Math.max(map.getZoom(), 14), { duration: 0.5 })
    }
    anterior.current = posicion
  }, [map, posicion])
  return null
}

function renderizarImagen(imagen: HTMLImageElement, ancho: number, alto: number, calidad: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto
  const contexto = canvas.getContext('2d')
  if (!contexto) throw new Error('No se pudo procesar la imagen.')
  contexto.drawImage(imagen, 0, 0, ancho, alto)
  return canvas.toDataURL('image/jpeg', calidad)
}

function procesarImagen(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.onload = () => {
      const imagen = new Image()

      imagen.onerror = () => reject(new Error('El archivo no es una imagen válida.'))
      imagen.onload = () => {
        const { width, height } = imagen
        const opciones: Array<{ maxLado: number; calidad: number }> = [
          { maxLado: MAX_ANCHO_ALTO, calidad: CALIDAD_JPEG },
          { maxLado: MAX_ANCHO_ALTO_SEGURO, calidad: CALIDAD_SEGURA },
        ]

        let ultima = ''
        for (const opcion of opciones) {
          const escala = Math.min(opcion.maxLado / width, opcion.maxLado / height, 1)
          const dataURL = renderizarImagen(
            imagen,
            Math.max(1, Math.round(width * escala)),
            Math.max(1, Math.round(height * escala)),
            opcion.calidad,
          )
          ultima = dataURL
          if (dataURL.length <= MAX_TAMANO_FOTO) {
            resolve(dataURL)
            return
          }
        }

        if (ultima.length <= MAX_TAMANO_FOTO) {
          resolve(ultima)
          return
        }
        reject(new Error('La foto es demasiado grande para adjuntarla. Probá con otra.'))
      }

      imagen.src = reader.result as string
    }

    reader.readAsDataURL(archivo)
  })
}

function Reportar() {
  const navigate = useNavigate()
  const { usuario, perfilCompleto } = useAuth()
  const { modo } = useModo()
  const [paso, setPaso] = useState(1)
  const [descripcion, setDescripcion] = useState('')
  const [fuente, setFuente] = useState<TipoRuido>('transito')
  const [periodo, setPeriodo] = useState<PeriodoRuido>('tarde')
  const [zona, setZona] = useState('Centro')
  const [intensidad, setIntensidad] = useState('alta')
  const [recurrente, setRecurrente] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [foto, setFoto] = useState<string | null>(null)
  const [fotoError, setFotoError] = useState('')
  const [procesandoFoto, setProcesandoFoto] = useState(false)
  const [posicion, setPosicion] = useState<[number, number] | null>(null)
  const [gpsEstado, setGpsEstado] = useState<'idle' | 'buscando' | 'ok' | 'error'>('idle')
  const [gpsMensaje, setGpsMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')
  const inputFotoRef = useRef<HTMLInputElement | null>(null)
  const montadoRef = useRef(true)

  useEffect(() => {
    return () => {
      montadoRef.current = false
    }
  }, [])

  function cambiarFoto(archivo?: File) {
    if (!archivo) return

    setProcesandoFoto(true)
    setFotoError('')
    procesarImagen(archivo)
      .then(dataURL => {
        setFoto(dataURL)
        setProcesandoFoto(false)
      })
      .catch(error => {
        setFotoError(error instanceof Error ? error.message : 'No se pudo procesar la imagen.')
        setProcesandoFoto(false)
      })
  }

  function quitarFoto() {
    setFoto(null)
    setFotoError('')
    if (inputFotoRef.current) inputFotoRef.current.value = ''
  }

  function obtenerUbicacion() {
    if (!navigator.geolocation) {
      setGpsEstado('error')
      setGpsMensaje('Tu navegador no permite ubicación. Mové el punto en el mapa.')
      return
    }
    setGpsEstado('buscando')
    setGpsMensaje('')
    navigator.geolocation.getCurrentPosition(
      resultado => {
        if (!montadoRef.current) return
        const coords: [number, number] = [resultado.coords.latitude, resultado.coords.longitude]
        setPosicion(coords)
        setZona(zonaMasCercana(coords))
        setGpsEstado('ok')
      },
      () => {
        if (!montadoRef.current) return
        setGpsEstado('error')
        setGpsMensaje('No se pudo obtener el GPS. Mové el punto en el mapa.')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    )
  }

  async function enviar() {
    if (!descripcion.trim() || enviando) return
    setEnviando(true)
    setErrorEnvio('')

    const fotoUrl = foto ?? undefined

    try {
      await guardarReporte({
        descripcion: descripcion.trim(),
        fecha: new Date().toISOString(),
        fuente,
        periodo,
        zona,
        intensidad,
        recurrente,
        fotoUrl,
        lat: (posicion ?? coordsDeZona(zona))[0],
        lng: (posicion ?? coordsDeZona(zona))[1],
        userId: usuario?.id,
      })
      setEnviando(false)
      setEnviado(true)
    } catch {
      setEnviando(false)
      setErrorEnvio('No se pudo enviar el reporte. Revisá tu conexión e intentá de nuevo.')
    }
  }

  if (!usuario || !perfilCompleto) {
    return (
      <div className="page">
        <div className="page-body-center">
          <div className="medicion-icono"><Lock size={44} /></div>
          <p className="medicion-desc">
            Para enviar reportes necesitás iniciar sesión y completar tu perfil.
          </p>
          <button className="btn-primario" onClick={() => navigate('/perfil')}>
            Ir a mi perfil
          </button>
        </div>
      </div>
    )
  }

  if (enviado) {
    return (
      <div className="page">
        <div className="page-body-center">
          <div className="medicion-check"><Check size={48} /></div>
          <p className="medicion-desc">Reporte enviado correctamente</p>
          <button className="btn-primario" onClick={() => navigate('/')}>
            Volver al mapa
          </button>
        </div>
      </div>
    )
  }

  const pasoValido =
    (paso !== 1 || posicion !== null) &&
    (paso !== 2 || descripcion.trim().length > 0)

  function siguiente() {
    if (pasoValido) setPaso(actual => Math.min(TOTAL_PASOS, actual + 1))
  }

  function anterior() {
    setPaso(actual => Math.max(1, actual - 1))
  }

  return (
    <div className="page">
      <Pasos pasos={PASOS} pasoActual={paso} />
      <div className="reportar-body">
        <input
          ref={inputFotoRef}
          id="foto-input"
          type="file"
          accept="image/*"
          capture="environment"
          className="reportar-foto-input"
          onChange={event => cambiarFoto(event.target.files?.[0])}
        />

        <header className="reportar-paso-head">
          <h2>{PASOS[paso - 1].titulo}</h2>
          <p>{PASOS[paso - 1].descripcion}</p>
        </header>

        {paso === 1 && (
          <section className="reporte-ubicacion">
            <div className="reporte-ubicacion-head">
              <div>
                <span className="reporte-paso">1. Ubicación</span>
                <strong><MapPin size={16} /> Confirmá el punto del reporte</strong>
              </div>
              <button className="medicion-gps-btn" onClick={obtenerUbicacion} type="button">
                <LocateFixed size={15} /> {gpsEstado === 'buscando' ? 'Buscando...' : 'Usar GPS'}
              </button>
            </div>
            <div className="reporte-mapa">
              <MapContainer
                center={posicion ?? coordsDeZona(zona)}
                zoom={14}
                zoomControl={false}
                attributionControl={false}
                style={{ width: '100%', height: '100%' }}
              >
                <TileLayer url={TILES[modo]} />
                <CentrarMapa posicion={posicion ?? coordsDeZona(zona)} />
                <Marker
                  position={posicion ?? coordsDeZona(zona)}
                  draggable
                  icon={ICONO_REPORTE}
                  eventHandlers={{
                    dragend: event => {
                      const latlng = (event.target as L.Marker).getLatLng()
                      const coords: [number, number] = [latlng.lat, latlng.lng]
                      setPosicion(coords)
                      setZona(zonaMasCercana(coords))
                      setGpsEstado('idle')
                    },
                  }}
                />
              </MapContainer>
            </div>
            <p className="reporte-ubicacion-hint">
              {gpsEstado === 'ok' ? 'GPS obtenido. Podés arrastrar el punto si necesitás corregirlo.' : gpsMensaje || 'Arrastrá el punto para ajustar la ubicación.'}
            </p>
            <label className="form-field">
              <span>Zona</span>
              <select value={zona} onChange={e => setZona(e.target.value)}>
                {ZONAS_MONTEVIDEO.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </section>
        )}

        {paso === 2 && (
          <>
            <label className="reportar-label" htmlFor="reporte-desc">
              ¿Qué está pasando?
            </label>
            <textarea
              id="reporte-desc"
              className="reportar-textarea"
              placeholder="Describí el problema de ruido..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={6}
              autoFocus
              required
            />
            <label className="form-field">
              <span>Fuente principal del ruido</span>
              <select value={fuente} onChange={e => setFuente(e.target.value as TipoRuido)}>
                {TIPOS_RUIDO.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>{tipo.label}</option>
                ))}
              </select>
            </label>
          </>
        )}

        {paso === 3 && (
          <>
            <label className="form-field">
              <span>¿Cuándo ocurre?</span>
              <select value={periodo} onChange={e => setPeriodo(e.target.value as PeriodoRuido)}>
                {PERIODOS_RUIDO.map((item) => (
                  <option key={item.id} value={item.id}>{item.label} ({item.horario})</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Intensidad percibida</span>
              <select value={intensidad} onChange={e => setIntensidad(e.target.value)}>
                <option value="media">Media — molesto en casa</option>
                <option value="alta">Alta — dificulta conversar</option>
                <option value="critica">Crítica — insoportable</option>
              </select>
            </label>
            <label className="form-check">
              <input
                type="checkbox"
                checked={recurrente}
                onChange={e => setRecurrente(e.target.checked)}
              />
              <span>Es un problema recurrente (no fue una vez sola)</span>
            </label>
          </>
        )}

        {paso === 4 && (
          <>
            {foto ? (
              <div className="reportar-foto reportar-foto--preview">
                <img className="reportar-foto-img" src={foto} alt="Foto del reporte" />
                <button
                  className="reportar-foto-quitar"
                  onClick={quitarFoto}
                  aria-label="Quitar foto"
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="reportar-foto"
                onClick={() => inputFotoRef.current?.click()}
              >
                {procesandoFoto ? <span>Procesando foto...</span> : (
                  <>
                    <Camera size={28} />
                    <span>{fotoError || 'Agregar foto (opcional)'}</span>
                  </>
                )}
              </button>
            )}
            <p className="reporte-ubicacion-hint">
              La foto ayuda a documentar la fuente del ruido. Se guarda en la base de datos, no es
              obligatoria.
            </p>
          </>
        )}

        {paso === 5 && (
          <>
            <section className="reporte-resumen">
              <div className="reporte-resumen-fila"><span>Ubicación</span><strong>{zona}</strong></div>
              <div className="reporte-resumen-fila"><span>Descripción</span><strong>{descripcion.trim()}</strong></div>
              <div className="reporte-resumen-fila">
                <span>Fuente</span>
                <strong>{TIPOS_RUIDO.find(tipo => tipo.id === fuente)?.label}</strong>
              </div>
              <div className="reporte-resumen-fila">
                <span>Horario</span>
                <strong>{PERIODOS_RUIDO.find(item => item.id === periodo)?.label}</strong>
              </div>
              <div className="reporte-resumen-fila"><span>Intensidad</span><strong>{intensidad}</strong></div>
              <div className="reporte-resumen-fila"><span>Recurrente</span><strong>{recurrente ? 'Sí' : 'No'}</strong></div>
              <div className="reporte-resumen-fila"><span>Foto</span><strong>{foto ? 'Adjuntada' : 'Sin foto'}</strong></div>
            </section>
            <button className="btn-secundario" onClick={() => setPaso(1)}>
              Editar detalles
            </button>
            {errorEnvio && <p className="auth-mensaje" role="alert">{errorEnvio}</p>}
          </>
        )}

        <div className="reportar-nav">
          {paso > 1 && (
            <button className="btn-secundario" onClick={anterior} type="button">
              <ChevronLeft size={18} /> Anterior
            </button>
          )}
          {paso < TOTAL_PASOS ? (
            <button
              className="btn-primario reportar-nav-siguiente"
              onClick={siguiente}
              disabled={!pasoValido}
              type="button"
            >
              Siguiente <ChevronRight size={18} />
            </button>
          ) : (
            <button
              className="btn-primario reportar-nav-siguiente"
              onClick={enviar}
              disabled={enviando}
              type="button"
            >
              <Send size={18} /> {enviando ? 'Enviando...' : 'Enviar reporte'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reportar
