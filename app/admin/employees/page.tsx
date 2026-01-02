'use client'

import { createClient } from '@/lib/supabase/client'
import { createEmployee } from './actions'
import EmployeeRow from './EmployeeRow'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const supabase = createClient()
  const { showToast } = useToast()

  useEffect(() => {
    async function getEmployees() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'super_admin')
        .order('name')
      if (data) setEmployees(data)
    }
    getEmployees()
  }, [])

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-semibold text-white">Employees</h2>
        <p className="text-[#666] text-sm mt-0.5">Manage your team and compensation</p>
      </header>

      {/* Add Employee Form */}
      <div className="card p-6">
        <h3 className="font-medium text-white mb-4">Add New Employee</h3>
        <form 
          action={async (formData) => {
            const res = await createEmployee(formData)
            if (res.error) {
              showToast(res.error, 'error')
            } else {
              showToast('Employee created successfully', 'success')
              window.location.reload()
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-xs text-[#666] mb-1.5">Full Name</label>
            <input name="name" required placeholder="John Doe" className="w-full" />
          </div>
          <div>
            <label className="block text-xs text-[#666] mb-1.5">Email</label>
            <input name="email" type="email" required placeholder="john@iqautomations.com" className="w-full" />
          </div>
          <div>
            <label className="block text-xs text-[#666] mb-1.5">Role</label>
            <select name="role" className="w-full">
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#666] mb-1.5">Hourly Rate ($)</label>
            <input name="hourly_rate" type="number" step="0.01" required placeholder="25.00" className="w-full" />
          </div>
          <div>
            <label className="block text-xs text-[#666] mb-1.5">Password (Optional)</label>
            <input name="password" type="password" placeholder="Leave empty for invite" className="w-full" />
            <p className="text-[10px] text-[#444] mt-1">If set, invite email is skipped</p>
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full btn btn-primary py-2.5">
              Create Employee
            </button>
          </div>
        </form>
      </div>

      {/* Employee List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Hourly Rate</th>
                <th className="hidden md:table-cell">Contact</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((emp) => (
                <EmployeeRow key={emp.id} emp={emp} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
