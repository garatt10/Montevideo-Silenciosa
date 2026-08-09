import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { PuntoRuido } from '../data/ruido'
import { colorRampaContinua } from '../data/coloresRuido'

function colorRgba(hex: string, opacidad: number): string {
  const valor = parseInt(hex.slice(1), 16)
  const r = (valor >> 16) & 255
  const g = (valor >> 8) & 255
  const b = valor & 255
  return `rgba(${r}, ${g}, ${b}, ${opacidad})`
}

function intensidadPorDecibeles(db: number): number {
  return Math.max(0.2, Math.min(0.78, (db - 55) / 40))
}

type MapaCalorRuidoProps = {
  puntos: PuntoRuido[]
}

function MapaCalorRuido({ puntos }: MapaCalorRuidoProps) {
  const map = useMap()

  useEffect(() => {
    const canvas = L.DomUtil.create('canvas', 'mapa-calor-canvas')
    const pane = map.getPanes().overlayPane
    const context = canvas.getContext('2d')
    let frameId: number | null = null

    pane.insertBefore(canvas, pane.firstChild)

    function redibujar() {
      frameId = null
      if (!context) return

      const dpr = window.devicePixelRatio || 1
      const size = map.getSize()
      const topLeft = map.containerPointToLayerPoint([0, 0])
      const zoom = map.getZoom()
      const radio = Math.max(42, Math.min(92, 30 + (zoom - 11) * 14))

      canvas.width = size.x * dpr
      canvas.height = size.y * dpr
      canvas.style.width = `${size.x}px`
      canvas.style.height = `${size.y}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      L.DomUtil.setPosition(canvas, topLeft)
      context.clearRect(0, 0, size.x, size.y)

      puntos.forEach((punto) => {
        const layerPoint = map.latLngToLayerPoint(punto.coordenadas)
        const canvasPoint = layerPoint.subtract(topLeft)
        const color = colorRampaContinua(punto.decibeles)
        const intensidad = intensidadPorDecibeles(punto.decibeles)
        const gradient = context.createRadialGradient(
          canvasPoint.x,
          canvasPoint.y,
          0,
          canvasPoint.x,
          canvasPoint.y,
          radio,
        )

        gradient.addColorStop(0, colorRgba(color, intensidad))
        gradient.addColorStop(0.28, colorRgba(color, intensidad * 0.62))
        gradient.addColorStop(0.55, colorRgba(color, intensidad * 0.28))
        gradient.addColorStop(0.8, colorRgba(color, intensidad * 0.1))
        gradient.addColorStop(1, colorRgba(color, 0))

        context.fillStyle = gradient
        context.beginPath()
        context.arc(canvasPoint.x, canvasPoint.y, radio, 0, Math.PI * 2)
        context.fill()
      })
    }

    function pedirRedibujo() {
      if (frameId !== null) return
      frameId = window.requestAnimationFrame(redibujar)
    }

    redibujar()
    map.on('moveend zoomend resize', pedirRedibujo)

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId)
      map.off('moveend zoomend resize', pedirRedibujo)
      canvas.remove()
    }
  }, [map, puntos])

  return null
}

export default MapaCalorRuido
