import {
  addDoc,
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { PeriodoRuido } from '../data/contextoRuido'
import type { TipoRuido } from '../data/ruido'

export type MedicionGuardada = {
  id: string
  decibeles: number
  fecha: string
  fuente?: TipoRuido
  zona?: string
  nota?: string
  lat?: number
  lng?: number
  simulada?: boolean
  userId?: string
}

export type ReporteGuardado = {
  id: string
  descripcion: string
  fecha: string
  fuente?: TipoRuido
  periodo?: PeriodoRuido
  zona?: string
  intensidad?: string
  recurrente?: boolean
  fotoUrl?: string
  lat?: number
  lng?: number
  userId?: string
}

export type TemaNoticia = 'montevideo' | 'investigacion' | 'prototipo'

export type NoticiaGuardada = {
  id: number
  titulo: string
  extracto: string
  categoria: string
  fecha: string
  color: string
  url?: string
  medio?: string
  ejemplo?: boolean
  tema: TemaNoticia
}

const COLECCIONES = {
  perfiles: 'perfiles',
  mediciones: 'mediciones',
  reportes: 'reportes',
  noticias: 'noticias',
} as const

const LIMITE_LISTADOS = 500

function texto(valor: unknown, fallback = ''): string {
  return typeof valor === 'string' ? valor : fallback
}

function convertirFecha(valor: unknown): string {
  try {
    if (valor instanceof Date) return valor.toISOString()
    if (typeof valor === 'string') return new Date(valor).toISOString()
    if (valor && typeof valor === 'object' && 'toDate' in valor) {
      return (valor as Timestamp).toDate().toISOString()
    }
    return new Date(Number(valor ?? Date.now())).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function medicionDesdeDoc(documento: QueryDocumentSnapshot): MedicionGuardada {
  const datos = documento.data()
  return {
    id: documento.id,
    decibeles: Number(datos.decibeles),
    fecha: convertirFecha(datos.fecha),
    fuente: typeof datos.fuente === 'string' ? datos.fuente as TipoRuido : undefined,
    zona: texto(datos.zona) || undefined,
    nota: texto(datos.nota) || undefined,
    lat: typeof datos.lat === 'number' ? datos.lat : undefined,
    lng: typeof datos.lng === 'number' ? datos.lng : undefined,
    simulada: Boolean(datos.simulada),
    userId: texto(datos.userId) || undefined,
  }
}

function reporteDesdeDoc(documento: QueryDocumentSnapshot): ReporteGuardado {
  const datos = documento.data()
  return {
    id: documento.id,
    descripcion: texto(datos.descripcion, 'Sin descripción'),
    fecha: convertirFecha(datos.fecha),
    fuente: typeof datos.fuente === 'string' ? datos.fuente as TipoRuido : undefined,
    periodo: typeof datos.periodo === 'string' ? datos.periodo as PeriodoRuido : undefined,
    zona: texto(datos.zona) || undefined,
    intensidad: texto(datos.intensidad) || undefined,
    recurrente: Boolean(datos.recurrente),
    fotoUrl: texto(datos.fotoUrl) || undefined,
    lat: typeof datos.lat === 'number' ? datos.lat : undefined,
    lng: typeof datos.lng === 'number' ? datos.lng : undefined,
    userId: texto(datos.userId) || undefined,
  }
}

export async function obtenerMediciones(): Promise<MedicionGuardada[]> {
  const coleccion = query(
    collection(db, COLECCIONES.mediciones),
    orderBy('fecha', 'desc'),
    limit(LIMITE_LISTADOS),
  )
  const snapshot = await getDocs(coleccion)
  return snapshot.docs.map(medicionDesdeDoc)
}

export async function guardarMedicion(
  medicion: Omit<MedicionGuardada, 'id'>,
): Promise<void> {
  await addDoc(collection(db, COLECCIONES.mediciones), {
    ...medicion,
    fecha: medicion.fecha ? new Date(medicion.fecha) : serverTimestamp(),
  })
}

export function suscribirMediciones(
  alCambiar: (mediciones: MedicionGuardada[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const coleccion = query(
    collection(db, COLECCIONES.mediciones),
    orderBy('fecha', 'desc'),
    limit(LIMITE_LISTADOS),
  )
  return onSnapshot(
    coleccion,
    (snapshot) => {
      alCambiar(snapshot.docs.map(medicionDesdeDoc))
    },
    (error) => {
      onError?.(error)
    },
  )
}

export async function obtenerReportes(): Promise<ReporteGuardado[]> {
  const coleccion = query(
    collection(db, COLECCIONES.reportes),
    orderBy('fecha', 'desc'),
    limit(LIMITE_LISTADOS),
  )
  const snapshot = await getDocs(coleccion)
  return snapshot.docs.map(reporteDesdeDoc)
}

export function suscribirReportes(
  alCambiar: (reportes: ReporteGuardado[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const coleccion = query(
    collection(db, COLECCIONES.reportes),
    orderBy('fecha', 'desc'),
    limit(LIMITE_LISTADOS),
  )
  return onSnapshot(
    coleccion,
    (snapshot) => {
      alCambiar(snapshot.docs.map(reporteDesdeDoc))
    },
    (error) => {
      onError?.(error)
    },
  )
}

export async function guardarReporte(
  reporte: Omit<ReporteGuardado, 'id'>,
): Promise<void> {
  await addDoc(collection(db, COLECCIONES.reportes), {
    ...reporte,
    fecha: reporte.fecha ? new Date(reporte.fecha) : serverTimestamp(),
  })
}

export async function obtenerNoticias(): Promise<NoticiaGuardada[]> {
  const snapshot = await getDocs(collection(db, COLECCIONES.noticias))
  return snapshot.docs.map((documento) => {
    const datos = documento.data()
    return {
      id: Number(datos.id),
      titulo: texto(datos.titulo, 'Sin título'),
      extracto: texto(datos.extracto),
      categoria: texto(datos.categoria, 'Actualidad'),
      fecha: texto(datos.fecha),
      color: texto(datos.color, '#3b63e0'),
      url: texto(datos.url) || undefined,
      medio: texto(datos.medio) || undefined,
      ejemplo: Boolean(datos.ejemplo),
      tema: (datos.tema as TemaNoticia) ?? 'montevideo',
    }
  })
}
