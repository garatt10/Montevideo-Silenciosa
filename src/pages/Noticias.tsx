import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { obtenerNoticias, sembrarNoticiasSiVacio, type NoticiaGuardada } from '../lib/api'

const NOTICIAS_SEED: NoticiaGuardada[] = [
  {
    id: 1,
    titulo: 'Contaminación sonora en Montevideo: el mapa con las zonas más ruidosas de la ciudad',
    extracto:
      'El estudio del IMFIA (Facultad de Ingeniería, Udelar) con la IMM relevó 250 puntos en 16 áreas. Los niveles LAeq rondan los 72–78 dB(A) en las grandes avenidas y corredores de transporte.',
    categoria: 'Nota real',
    fecha: '28/06/2026',
    color: '#3b82f6',
    url: 'https://www.elpais.com.uy/informacion/politica/contaminacion-sonora-en-montevideo-el-mapa-con-las-zonas-mas-ruidosas-de-la-ciudad',
    medio: 'El País',
  },
  {
    id: 2,
    titulo: 'Mapa acústico de Montevideo: Rambla del Buceo, 18 de Julio y Avenida Italia lideran los niveles de ruido',
    extracto:
      'El relevamiento del IMFIA-Fing registró hasta 100 dB(A) de pico en la Rambla del Buceo por motos y escapes modificados, y 78 dB(A) promedio en 8 de Octubre.',
    categoria: 'Nota real',
    fecha: '29/06/2026',
    color: '#3b82f6',
    url: 'https://www.telenoche.com.uy/sociedad/mapa-acustico-montevideo-rambla-del-buceo-18-julio-y-avenida-italia-lideran-los-niveles-ruido-n5401435',
    medio: 'Telenoche',
  },
  {
    id: 3,
    titulo: 'Nuevo mapa acústico de Montevideo',
    extracto:
      'Las ingenieras Elizabeth González y Valentina La Manna presentan en Radio Cultura el nuevo mapa acústico: 250 puntos de monitoreo, los barrios más ruidosos y la propuesta normativa.',
    categoria: 'Nota real',
    fecha: '2025',
    color: '#3b82f6',
    url: 'https://mediospublicos.uy/nuevo-mapa-acustico-de-montevideo/',
    medio: 'Medios Públicos',
  },
  {
    id: 4,
    titulo: 'Mapa Acústico de Montevideo — IMFIA',
    extracto:
      'Ficha del proyecto: mediciones de campo de junio 2024 a junio 2025 en el marco de los proyectos CSIC-I+D y CSIC-IM «Ing. Oscar Maggiolo», del IMFIA-Fing y la Intendencia de Montevideo.',
    categoria: 'Proyecto',
    fecha: '2024–2025',
    color: '#8b5cf6',
    url: 'https://idm.fing.edu.uy/es/node/52928',
    medio: 'Fing · Udelar',
  },
  {
    id: 5,
    titulo: 'MVD Silenciosa: la app que mide el ruido urbano',
    extracto:
      'Esta es una aplicación de demostración: su mapa usa los datos del estudio del IMFIA y permite estimar el ruido en cualquier punto de Montevideo.',
    categoria: 'Ejemplo del prototipo',
    fecha: 'Prototipo',
    color: '#059669',
    ejemplo: true,
  },
]

function Noticias() {
  const [noticias, setNoticias] = useState<NoticiaGuardada[]>(NOTICIAS_SEED)

  useEffect(() => {
    let activo = true

    obtenerNoticias()
      .then(async (lista) => {
        if (!activo) return
        if (lista.length === 0) {
          try {
            await sembrarNoticiasSiVacio(NOTICIAS_SEED)
            const actualizadas = await obtenerNoticias()
            if (activo && actualizadas.length > 0) setNoticias(actualizadas)
          } catch {
            if (activo) setNoticias(NOTICIAS_SEED)
          }
          return
        }
        setNoticias(lista)
      })
      .catch(() => {
        if (activo) setNoticias(NOTICIAS_SEED)
      })

    return () => {
      activo = false
    }
  }, [])

  return (
    <div className="page">
      <div className="noticias-lista">
        {noticias.map(n => (
          <article key={n.id} className="noticia-card">
            <span className="noticia-categoria" style={{ background: n.color }}>{n.categoria}</span>
            <h2 className="noticia-titulo">{n.titulo}</h2>
            <p className="noticia-extracto">{n.extracto}</p>
            <div className="noticia-footer">
              <time className="noticia-fecha">{n.fecha}</time>
              {n.url && !n.ejemplo && (
                <a
                  className="noticia-enlace"
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {n.medio} ↗
                </a>
              )}
            </div>
          </article>
        ))}
        <Link to="/metodologia" className="noticias-metodologia">
          Datos y metodología del mapa →
        </Link>
      </div>
    </div>
  )
}

export default Noticias
