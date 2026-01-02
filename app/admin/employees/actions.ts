'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEmployee(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as 'employee' | 'admin'
  const hourly_rate = parseFloat(formData.get('hourly_rate') as string)
  const phone = formData.get('phone') as string
  /* Removed duplicate phone line */
  const address = formData.get('address') as string
  const password = formData.get('password') as string

  // Note: auth.admin functions require service_role key
  // We'll use a standard invite or just insert into profiles if the user already exists
  // For this simplified version, let's assume we're creating a profile for an existing auth user
  // OR we can use the invite mechanism.
  
  // Since I don't have the password, the best way in Supabase is to send an invite email
  const supabaseAdmin = createAdminClient()
  let authData: any, authError

  if (password && password.length > 0) {
    // Create user directly with password
    const result = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })
    authData = result.data
    authError = result.error
  } else {
    // Send invite
    // Note: redirectTo points to update-password because implied flow returns hash tokens
    // which cannot be seen by the server-side auth/callback route.
    const result = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { name },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/update-password`,
    })
    authData = result.data
    authError = result.error
  }

  if (authError) return { error: authError.message }
  if (!authData?.user) return { error: 'Failed to create user' }

  // Update profile with extra info (trigger handle_new_user should have created it)
  // Use admin client to ensure we have permission to update the new user's profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      name,
      role,
      hourly_rate,
      phone,
      address,
    })
    .eq('id', authData.user.id)

  if (profileError) return { error: profileError.message }

  revalidatePath('/admin/employees')
  return { success: true }
}

export async function updateProfile(id: string, updates: any) {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  // If email is being updated, we need to update the auth user as well
  if (updates.email) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      email: updates.email,
      email_confirm: true // Auto-confirm the change
    })
    
    if (authError) return { error: 'Auth update failed: ' + authError.message }
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/employees')
  return { success: true }
}

export async function deleteEmployee(id: string) {
  const supabase = await createClient()
  
  
  // In a production app, we should probably soft delete or deactivate
  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)

  if (error) return { error: error.message }
  revalidatePath('/admin/employees')
  return { success: true }
}
