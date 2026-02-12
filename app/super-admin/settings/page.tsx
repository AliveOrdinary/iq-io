'use client'

import { createClient } from '@/lib/supabase/client'
import { updateSettings } from './actions'
import { useEffect, useState, lazy, Suspense } from 'react'
import { useToast } from '@/components/ui/Toast'
import type { Geofence } from '@/components/super-admin/GeofenceMap'

// Lazy load GeofenceMap to avoid SSR issues with Leaflet
const GeofenceMap = lazy(() => import('@/components/super-admin/GeofenceMap'))

export default function SettingsPage() {
  const [geoValue, setGeoValue] = useState<Geofence>({ lat: 43.8219, lng: -79.6200, radius: 100 })
  const [clockInWindow, setClockInWindow] = useState({ start: "06:50", end: "13:00" })
  const [hourValue, setHourValue] = useState({ start: "07:00", end: "15:00", days: [1,2,3,4,5] })
  const supabase = createClient()
  const { showToast } = useToast()

  useEffect(() => {
    async function fetchData() {
      const { data: geofence } = await supabase.from('settings').select('value').eq('key', 'geofence').single()
      const { data: clockIn } = await supabase.from('settings').select('value').eq('key', 'clock_in_window').single()
      const { data: workHours } = await supabase.from('settings').select('value').eq('key', 'work_hours').single()
      
      if (geofence?.value) {
        const g = geofence.value as any
        // Normalize: handle legacy polygon or circle formats
        if (g.lat !== undefined && g.lng !== undefined) {
          setGeoValue({ lat: g.lat, lng: g.lng, radius: g.radius || 100 })
        } else if (g.type === 'circle' && g.center) {
          setGeoValue({ lat: g.center[1], lng: g.center[0], radius: g.radius || 100 })
        } else {
          // Polygon or unknown — reset to default, user will re-set
          setGeoValue({ lat: 43.8219, lng: -79.6200, radius: 100 })
        }
      }
      if (clockIn?.value) setClockInWindow(clockIn.value as any)
      if (workHours?.value) setHourValue(workHours.value as any)
    }
    fetchData()
  }, [])

  const handleGeofenceChange = (newGeofence: Geofence) => {
    setGeoValue(newGeofence)
  }

  const handleSaveGeofence = async () => {
    // Always save as simple { lat, lng, radius }
    await updateSettings('geofence', {
      lat: geoValue.lat,
      lng: geoValue.lng,
      radius: geoValue.radius,
    })
    showToast('Geofence updated', 'success')
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <p className="text-[#666] text-sm mt-0.5">Configure geofencing, clock-in window, and shift schedules</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Geofence Settings - Takes 2 columns */}
        <div className="card p-6 space-y-4 xl:col-span-2">
          <h3 className="font-medium text-white">Geofence Area</h3>
          <p className="text-sm text-[#666]">
            Click on the map to set the center, then adjust the radius. Use satellite view to see the building.
          </p>
          
          <Suspense fallback={
            <div className="h-[500px] w-full bg-[#111] rounded border border-[#333] flex items-center justify-center text-[#666]">
              Loading map...
            </div>
          }>
            <GeofenceMap value={geoValue} onChange={handleGeofenceChange} />
          </Suspense>

          <button 
            onClick={handleSaveGeofence}
            className="w-full btn btn-primary"
          >
            Save Geofence
          </button>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Clock-In Window */}
          <div className="card p-6 space-y-4">
            <h3 className="font-medium text-white">Clock-In Window</h3>
            <p className="text-sm text-[#666]">
              Employees can only clock in during this time window.
            </p>

            <form action={async (formData) => {
              const value = {
                start: formData.get('start'),
                end: formData.get('end'),
              }
              await updateSettings('clock_in_window', value)
              showToast('Clock-in window updated', 'success')
            }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#666] mb-1.5">Window Start</label>
                  <input name="start" type="time" defaultValue={clockInWindow.start} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs text-[#666] mb-1.5">Window End</label>
                  <input name="end" type="time" defaultValue={clockInWindow.end} className="w-full" />
                </div>
              </div>
              <button type="submit" className="w-full btn btn-primary">
                Update Clock-In Window
              </button>
            </form>
          </div>

          {/* Work Hours */}
          <div className="card p-6 space-y-4">
            <h3 className="font-medium text-white">Work Hours</h3>
            <p className="text-sm text-[#666]">
              Standard work hours for payroll calculations.
            </p>

            <form action={async (formData) => {
              const value = {
                start: formData.get('start'),
                end: formData.get('end'),
                days: hourValue.days
              }
              await updateSettings('work_hours', value)
              showToast('Work hours updated', 'success')
            }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#666] mb-1.5">Shift Start</label>
                  <input name="start" type="time" defaultValue={hourValue.start} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs text-[#666] mb-1.5">Shift End</label>
                  <input name="end" type="time" defaultValue={hourValue.end} className="w-full" />
                </div>
              </div>
              <button type="submit" className="w-full btn btn-secondary">
                Update Schedule
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
