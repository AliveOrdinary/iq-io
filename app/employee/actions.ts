'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function clockIn(latitude: number, longitude: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Validate coordinates
  if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { error: 'Invalid coordinates' }
  }

  // Optional: Server-side geofence validation
  const { data: geofenceSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'geofence')
    .single()

  if (geofenceSetting?.value) {
    const geofence = geofenceSetting.value as { lat: number; lng: number; radius: number }
    const R = 6371e3
    const phi1 = (latitude * Math.PI) / 180
    const phi2 = (geofence.lat * Math.PI) / 180
    const deltaPhi = ((geofence.lat - latitude) * Math.PI) / 180
    const deltaLambda = ((geofence.lng - longitude) * Math.PI) / 180
    const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    if (distance > geofence.radius) {
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

