import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Check, Info, LocateFixed, Loader2, Lock, MapPin, Mic, RotateCcw, Send, X } from 'lucide-react'
import { useModo } from '../contexts/ModoContext'
import { useAuth } from '../contexts/AuthContext'
import {
  TIPOS_RUIDO,
  ZONAS_MONTEVIDEO,
  coordsDeZona,
  zonaMasCercana,
} from '../data/contextoRuido'
import { guardarMedicion } from '../lib/api'
import type { TipoRuido } from '../data/ruido'
import { etiquetaDB } from '../data/coloresRuido'
import MedidorDb from '../components/MedidorDb'
import Pasos from '../components/Pasos'

type Estado = 'listo' | 'midiendo' | 'resultado' | 'enviado'

type MuestraAudio = {
  context: AudioContext
  analyser: AnalyserNode
  data: Uint8Array
}

const OPCIONES_DURACION = [15, 30, 60]
const DURACION_DEFAULT = 30
const INTERVALO_MUESTREO_MS = 500

const PASOS = [
  { titulo: 'Preparar', descripcion: 'Duración y ubicación' },
  { titulo: 'Medir', descripcion: 'Capturando sonido' },
  { titulo: 'Resultado', descripcion: 'Revisá y guardá' },
]

function pasoDeEstado(estado: Estado): number {
  if (estado === 'listo') return 1
  if (estado === 'midiendo') return 2
  return 3
}

const TILES: Record<string, string> = {
  oscuro: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  claro: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
}

const ICONO_PUNTO = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;background:#2563eb;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function generarDBSimulado(): number {
  return Math.round((40 + Math.random() * 50) * 10) / 10
}

function CentrarEn({ posicion }: { posicion: [number, number] }) {
  const map = useMap()
  const anteriorRef = useRef<[number, number] | null>(null)

  useEffect(() => {
    const anterior = anteriorRef.current
    if (anterior && (anterior[0] !== posicion[0] || anterior[1] !== posicion[1])) {
      map.flyTo(posicion, Math.max(map.getZoom(), 14), { duration: 0.6 })
    }
    anteriorRef.current = posicion
  }, [posicion, map])

  return null
}

type MiniMapaProps = {
  posicion: [number, number]
  onCambio: (posicion: [number, number]) => void
}

function MiniMapa({ posicion, onCambio }: MiniMapaProps) {
  const { modo } = useModo()

  return (
    <MapContainer
      center={posicion}
      zoom={14}
      zoomControl={false}
      attributionControl={false}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer url={TILES[modo]} />
      <CentrarEn posicion={posicion} />
      <Marker
        position={posicion}
        draggable
        icon={ICONO_PUNTO}
        eventHandlers={{
          dragend: (event) => {
            const marker = event.target as L.Marker
            const latlng = marker.getLatLng()
            onCambio([latlng.lat, latlng.lng])
          },
        }}
      />
    </MapContainer>
  )
}

