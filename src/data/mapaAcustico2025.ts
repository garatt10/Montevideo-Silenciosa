import type { PuntoRuido } from './ruido'
import datos from './mapa-acustico-2025.json'

export type PuntoAcustico = PuntoRuido & {
  circuito: string
}

interface PuntoAcusticoCrudo {
  lat: number
  lon: number
  db: number
  direccion: string
  circuito: string
}

interface DatosAcustico {
  fuente: string
  puntos: PuntoAcusticoCrudo[]
}

const datosAcustico = datos as DatosAcustico

export const puntosAcustico2025: PuntoAcustico[] = datosAcustico.puntos.map((punto, index) => ({
  id: `acustico-${index}`,
  nombre: punto.direccion,
  coordenadas: [punto.lat, punto.lon] as [number, number],
  decibeles: punto.db,
  tipo: 'transito' as const,
  detalle: `Medición de campo LAeq 2025 — ${punto.circuito}.`,
  circuito: punto.circuito,
}))

export const FUENTE_ACUSTICO_2025 = {
  titulo: 'Mapa Acústico de Montevideo 2025',
  institucion: 'IMFIA — Facultad de Ingeniería (Udelar) e Intendencia de Montevideo',
  periodo: 'mediciones de campo de junio 2024 a junio 2025',
  publicacion: 'vía El País',
  referencia: 'https://idm.fing.edu.uy/es/node/52928',
} as const
