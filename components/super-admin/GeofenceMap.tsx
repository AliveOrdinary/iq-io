'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

type GeofenceType = 'circle' | 'polygon'

export type CircleGeofence = {
  type: 'circle'
  center: [number, number] // [lng, lat]
  radius: number
}

export type PolygonGeofence = {
  type: 'polygon'
  coordinates: [number, number][] // [lng, lat] pairs
}

export type LegacyGeofence = { lat: number; lng: number; radius: number }

export type Geofence = CircleGeofence | PolygonGeofence | LegacyGeofence

type GeofenceMapProps = {
  value: Geofence
  onChange: (geofence: Geofence) => void
}

export default function GeofenceMap({ value, onChange }: GeofenceMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<L.Circle | L.Polygon | null>(null)
  const [geofenceType, setGeofenceType] = useState<GeofenceType>('circle')
  const [isDrawing, setIsDrawing] = useState(false)
  const [tempPoints, setTempPoints] = useState<[number, number][]>([])

  // Get center from value
  const getCenter = (): [number, number] => {
    if ('lat' in value) {
      return [value.lat, value.lng]
    }
    if (value.type === 'circle') {
      return [value.center[1], value.center[0]]
    }
    if (value.type === 'polygon' && value.coordinates.length > 0) {
      const lats = value.coordinates.map(c => c[1])
      const lngs = value.coordinates.map(c => c[0])
      return [
        lats.reduce((a, b) => a + b, 0) / lats.length,
        lngs.reduce((a, b) => a + b, 0) / lngs.length
      ]
    }
    return [43.8219, -79.6200] // Default center
  }

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current).setView(getCenter(), 17)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    // Draw initial geofence
    drawGeofence(value)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  const drawGeofence = (geo: Geofence) => {
    if (!mapRef.current) return
    
    // Remove existing layer
    if (layerRef.current) {
      mapRef.current.removeLayer(layerRef.current)
    }

    if ('lat' in geo || (geo.type === 'circle')) {
      const lat = 'lat' in geo ? geo.lat : geo.center[1]
      const lng = 'lat' in geo ? geo.lng : geo.center[0]
      const radius = geo.radius
      
      const circle = L.circle([lat, lng], {
        radius,
        color: '#22c55e',
        fillColor: '#22c55e',
        fillOpacity: 0.2,
      }).addTo(mapRef.current)
      
      layerRef.current = circle
      setGeofenceType('circle')
    } else if (geo.type === 'polygon') {
      const latLngs = geo.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
      
      const polygon = L.polygon(latLngs, {
        color: '#22c55e',
        fillColor: '#22c55e',
        fillOpacity: 0.2,
      }).addTo(mapRef.current)
      
      layerRef.current = polygon
      setGeofenceType('polygon')
    }
  }

  const handleCircleMode = () => {
    setGeofenceType('circle')
    setIsDrawing(false)
    setTempPoints([])
    
    // Convert to circle at current center
    const center = mapRef.current?.getCenter()
    if (center) {
      const newGeofence: CircleGeofence = {
        type: 'circle',
        center: [center.lng, center.lat],
        radius: 100
      }
      onChange(newGeofence)
      drawGeofence(newGeofence)
    }
  }

  const handlePolygonMode = () => {
    setGeofenceType('polygon')
    setIsDrawing(true)
    setTempPoints([])
    
    // Remove existing layer
    if (layerRef.current && mapRef.current) {
      mapRef.current.removeLayer(layerRef.current)
      layerRef.current = null
    }
  }

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!isDrawing || geofenceType !== 'polygon') return
    
    const newPoints = [...tempPoints, [e.latlng.lng, e.latlng.lat] as [number, number]]
    setTempPoints(newPoints)
    
    // Draw temporary polygon
    if (mapRef.current) {
      if (layerRef.current) {
        mapRef.current.removeLayer(layerRef.current)
      }
      
      const latLngs = newPoints.map(([lng, lat]) => [lat, lng] as [number, number])
      const polygon = L.polygon(latLngs, {
        color: '#22c55e',
        fillColor: '#22c55e',
        fillOpacity: 0.2,
        dashArray: '5, 5'
      }).addTo(mapRef.current)
      
      layerRef.current = polygon
    }
  }

  const handleFinishDrawing = () => {
    if (tempPoints.length < 3) {
      alert('Please draw at least 3 points for a polygon')
      return
    }
    
    setIsDrawing(false)
    const newGeofence: PolygonGeofence = {
      type: 'polygon',
      coordinates: tempPoints
    }
    onChange(newGeofence)
    drawGeofence(newGeofence)
    setTempPoints([])
  }

  const handleCancelDrawing = () => {
    setIsDrawing(false)
    setTempPoints([])
    drawGeofence(value)
  }

  const handleRadiusChange = (newRadius: number) => {
    if ('lat' in value) {
      const updated = { ...value, radius: newRadius }
      onChange(updated)
      drawGeofence(updated)
    } else if (value.type === 'circle') {
      const updated: CircleGeofence = { ...value, radius: newRadius }
      onChange(updated)
      drawGeofence(updated)
    }
  }

  useEffect(() => {
    if (!mapRef.current) return
    
    mapRef.current.on('click', handleMapClick)
    return () => {
      mapRef.current?.off('click', handleMapClick)
    }
  }, [isDrawing, geofenceType, tempPoints])

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCircleMode}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            geofenceType === 'circle' 
              ? 'bg-accent text-black' 
              : 'bg-[#222] text-[#999] hover:bg-[#333]'
          }`}
        >
          Circle
        </button>
        <button
          type="button"
          onClick={handlePolygonMode}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            geofenceType === 'polygon' 
              ? 'bg-accent text-black' 
              : 'bg-[#222] text-[#999] hover:bg-[#333]'
          }`}
        >
          Draw Polygon
        </button>
      </div>

      {/* Drawing Instructions */}
      {isDrawing && (
        <div className="bg-[#222] border border-[#333] rounded p-3 text-sm">
          <p className="text-[#999]">Click on the map to draw polygon points. Click at least 3 points.</p>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={handleFinishDrawing}
              className="px-3 py-1 text-xs bg-accent text-black rounded"
            >
              Finish ({tempPoints.length} points)
            </button>
            <button
              type="button"
              onClick={handleCancelDrawing}
              className="px-3 py-1 text-xs bg-[#333] text-[#999] rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="h-64 w-full rounded border border-[#333]"
      />

      {/* Radius Control (for circle mode) */}
      {geofenceType === 'circle' && !isDrawing && (
        <div>
          <label className="block text-xs text-[#666] mb-1.5">Radius (meters)</label>
          <input
            type="number"
            value={'radius' in value ? value.radius : 100}
            onChange={(e) => handleRadiusChange(parseInt(e.target.value) || 100)}
            className="w-full"
            min={10}
            max={1000}
          />
        </div>
      )}
    </div>
  )
}
