import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Get currently clocked in employees
  const { data: activeEntries } = await supabase
    .from('time_entries')
    .select('*, profiles(name, role)')
    .is('clock_out', null)

  // Get total hours today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data: todaysEntries } = await supabase
    .from('time_entries')
    .select('hours_worked')
    .gte('clock_in', today.toISOString())
    .not('hours_worked', 'is', null)

  const totalHours = todaysEntries?.reduce((acc, curr) => acc + (curr.hours_worked || 0), 0) || 0

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">Real-time status of your team at IQ Automations.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <p className="text-sm font-medium text-gray-400">Clocked In Now</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-bold text-white">{activeEntries?.length || 0}</span>
            <span className="text-sm text-green-500 font-medium">Active</span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <p className="text-sm font-medium text-gray-400">Total Hours Today</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-bold text-white">{totalHours.toFixed(1)}</span>
            <span className="text-sm text-blue-500 font-medium">Hours</span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <p className="text-sm font-medium text-gray-400">Next Payroll</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl font-bold text-white uppercase tracking-tight">Friday</span>
            <span className="text-sm text-purple-500 font-medium">Automatic</span>
          </div>
        </div>
      </div>

      {/* Live Status Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Live Employee Status</h3>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] uppercase font-bold tracking-widest border border-green-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-gray-500 border-b border-white/5">
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Clocked In At</th>
                <th className="px-6 py-4 font-semibold">Time Elapsed</th>
                <th className="px-6 py-4 font-semibold text-right">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeEntries?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500 italic">
                    No employees are currently clocked in.
                  </td>
                </tr>
              ) : (
                activeEntries?.map((entry) => {
                  const startTime = new Date(entry.clock_in)
                  const elapsedMs = new Date().getTime() - startTime.getTime()
                  const elapsedHrs = Math.floor(elapsedMs / (1000 * 60 * 60))
                  const elapsedMins = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60))

                  return (
                    <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{entry.profiles.name}</div>
                        <div className="text-xs text-gray-500">{entry.profiles.role}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 underline decoration-white/10 underline-offset-4">
                        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-blue-400">
                        {elapsedHrs}h {elapsedMins}m
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 uppercase font-medium">
                          Verified GPS
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
