export const STORAGE_KEYS = {
  modo: 'modo',
} as const

export function leer<T>(clave: string, fallback: T): T {
  try {
    const crudo = localStorage.getItem(clave)
    return crudo === null ? fallback : (JSON.parse(crudo) as T)
  } catch {
    return fallback
  }
}

export function guardar(clave: string, valor: unknown): void {
  localStorage.setItem(clave, JSON.stringify(valor))
}
