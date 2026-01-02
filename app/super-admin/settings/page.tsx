'use client'

import { createClient } from '@/lib/supabase/client'
import { updateSettings } from './actions'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const [geoValue, setGeoValue] = useState({ lat: 43.8219, lng: -79.6200, radius: 100 })
  const [hourValue, setHourValue] = useState({ start: "07:00", end: "15:00", days: [1,2,3,4,5] })
  const supabase = createClient()

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
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-white">System Settings</h2>
        <p className="text-gray-500 mt-1">Configure geofencing and shift schedules.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Geofence Settings */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 pr-0.5">
              📍
            </div>
            <h3 className="text-lg font-semibold text-white">Geofence Configuration</h3>
          </div>

          <form action={async (formData) => {
            const value = {
              lat: parseFloat(formData.get('lat') as string),
              lng: parseFloat(formData.get('lng') as string),
              radius: parseInt(formData.get('radius') as string)
            }
            await updateSettings('geofence', value)
            alert('Geofence updated')
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Latitude</label>
                <input name="lat" type="number" step="any" defaultValue={geoValue.lat} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Longitude</label>
                <input name="lng" type="number" step="any" defaultValue={geoValue.lng} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Radius (meters)</label>
              <input name="radius" type="number" defaultValue={geoValue.radius} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] mt-2 text-sm">
              Update Geofence
            </button>
          </form>
        </section>

        {/* Shift Settings */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 pr-0.5">
              ⏰
            </div>
            <h3 className="text-lg font-semibold text-white">Work Hours</h3>
          </div>

          <form action={async (formData) => {
            const value = {
              start: formData.get('start'),
              end: formData.get('end'),
              days: hourValue.days // Keep current days for now
            }
            await updateSettings('work_hours', value)
            alert('Work hours updated')
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Shift Start</label>
                <input name="start" type="time" defaultValue={hourValue.start} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Shift End (Auto-Clockout)</label>
                <input name="end" type="time" defaultValue={hourValue.end} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
            </div>
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98] mt-2 text-sm">
              Update Shift Schedule
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
