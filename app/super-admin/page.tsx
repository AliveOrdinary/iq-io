import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function SuperAdminDashboard() {
  const supabase = await createClient()

  const { count: employeeCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'employee')

  const { count: adminCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')

  const { data: recentEntries } = await supabase
    .from('time_entries')
    .select('*, profiles(name)')
    .order('clock_in', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-semibold text-white">Dashboard</h2>
        <p className="text-[#666] text-sm mt-0.5">System overview and controls</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs text-[#666] mb-1">Total Employees</p>
          <p className="text-3xl font-semibold text-white">{employeeCount || 0}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-[#666] mb-1">Active Admins</p>
          <p className="text-3xl font-semibold text-accent">{adminCount || 0}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-[#666] mb-1">System Status</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <p className="font-medium text-white">Active</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="font-medium text-white">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/super-admin/employees" className="card p-4 hover:bg-[#1a1a1a] transition-colors">
              <p className="font-medium text-white">Manage Team</p>
              <p className="text-xs text-[#666] mt-0.5">Add/remove users and set rates</p>
            </Link>
            <Link href="/super-admin/settings" className="card p-4 hover:bg-[#1a1a1a] transition-colors">
              <p className="font-medium text-white">Settings</p>
              <p className="text-xs text-[#666] mt-0.5">Geofence and schedules</p>
            </Link>
            <Link href="/super-admin/time-entries" className="card p-4 hover:bg-[#1a1a1a] transition-colors">
              <p className="font-medium text-white">Time Corrections</p>
              <p className="text-xs text-[#666] mt-0.5">Audit and edit records</p>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="font-medium text-white">Recent Time Logs</h3>
          <div className="card divide-y divide-[#1a1a1a]">
            {recentEntries?.map(entry => (
              <div key={entry.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{entry.profiles?.name}</p>
                  <p className="text-xs text-[#666]">
                    {new Date(entry.clock_in).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`text-xs ${entry.clock_out ? 'text-[#666]' : 'text-accent'}`}>
                  {entry.clock_out ? 'Completed' : 'In Progress'}
                </span>
              </div>
            ))}
            {(!recentEntries || recentEntries.length === 0) && (
              <p className="p-6 text-center text-[#666] text-sm">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
