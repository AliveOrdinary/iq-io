export type ActivityEntry = {
  id: string
  clock_in: string
  clock_out: string | null
  hours_worked: number | null
}

export default function ActivityLog({ entries }: { entries: ActivityEntry[] }) {
  return (
    <div className="card p-6">
      <h3 className="font-medium text-white mb-4">Recent Activity</h3>
      
      <div className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-[#666] py-4 text-center">No recent activity</p>
        ) : (
          entries.map((entry) => (
            <div 
              key={entry.id} 
              className="flex items-center justify-between p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]"
            >
              <div>
                <span className="text-xs text-[#666]">
                  {new Date(entry.clock_in).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
                <div className="text-sm text-white mt-0.5">
                  {new Date(entry.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' — '}
                  {entry.clock_out 
                    ? new Date(entry.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : <span className="text-accent">In Progress</span>
                  }
                </div>
              </div>

              {entry.hours_worked !== null && (
                <span className="text-sm font-mono text-accent">
                  {entry.hours_worked}h
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
