import { createClient } from '@/lib/supabase/server'
import { updateTimeLogs } from '../settings/actions'
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
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-white">Time Corrections</h2>
        <p className="text-gray-500 mt-1">Directly edit or correct employee time logs.</p>
      </header>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl text-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">
              <th className="px-6 py-4 font-bold">Employee</th>
              <th className="px-6 py-4 font-bold">Clock In</th>
              <th className="px-6 py-4 font-bold">Clock Out</th>
              <th className="px-6 py-4 font-bold">Hours</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {entries?.map((entry) => (
              <TimeEntryRow key={entry.id} entry={entry} />
            ))}
          </tbody>
        </table>
      </div>
      
      <p className="text-xs text-gray-500 italic">
        * Note: Changing Clock In/Out times will not automatically recalculate hours in this view. 
        Re-calculation logic should be triggered upon save.
      </p>
    </div>
  )
}
