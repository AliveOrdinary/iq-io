'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Company timezone (Eastern Time)
const COMPANY_TIMEZONE = 'America/Toronto'

export async function clockIn(latitude: number, longitude: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Validate coordinates
  if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { error: 'Invalid coordinates' }
  }

  // Get current time in company timezone
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: COMPANY_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  const currentTime = formatter.format(now).replace(/\u202f/g, ' ').trim()
  
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: COMPANY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const todayDate = dateFormatter.format(now)

  // Check if today is a weekend (Saturday = 6, Sunday = 0)
  // Use timezone-aware day check
  const dayFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: COMPANY_TIMEZONE,
    weekday: 'short'
  })
  const dayName = dayFormatter.format(now)
  const isWeekend = dayName === 'Sat' || dayName === 'Sun'

  if (isWeekend) {
    // Check if there's a weekend override making it a working day
    const { data: weekendOverride } = await supabase
      .from('off_days')
      .select('id')
      .eq('date', todayDate)
      .eq('type', 'weekend_override')
      .single()
    
    if (!weekendOverride) {
      return { error: 'Cannot clock in on weekends' }
    }
  }

  // Check if today is an off day (only if is_active is true)
  const { data: offDay } = await supabase
    .from('off_days')
    .select('name, is_active')
    .eq('date', todayDate)
    .eq('is_active', true)
    .neq('type', 'weekend_override')
    .single()

  if (offDay) {
    return { error: `Cannot clock in: Today is ${offDay.name}` }
  }

  // Check clock-in time window
  const { data: clockInWindowSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'clock_in_window')
    .single()

  if (clockInWindowSetting?.value) {
    const window = clockInWindowSetting.value as { start: string; end: string }
    if (currentTime < window.start || currentTime > window.end) {
      return { error: `Clock-in is only available between ${window.start} and ${window.end}` }
    }
  }

  // Geofence validation — circle only (lat, lng, radius)
  const { data: geofenceSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'geofence')
    .single()

  if (geofenceSetting?.value) {
    const geofence = geofenceSetting.value as { lat: number; lng: number; radius: number }
    
    if (geofence.lat !== undefined && geofence.lng !== undefined && geofence.radius !== undefined) {
      const R = 6371e3 // Earth radius in meters
      const phi1 = (latitude * Math.PI) / 180
      const phi2 = (geofence.lat * Math.PI) / 180
      const deltaPhi = ((geofence.lat - latitude) * Math.PI) / 180
      const deltaLambda = ((geofence.lng - longitude) * Math.PI) / 180
      const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      
      if (distance > geofence.radius) {
        return { error: `You are ${Math.round(distance)}m away. Must be within ${geofence.radius}m to clock in.` }
      }
    }
  }

  const { error } = await supabase.from('time_entries').insert({
    user_id: user.id,
    clock_in: new Date().toISOString(),
    latitude,
    longitude,
  })

  if (error) return { error: error.message }

  revalidatePath('/employee')
  return { success: true }
}

export async function clockOut(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }

  // Validate id format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return { error: 'Invalid entry ID' }
  }

  const now = new Date()
  const clock_out = now.toISOString()

  // Get clock_in time AND verify ownership
  const { data: entry, error: fetchError } = await supabase
    .from('time_entries')
    .select('clock_in, user_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    return { error: 'Entry not found' }
  }

  if (!entry) {
    return { error: 'Entry not found' }
  }

  // CRITICAL: Verify the authenticated user owns this entry
  if (entry.user_id !== user.id) {
    return { error: 'Unauthorized: You can only clock out your own entries' }
  }

  const clockInDate = new Date(entry.clock_in)
  const hoursWorked = (now.getTime() - clockInDate.getTime()) / (1000 * 60 * 60)

  const { error } = await supabase
    .from('time_entries')
    .update({
      clock_out,
      hours_worked: parseFloat(hoursWorked.toFixed(2)),
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/employee')
  return { success: true }
}