function Medicion() {
  const navigate = useNavigate()
  const { usuario, perfilCompleto } = useAuth()
  const [estado, setEstado] = useState<Estado>('listo')
  const [duracion, setDuracion] = useState<number>(DURACION_DEFAULT)
  const [segundos, setSegundos] = useState(0)
  const [dBActual, setDBActual] = useState<number | null>(null)
  const [decibeles, setDecibeles] = useState(0)
  const [fuente, setFuente] = useState<TipoRuido>('transito')
  const [zona, setZona] = useState('Centro')
  const [nota, setNota] = useState('')
  const [posicion, setPosicion] = useState<[number, number] | null>(null)
  const [gpsEstado, setGpsEstado] = useState<'idle' | 'buscando' | 'ok' | 'error'>('idle')
  const [gpsMensaje, setGpsMensaje] = useState('')
  const [simulada, setSimulada] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')
  const [enviando, setEnviando] = useState(false)

  const audioRef = useRef<MuestraAudio | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const muestrasRef = useRef<number[]>([])
  const intervaloRef = useRef<number | null>(null)
  const gpsObtenidoRef = useRef(false)
  const montadoRef = useRef(true)
  const sesionRef = useRef(false)

  function detenerAudio() {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current)
      intervaloRef.current = null
    }
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    audioRef.current?.context.close().catch(() => {})
    audioRef.current = null
  }

  useEffect(() => {
    return () => {
      montadoRef.current = false
      sesionRef.current = false
      detenerAudio()
    }
  }, [])

  async function prepararMicrofono(): Promise<boolean> {
    if (!navigator.mediaDevices?.getUserMedia) return false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      streamRef.current = stream
      const context = new AudioContext()
      await context.resume()
      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.2
      source.connect(analyser)
      audioRef.current = { context, analyser, data: new Uint8Array(analyser.fftSize) }
      return true
    } catch {
      return false
    }
  }

  function muestrearDB(): number {
    const audio = audioRef.current
    if (!audio) return generarDBSimulado()

    audio.analyser.getByteTimeDomainData(audio.data)
    let sumaCuadrados = 0
    for (let i = 0; i < audio.data.length; i += 1) {
      const valor = (audio.data[i] - 128) / 128
      sumaCuadrados += valor * valor
    }
    const rms = Math.sqrt(sumaCuadrados / audio.data.length)
    const dbFS = 20 * Math.log10(Math.max(rms, 1e-6))

    return Math.max(35, Math.min(100, Math.round((95 + dbFS * 1.5) * 10) / 10))
  }

  function capturarGps() {
    if (!navigator.geolocation) {
      setGpsEstado('error')
      setGpsMensaje('Tu navegador no permite ubicación. Arrastrá el punto en el mapa.')
      return
    }

    setGpsEstado('buscando')
    setGpsMensaje('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!montadoRef.current) return
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude]
        setPosicion(coords)
        setZona(zonaMasCercana(coords))
        setGpsEstado('ok')
        gpsObtenidoRef.current = true
      },
      () => {
        if (!montadoRef.current) return
        setGpsEstado('error')
        setGpsMensaje('No se pudo obtener el GPS. Arrastrá el punto en el mapa.')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    )
  }

  async function iniciar() {
    detenerAudio()
    setEstado('midiendo')
    setSegundos(0)
    setDBActual(null)
    setSimulada(false)
    setErrorEnvio('')
    muestrasRef.current = []
    sesionRef.current = true

    if (!gpsObtenidoRef.current) capturarGps()

    const micListo = await prepararMicrofono()
    if (!montadoRef.current || !sesionRef.current) {
      detenerAudio()
      return
    }
    setSimulada(!micListo)

    const inicio = performance.now()
    intervaloRef.current = window.setInterval(() => {
      if (!sesionRef.current) return
      const db = muestrearDB()
      muestrasRef.current.push(db)
      setDBActual(db)

      const transcurrido = Math.min(duracion, Math.round((performance.now() - inicio) / 1000))
      setSegundos(transcurrido)

      if (transcurrido >= duracion) {
        sesionRef.current = false
        detenerAudio()
        const promedio = muestrasRef.current.length > 0
          ? muestrasRef.current.reduce((suma, valor) => suma + valor, 0) / muestrasRef.current.length
          : db
        setDecibeles(Math.round(promedio * 10) / 10)
        setEstado('resultado')
      }
    }, INTERVALO_MUESTREO_MS)
  }

  function cancelar() {
    sesionRef.current = false
    detenerAudio()
    setEstado('listo')
    setSegundos(0)
    setDBActual(null)
    setSimulada(false)
  }

  function enviar() {
    if (enviando) return
    setEnviando(true)
    setErrorEnvio('')
    const coords = posicion ?? coordsDeZona(zona)
    guardarMedicion({
      decibeles,
      fecha: new Date().toISOString(),
      fuente,
      zona,
      nota: nota.trim(),
      lat: coords[0],
      lng: coords[1],
      simulada,
      userId: usuario?.id,
    })
      .then(() => {
        if (!montadoRef.current) return
        setEnviando(false)
        setEstado('enviado')
      })
      .catch(() => {
        if (!montadoRef.current) return
        setEnviando(false)
        setErrorEnvio('No se pudo guardar la medición. Revisá tu conexión e intentá de nuevo.')
      })
  }

  const puedeEnviar = usuario != null && perfilCompleto
  const posicionMapa = posicion ?? coordsDeZona(zona)

  return (
    <div className="page page-medicion">
      <Pasos
        pasos={PASOS}
        pasoActual={pasoDeEstado(estado)}
        completado={estado === 'enviado'}
      />

      {estado === 'listo' && (
        <div className="medicion-body medicion-listo">
          <div className="medicion-icono"><Mic size={56} /></div>
          <h1 className="medicion-titulo">Medir el ruido</h1>
          <p className="medicion-desc">
            Hacé una medición de {duracion} segundos cerca de la fuente de sonido. Necesitamos el
            micrófono del dispositivo y, si es posible, tu ubicación.
          </p>

          <ul className="medicion-pasos-lista">
            <li><Mic size={18} /> Mantené el dispositivo cerca de la fuente de ruido</li>
            <li><MapPin size={18} /> Sin movimientos bruscos ni viento directo al micrófono</li>
            <li><Check size={18} /> Al terminar, podés ajustar ubicación y guardar</li>
          </ul>

          <div className="medicion-duracion">
            <span className="medicion-duracion-label">Duración</span>
            <div className="medicion-duracion-chips" role="group" aria-label="Elegir duración">
              {OPCIONES_DURACION.map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  className={`medicion-duracion-chip${duracion === opcion ? ' medicion-duracion-chip--activo' : ''}`}
                  onClick={() => setDuracion(opcion)}
                  aria-pressed={duracion === opcion}
                >
                  {opcion}s
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primario btn-primario--grande" onClick={iniciar}>
            <Mic size={20} /> Comenzar medición
          </button>
          <p className="medicion-hint">
            Vamos a pedirte acceso al micrófono. Podés cancelar cuando quieras.
          </p>
        </div>
      )}

      {estado === 'midiendo' && (
        <div className="medicion-body">
          {dBActual !== null && <MedidorDb decibeles={dBActual} midiendo />}
          <div className="medicion-timer">{segundos}s / {duracion}s</div>
          <div className="medicion-barra">
            <div
              className="medicion-barra-inner"
              style={{ width: `${(segundos / duracion) * 100}%` }}
            />
          </div>
          <div className="medicion-icono midiendo"><Mic size={32} /></div>
          <p className="medicion-desc midiendo">Midiendo...</p>
          {simulada && (
            <p className="medicion-aviso" role="status">
              <Info size={15} /> Sin acceso al micrófono: mostrando valores simulados.
            </p>
          )}
          <p className="medicion-gps">
            {gpsEstado === 'buscando' && 'Obteniendo ubicación por GPS...'}
            {gpsEstado === 'error' && gpsMensaje}
            {gpsEstado === 'ok' && 'Ubicación obtenida'}
          </p>
          <button className="btn-secundario medicion-cancelar" onClick={cancelar} type="button">
            <X size={18} /> Cancelar
          </button>
        </div>
      )}

      {estado === 'resultado' && (
        <div className="medicion-body medicion-resultado">
          {simulada && (
            <div className="medicion-aviso medicion-aviso--destacado">
              <Info size={16} />
              <div>
                <strong>Sin acceso al micrófono</strong>
                <span>Estos valores son una simulación: se guardarán como estimación personal y no se
                  suman al mapa comunitario.</span>
              </div>
            </div>
          )}
          <MedidorDb decibeles={decibeles} />
          <p className="medicion-desc">
            {simulada ? 'Estimación simulada.' : `Promedio de ${duracion} segundos de audio.`}
            <strong className="medicion-resultado-etiqueta"> {etiquetaDB(decibeles)}</strong>
          </p>

          <div className="medicion-calidad" role="group" aria-label="Calidad de la medición">
            <div>
              <span>Micrófono</span>
              <strong className={simulada ? 'medicion-calidad--alerta' : 'medicion-calidad--ok'}>
                {simulada ? 'Sin permiso' : 'Capturado'}
              </strong>
            </div>
            <div>
              <span>Ubicación</span>
              <strong className={gpsEstado === 'ok' ? 'medicion-calidad--ok' : 'medicion-calidad--alerta'}>
                {gpsEstado === 'ok' ? 'GPS' : 'Ajustable'}
              </strong>
            </div>
            <div>
              <span>Duración</span>
              <strong>{duracion} s</strong>
            </div>
          </div>

          <div className="medicion-mapa-head">
            <MapPin size={16} />
            <strong>Ubicación de la medición</strong>
            <button className="medicion-gps-btn" onClick={capturarGps} type="button">
              <LocateFixed size={15} /> Mi ubicación
            </button>
          </div>
          <div className="medicion-mapa">
            <MiniMapa
              posicion={posicionMapa}
              onCambio={(coords) => {
                setPosicion(coords)
                setZona(zonaMasCercana(coords))
              }}
            />
          </div>
          <p className="medicion-mapa-hint">
            Arrastrá el punto para corregir la ubicación.
          </p>

          <div className="medicion-contexto">
            <label className="form-field">
              <span>Fuente principal</span>
              <select value={fuente} onChange={e => setFuente(e.target.value as TipoRuido)}>
                {TIPOS_RUIDO.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>{tipo.label}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Zona</span>
              <select value={zona} onChange={e => setZona(e.target.value)}>
                {ZONAS_MONTEVIDEO.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="form-field form-field--full">
              <span>Nota opcional</span>
              <input
                value={nota}
                onChange={e => setNota(e.target.value)}
                placeholder="Ej: obra frente a casa"
              />
            </label>
          </div>

          {errorEnvio && <p className="auth-mensaje" role="alert">{errorEnvio}</p>}

          {puedeEnviar ? (
            <div className="medicion-acciones">
              <button
                className={`btn-primario ${enviando ? 'btn-primario--cargando' : ''}`}
                onClick={enviar}
                disabled={enviando}
              >
                {enviando ? <Loader2 className="btn-spinner" size={20} /> : <Send size={20} />}
                {enviando ? 'Guardando...' : 'Guardar medición'}
              </button>
              <button className="btn-secundario" onClick={iniciar}>
                <RotateCcw size={20} /> Repetir
              </button>
            </div>
          ) : (
            <div className="medicion-acciones medicion-acciones--bloqueadas">
              <p className="medicion-gps">
                <Lock size={15} style={{ verticalAlign: '-2px' }} /> Iniciá sesión y completá tu
                perfil para guardar mediciones.
              </p>
              <button className="btn-primario" onClick={() => navigate('/perfil')}>
                Ir a mi perfil
              </button>
            </div>
          )}
        </div>
      )}

      {estado === 'enviado' && (
        <div className="medicion-body medicion-enviado" role="status">
          <div className="medicion-check"><Check size={48} /></div>
          <h1 className="medicion-titulo">Medición guardada</h1>
          <p className="medicion-desc">
            {decibeles} dB · {zona}
          </p>
          {simulada ? (
            <p className="medicion-aviso medicion-aviso--resultado">
              Se guardó como estimación personal y no se agrega al mapa comunitario.
            </p>
          ) : (
            <p className="medicion-enviado-nota">
              Gracias por aportar al mapa comunitario de ruido.
            </p>
          )}
          <button className="btn-primario" onClick={() => navigate('/')}>
            Ver en el mapa
          </button>
          <button className="btn-secundario" onClick={() => { setEstado('listo'); setNota('') }}>
            Medir otra vez
          </button>
        </div>
      )}
    </div>
  )
}

export default Medicion
