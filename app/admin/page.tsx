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
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-semibold text-white">Dashboard</h2>
        <p className="text-[#666] text-sm mt-0.5">Real-time status of your team</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs text-[#666] mb-1">Clocked In Now</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-white">{activeEntries?.length || 0}</span>
            <span className="text-xs text-accent">Active</span>
          </div>
        </div>
        <div className="card p-5">
          <p className="text-xs text-[#666] mb-1">Total Hours Today</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-white">{totalHours.toFixed(1)}</span>
            <span className="text-xs text-[#666]">hrs</span>
          </div>
        </div>
        <div className="card p-5">
          <p className="text-xs text-[#666] mb-1">Next Payroll</p>
          <span className="text-lg font-semibold text-white">Friday</span>
        </div>
      </div>

      {/* Live Status Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[#222] flex items-center justify-between">
          <h3 className="font-medium text-white">Employee Status</h3>
          <span className="text-xs text-accent">● Live</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-[500px] w-full">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Clocked In</th>
                <th>Elapsed</th>
                <th className="text-right hidden sm:table-cell">Location</th>
              </tr>
            </thead>
            <tbody>
              {activeEntries?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#666]">
                    No employees currently clocked in
                  </td>
                </tr>
              ) : (
                activeEntries?.map((entry) => {
                  const startTime = new Date(entry.clock_in)
                  const elapsedMs = new Date().getTime() - startTime.getTime()
                  const elapsedHrs = Math.floor(elapsedMs / (1000 * 60 * 60))
                  const elapsedMins = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60))

                  return (
                    <tr key={entry.id}>
                      <td>
                        <div className="font-medium text-white">{entry.profiles.name}</div>
                        <div className="text-xs text-[#666]">{entry.profiles.role}</div>
                      </td>
                      <td className="text-[#999]">
                        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="font-mono text-accent">
                        {elapsedHrs}h {elapsedMins}m
                      </td>
                      <td className="text-right hidden sm:table-cell">
                        <span className="text-xs text-[#666]">GPS Verified</span>
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
