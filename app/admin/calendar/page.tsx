'use client'

import { createClient } from '@/lib/supabase/client'
import { addOffDay, removeOffDay, toggleStatutoryHoliday, setWeekendAsWorking, removeWeekendOverride } from './actions'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'

type OffDay = {
  id: string
  date: string
  name: string
  type: 'statutory' | 'company' | 'weekend_override'
  is_active: boolean
}

type SelectedDay = {
  date: string
  dayNumber: number
  isWeekend: boolean
  offDay: OffDay | null
  weekendOverride: OffDay | null
}

export default function CalendarPage() {
  const [offDays, setOffDays] = useState<OffDay[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null)
  const [newOffDayName, setNewOffDayName] = useState('')
  const [loading, setLoading] = useState(false)
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

  const isWeekend = (day: number) => {
    const date = new Date(year, month, day)
    return date.getDay() === 0 || date.getDay() === 6
  }

  const getOffDayForDate = (dateStr: string) => {
    return offDays.find(od => od.date === dateStr && od.type !== 'weekend_override' && od.is_active)
  }

  const getWeekendOverride = (dateStr: string) => {
    return offDays.find(od => od.date === dateStr && od.type === 'weekend_override')
  }

  const handleDayClick = (day: number) => {
    const dateStr = formatDateString(day)
    const offDay = offDays.find(od => od.date === dateStr && od.type !== 'weekend_override')
    const weekendOverride = getWeekendOverride(dateStr)
    
    setSelectedDay({
      date: dateStr,
      dayNumber: day,
      isWeekend: isWeekend(day),
      offDay: offDay || null,
      weekendOverride: weekendOverride || null
    })
    setNewOffDayName('')
  }

  const handleAddCompanyOffDay = async () => {
    if (!selectedDay || !newOffDayName) return
    setLoading(true)
    const res = await addOffDay(selectedDay.date, newOffDayName)
    if (res.error) {
      showToast(res.error, 'error')
    } else {
      showToast('Off day added', 'success')
      const { data } = await supabase.from('off_days').select('*').order('date')
      if (data) setOffDays(data as OffDay[])
      setSelectedDay(null)
    }
    setLoading(false)
  }

  const handleRemoveCompanyOffDay = async () => {
    if (!selectedDay?.offDay) return
    setLoading(true)
    const res = await removeOffDay(selectedDay.offDay.id)
    if (res.error) {
      showToast(res.error, 'error')
    } else {
      showToast('Off day removed', 'success')
      setOffDays(offDays.filter(od => od.id !== selectedDay.offDay!.id))
      setSelectedDay(null)
    }
    setLoading(false)
  }

  const handleToggleStatutory = async () => {
    if (!selectedDay?.offDay) return
    setLoading(true)
    const newStatus = !selectedDay.offDay.is_active
    const res = await toggleStatutoryHoliday(selectedDay.offDay.id, newStatus)
    if (res.error) {
      showToast(res.error, 'error')
    } else {
      showToast(newStatus ? 'Marked as off day' : 'Marked as working day', 'success')
      setOffDays(offDays.map(od => od.id === selectedDay.offDay!.id ? { ...od, is_active: newStatus } : od))
      setSelectedDay({ ...selectedDay, offDay: { ...selectedDay.offDay, is_active: newStatus } })
    }
    setLoading(false)
  }

  const handleToggleWeekend = async () => {
    if (!selectedDay) return
    setLoading(true)
    
    if (selectedDay.weekendOverride) {
      // Remove override (revert to off)
      const res = await removeWeekendOverride(selectedDay.weekendOverride.id)
      if (res.error) {
        showToast(res.error, 'error')
      } else {
        showToast('Reverted to off day', 'success')
        setOffDays(offDays.filter(od => od.id !== selectedDay.weekendOverride!.id))
        setSelectedDay({ ...selectedDay, weekendOverride: null })
      }
    } else {
      // Add override (make working)
      const res = await setWeekendAsWorking(selectedDay.date)
      if (res.error) {
        showToast(res.error, 'error')
      } else {
        showToast('Marked as working day', 'success')
        const { data } = await supabase.from('off_days').select('*').order('date')
        if (data) {
          setOffDays(data as OffDay[])
          const newOverride = (data as OffDay[]).find(od => od.date === selectedDay.date && od.type === 'weekend_override')
          setSelectedDay({ ...selectedDay, weekendOverride: newOverride || null })
        }
      }
    }
    setLoading(false)
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const getDayStatus = (day: number) => {
    const dateStr = formatDateString(day)
    const offDay = getOffDayForDate(dateStr)
    const weekend = isWeekend(day)
    const weekendOverride = getWeekendOverride(dateStr)
    const inactiveStatutory = offDays.find(od => od.date === dateStr && od.type === 'statutory' && !od.is_active)
    
    if (offDay) return { type: offDay.type, name: offDay.name, working: false }
    if (weekend && !weekendOverride) return { type: 'weekend', name: 'Weekend', working: false }
    if (weekendOverride) return { type: 'weekend_working', name: 'Working Weekend', working: true }
    if (inactiveStatutory) return { type: 'statutory_working', name: inactiveStatutory.name, working: true }
    return { type: 'regular', name: 'Working Day', working: true }
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-semibold text-white">Off Days Calendar</h2>
        <p className="text-[#666] text-sm mt-0.5">Click on any day to manage its working status</p>
      </header>

      <div className="relative">
        {/* Calendar */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(new Date(year, month - 1))}
              className="p-2 hover:bg-[#222] rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="font-medium text-white text-lg">{monthNames[month]} {year}</h3>
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
              <div key={day} className={`text-center text-xs py-2 ${day === 'Sun' || day === 'Sat' ? 'text-[#555]' : 'text-[#999]'}`}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startingDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = formatDateString(day)
              const status = getDayStatus(day)
              const isToday = dateStr === new Date().toISOString().split('T')[0]
              const isSelected = selectedDay?.date === dateStr

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square rounded flex flex-col items-center justify-center text-sm transition-all relative
                    ${status.type === 'statutory' ? 'bg-accent/20 text-accent' : ''}
                    ${status.type === 'company' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : ''}
                    ${status.type === 'weekend' ? 'bg-[#1a1a1a] text-[#555]' : ''}
                    ${status.type === 'weekend_working' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                    ${status.type === 'statutory_working' ? 'bg-[#222] text-[#888]' : ''}
                    ${status.type === 'regular' ? 'hover:bg-[#222]' : 'hover:opacity-80'}
                    ${isSelected ? 'ring-2 ring-accent ring-offset-1 ring-offset-[#0a0a0a]' : ''}
                    ${isToday ? 'font-bold' : ''}
                  `}
                >
                  <span>{day}</span>
                  {status.type !== 'regular' && status.type !== 'weekend' && (
                    <span className="text-[7px] mt-0.5 truncate max-w-full px-0.5 opacity-75">
                      {status.name.split(' ')[0]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-4 mt-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-accent/20" />
              <span className="text-[#666]">Statutory</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#f59e0b]/20" />
              <span className="text-[#666]">Company Off</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#1a1a1a]" />
              <span className="text-[#666]">Weekend</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500/20" />
              <span className="text-[#666]">Working Weekend</span>
            </div>
          </div>
        </div>

        {/* Slide-out Panel */}
        <div className={`fixed inset-y-0 right-0 w-80 bg-[#0a0a0a] border-l border-[#222] shadow-2xl transform transition-transform duration-300 ease-out z-50 ${selectedDay ? 'translate-x-0' : 'translate-x-full'}`}>
          {selectedDay && (
            <div className="h-full flex flex-col p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-white text-lg">
                    {dayNames[new Date(selectedDay.date).getDay()]}
                  </h3>
                  <p className="text-[#666] text-sm">
                    {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-2 hover:bg-[#222] rounded transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Current Status */}
              <div className="mb-6">
                <label className="block text-xs text-[#666] mb-2">Current Status</label>
                <div className={`px-3 py-2 rounded text-sm ${
                  getDayStatus(selectedDay.dayNumber).working 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {getDayStatus(selectedDay.dayNumber).working ? '✓ Working Day' : '✗ Off Day'}
                  {selectedDay.offDay && ` • ${selectedDay.offDay.name}`}
                </div>
              </div>

              {/* Actions based on day type */}
              <div className="flex-1 space-y-4">
                {/* Weekend day */}
                {selectedDay.isWeekend && !selectedDay.offDay && (
                  <div className="space-y-3">
                    <p className="text-sm text-[#999]">
                      {selectedDay.weekendOverride 
                        ? 'This weekend is marked as a working day.'
                        : 'Weekends are off by default.'}
                    </p>
                    <button
                      onClick={handleToggleWeekend}
                      disabled={loading}
                      className={`w-full py-2.5 rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                        selectedDay.weekendOverride
                          ? 'bg-[#222] text-[#999] hover:bg-[#333]'
                          : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      }`}
                    >
                      {loading ? 'Saving...' : selectedDay.weekendOverride ? 'Revert to Off Day' : 'Mark as Working Day'}
                    </button>
                  </div>
                )}

                {/* Statutory holiday */}
                {selectedDay.offDay?.type === 'statutory' && (
                  <div className="space-y-3">
                    <p className="text-sm text-[#999]">
                      This is a statutory holiday. You can override it as a working day.
                    </p>
                    <button
                      onClick={handleToggleStatutory}
                      disabled={loading}
                      className={`w-full py-2.5 rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                        selectedDay.offDay.is_active
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-[#222] text-[#999] hover:bg-[#333]'
                      }`}
                    >
                      {loading ? 'Saving...' : selectedDay.offDay.is_active ? 'Mark as Working Day' : 'Revert to Off Day'}
                    </button>
                  </div>
                )}

                {/* Company off day */}
                {selectedDay.offDay?.type === 'company' && (
                  <div className="space-y-3">
                    <p className="text-sm text-[#999]">
                      This is a company off day: <strong>{selectedDay.offDay.name}</strong>
                    </p>
                    <button
                      onClick={handleRemoveCompanyOffDay}
                      disabled={loading}
                      className="w-full py-2.5 rounded text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Removing...' : 'Remove Off Day'}
                    </button>
                  </div>
                )}

                {/* Regular working day - can add company off day */}
                {!selectedDay.offDay && !selectedDay.isWeekend && (
                  <div className="space-y-3">
                    <p className="text-sm text-[#999]">Add a company off day for this date:</p>
                    <input
                      type="text"
                      value={newOffDayName}
                      onChange={(e) => setNewOffDayName(e.target.value)}
                      placeholder="e.g., Team Retreat"
                      className="w-full"
                    />
                    <button
                      onClick={handleAddCompanyOffDay}
                      disabled={loading || !newOffDayName}
                      className="w-full py-2.5 rounded text-sm font-medium bg-[#f59e0b]/20 text-[#f59e0b] hover:bg-[#f59e0b]/30 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Add Company Off Day'}
                    </button>
                  </div>
                )}
              </div>

              {/* Done Button */}
              <button
                onClick={() => setSelectedDay(null)}
                className="w-full py-2.5 rounded text-sm font-medium bg-accent text-black hover:bg-accent/90 transition-colors mt-4"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Backdrop */}
        {selectedDay && (
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedDay(null)}
          />
        )}
      </div>
    </div>
  )
}
