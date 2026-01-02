'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Allowed fields that can be updated via updateProfile
type ProfileUpdateFields = {
  name?: string
  email?: string
  phone?: string | null
  address?: string | null
  hourly_rate?: number | null
  role?: 'employee' | 'admin'
  is_active?: boolean
}

// Helper function to verify the caller has admin privileges
async function verifyAdminRole(): Promise<{ authorized: boolean; error?: string; userId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { authorized: false, error: 'Not authenticated' }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return { authorized: false, error: 'Unauthorized: Admin privileges required' }
  }
  
  return { authorized: true, userId: user.id }
}

export async function createEmployee(formData: FormData) {
  const authCheck = await verifyAdminRole()
  if (!authCheck.authorized) return { error: authCheck.error }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as 'employee' | 'admin'
  const hourlyRateStr = formData.get('hourly_rate') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const password = formData.get('password') as string

  // Input validation
  if (!name || name.trim().length < 2) {
    return { error: 'Name must be at least 2 characters' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    return { error: 'Invalid email address' }
  }
  
  if (role && !['employee', 'admin'].includes(role)) {
    return { error: 'Invalid role. Must be employee or admin' }
  }
  
  const hourly_rate = hourlyRateStr ? parseFloat(hourlyRateStr) : null
  if (hourly_rate !== null && (isNaN(hourly_rate) || hourly_rate < 0)) {
    return { error: 'Invalid hourly rate' }
  }

  const supabaseAdmin = createAdminClient()
  let userId: string | null = null

  if (password && password.length > 0) {
    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters' }
    }
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })
    if (error) return { error: error.message }
    if (!data?.user) return { error: 'Failed to create user' }
    userId = data.user.id
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { name },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/update-password`,
    })
    if (error) return { error: error.message }
    if (!data?.user) return { error: 'Failed to create user' }
    userId = data.user.id
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      name: name.trim(),
      role: role || 'employee',
      hourly_rate,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
    })
    .eq('id', userId)

  if (profileError) return { error: profileError.message }

  revalidatePath('/admin/employees')
  revalidatePath('/super-admin/employees')
  return { success: true }
}

export async function updateProfile(id: string, updates: ProfileUpdateFields) {
  const authCheck = await verifyAdminRole()
  if (!authCheck.authorized) return { error: authCheck.error }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return { error: 'Invalid user ID' }
  }

  // Validate and sanitize updates - only allow specific fields
  const allowedFields: (keyof ProfileUpdateFields)[] = ['name', 'email', 'phone', 'address', 'hourly_rate', 'role', 'is_active']
  const sanitizedUpdates: Partial<ProfileUpdateFields> = {}
  
  for (const key of allowedFields) {
    if (key in updates) {
      // Validate specific fields
      if (key === 'role' && updates.role && !['employee', 'admin'].includes(updates.role)) {
        return { error: 'Invalid role' }
      }
      if (key === 'hourly_rate' && updates.hourly_rate !== null && updates.hourly_rate !== undefined) {
        if (typeof updates.hourly_rate !== 'number' || updates.hourly_rate < 0) {
          return { error: 'Invalid hourly rate' }
        }
      }
      if (key === 'email' && updates.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(updates.email)) {
          return { error: 'Invalid email address' }
        }
      }
      sanitizedUpdates[key] = updates[key] as any
    }
  }

  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  // If email is being updated, sync with auth
  if (sanitizedUpdates.email) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      email: sanitizedUpdates.email,
      email_confirm: true
    })
    
    if (authError) return { error: 'Auth update failed: ' + authError.message }
  }

  const { error } = await supabase
    .from('profiles')
    .update(sanitizedUpdates)
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/employees')
  revalidatePath('/super-admin/employees')
  return { success: true }
}

export async function deleteEmployee(id: string) {
  const authCheck = await verifyAdminRole()
  if (!authCheck.authorized) return { error: authCheck.error }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return { error: 'Invalid user ID' }
  }

  // Prevent self-deletion
  if (id === authCheck.userId) {
    return { error: 'Cannot delete your own account' }
  }

  const supabaseAdmin = createAdminClient()
  
  // Verify target is not a super_admin
  const { data: target } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', id)
    .single()
  
  if (target?.role === 'super_admin') {
    return { error: 'Cannot delete super admin accounts' }
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/employees')
  revalidatePath('/super-admin/employees')
  return { success: true }
}

