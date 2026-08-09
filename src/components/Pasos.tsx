import { Check } from 'lucide-react'

export type Paso = {
  titulo: string
  descripcion?: string
}

type PasosProps = {
  pasos: Paso[]
  pasoActual: number
  completado?: boolean
}

function Pasos({ pasos, pasoActual, completado = false }: PasosProps) {
  return (
    <nav className="pasos" aria-label="Progreso del formulario">
      <ol className="pasos-lista">
        {pasos.map((paso, index) => {
          const numero = index + 1
          const hecho = numero < pasoActual || (completado && numero === pasoActual)
          const activo = numero === pasoActual && !hecho
          return (
            <li
              key={paso.titulo}
              className={`paso${activo ? ' paso--activo' : ''}${hecho ? ' paso--completado' : ''}`}
              aria-current={activo ? 'step' : undefined}
            >
              <span className="paso-indice">{hecho ? <Check size={15} /> : numero}</span>
              <span className="paso-info">
                <strong>{paso.titulo}</strong>
                {paso.descripcion && <small>{paso.descripcion}</small>}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Pasos
