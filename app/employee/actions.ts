'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function clockIn(latitude: number, longitude: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

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
  console.log('Clocking out for entry:', id)
  const supabase = await createClient()
  
  const now = new Date()
  const clock_out = now.toISOString()

  // Get clock_in time to calculate hours
  const { data: entry, error: fetchError } = await supabase
    .from('time_entries')
    .select('clock_in')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Error fetching entry:', fetchError)
    return { error: fetchError.message }
  }

  if (!entry) {
    console.error('Entry not found for id:', id)
    return { error: 'Entry not found' }
  }

  const clockInDate = new Date(entry.clock_in)
  const hoursWorked = (now.getTime() - clockInDate.getTime()) / (1000 * 60 * 60)
  
  console.log('Calculated hours:', hoursWorked)

  const { error } = await supabase
    .from('time_entries')
    .update({
      clock_out,
      hours_worked: parseFloat(hoursWorked.toFixed(2)),
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating entry:', error)
    return { error: error.message }
  }

  revalidatePath('/employee')
  return { success: true }
}
