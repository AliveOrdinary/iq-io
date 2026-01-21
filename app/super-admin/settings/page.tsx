'use client'

import { createClient } from '@/lib/supabase/client'
import { updateSettings } from './actions'
import { useEffect, useState, lazy, Suspense } from 'react'
import { useToast } from '@/components/ui/Toast'
import type { Geofence } from '@/components/super-admin/GeofenceMap'

// Lazy load GeofenceMap to avoid SSR issues with Leaflet
const GeofenceMap = lazy(() => import('@/components/super-admin/GeofenceMap'))

type PayrollSchedule = {
  anchor_date: string
  enabled: boolean
}

type AdminRecipient = {
  email: string
  name: string | null
}

export default function SettingsPage() {
  const [geoValue, setGeoValue] = useState<Geofence>({ lat: 43.8219, lng: -79.6200, radius: 100 })
  const [clockInWindow, setClockInWindow] = useState({ start: "06:50", end: "13:00" })
  const [hourValue, setHourValue] = useState({ start: "07:00", end: "15:00", days: [1,2,3,4,5] })
  const [payrollSchedule, setPayrollSchedule] = useState<PayrollSchedule>({ anchor_date: '', enabled: false })
  const [adminRecipients, setAdminRecipients] = useState<AdminRecipient[]>([])
  const supabase = createClient()
  const { showToast } = useToast()

  useEffect(() => {
    async function fetchData() {
      const { data: geofence } = await supabase.from('settings').select('value').eq('key', 'geofence').single()
      const { data: clockIn } = await supabase.from('settings').select('value').eq('key', 'clock_in_window').single()
      const { data: workHours } = await supabase.from('settings').select('value').eq('key', 'work_hours').single()
      const { data: payroll } = await supabase.from('settings').select('value').eq('key', 'payroll_schedule').single()
      const { data: admins } = await supabase.from('profiles').select('email, name').in('role', ['admin', 'super_admin'])
      
      if (geofence?.value) setGeoValue(geofence.value as Geofence)
      if (clockIn?.value) setClockInWindow(clockIn.value as any)
      if (workHours?.value) setHourValue(workHours.value as any)
      if (payroll?.value) setPayrollSchedule(payroll.value as PayrollSchedule)
      if (admins) setAdminRecipients(admins as AdminRecipient[])
    }
    fetchData()
  }, [])

  const handleGeofenceChange = async (newGeofence: Geofence) => {
    setGeoValue(newGeofence)
  }

  const handleSaveGeofence = async () => {
    await updateSettings('geofence', geoValue)
    showToast('Geofence updated', 'success')
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <p className="text-[#666] text-sm mt-0.5">Configure geofencing, clock-in window, and shift schedules</p>
      </header>

      {/* Desktop: Side by side layout - Map on left, settings on right */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Geofence Settings - Takes up 2 columns on XL screens */}
        <div className="card p-6 space-y-4 xl:col-span-2">
          <h3 className="font-medium text-white">Geofence Area</h3>
          <p className="text-sm text-[#666]">
            Define the area where employees can clock in. Draw a polygon around your building or use a circle with radius.
          </p>
          
          <Suspense fallback={
            <div className="h-[500px] w-full bg-[#111] rounded border border-[#333] flex items-center justify-center text-[#666]">
              Loading map...
            </div>
          }>
            <GeofenceMapLarge value={geoValue} onChange={handleGeofenceChange} />
          </Suspense>

          <button 
            onClick={handleSaveGeofence}
            className="w-full btn btn-primary"
          >
            Save Geofence
          </button>
        </div>

        {/* Right sidebar for time settings */}
        <div className="space-y-6">
          {/* Clock-In Window Settings */}
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

          {/* Shift Settings */}
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

          {/* Payroll Schedule Settings */}
          <div className="card p-6 space-y-4">
            <h3 className="font-medium text-white">Payroll Schedule</h3>
            <p className="text-sm text-[#666]">
              Configure bi-weekly payroll report emails.
            </p>

            <form action={async (formData) => {
              const value = {
                anchor_date: formData.get('anchor_date'),
                enabled: formData.get('enabled') === 'on',
              }
              await updateSettings('payroll_schedule', value)
              setPayrollSchedule(value as PayrollSchedule)
              showToast('Payroll schedule updated', 'success')
            }} className="space-y-3">
              <div>
                <label className="block text-xs text-[#666] mb-1.5">Pay Period Start (Monday)</label>
                <input 
                  name="anchor_date" 
                  type="date" 
                  defaultValue={payrollSchedule.anchor_date}
                  className="w-full" 
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  name="enabled" 
                  type="checkbox" 
                  id="payroll-enabled"
                  defaultChecked={payrollSchedule.enabled}
                  className="w-4 h-4" 
                />
                <label htmlFor="payroll-enabled" className="text-sm text-[#999]">Enable bi-weekly emails</label>
              </div>
              
              {/* Admin Recipients (read-only) */}
              <div className="pt-2 border-t border-[#222]">
                <p className="text-xs text-[#666] mb-2">Recipients (auto from admin roles):</p>
                <div className="space-y-1">
                  {adminRecipients.map(admin => (
                    <div key={admin.email} className="text-xs text-[#999]">
                      {admin.name || admin.email}
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full btn btn-secondary">
                Update Payroll Schedule
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrapper component to render the map with larger height
function GeofenceMapLarge({ value, onChange }: { value: Geofence, onChange: (g: Geofence) => void }) {
  const GeofenceMap = lazy(() => import('@/components/super-admin/GeofenceMap'))
  
  return (
    <div className="geofence-map-large">
      <style jsx>{`
        .geofence-map-large :global(.h-64) {
          height: 500px !important;
        }
      `}</style>
      <Suspense fallback={
        <div className="h-[500px] w-full bg-[#111] rounded border border-[#333] flex items-center justify-center text-[#666]">
          Loading map...
        </div>
      }>
        <GeofenceMap value={value} onChange={onChange} />
      </Suspense>
    </div>
  )
}
