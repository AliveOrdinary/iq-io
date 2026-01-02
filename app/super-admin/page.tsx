import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function SuperAdminDashboard() {
  const supabase = await createClient()

  // High-level stats
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
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-white">Super Admin Dashboard</h2>
        <p className="text-gray-500 mt-1">System-wide overview and administrative controls.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Total Employees</p>
          <p className="text-4xl font-bold text-white">{employeeCount || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Active Admins</p>
          <p className="text-4xl font-bold text-blue-500">{adminCount || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">System Status</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-lg font-bold text-white uppercase tracking-tight">Active</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Quick Actions */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/super-admin/employees" className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-blue-600/10 hover:border-blue-500/50 transition-all">
              <p className="font-bold text-white group-hover:text-blue-400 transition-colors">Manage Team</p>
              <p className="text-xs text-gray-500 mt-1">Add/remove users and set rates.</p>
            </Link>
            <Link href="/super-admin/settings" className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-purple-600/10 hover:border-purple-500/50 transition-all">
              <p className="font-bold text-white group-hover:text-purple-400 transition-colors">System Settings</p>
              <p className="text-xs text-gray-500 mt-1">Geofence and work schedules.</p>
            </Link>
            <Link href="/super-admin/time-entries" className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-amber-600/10 hover:border-amber-500/50 transition-all">
              <p className="font-bold text-white group-hover:text-amber-400 transition-colors">Time Corrections</p>
              <p className="text-xs text-gray-500 mt-1">Audit and edit clock records.</p>
            </Link>
          </div>
        </div>

        {/* Recent System Activity */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Recent Time Logs</h3>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
            {recentEntries?.map(entry => (
              <div key={entry.id} className="p-4 flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-white">{entry.profiles?.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-tighter">
                    {new Date(entry.clock_in).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                   <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                     entry.clock_out ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                   }`}>
                     {entry.clock_out ? 'COMPLETED' : 'IN PROGRESS'}
                   </span>
                </div>
              </div>
            ))}
            {(!recentEntries || recentEntries.length === 0) && (
              <p className="p-8 text-center text-gray-500 text-sm italic">No recent activity detected.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
