import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
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
}

const COLECCIONES = {
  perfiles: 'perfiles',
  mediciones: 'mediciones',
  reportes: 'reportes',
  noticias: 'noticias',
} as const

function convertirFecha(valor: unknown): string {
  if (valor instanceof Date) return valor.toISOString()
  if (valor && typeof valor === 'object' && 'toDate' in valor) {
    return (valor as Timestamp).toDate().toISOString()
  }
  return new Date(Number(valor ?? Date.now())).toISOString()
}

function medicionDesdeDoc(documento: QueryDocumentSnapshot): MedicionGuardada {
  const datos = documento.data()
  return {
    id: documento.id,
    decibeles: Number(datos.decibeles),
    fecha: convertirFecha(datos.fecha),
    fuente: datos.fuente,
    zona: datos.zona,
    nota: datos.nota,
    lat: typeof datos.lat === 'number' ? datos.lat : undefined,
    lng: typeof datos.lng === 'number' ? datos.lng : undefined,
    simulada: Boolean(datos.simulada),
    userId: datos.userId ?? undefined,
  }
}

function reporteDesdeDoc(documento: QueryDocumentSnapshot): ReporteGuardado {
  const datos = documento.data()
  return {
    id: documento.id,
    descripcion: datos.descripcion,
    fecha: convertirFecha(datos.fecha),
    fuente: datos.fuente,
    periodo: datos.periodo,
    zona: datos.zona,
    intensidad: datos.intensidad,
    recurrente: Boolean(datos.recurrente),
    fotoUrl: datos.fotoUrl ?? undefined,
    lat: typeof datos.lat === 'number' ? datos.lat : undefined,
    lng: typeof datos.lng === 'number' ? datos.lng : undefined,
    userId: datos.userId ?? undefined,
  }
}

export async function obtenerMediciones(): Promise<MedicionGuardada[]> {
  const coleccion = query(collection(db, COLECCIONES.mediciones), orderBy('fecha', 'desc'))
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

export function suscribirMediciones(alCambiar: (mediciones: MedicionGuardada[]) => void): () => void {
  const coleccion = query(collection(db, COLECCIONES.mediciones), orderBy('fecha', 'desc'))
  return onSnapshot(coleccion, (snapshot) => {
    alCambiar(snapshot.docs.map(medicionDesdeDoc))
  })
}

export async function obtenerReportes(): Promise<ReporteGuardado[]> {
  const coleccion = query(collection(db, COLECCIONES.reportes), orderBy('fecha', 'desc'))
  const snapshot = await getDocs(coleccion)
  return snapshot.docs.map(reporteDesdeDoc)
}

export function suscribirReportes(alCambiar: (reportes: ReporteGuardado[]) => void): () => void {
  const coleccion = query(collection(db, COLECCIONES.reportes), orderBy('fecha', 'desc'))
  return onSnapshot(coleccion, (snapshot) => {
    alCambiar(snapshot.docs.map(reporteDesdeDoc))
  })
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
      titulo: datos.titulo,
      extracto: datos.extracto,
      categoria: datos.categoria,
      fecha: datos.fecha,
      color: datos.color,
      url: datos.url ?? undefined,
      medio: datos.medio ?? undefined,
      ejemplo: Boolean(datos.ejemplo),
    }
  })
}

export async function sembrarNoticiasSiVacio(noticias: NoticiaGuardada[]): Promise<void> {
  const snapshot = await getDocs(collection(db, COLECCIONES.noticias))
  if (!snapshot.empty) return
  await Promise.all(
    noticias.map((noticia) =>
      setDoc(doc(db, COLECCIONES.noticias, String(noticia.id)), noticia),
    ),
  )
}
