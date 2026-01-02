'use client'

import { createClient } from '@/lib/supabase/client'
import { createEmployee, deleteEmployee } from '@/app/admin/employees/actions'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from '@/lib/database.types'
import { useToast } from '@/components/ui/Toast'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function SuperAdminEmployeesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const supabase = createClient()
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    async function getProfiles() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'super_admin')
        .order('name')
      if (data) setProfiles(data)
    }
    getProfiles()
  }, [])

  const handleCreateEmployee = async (formData: FormData) => {
    const res = await createEmployee(formData)
    if (res.error) {
      showToast(res.error, 'error')
    } else {
      showToast('User created', 'success')
      router.refresh()
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'super_admin')
        .order('name')
      if (data) setProfiles(data)
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    const res = await deleteEmployee(id)
    if (res.error) {
      showToast(res.error, 'error')
    } else {
      showToast('User removed', 'success')
      setProfiles(profiles.filter(p => p.id !== id))
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-semibold text-white">Team Management</h2>
        <p className="text-[#666] text-sm mt-0.5">Manage admins and employees</p>
      </header>

      {/* Add User Form */}
      <div className="card p-6">
        <h3 className="font-medium text-white mb-4">Create New User</h3>
        <form 
          action={handleCreateEmployee}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div>
            <label className="block text-xs text-[#666] mb-1.5">Full Name</label>
            <input name="name" required placeholder="Jane Doe" className="w-full" />
          </div>
          <div>
            <label className="block text-xs text-[#666] mb-1.5">Email</label>
            <input name="email" type="email" required placeholder="jane@iqautomations.com" className="w-full" />
          </div>
          <div>
            <label className="block text-xs text-[#666] mb-1.5">Role</label>
            <select name="role" className="w-full">
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full btn btn-primary py-2.5">
              Create User
            </button>
          </div>
        </form>
      </div>

      {/* Team List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[500px] w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th className="hidden sm:table-cell">Email</th>
                <th>Role</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles?.map((p) => (
                <tr key={p.id} className="group">
                  <td>
                    <div className="font-medium text-white">{p.name}</div>
                    <div className="text-xs text-[#666] sm:hidden">{p.email}</div>
                  </td>
                  <td className="text-[#999] hidden sm:table-cell">{p.email}</td>
                  <td>
                    <span className={`text-xs ${p.role === 'admin' ? 'text-accent' : 'text-[#666]'}`}>
                      {p.role}
                    </span>
                  </td>
                  <td className="text-right">
                     <button 
                       onClick={() => handleDeleteEmployee(p.id)}
                       className="text-[#666] hover:text-[#ef4444] text-xs font-medium md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                     >
                       Remove
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
