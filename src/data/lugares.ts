export type Categoria = 'shopping' | 'plaza' | 'parque' | 'hospital' | 'centro_educativo' | 'terminal'

export interface Lugar {
  id: number
  nombre: string
  categoria: Categoria
  coordenadas: [number, number]
  ruido: {
    promedioDb: number
    picoDb: number
    periodoCritico: string
    fuentes: string[]
    recomendacion: string
  }
}

const lugares: Lugar[] = [
  { id: 1, nombre: 'Montevideo Shopping', categoria: 'shopping', coordenadas: [-34.9028, -56.1361], ruido: { promedioDb: 73, picoDb: 84, periodoCritico: '18:00 a 21:00', fuentes: ['tránsito', 'estacionamiento', 'locales comerciales'], recomendacion: 'Evitar accesos principales en hora pico.' } },
  { id: 2, nombre: 'Punta Carretas Shopping', categoria: 'shopping', coordenadas: [-34.9224, -56.1589], ruido: { promedioDb: 72, picoDb: 82, periodoCritico: '17:30 a 21:30', fuentes: ['autos', 'motos', 'gastronomía'], recomendacion: 'Buscar calles laterales para una espera más tranquila.' } },
  { id: 3, nombre: 'Portones Shopping', categoria: 'shopping', coordenadas: [-34.8691, -56.0445], ruido: { promedioDb: 75, picoDb: 86, periodoCritico: '17:00 a 20:30', fuentes: ['avenidas', 'ómnibus', 'carga y descarga'], recomendacion: 'Los bordes residenciales bajan varios decibeles.' } },
  { id: 4, nombre: 'Tres Cruces Shopping', categoria: 'shopping', coordenadas: [-34.8940, -56.1415], ruido: { promedioDb: 81, picoDb: 90, periodoCritico: '07:30 a 09:30 y 17:00 a 20:00', fuentes: ['terminal', 'ómnibus', 'avenidas'], recomendacion: 'Usar auriculares o esperar dentro del edificio.' } },
  { id: 5, nombre: 'Plaza Independencia', categoria: 'plaza', coordenadas: [-34.9068, -56.1990], ruido: { promedioDb: 70, picoDb: 80, periodoCritico: '12:00 a 18:30', fuentes: ['tránsito', 'turismo', 'actos públicos'], recomendacion: 'El centro de la plaza es más estable que las veredas.' } },
  { id: 6, nombre: 'Plaza Matriz', categoria: 'plaza', coordenadas: [-34.9064, -56.2028], ruido: { promedioDb: 66, picoDb: 76, periodoCritico: '11:00 a 16:00', fuentes: ['peatones', 'bares', 'vehículos livianos'], recomendacion: 'Buena opción para pausas cortas fuera de hora pico.' } },
  { id: 7, nombre: 'Plaza Cagancha', categoria: 'plaza', coordenadas: [-34.9055, -56.1900], ruido: { promedioDb: 74, picoDb: 84, periodoCritico: '08:00 a 19:00', fuentes: ['18 de Julio', 'ómnibus', 'motos'], recomendacion: 'Mayor ruido sobre 18 de Julio.' } },
  { id: 8, nombre: 'Plaza Zabala', categoria: 'plaza', coordenadas: [-34.9080, -56.2070], ruido: { promedioDb: 60, picoDb: 70, periodoCritico: '12:00 a 15:00', fuentes: ['turismo', 'servicios', 'tránsito bajo'], recomendacion: 'Una de las plazas más tranquilas de Ciudad Vieja.' } },
  { id: 9, nombre: 'Parque Rodó', categoria: 'parque', coordenadas: [-34.9167, -56.1689], ruido: { promedioDb: 58, picoDb: 72, periodoCritico: 'sábados y domingos 16:00 a 20:00', fuentes: ['rambla', 'feria', 'recreación'], recomendacion: 'El interior arbolado es más silencioso.' } },
  { id: 10, nombre: 'Parque Batlle', categoria: 'parque', coordenadas: [-34.8936, -56.1519], ruido: { promedioDb: 62, picoDb: 82, periodoCritico: 'eventos deportivos', fuentes: ['estadios', 'avenidas', 'deporte'], recomendacion: 'Sin eventos suele ser zona moderada.' } },
  { id: 11, nombre: 'Parque del Prado', categoria: 'parque', coordenadas: [-34.8600, -56.2014], ruido: { promedioDb: 55, picoDb: 68, periodoCritico: 'fines de semana de tarde', fuentes: ['paseos', 'tránsito local'], recomendacion: 'Punto recomendado para descanso sonoro.' } },
  { id: 12, nombre: 'Parque Rivera', categoria: 'parque', coordenadas: [-34.8967, -56.0875], ruido: { promedioDb: 57, picoDb: 70, periodoCritico: '17:00 a 19:00', fuentes: ['avenidas cercanas', 'actividad deportiva'], recomendacion: 'Más tranquilo hacia el lago.' } },
  { id: 13, nombre: 'Hospital de Clínicas', categoria: 'hospital', coordenadas: [-34.8886, -56.1275], ruido: { promedioDb: 71, picoDb: 83, periodoCritico: '07:00 a 10:00', fuentes: ['ambulancias', 'Avenida Italia', 'ómnibus'], recomendacion: 'Mantener zonas de espera lejos de avenida.' } },
  { id: 14, nombre: 'Hospital Maciel', categoria: 'hospital', coordenadas: [-34.9072, -56.2092], ruido: { promedioDb: 68, picoDb: 78, periodoCritico: '09:00 a 14:00', fuentes: ['servicios', 'tránsito portuario', 'ambulancias'], recomendacion: 'Calles internas reducen la exposición.' } },
  { id: 15, nombre: 'Hospital Pereira Rossell', categoria: 'hospital', coordenadas: [-34.8981, -56.1636], ruido: { promedioDb: 73, picoDb: 85, periodoCritico: '07:30 a 12:00', fuentes: ['ambulancias', 'transporte público', 'accesos'], recomendacion: 'Mayor cuidado en accesos de emergencia.' } },
  { id: 16, nombre: 'Hospital Militar', categoria: 'hospital', coordenadas: [-34.8840, -56.1545], ruido: { promedioDb: 66, picoDb: 76, periodoCritico: '08:00 a 11:00', fuentes: ['autos', 'ómnibus', 'servicios'], recomendacion: 'Ruido moderado comparado con hospitales centrales.' } },
  { id: 17, nombre: 'Universidad de la República', categoria: 'centro_educativo', coordenadas: [-34.9047, -56.1839], ruido: { promedioDb: 72, picoDb: 82, periodoCritico: '08:00 a 20:00', fuentes: ['18 de Julio', 'estudiantes', 'ómnibus'], recomendacion: 'Aulas interiores suelen amortiguar mejor.' } },
  { id: 18, nombre: 'Universidad ORT Uruguay', categoria: 'centro_educativo', coordenadas: [-34.9126, -56.1568], ruido: { promedioDb: 67, picoDb: 78, periodoCritico: '18:00 a 21:00', fuentes: ['tránsito barrial', 'entrada y salida'], recomendacion: 'Evitar esperas sobre Bulevar Artigas.' } },
  { id: 19, nombre: 'Universidad Católica (UCU)', categoria: 'centro_educativo', coordenadas: [-34.8888, -56.1591], ruido: { promedioDb: 69, picoDb: 80, periodoCritico: '08:00 a 10:00', fuentes: ['Avenida Italia', 'autos', 'ómnibus'], recomendacion: 'Ingresos secundarios tienen menor presión sonora.' } },
  { id: 20, nombre: 'Instituto de Profesores (IPA)', categoria: 'centro_educativo', coordenadas: [-34.8935, -56.1890], ruido: { promedioDb: 71, picoDb: 81, periodoCritico: '17:00 a 20:00', fuentes: ['Centro', 'transporte público', 'peatones'], recomendacion: 'Ruido alto sostenido en días hábiles.' } },
  { id: 21, nombre: 'Terminal Tres Cruces', categoria: 'terminal', coordenadas: [-34.8945, -56.1402], ruido: { promedioDb: 83, picoDb: 92, periodoCritico: '06:30 a 09:30 y 17:00 a 21:00', fuentes: ['ómnibus', 'taxis', 'anuncios', 'avenidas'], recomendacion: 'Zona crítica de ruido urbano.' } },
  { id: 22, nombre: 'Puerto de Montevideo (Buquebus)', categoria: 'terminal', coordenadas: [-34.9029, -56.2136], ruido: { promedioDb: 76, picoDb: 88, periodoCritico: 'arribos y partidas', fuentes: ['barcos', 'camiones', 'taxis'], recomendacion: 'Picos asociados a operaciones portuarias.' } },
  { id: 23, nombre: 'Terminal Ciudad Vieja', categoria: 'terminal', coordenadas: [-34.9045, -56.2125], ruido: { promedioDb: 72, picoDb: 82, periodoCritico: '08:00 a 18:00', fuentes: ['ómnibus', 'peatones', 'turismo'], recomendacion: 'Ruido variable por actividad del casco histórico.' } },
]

export default lugares
