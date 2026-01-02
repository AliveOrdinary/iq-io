'use client'

import { createClient } from '@/lib/supabase/client'
import { updateSettings } from './actions'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'

export default function SettingsPage() {
  const [geoValue, setGeoValue] = useState({ lat: 43.8219, lng: -79.6200, radius: 100 })
  const [hourValue, setHourValue] = useState({ start: "07:00", end: "15:00", days: [1,2,3,4,5] })
  const supabase = createClient()
  const { showToast } = useToast()

  useEffect(() => {
    async function fetchData() {
      const { data: geofence } = await supabase.from('settings').select('value').eq('key', 'geofence').single()
      const { data: workHours } = await supabase.from('settings').select('value').eq('key', 'work_hours').single()
      
      if (geofence?.value) setGeoValue(geofence.value as any)
      if (workHours?.value) setHourValue(workHours.value as any)
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <p className="text-[#666] text-sm mt-0.5">Configure geofencing and shift schedules</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Geofence Settings */}
        <div className="card p-6 space-y-4">
          <h3 className="font-medium text-white">Geofence</h3>

          <form action={async (formData) => {
            const value = {
              lat: parseFloat(formData.get('lat') as string),
              lng: parseFloat(formData.get('lng') as string),
              radius: parseInt(formData.get('radius') as string)
            }
            await updateSettings('geofence', value)
            showToast('Geofence updated', 'success')
          }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#666] mb-1.5">Latitude</label>
                <input name="lat" type="number" step="any" defaultValue={geoValue.lat} className="w-full" />
              </div>
              <div>
                <label className="block text-xs text-[#666] mb-1.5">Longitude</label>
                <input name="lng" type="number" step="any" defaultValue={geoValue.lng} className="w-full" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#666] mb-1.5">Radius (meters)</label>
              <input name="radius" type="number" defaultValue={geoValue.radius} className="w-full" />
            </div>
            <button type="submit" className="w-full btn btn-primary">
              Update Geofence
            </button>
          </form>
        </div>

        {/* Shift Settings */}
        <div className="card p-6 space-y-4">
          <h3 className="font-medium text-white">Work Hours</h3>

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
  )
}
