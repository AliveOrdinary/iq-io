'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'
import type L from 'leaflet'

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
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.Circle | L.Polygon | null>(null)
  const leafletRef = useRef<typeof L | null>(null)
  const tempMarkersRef = useRef<L.CircleMarker[]>([])
  const [geofenceType, setGeofenceType] = useState<GeofenceType>('circle')
  const [isDrawing, setIsDrawing] = useState(false)
  const [tempPoints, setTempPoints] = useState<[number, number][]>([])
  const [isMapReady, setIsMapReady] = useState(false)

  // Get center from value
  const getCenter = useCallback((): [number, number] => {
    if ('lat' in value) {
      return [value.lat, value.lng]
    }
    if (value.type === 'circle') {
      return [value.center[1], value.center[0]]
    }
    if (value.type === 'polygon' && value.coordinates.length > 0) {
      const avgLng = value.coordinates.reduce((sum, c) => sum + c[0], 0) / value.coordinates.length
      const avgLat = value.coordinates.reduce((sum, c) => sum + c[1], 0) / value.coordinates.length
      return [avgLat, avgLng]
    }
    return [43.7, -79.4] // Default to Toronto
  }, [value])

  // Initialize map on mount
  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current || !mapContainerRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      
      leafletRef.current = L
      
      // Fix for default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const center = getCenter()
      
      const map = L.map(mapContainerRef.current!, {
        center,
        zoom: 17,
        scrollWheelZoom: true,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map)

      mapRef.current = map
      setIsMapReady(true)
      
      // Draw initial geofence
      drawGeofence(value, L)
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  const drawGeofence = (geofence: Geofence, L: any) => {
    if (!mapRef.current) return
    
    // Remove existing layer
    if (layerRef.current) {
      mapRef.current.removeLayer(layerRef.current)
    }

    if ('lat' in geofence) {
      const circle = L.circle([geofence.lat, geofence.lng], {
        radius: geofence.radius,
        color: '#00ff88',
        fillColor: '#00ff88',
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(mapRef.current)
      layerRef.current = circle
      setGeofenceType('circle')
    } else if (geofence.type === 'circle') {
      const circle = L.circle([geofence.center[1], geofence.center[0]], {
        radius: geofence.radius,
        color: '#00ff88',
        fillColor: '#00ff88',
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(mapRef.current)
      layerRef.current = circle
      setGeofenceType('circle')
    } else if (geofence.type === 'polygon') {
      const latLngs = geofence.coordinates.map(c => [c[1], c[0]] as [number, number])
      const polygon = L.polygon(latLngs, {
        color: '#00ff88',
        fillColor: '#00ff88',
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(mapRef.current)
      layerRef.current = polygon
      setGeofenceType('polygon')
    }
  }

  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (!isDrawing || geofenceType !== 'polygon' || !leafletRef.current || !mapRef.current) return
    
    const newPoint: [number, number] = [e.latlng.lng, e.latlng.lat]
    setTempPoints(prev => [...prev, newPoint])
    
    // Draw temporary marker
    const marker = leafletRef.current.circleMarker(e.latlng, {
      radius: 6,
      color: '#00ff88',
      fillColor: '#00ff88',
      fillOpacity: 1,
      weight: 2,
    }).addTo(mapRef.current)
    tempMarkersRef.current.push(marker)
  }, [isDrawing, geofenceType])

  const clearTempMarkers = () => {
    if (mapRef.current) {
      tempMarkersRef.current.forEach(marker => {
        mapRef.current?.removeLayer(marker)
      })
    }
    tempMarkersRef.current = []
  }

  const handleCircleMode = () => {
    setIsDrawing(false)
    setTempPoints([])
    clearTempMarkers()
    setGeofenceType('circle')
    
    const center = getCenter()
    const newValue: CircleGeofence = {
      type: 'circle',
      center: [center[1], center[0]],
      radius: 'radius' in value ? value.radius : 100,
    }
    onChange(newValue)
    if (leafletRef.current && mapRef.current) {
      drawGeofence(newValue, leafletRef.current)
    }
  }

  const handlePolygonMode = () => {
    setGeofenceType('polygon')
    setIsDrawing(true)
    setTempPoints([])
    clearTempMarkers()
    
    if (layerRef.current && mapRef.current) {
      mapRef.current.removeLayer(layerRef.current)
      layerRef.current = null
    }
  }

  const handleFinishDrawing = () => {
    if (tempPoints.length < 3) {
      alert('Please draw at least 3 points')
      return
    }
    
    const newValue: PolygonGeofence = {
      type: 'polygon',
      coordinates: tempPoints,
    }
    onChange(newValue)
    clearTempMarkers()
    if (leafletRef.current) {
      drawGeofence(newValue, leafletRef.current)
    }
    setIsDrawing(false)
    setTempPoints([])
  }

  const handleCancelDrawing = () => {
    setIsDrawing(false)
    setTempPoints([])
    clearTempMarkers()
    if (leafletRef.current) {
      drawGeofence(value, leafletRef.current)
    }
  }

  const handleRadiusChange = (newRadius: number) => {
    if ('lat' in value) {
      const updated: CircleGeofence = {
        type: 'circle',
        center: [value.lng, value.lat],
        radius: newRadius,
      }
      onChange(updated)
      if (leafletRef.current) {
        drawGeofence(updated, leafletRef.current)
      }
    } else if (value.type === 'circle') {
      const updated: CircleGeofence = { ...value, radius: newRadius }
      onChange(updated)
      if (leafletRef.current) {
        drawGeofence(updated, leafletRef.current)
      }
    }
  }

  useEffect(() => {
    if (!mapRef.current || !isMapReady) return
    
    mapRef.current.on('click', handleMapClick)
    return () => {
      mapRef.current?.off('click', handleMapClick)
    }
  }, [isMapReady, handleMapClick])

  const handleLocateMe = () => {
    if (!mapRef.current || !leafletRef.current) return
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          mapRef.current?.setView([latitude, longitude], 18)
          
          leafletRef.current!.marker([latitude, longitude])
            .addTo(mapRef.current!)
            .bindPopup('Your location')
            .openPopup()
        },
        () => {
          alert('Could not get your location. Please enable location services.')
        },
        { enableHighAccuracy: true }
      )
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCircleMode}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              geofenceType === 'circle' && !isDrawing
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
              geofenceType === 'polygon' || isDrawing
                ? 'bg-accent text-black' 
                : 'bg-[#222] text-[#999] hover:bg-[#333]'
            }`}
          >
            Draw Polygon
          </button>
        </div>
        
        {/* Map Controls */}
        <button
          type="button"
          onClick={handleLocateMe}
          className="px-3 py-1.5 text-sm rounded bg-[#222] text-[#999] hover:bg-[#333] transition-colors flex items-center gap-1.5"
          title="Find my location"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Locate Me
        </button>
      </div>

      {/* Drawing Instructions */}
      {isDrawing && (
        <div className="bg-[#222] border border-[#333] rounded p-3 text-sm">
          <p className="text-[#999]">Click on the map to draw polygon points. Click at least 3 points to define the geofence area.</p>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={handleFinishDrawing}
              disabled={tempPoints.length < 3}
              className="px-3 py-1 text-xs bg-accent text-black rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Finish Drawing ({tempPoints.length} points)
            </button>
            <button
              type="button"
              onClick={handleCancelDrawing}
              className="px-3 py-1 text-xs bg-[#333] text-[#999] rounded hover:bg-[#444]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Map Container - Large height for easier polygon drawing */}
      <div 
        ref={mapContainerRef} 
        className="h-[500px] w-full rounded border border-[#333]"
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
