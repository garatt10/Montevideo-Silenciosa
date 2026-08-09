import { Link } from 'react-router-dom'
import { FUENTE_ACUSTICO_2025 } from '../data/mapaAcustico2025'

const ENLACES = [
  {
    titulo: 'Ficha del proyecto — Mapa Acústico de Montevideo',
    detalle: 'IMFIA · Facultad de Ingeniería (Udelar)',
    url: 'https://idm.fing.edu.uy/es/node/52928',
    medio: 'idm.fing.edu.uy',
  },
  {
    titulo: 'Contaminación sonora en Montevideo: el mapa con las zonas más ruidosas de la ciudad',
    detalle: 'Publicado por El País — 28 de junio de 2026',
    url: 'https://www.elpais.com.uy/informacion/politica/contaminacion-sonora-en-montevideo-el-mapa-con-las-zonas-mas-ruidosas-de-la-ciudad',
    medio: 'El País',
  },
  {
    titulo: 'Mapa acústico de Montevideo: Rambla del Buceo, 18 de Julio y Avenida Italia lideran los niveles de ruido',
    detalle: 'Publicado por Telenoche — 29 de junio de 2026',
    url: 'https://www.telenoche.com.uy/sociedad/mapa-acustico-montevideo-rambla-del-buceo-18-julio-y-avenida-italia-lideran-los-niveles-ruido-n5401435',
    medio: 'Telenoche',
  },
  {
    titulo: 'Nuevo mapa acústico de Montevideo',
    detalle: 'Entrevista a las ingenieras Elizabeth González y Valentina La Manna — Radio Cultura (Medios Públicos)',
    url: 'https://mediospublicos.uy/nuevo-mapa-acustico-de-montevideo/',
    medio: 'Medios Públicos',
  },
]

function Metodologia() {
  return (
    <div className="page metodologia-page">
      <div className="metodologia-scroll">
        <header className="metodologia-cabecera">
          <h1>Datos y metodología</h1>
          <p className="metodologia-subtitulo">
            De dónde salen los niveles de ruido del mapa y cómo interpretarlos.
          </p>
        </header>

        <section className="metodologia-seccion">
          <h2>La fuente del mapa</h2>
          <p>
            El mapa usa mediciones de campo del <strong>{FUENTE_ACUSTICO_2025.titulo}</strong>,
            elaborado por el <strong>{FUENTE_ACUSTICO_2025.institucion}</strong> con{' '}
            {FUENTE_ACUSTICO_2025.periodo}.
          </p>
          <p>
            El estudio relevó <strong>250 puntos</strong> de monitoreo en las 16 áreas del
            territorio. Esta app muestra <strong>246 de esos puntos</strong>: los que pudieron
            recuperarse de la versión pública del mapa interactivo (ver «Cómo se actualizaron los
            datos»). Los valores son niveles de presión sonora <strong>LAeq</strong> en decibeles
            (dB(A)).
          </p>
          <p>
            Los niveles más altos se registran en grandes avenidas y corredores de transporte
            (72–78 dB(A)), con picos por encima de los 100 dB(A) asociados sobre todo a motos con
            escapes modificados.
          </p>
        </section>

        <section className="metodologia-seccion">
          <h2>¿Qué es el LAeq y el dB(A)?</h2>
          <p>
            El <strong>LAeq</strong> (nivel sonoro continuo equivalente ponderado A) es el promedio
            energético del ruido durante el período de medición: un único número que resume cómo de
            fuerte fue el sonido. La <strong>ponderación A</strong> (de ahí «dB(A)») atenúa las
            frecuencias graves y agudas para imitar la sensibilidad real del oído humano.
          </p>
          <p>
            Una guía aproximada: por debajo de 55 dB(A) un ambiente se percibe tranquilo; de
            60–65 dB(A) hay conversación normal de fondo; de 70–75 dB(A) el ruido ya resulta
            molesto y dificulta la concentración; y por encima de 80 dB(A) la exposición sostenida
            puede dañar la audición.
          </p>
        </section>

        <section className="metodologia-seccion">
          <h2>Qué muestra el mapa de la app</h2>
          <p>
            La superficie de color se calcula por <strong>interpolación</strong> entre los puntos de
            medición: cada celda del mapa pondera los puntos cercanos con mayor peso a los más
            próximos (inverse distance weighting). Entre dos puntos, el color varía de forma
            continua siguiendo la escala de la app (verde → amarillo → naranja → rojo).
          </p>
          <p>
            La <strong>estimación en una ubicación</strong> aplica la misma idea para mostrar un
            valor aproximado de ruido, y la línea de tiempo ajusta ese valor según la hora del día
            como una <strong>estimación</strong> (el estudio mide un promedio general, no cada hora).
          </p>
          <p>
            Los valores son de referencia: sirven para comparar zonas y tomar decisiones
            (elegir un recorrido, exigir controles), no reemplazan un informe acústico profesional.
          </p>
        </section>

        <section className="metodologia-seccion">
          <h2>Límites de medir con el celular</h2>
          <p>
            La función de medición de la app usa el micrófono del teléfono, que <strong>no está
            calibrado</strong>. Los valores obtenidos son aproximados y pueden variar según el
            modelo, la posición y el viento. Al medir:
          </p>
          <ul>
            <li>Buscá un ambiente sin viento y alejá el teléfono del cuerpo y de la ropa.</li>
            <li>Evitá tapar el micrófono con la mano.</li>
            <li>Mantené la medición al menos 15–30 segundos para obtener un promedio más estable.</li>
            <li>Compará siempre con el mismo teléfono para que las diferencias sean coherentes.</li>
          </ul>
          <p>
            Una forma de calibrar de manera relativa: en un ambiente que conozcas (por ejemplo una
            biblioteca o un punto del mapa acústico oficial), anotá qué valor marca tu teléfono y
            usá esa diferencia como referencia.
          </p>
        </section>

        <section className="metodologia-seccion">
          <h2>Cómo se actualizaron los datos</h2>
          <p>
            Los puntos se extrajeron de la versión pública del mapa interactivo del estudio con el
            script <code>tools/scrape-mapa-acustico.mjs</code>, que descarga las teselas de datos y
            decodifica los puntos de medición. Cada punto incluye su dirección y el circuito vial
            al que pertenece.
          </p>
          <p>
            <Link to="/medicion" className="metodologia-enlace">
              Probar la medición con el micrófono →
            </Link>
          </p>
        </section>

        <section className="metodologia-seccion">
          <h2>Fuentes y referencias</h2>
          <ul className="metodologia-fuentes">
            {ENLACES.map(enlace => (
              <li key={enlace.url}>
                <a href={enlace.url} target="_blank" rel="noopener noreferrer">
                  <span className="metodologia-fuente-titulo">{enlace.titulo}</span>
                  <span className="metodologia-fuente-detalle">{enlace.detalle}</span>
                  <span className="metodologia-fuente-medio">{enlace.medio}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <footer className="metodologia-pie">
          <Link to="/noticias" className="metodologia-enlace">
            Ver las noticias sobre el estudio →
          </Link>
        </footer>
      </div>
    </div>
  )
}

export default Metodologia
