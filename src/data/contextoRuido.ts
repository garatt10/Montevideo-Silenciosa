import type { TipoRuido } from './ruido'

export const TIPOS_RUIDO: { id: TipoRuido; label: string }[] = [
  { id: 'transito', label: 'Tránsito' },
  { id: 'comercial', label: 'Comercial' },
  { id: 'obra', label: 'Obra' },
  { id: 'nocturno', label: 'Nocturno' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'verde', label: 'Zona verde' },
]

export const PERIODOS_RUIDO = [
  { id: 'manana', label: 'Mañana', horario: '07-11 h' },
  { id: 'mediodia', label: 'Mediodía', horario: '11-15 h' },
  { id: 'tarde', label: 'Tarde', horario: '15-20 h' },
  { id: 'noche', label: 'Noche', horario: '20-01 h' },
] as const

export type PeriodoRuido = typeof PERIODOS_RUIDO[number]['id']

export type TiempoMapa = {
  id: string
  label: string
  detalle: string
  desde: string
  hasta: string
  antiguedadMeses: number
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']

function finDeMes(anio: number, mes: number): Date {
  return new Date(anio, mes + 1, 0, 23, 59, 59)
}

export function crearLineaTiempoMapa(fechaActual = new Date()): TiempoMapa[] {
  const periodos: TiempoMapa[] = []
  const hoy = new Date(fechaActual)

  for (let i = 0; i < 6; i += 1) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const anio = fecha.getFullYear()
    const mes = fecha.getMonth()
    const hasta = i === 0 ? hoy : finDeMes(anio, mes)

    periodos.push({
      id: `${anio}-${String(mes + 1).padStart(2, '0')}`,
      label: i === 0 ? 'Actualidad' : `${MESES[mes]} ${anio}`,
      detalle: i === 0 ? `${MESES[mes]} ${anio}` : 'Mes cerrado',
      desde: new Date(anio, mes, 1).toISOString(),
      hasta: hasta.toISOString(),
      antiguedadMeses: i,
    })
  }

  for (let i = 1; i <= 2; i += 1) {
    const anio = hoy.getFullYear() - i
    periodos.push({
      id: `${anio}`,
      label: `${anio}`,
      detalle: 'Promedio anual',
      desde: new Date(anio, 0, 1).toISOString(),
      hasta: new Date(anio, 11, 31, 23, 59, 59).toISOString(),
      antiguedadMeses: i * 12,
    })
  }

  return periodos
}

export const ZONAS_MONTEVIDEO = [
  'Centro',
  'Ciudad Vieja',
  'Cordon',
  'Tres Cruces',
  'Pocitos',
  'Punta Carretas',
  'Malvin',
  'Union',
  'Prado',
  'Cerro',
  'La Teja',
  'Carrasco',
] as const

export type ZonaMontevideo = typeof ZONAS_MONTEVIDEO[number]

export const ZONAS_COORDS: Record<ZonaMontevideo, [number, number]> = {
  Centro: [-34.905, -56.188],
  'Ciudad Vieja': [-34.906, -56.205],
  Cordon: [-34.902, -56.176],
  'Tres Cruces': [-34.894, -56.141],
  Pocitos: [-34.91, -56.146],
  'Punta Carretas': [-34.922, -56.159],
  Malvin: [-34.894, -56.1],
  Union: [-34.878, -56.129],
  Prado: [-34.861, -56.202],
  Cerro: [-34.889, -56.252],
  'La Teja': [-34.861, -56.231],
  Carrasco: [-34.882, -56.052],
}

export const CENTRO_MONTEVIDEO: [number, number] = [-34.9011, -56.1645]

export function distanciaKm(a: [number, number], b: [number, number]): number {
  const radioTierra = 6371
  const lat1 = a[0] * Math.PI / 180
  const lat2 = b[0] * Math.PI / 180
  const deltaLat = (b[0] - a[0]) * Math.PI / 180
  const deltaLng = (b[1] - a[1]) * Math.PI / 180
  const haversine = Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2

  return radioTierra * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

export function coordsDeZona(zona: string): [number, number] {
  return ZONAS_COORDS[zona as ZonaMontevideo] ?? CENTRO_MONTEVIDEO
}

export function zonaMasCercana(coordenadas: [number, number]): ZonaMontevideo {
  let mejor: ZonaMontevideo = 'Centro'
  let menorDistancia = Infinity

  for (const zona of ZONAS_MONTEVIDEO) {
    const distancia = distanciaKm(coordenadas, ZONAS_COORDS[zona])
    if (distancia < menorDistancia) {
      menorDistancia = distancia
      mejor = zona
    }
  }

  return mejor
}
