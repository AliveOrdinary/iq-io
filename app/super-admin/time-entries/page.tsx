import { createClient } from '@/lib/supabase/server'
import TimeEntryRow from './TimeEntryRow'

export default async function TimeEntriesPage({
  searchParams,
}: {
  searchParams: { user_id?: string }
}) {
  const supabase = await createClient()

  const { data: entries } = await supabase
    .from('time_entries')
    .select('*, profiles(name)')
    .order('clock_in', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-semibold text-white">Time Corrections</h2>
        <p className="text-[#666] text-sm mt-0.5">Edit or correct employee time logs</p>
      </header>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Hours</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries?.map((entry) => (
                <TimeEntryRow key={entry.id} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <p className="text-xs text-[#444]">
        * Changing times will recalculate hours on save
      </p>
    </div>
  )
}
