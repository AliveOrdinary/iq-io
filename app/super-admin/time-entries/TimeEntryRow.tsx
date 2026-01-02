'use client'

import { useState } from 'react'
import { updateTimeLogs } from '../settings/actions'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export default function TimeEntryRow({ entry }: { entry: any }) {
  const [clockIn, setClockIn] = useState(entry.clock_in)
  const [clockOut, setClockOut] = useState(entry.clock_out)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  const handleSave = async () => {
    setLoading(true)
    
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
      showToast('Error updating log: ' + error, 'error')
    } else {
      showToast('Time entry updated', 'success')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <tr className="group">
      <td className="font-medium text-white">
        {entry.profiles?.name || 'Unknown'}
      </td>
      <td>
        <input 
          type="datetime-local" 
          value={clockIn ? new Date(clockIn).toISOString().slice(0, 16) : ''}
          onChange={(e) => setClockIn(new Date(e.target.value).toISOString())}
          className="w-auto text-xs"
        />
      </td>
      <td>
        <input 
          type="datetime-local" 
          value={clockOut ? new Date(clockOut).toISOString().slice(0, 16) : ''}
          onChange={(e) => setClockOut(new Date(e.target.value).toISOString())}
          className="w-auto text-xs"
        />
      </td>
      <td className="font-mono text-accent">
        {entry.hours_worked?.toFixed(2) || '0.00'}h
      </td>
      <td className="text-right">
        <button 
          onClick={handleSave}
          disabled={loading}
          className="text-accent hover:opacity-80 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </td>
    </tr>
  )
}
