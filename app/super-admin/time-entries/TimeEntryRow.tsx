'use client'

import { useState } from 'react'
import { updateTimeLogs } from '../settings/actions'
import { useRouter } from 'next/navigation'

export default function TimeEntryRow({ entry }: { entry: any }) {
  const [clockIn, setClockIn] = useState(entry.clock_in)
  const [clockOut, setClockOut] = useState(entry.clock_out)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setLoading(true)
    
    // Recalculate hours if both exist
    let hours_worked = entry.hours_worked
    if (clockIn && clockOut) {
      const start = new Date(clockIn).getTime()
      const end = new Date(clockOut).getTime()
      hours_worked = (end - start) / (1000 * 60 * 60)
    }

    const { error } = await updateTimeLogs(entry.id, {
      clock_in: clockIn,
      clock_out: clockOut,
      hours_worked
    })

    if (error) {
      alert('Error updating log: ' + error)
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <tr className="hover:bg-white/[0.02] transition-colors group">
      <td className="px-6 py-4 font-medium text-white">
        {entry.profiles?.name || 'Unknown'}
      </td>
      <td className="px-6 py-4">
        <input 
          type="datetime-local" 
          value={clockIn ? new Date(clockIn).toISOString().slice(0, 16) : ''}
          onChange={(e) => setClockIn(new Date(e.target.value).toISOString())}
          className="bg-transparent border border-white/10 rounded px-2 py-1 text-gray-300 focus:ring-1 focus:ring-blue-500 text-xs"
        />
      </td>
      <td className="px-6 py-4">
        <input 
          type="datetime-local" 
          value={clockOut ? new Date(clockOut).toISOString().slice(0, 16) : ''}
          onChange={(e) => setClockOut(new Date(e.target.value).toISOString())}
          className="bg-transparent border border-white/10 rounded px-2 py-1 text-gray-300 focus:ring-1 focus:ring-blue-500 text-xs"
        />
      </td>
      <td className="px-6 py-4 font-mono text-blue-400">
        {entry.hours_worked?.toFixed(2) || '0.00'}
      </td>
      <td className="px-6 py-4 text-right">
        <button 
          onClick={handleSave}
          disabled={loading}
          className="text-blue-500 hover:text-blue-400 text-[10px] font-bold uppercase tracking-widest transition-opacity opacity-0 group-hover:opacity-100 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </td>
    </tr>
  )
}
