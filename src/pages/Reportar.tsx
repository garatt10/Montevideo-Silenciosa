import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Camera, Check, LocateFixed, Lock, MapPin, Send, X } from 'lucide-react'
import { PERIODOS_RUIDO, TIPOS_RUIDO, ZONAS_MONTEVIDEO, coordsDeZona, zonaMasCercana, type PeriodoRuido } from '../data/contextoRuido'
import { useAuth } from '../contexts/AuthContext'
import { useModo } from '../contexts/ModoContext'
import { guardarReporte } from '../lib/api'
import type { TipoRuido } from '../data/ruido'

const MAX_ANCHO_ALTO = 900
const CALIDAD_JPEG = 0.72
const MAX_ANCHO_ALTO_SEGURO = 640
const CALIDAD_SEGURA = 0.5
const MAX_TAMANO_FOTO = 700000
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
        let { width, height } = imagen
        if (width > MAX_ANCHO_ALTO || height > MAX_ANCHO_ALTO) {
          const escala = Math.min(MAX_ANCHO_ALTO / width, MAX_ANCHO_ALTO / height)
          width = Math.round(width * escala)
          height = Math.round(height * escala)
        }

        let dataURL = renderizarImagen(imagen, width, height, CALIDAD_JPEG)
        if (dataURL.length > MAX_TAMANO_FOTO) {
          const escala = Math.min(MAX_ANCHO_ALTO_SEGURO / width, MAX_ANCHO_ALTO_SEGURO / height, 1)
          dataURL = renderizarImagen(
            imagen,
            Math.round(width * escala),
            Math.round(height * escala),
            CALIDAD_SEGURA,
          )
        }

        resolve(dataURL)
      }

      imagen.src = reader.result as string
    }

    reader.readAsDataURL(archivo)
  })
}

function conTimeout<T>(promesa: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const temporizador = setTimeout(() => reject(new Error('Tiempo de espera agotado.')), ms)
    promesa.then(
      (valor) => {
        clearTimeout(temporizador)
        resolve(valor)
      },
      (error) => {
        clearTimeout(temporizador)
        reject(error)
      },
    )
  })
}

function Reportar() {
  const navigate = useNavigate()
  const { usuario, perfilCompleto } = useAuth()
  const { modo } = useModo()
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
        const coords: [number, number] = [resultado.coords.latitude, resultado.coords.longitude]
        setPosicion(coords)
        setZona(zonaMasCercana(coords))
        setGpsEstado('ok')
      },
      () => {
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
      await conTimeout(
        guardarReporte({
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
        }),
        15000,
      )
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

  return (
    <div className="page">
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
          <label
            className="reportar-foto"
            htmlFor="foto-input"
            tabIndex={0}
            role="button"
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                inputFotoRef.current?.click()
              }
            }}
          >
            {procesandoFoto ? <span>Procesando foto...</span> : (
              <>
                <Camera size={28} />
                <span>{fotoError || 'Agregar foto'}</span>
              </>
            )}
          </label>
        )}

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
        </section>

        <div className="reportar-grid">
          <label className="form-field">
            <span>Fuente</span>
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

          <label className="form-field">
            <span>Horario</span>
            <select value={periodo} onChange={e => setPeriodo(e.target.value as PeriodoRuido)}>
              {PERIODOS_RUIDO.map((item) => (
                <option key={item.id} value={item.id}>{item.label} ({item.horario})</option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Intensidad</span>
            <select value={intensidad} onChange={e => setIntensidad(e.target.value)}>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </label>
        </div>

        <label className="form-check">
          <input
            type="checkbox"
            checked={recurrente}
            onChange={e => setRecurrente(e.target.checked)}
          />
          <span>Es un problema recurrente</span>
        </label>

        <textarea
          className="reportar-textarea"
          placeholder="Describí el problema de ruido..."
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          rows={5}
        />
        {errorEnvio && <p className="auth-mensaje">{errorEnvio}</p>}
        <button
          className="btn-primario"
          onClick={enviar}
          disabled={!descripcion.trim() || enviando}
        >
          <Send size={20} /> {enviando ? 'Enviando...' : 'Enviar reporte'}
        </button>
      </div>
    </div>
  )
}

export default Reportar
