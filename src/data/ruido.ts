import { distanciaKm } from './contextoRuido'
import type { TiempoMapa } from './contextoRuido'
import { puntosAcustico2025 } from './mapaAcustico2025'

export type TipoRuido = 'transito' | 'comercial' | 'obra' | 'nocturno' | 'verde' | 'terminal'

export interface PuntoRuido {
  id: string
  nombre: string
  coordenadas: [number, number]
  decibeles: number
  tipo: TipoRuido
  detalle: string
  circuito?: string
}

export const puntosRuido: PuntoRuido[] = puntosAcustico2025

export function ajustarPuntoPorTiempo(punto: PuntoRuido, tiempo: TiempoMapa): PuntoRuido {
  const tendencia = Math.min(5, tiempo.antiguedadMeses * 0.25)
  const variacionTipo: Record<TipoRuido, number> = {
    transito: -tendencia,
    comercial: -tendencia * 0.8,
    obra: tiempo.antiguedadMeses % 2 === 0 ? 2 : -3,
    nocturno: -tendencia * 0.4,
    verde: 0,
    terminal: -tendencia * 0.6,
  }

  return {
    ...punto,
    decibeles: Math.max(42, Math.min(94, punto.decibeles + variacionTipo[punto.tipo])),
  }
}

export function estimarRuidoEnUbicacion(
  coordenadas: [number, number],
  puntos: PuntoRuido[],
): {
  decibeles: number
  confianza: 'alta' | 'media' | 'baja'
  referencia: string
  distanciaReferenciaKm: number
  esReferenciaCercana: boolean
} | null {
  if (puntos.length === 0) return null

  const cercanos = puntos
    .map((punto) => ({
      punto,
      distancia: distanciaKm(coordenadas, punto.coordenadas),
    }))
    .sort((a, b) => a.distancia - b.distancia)
    .slice(0, 6)

  const pesoTotal = cercanos.reduce((total, item) => total + 1 / Math.max(item.distancia, 0.18), 0)
  const decibeles = cercanos.reduce((total, item) => {
    const peso = 1 / Math.max(item.distancia, 0.18)
    return total + item.punto.decibeles * peso
  }, 0) / pesoTotal
  const masCercano = cercanos[0]

  return {
    decibeles: Math.round(decibeles * 10) / 10,
    confianza: masCercano.distancia < 0.8 ? 'alta' : masCercano.distancia < 2 ? 'media' : 'baja',
    referencia: masCercano.punto.nombre,
    distanciaReferenciaKm: Math.round(masCercano.distancia * 10) / 10,
    esReferenciaCercana: masCercano.distancia <= 1.2,
  }
}
