'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSettings(key: string, value: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('settings')
    .update({ value })
    .eq('key', key)

  if (error) return { error: error.message }
  
  revalidatePath('/super-admin/settings')
  revalidatePath('/employee') // Refresh for employees too
  return { success: true }
}

export async function updateTimeLogs(id: string, updates: any) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('time_entries')
    .update(updates)
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/super-admin/time-entries')
  return { success: true }
}
