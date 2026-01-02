'use client'

import { useState, useEffect } from 'react'
import { clockIn, clockOut } from '@/app/employee/actions'
import { calculateDistance, Coordinates } from '@/lib/geolocation'
import { cn } from '@/lib/utils'
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
          setError('Location access denied. Please enable location to clock in.')
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
        showToast('Clocked in successfully!', 'success')
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
        showToast('Clocked out successfully!', 'success')
      }
    } catch {
      showToast('An unexpected error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-xl">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">
            {currentEntry ? 'You are Clocked In' : 'Work Status'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {currentEntry 
              ? `Since ${new Date(currentEntry.clock_in).toLocaleTimeString()}`
              : 'Ready to start your shift?'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {coords ? (
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all",
            isWithinRange ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
          )}>
            <div className={cn("w-2 h-2 rounded-full", isWithinRange ? "bg-green-500 animate-pulse" : "bg-yellow-500")} />
            {isWithinRange ? 'Within Range (Ready)' : `Outside Range (${Math.round(distance || 0)}m away)`}
          </div>
        ) : !error && (
          <div className="text-xs text-gray-500 animate-pulse">Checking location...</div>
        )}

        <button
          onClick={currentEntry ? handleClockOut : handleClockIn}
          disabled={loading || (!currentEntry && !isWithinRange)}
          className={cn(
            "w-48 h-48 rounded-full border-8 transition-all flex flex-col items-center justify-center gap-2 relative group",
            currentEntry 
              ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500" 
              : "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-500",
            (!currentEntry && !isWithinRange) && "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          <div className={cn(
            "absolute inset-0 rounded-full blur-xl opacity-20 transition-all group-hover:opacity-40",
            currentEntry ? "bg-red-500" : "bg-blue-500"
          )} />
          <span className="text-lg font-bold tracking-wider uppercase">
            {loading ? 'Processing...' : currentEntry ? 'Clock Out' : 'Clock In'}
          </span>
          <span className="text-[10px] text-gray-500 font-medium">
            {currentEntry ? 'End Shift' : 'Start Shift'}
          </span>
        </button>
      </div>
    </div>
  )
}
