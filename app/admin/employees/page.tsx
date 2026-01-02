'use client'

import { createClient } from '@/lib/supabase/client'
import { createEmployee } from './actions'
import EmployeeRow from './EmployeeRow'
import { useEffect, useState } from 'react'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const supabase = createClient()

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
    <div className="space-y-12">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Employee Management</h2>
          <p className="text-gray-500 mt-1">Manage your team and their compensation.</p>
        </div>
      </header>

      {/* Add Employee Form Section (simplified) */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-6">Add New Employee</h3>
        <form 
          action={async (formData) => {
            const res = await createEmployee(formData)
            if (res.error) alert(res.error)
            else window.location.reload()
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Full Name</label>
            <input name="name" required placeholder="John Doe" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Email</label>
            <input name="email" type="email" required placeholder="john@iqautomations.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Role</label>
            <select name="role" className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none">
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Hourly Rate ($)</label>
            <input name="hourly_rate" type="number" step="0.01" required placeholder="25.00" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest pl-1">Password (Optional)</label>
            <input name="password" type="password" placeholder="Leave empty for email invite" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            <p className="text-[10px] text-gray-500 pl-1">If set, invite email is skipped.</p>
          </div>
          <div className="lg:col-span-2 flex items-end">
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
              Create User / Send Invite
            </button>
          </div>
        </form>
      </div>

      {/* Employee List */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl text-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">
              <th className="px-6 py-4 font-bold">Employee</th>
              <th className="px-6 py-4 font-bold">Role</th>
              <th className="px-6 py-4 font-bold">Hourly Rate</th>
              <th className="px-6 py-4 font-bold">Contact</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {employees?.map((emp) => (
              <EmployeeRow key={emp.id} emp={emp} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
