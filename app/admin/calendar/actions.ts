'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addOffDay(date: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Verify user is admin or super_admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase.from('off_days').insert({
    date,
    name,
    type: 'company',
    created_by: user.id
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'This date is already marked as an off day' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/calendar')
  return { success: true }
}

export async function removeOffDay(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Verify user is admin or super_admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Unauthorized' }
  }

  // Check if it's a statutory holiday (cannot delete)
  const { data: offDay } = await supabase
    .from('off_days')
    .select('type')
    .eq('id', id)
    .single()

  if (offDay?.type === 'statutory') {
    return { error: 'Cannot remove statutory holidays' }
  }

  const { error } = await supabase
    .from('off_days')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/calendar')
  return { success: true }
}
