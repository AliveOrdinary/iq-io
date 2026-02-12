'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'

export type Geofence = {
  lat: number
  lng: number
  radius: number
}

type GeofenceMapProps = {
  value: Geofence
  onChange: (geofence: Geofence) => void
}

export default function GeofenceMap({ value, onChange }: GeofenceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const circleRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)
  const [mapLayer, setMapLayer] = useState<'satellite' | 'street'>('satellite')

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current || !mapContainerRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      leafletRef.current = L

      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapContainerRef.current!, {
        center: [value.lat, value.lng],
        zoom: 17,
        scrollWheelZoom: true,
      })

      // ESRI Satellite tiles (free, no API key)
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri',
          maxZoom: 19,
        }
      )

      // OpenStreetMap street tiles
      const streetLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }
      )

      // Start with satellite
      satelliteLayer.addTo(map)

      // Store layer references for toggling
      ;(map as any)._satelliteLayer = satelliteLayer
      ;(map as any)._streetLayer = streetLayer
      ;(map as any)._currentLayer = 'satellite'

      mapRef.current = map

      // Draw initial circle and marker
      drawGeofence(value, L, map)

      // Click to reposition center
      map.on('click', (e: any) => {
        const newValue = { lat: e.latlng.lat, lng: e.latlng.lng, radius: value.radius }
        onChange(newValue)
        drawGeofence(newValue, L, map)
      })
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update circle when value changes externally (e.g. radius slider)
  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return
    drawGeofence(value, leafletRef.current, mapRef.current)
  }, [value.lat, value.lng, value.radius])

  const drawGeofence = (geofence: Geofence, L: any, map: any) => {
    // Remove existing
    if (circleRef.current) map.removeLayer(circleRef.current)
    if (markerRef.current) map.removeLayer(markerRef.current)

    // Draw circle
    circleRef.current = L.circle([geofence.lat, geofence.lng], {
      radius: geofence.radius,
      color: '#00ff88',
      fillColor: '#00ff88',
      fillOpacity: 0.15,
      weight: 2,
    }).addTo(map)

    // Draw center marker
    markerRef.current = L.circleMarker([geofence.lat, geofence.lng], {
      radius: 6,
      color: '#fff',
      fillColor: '#00ff88',
      fillOpacity: 1,
      weight: 2,
    }).addTo(map)
  }

  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const newValue = { lat: latitude, lng: longitude, radius: value.radius }
        onChange(newValue)
        mapRef.current?.setView([latitude, longitude], 17)
      },
      () => alert('Could not get your location'),
      { enableHighAccuracy: true }
    )
  }

  const toggleLayer = () => {
    if (!mapRef.current) return
    const map = mapRef.current
    const current = (map as any)._currentLayer

    if (current === 'satellite') {
      map.removeLayer((map as any)._satelliteLayer)
      ;(map as any)._streetLayer.addTo(map)
      ;(map as any)._currentLayer = 'street'
      setMapLayer('street')
    } else {
      map.removeLayer((map as any)._streetLayer)
      ;(map as any)._satelliteLayer.addTo(map)
      ;(map as any)._currentLayer = 'satellite'
      setMapLayer('satellite')
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-[#666]">Click on the map to set the geofence center</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleLayer}
            className="px-3 py-1.5 text-sm rounded bg-[#222] text-[#999] hover:bg-[#333] transition-colors"
          >
            {mapLayer === 'satellite' ? '🗺️ Street' : '🛰️ Satellite'}
          </button>
          <button
            type="button"
            onClick={handleLocateMe}
            className="px-3 py-1.5 text-sm rounded bg-[#222] text-[#999] hover:bg-[#333] transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Locate Me
          </button>
        </div>
      </div>

      {/* Map */}
      <div
        ref={mapContainerRef}
        className="h-[500px] w-full rounded border border-[#333]"
      />

      {/* Radius Slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-[#666]">Radius</label>
          <span className="text-xs text-[#999] font-mono">{value.radius}m</span>
        </div>
        <input
          type="range"
          min={25}
          max={500}
          step={5}
          value={value.radius}
          onChange={(e) => onChange({ ...value, radius: parseInt(e.target.value) })}
          className="w-full accent-[#00ff88] h-2 bg-[#222] rounded-lg cursor-pointer"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[#444]">25m</span>
          <span className="text-[10px] text-[#444]">500m</span>
        </div>
      </div>
    </div>
  )
}
