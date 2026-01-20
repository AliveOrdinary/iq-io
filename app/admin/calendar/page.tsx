'use client'

import { createClient } from '@/lib/supabase/client'
import { addOffDay, removeOffDay } from './actions'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'

type OffDay = {
  id: string
  date: string
  name: string
  type: 'statutory' | 'company'
}

export default function CalendarPage() {
  const [offDays, setOffDays] = useState<OffDay[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [offDayName, setOffDayName] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const supabase = createClient()
  const { showToast } = useToast()

  useEffect(() => {
    async function fetchOffDays() {
      const { data } = await supabase
        .from('off_days')
        .select('*')
        .order('date')
      if (data) setOffDays(data as OffDay[])
    }
    fetchOffDays()
  }, [])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    return { daysInMonth, startingDay, year, month }
  }

  const { daysInMonth, startingDay, year, month } = getDaysInMonth(currentMonth)

  const formatDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const getOffDayForDate = (dateStr: string) => {
    return offDays.find(od => od.date === dateStr)
  }

  const handleAddOffDay = async () => {
    if (!selectedDate || !offDayName) {
      showToast('Please select a date and enter a name', 'error')
      return
    }
    const res = await addOffDay(selectedDate, offDayName)
    if (res.error) {
      showToast(res.error, 'error')
    } else {
      showToast('Off day added', 'success')
      setSelectedDate('')
      setOffDayName('')
      // Refetch
      const { data } = await supabase.from('off_days').select('*').order('date')
      if (data) setOffDays(data as OffDay[])
    }
  }

  const handleRemoveOffDay = async (id: string) => {
    const res = await removeOffDay(id)
    if (res.error) {
      showToast(res.error, 'error')
    } else {
      showToast('Off day removed', 'success')
      setOffDays(offDays.filter(od => od.id !== id))
    }
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-semibold text-white">Off Days Calendar</h2>
        <p className="text-[#666] text-sm mt-0.5">Manage statutory holidays and company off days</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(new Date(year, month - 1))}
              className="p-2 hover:bg-[#222] rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="font-medium text-white text-lg">
              {monthNames[month]} {year}
            </h3>
            <button
              onClick={() => setCurrentMonth(new Date(year, month + 1))}
              className="p-2 hover:bg-[#222] rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs text-[#666] py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startingDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = formatDateString(day)
              const offDay = getOffDayForDate(dateStr)
              const isSelected = selectedDate === dateStr
              const isToday = dateStr === new Date().toISOString().split('T')[0]

              return (
                <button
                  key={day}
                  onClick={() => !offDay && setSelectedDate(isSelected ? '' : dateStr)}
                  className={`aspect-square rounded flex flex-col items-center justify-center text-sm transition-colors relative
                    ${offDay?.type === 'statutory' ? 'bg-accent/20 text-accent cursor-default' : ''}
                    ${offDay?.type === 'company' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : ''}
                    ${isSelected ? 'ring-2 ring-accent' : ''}
                    ${isToday && !offDay ? 'bg-[#222]' : ''}
                    ${!offDay ? 'hover:bg-[#222] cursor-pointer' : ''}
                  `}
                  title={offDay?.name}
                >
                  <span className={isToday ? 'font-bold' : ''}>{day}</span>
                  {offDay && (
                    <span className="text-[8px] mt-0.5 truncate max-w-full px-1">
                      {offDay.name.split(' ')[0]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex gap-4 mt-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-accent/20" />
              <span className="text-[#666]">Statutory Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#f59e0b]/20" />
              <span className="text-[#666]">Company Off Day</span>
            </div>
          </div>
        </div>

        {/* Add Off Day Panel */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="font-medium text-white">Add Company Off Day</h3>
            
            <div>
              <label className="block text-xs text-[#666] mb-1.5">Selected Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-xs text-[#666] mb-1.5">Description</label>
              <input
                type="text"
                value={offDayName}
                onChange={(e) => setOffDayName(e.target.value)}
                placeholder="e.g., Company Retreat"
                className="w-full"
              />
            </div>
            
            <button
              onClick={handleAddOffDay}
              disabled={!selectedDate || !offDayName}
              className="w-full btn btn-primary disabled:opacity-50"
            >
              Add Off Day
            </button>
          </div>

          {/* Company Off Days List */}
          <div className="card p-6">
            <h3 className="font-medium text-white mb-4">Company Off Days</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {offDays.filter(od => od.type === 'company').length === 0 ? (
                <p className="text-[#666] text-sm">No company off days added</p>
              ) : (
                offDays.filter(od => od.type === 'company').map(od => (
                  <div key={od.id} className="flex items-center justify-between py-2 border-b border-[#222] last:border-0">
                    <div>
                      <p className="text-sm text-white">{od.name}</p>
                      <p className="text-xs text-[#666]">{new Date(od.date + 'T00:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveOffDay(od.id)}
                      className="text-[#ef4444] hover:text-[#dc2626] p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
