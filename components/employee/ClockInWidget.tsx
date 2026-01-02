'use client'

import { useState, useEffect } from 'react'
import { clockIn, clockOut } from '@/app/employee/actions'
import { calculateDistance, Coordinates } from '@/lib/geolocation'
import { useToast } from '@/components/ui/Toast'

type ClockInWidgetProps = {
  currentEntry: { id: string; clock_in: string } | null
  geofence: { lat: number; lng: number; radius: number }
}

export default function ClockInWidget({ currentEntry, geofence }: ClockInWidgetProps) {
  const [coords, setCoords] = useState<Coordinates | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }
          setCoords(newCoords)
          const d = calculateDistance(newCoords, {
            latitude: geofence.lat,
            longitude: geofence.lng,
          })
          setDistance(d)
        },
        () => {
          setError('Location access denied. Enable location to clock in.')
        },
        { enableHighAccuracy: true }
      )
      return () => navigator.geolocation.clearWatch(watchId)
    } else {
      setError('Geolocation not supported.')
    }
  }, [geofence.lat, geofence.lng])

  const isWithinRange = distance !== null && distance <= geofence.radius

  const handleClockIn = async () => {
    if (!coords) return
    setLoading(true)
    try {
      const res = await clockIn(coords.latitude, coords.longitude)
      if (res.error) {
        showToast(res.error, 'error')
      } else {
        showToast('Clocked in successfully', 'success')
      }
    } catch {
      showToast('An unexpected error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClockOut = async () => {
    if (!currentEntry) return
    setLoading(true)
    try {
      const res = await clockOut(currentEntry.id)
      if (res.error) {
        showToast(res.error, 'error')
      } else {
        showToast('Clocked out successfully', 'success')
      }
    } catch {
      showToast('An unexpected error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <div className="space-y-5">
        <div>
          <h2 className="font-medium text-white">
            {currentEntry ? 'Clocked In' : 'Ready to Work?'}
          </h2>
          <p className="text-sm text-[#666] mt-0.5">
            {currentEntry 
              ? `Since ${new Date(currentEntry.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Clock in to start your shift'}
          </p>
        </div>

        {error && (
          <div className="text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 px-3 py-2 rounded">
            {error}
          </div>
        )}

        {coords ? (
          <div className={`text-xs px-3 py-1.5 rounded inline-flex items-center gap-2 ${
            isWithinRange 
              ? 'bg-accent/10 text-accent border border-accent/20' 
              : 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isWithinRange ? 'bg-accent' : 'bg-[#f59e0b]'}`} />
            {isWithinRange ? 'Within range' : `${Math.round(distance || 0)}m away`}
          </div>
        ) : !error && (
          <div className="text-xs text-[#666]">Checking location...</div>
        )}

        <button
          onClick={currentEntry ? handleClockOut : handleClockIn}
          disabled={loading || (!currentEntry && !isWithinRange)}
          className={`w-full py-3 rounded font-medium transition-colors ${
            currentEntry 
              ? 'bg-[#ef4444] text-white hover:bg-[#dc2626]' 
              : 'btn-primary'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? 'Processing...' : currentEntry ? 'Clock Out' : 'Clock In'}
        </button>
      </div>
    </div>
  )
}
