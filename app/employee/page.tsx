import { createClient } from '@/lib/supabase/server'
import ClockInWidget from '@/components/employee/ClockInWidget'
import ActivityLog from '@/components/employee/ActivityLog'
import { logout } from '@/app/login/actions'
import { redirect } from 'next/navigation'

export default async function EmployeeDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get current active entry
  const { data: activeEntries } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .order('clock_in', { ascending: false })
    .limit(1)

  const currentEntry = activeEntries?.[0] || null

  // Get recent history
  const { data: history } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('clock_in', { ascending: false })
    .limit(5)

  // Get geofence settings
  const { data: geofenceSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'geofence')
    .single()

  // Normalize geofence to circle format { lat, lng, radius }
  let geofence = { lat: 43.8219, lng: -79.6200, radius: 100 }
  if (geofenceSetting?.value) {
    const g = geofenceSetting.value as any
    if (g.lat !== undefined && g.lng !== undefined) {
      geofence = { lat: g.lat, lng: g.lng, radius: g.radius || 100 }
    } else if (g.type === 'circle' && g.center) {
      geofence = { lat: g.center[1], lng: g.center[0], radius: g.radius || 100 }
    }
  }

  return (
    <div className="min-h-screen bg-black text-[#e5e5e5] p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">IQ Automations</h1>
            <p className="text-[#666] text-sm">Employee Dashboard</p>
          </div>
          <form action={logout}>
            <button className="text-sm text-[#666] hover:text-white transition-colors">
              Sign out
            </button>
          </form>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <ClockInWidget 
            currentEntry={currentEntry} 
            geofence={geofence} 
          />
          <ActivityLog entries={history || []} />
        </div>

        {/* Footer info */}
        <div className="text-center pt-6 border-t border-[#222]">
          <p className="text-xs text-[#444]">
            Shift: 7:00 AM — 3:00 PM EST
          </p>
        </div>
      </div>
    </div>
  )
}
