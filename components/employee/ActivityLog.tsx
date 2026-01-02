export type ActivityEntry = {
  id: string
  clock_in: string
  clock_out: string | null
  hours_worked: number | null
}

export default function ActivityLog({ entries }: { entries: ActivityEntry[] }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
      <h3 className="text-lg font-semibold text-white mb-6">Recent Activity</h3>
      
      <div className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No recent activity found.</p>
        ) : (
          entries.map((entry) => (
            <div 
              key={entry.id} 
              className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {new Date(entry.clock_in).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
                <span className="text-sm text-white font-medium">
                  {new Date(entry.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' — '}
                  {entry.clock_out 
                    ? new Date(entry.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : <span className="text-blue-400 italic">In Progress</span>
                  }
                </span>
              </div>

              {entry.hours_worked !== null && (
                <div className="text-right">
                  <span className="text-sm font-bold text-blue-500">
                    {entry.hours_worked} hrs
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
