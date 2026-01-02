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

  const geofence = (geofenceSetting?.value as { lat: number; lng: number; radius: number }) || {
    lat: 43.8219,
    lng: -79.6200,
    radius: 100
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              IQ <span className="text-blue-500">Automations</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Employee Dashboard</p>
          </div>
          <form action={logout}>
            <button className="text-sm text-gray-400 hover:text-white transition-colors">
              Sign out
            </button>
          </form>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <ClockInWidget 
            currentEntry={currentEntry} 
            geofence={geofence} 
          />
          <ActivityLog entries={history || []} />
        </div>

        {/* Footer info */}
        <div className="text-center pt-8 border-t border-white/5">
          <p className="text-xs text-gray-600 uppercase tracking-widest font-medium">
            Shift: 7:00 AM — 3:00 PM EST
          </p>
        </div>
      </div>
    </div>
  )
}
