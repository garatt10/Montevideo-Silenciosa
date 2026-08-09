export const COLORES_DB = {
  bajo: '#10b981',
  moderado: '#eab308',
  alto: '#f97316',
  critico: '#ef4444',
} as const

export type NivelRuido = keyof typeof COLORES_DB

const RGB: Record<NivelRuido, string> = {
  bajo: '16, 185, 129',
  moderado: '234, 179, 8',
  alto: '249, 115, 22',
  critico: '239, 68, 68',
}

const ETIQUETAS: Record<NivelRuido, string> = {
  bajo: 'Bajo',
  moderado: 'Moderado',
  alto: 'Alto',
  critico: 'Crítico',
}

export function nivelRuido(dB: number): NivelRuido {
  if (dB < 55) return 'bajo'
  if (dB < 70) return 'moderado'
  if (dB < 80) return 'alto'
  return 'critico'
}

export function colorDB(dB: number): string {
  return COLORES_DB[nivelRuido(dB)]
}

export function colorDBRgb(dB: number): string {
  return RGB[nivelRuido(dB)]
}

export function etiquetaDB(dB: number): string {
  return ETIQUETAS[nivelRuido(dB)]
}

const RAMPA_STOPS: [number, string][] = [
  [45, '#10b981'],
  [62, '#eab308'],
  [76, '#f97316'],
  [92, '#ef4444'],
]

function hexARgb(hex: string): [number, number, number] {
  const valor = parseInt(hex.slice(1), 16)
  return [(valor >> 16) & 255, (valor >> 8) & 255, valor & 255]
}

function rgbAHex(r: number, g: number, b: number): string {
  const canal = (valor: number) => Math.round(Math.max(0, Math.min(255, valor))).toString(16).padStart(2, '0')
  return `#${canal(r)}${canal(g)}${canal(b)}`
}

export function colorRampaContinua(dB: number): string {
  const db = Math.max(40, Math.min(95, dB))
  const primer = RAMPA_STOPS[0]
  const ultimo = RAMPA_STOPS[RAMPA_STOPS.length - 1]

  if (db <= primer[0]) return primer[1]
  if (db >= ultimo[0]) return ultimo[1]

  for (let i = 0; i < RAMPA_STOPS.length - 1; i += 1) {
    const [dbA, colorA] = RAMPA_STOPS[i]
    const [dbB, colorB] = RAMPA_STOPS[i + 1]
    if (db >= dbA && db <= dbB) {
      const proporcion = (db - dbA) / (dbB - dbA)
      const a = hexARgb(colorA)
      const b = hexARgb(colorB)
      return rgbAHex(
        a[0] + (b[0] - a[0]) * proporcion,
        a[1] + (b[1] - a[1]) * proporcion,
        a[2] + (b[2] - a[2]) * proporcion,
      )
    }
  }

  return ultimo[1]
}
