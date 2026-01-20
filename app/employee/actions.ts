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
  const currentTime = formatter.format(now)
  
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: COMPANY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const todayDate = dateFormatter.format(now)

  // Check if today is an off day
  const { data: offDay } = await supabase
    .from('off_days')
    .select('name')
    .eq('date', todayDate)
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

  // Geofence validation
  const { data: geofenceSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'geofence')
    .single()

  if (geofenceSetting?.value) {
    const geofence = geofenceSetting.value as { 
      lat?: number
      lng?: number
      radius?: number
      type?: string
      coordinates?: [number, number][]
      center?: [number, number]
    }
    
    let isInsideGeofence = false
    
    if (geofence.type === 'polygon' && geofence.coordinates) {
      // Point-in-polygon check
      isInsideGeofence = isPointInPolygon(
        { latitude, longitude },
        geofence.coordinates
      )
    } else {
      // Circle/radius check (existing logic)
      const centerLat = geofence.lat ?? geofence.center?.[1]
      const centerLng = geofence.lng ?? geofence.center?.[0]
      const radius = geofence.radius ?? 100
      
      if (centerLat !== undefined && centerLng !== undefined) {
        const R = 6371e3
        const phi1 = (latitude * Math.PI) / 180
        const phi2 = (centerLat * Math.PI) / 180
        const deltaPhi = ((centerLat - latitude) * Math.PI) / 180
        const deltaLambda = ((centerLng - longitude) * Math.PI) / 180
        const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        
        isInsideGeofence = distance <= radius
      }
    }
    
    if (!isInsideGeofence) {
      return { error: 'You must be within the designated area to clock in' }
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

// Ray-casting algorithm for point-in-polygon check
function isPointInPolygon(
  point: { latitude: number; longitude: number },
  polygon: [number, number][] // [lng, lat] pairs (GeoJSON format)
): boolean {
  const x = point.longitude
  const y = point.latitude
  let inside = false
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  
  return inside
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

