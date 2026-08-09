import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Check, LocateFixed, Lock, MapPin, Mic, RotateCcw, Send } from 'lucide-react'
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
import MedidorDb from '../components/MedidorDb'
type Estado = 'listo' | 'midiendo' | 'resultado' | 'enviado'

type MuestraAudio = {
  context: AudioContext
  analyser: AnalyserNode
  data: Uint8Array
}

const OPCIONES_DURACION = [15, 30, 60]
const DURACION_DEFAULT = 30
const INTERVALO_MUESTREO_MS = 500

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

  const audioRef = useRef<MuestraAudio | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const muestrasRef = useRef<number[]>([])
  const intervaloRef = useRef<number | null>(null)
  const gpsObtenidoRef = useRef(false)

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
    return () => detenerAudio()
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
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude]
        setPosicion(coords)
        setZona(zonaMasCercana(coords))
        setGpsEstado('ok')
        gpsObtenidoRef.current = true
      },
      () => {
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
    muestrasRef.current = []

    if (!gpsObtenidoRef.current) capturarGps()

    const micListo = await prepararMicrofono()
    setSimulada(!micListo)

    const inicio = performance.now()
    intervaloRef.current = window.setInterval(() => {
      const db = muestrearDB()
      muestrasRef.current.push(db)
      setDBActual(db)

      const transcurrido = Math.min(duracion, Math.round((performance.now() - inicio) / 1000))
      setSegundos(transcurrido)

      if (transcurrido >= duracion) {
        detenerAudio()
        const promedio = muestrasRef.current.length > 0
          ? muestrasRef.current.reduce((suma, valor) => suma + valor, 0) / muestrasRef.current.length
          : db
        setDecibeles(Math.round(promedio * 10) / 10)
        setEstado('resultado')
      }
    }, INTERVALO_MUESTREO_MS)
  }

  function enviar() {
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
      .then(() => setEstado('enviado'))
      .catch(() => {
        setErrorEnvio('No se pudo guardar la medición. Revisá tu conexión e intentá de nuevo.')
      })
  }

  const puedeEnviar = usuario != null && perfilCompleto

  const posicionMapa = posicion ?? coordsDeZona(zona)

  return (
    <div className="page page-medicion">
      {estado === 'listo' && (
        <div className="medicion-body">
          <div className="medicion-icono"><Mic size={56} /></div>
          <p className="medicion-desc">
            Presioná iniciar, permití el acceso al micrófono y mantené el dispositivo cerca de la
            fuente de sonido durante {duracion} segundos. También usaremos tu ubicación (GPS).
          </p>
          <div className="medicion-duracion">
            <span className="medicion-duracion-label">Duración</span>
            <div className="medicion-duracion-chips">
              {OPCIONES_DURACION.map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  className={`medicion-duracion-chip${duracion === opcion ? ' medicion-duracion-chip--activo' : ''}`}
                  onClick={() => setDuracion(opcion)}
                >
                  {opcion}s
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primario" onClick={iniciar}>
            <Mic size={20} /> Iniciar medición
          </button>
        </div>
      )}

      {estado === 'midiendo' && (
        <div className="medicion-body">
          {dBActual !== null && <MedidorDb decibeles={dBActual} />}
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
            <p className="medicion-aviso">
              Sin acceso al micrófono: mostrando valores simulados.
            </p>
          )}
          <p className="medicion-gps">
            {gpsEstado === 'buscando' && 'Obteniendo ubicación por GPS...'}
            {gpsEstado === 'error' && gpsMensaje}
            {gpsEstado === 'ok' && 'Ubicación obtenida'}
          </p>
        </div>
      )}

      {estado === 'resultado' && (
        <div className="medicion-body medicion-resultado">
          <MedidorDb decibeles={decibeles} />
          <p className="medicion-desc">
            {simulada ? 'Estimación simulada (sin acceso al micrófono).' : `Promedio de ${duracion} segundos de audio.`}
          </p>

          <div className="medicion-calidad" aria-label="Calidad de la medición">
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

          {errorEnvio && <p className="auth-mensaje">{errorEnvio}</p>}

          {puedeEnviar ? (
            <div className="medicion-acciones">
              <button className="btn-primario" onClick={enviar}>
                <Send size={20} /> Enviar
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
        <div className="medicion-body">
          <div className="medicion-check"><Check size={48} /></div>
          <p className="medicion-desc">Medición enviada correctamente</p>
          <p className="medicion-desc">
            {decibeles} dB · {zona}
          </p>
          {simulada && (
            <p className="medicion-aviso medicion-aviso--resultado">
              Se guardó como estimación personal y no se agrega al mapa comunitario.
            </p>
          )}
          <button className="btn-primario" onClick={() => navigate('/')}>
            Ver en el mapa
          </button>
        </div>
      )}
    </div>
  )
}

export default Medicion
