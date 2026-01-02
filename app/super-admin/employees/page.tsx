'use client'

import { createClient } from '@/lib/supabase/client'
import { createEmployee, deleteEmployee } from '@/app/admin/employees/actions'
import { useEffect, useState } from 'react'

export default function SuperAdminEmployeesPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function getProfiles() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('email', 'aliveordinary@gmail.com')
        .order('name')
      if (data) setProfiles(data)
    }
    getProfiles()
  }, [])

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-white">Team Management</h2>
        <p className="text-gray-500 mt-1">Manage Admins and Employees for IQ Automations.</p>
      </header>

      {/* Add Person Form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-6">Create New User</h3>
        <form 
          action={async (formData) => {
            const res = await createEmployee(formData)
            if (res.error) alert(res.error)
            else window.location.reload()
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Full Name</label>
            <input name="name" required placeholder="Jane Doe" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Email</label>
            <input name="email" type="email" required placeholder="jane@iqautomations.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Role</label>
            <select name="role" className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none">
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Password</label>
            <input name="password" type="password" placeholder="Optional" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
              Create User
            </button>
          </div>
        </form>
      </div>

      {/* Team List */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl text-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">
              <th className="px-6 py-4 font-bold">Name</th>
              <th className="px-6 py-4 font-bold">Email</th>
              <th className="px-6 py-4 font-bold">Role</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {profiles?.map((p) => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4 font-semibold text-white">{p.name}</td>
                <td className="px-6 py-4 text-gray-400">{p.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest ${
                    p.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}>
                    {p.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                   <form action={async () => {
                    await deleteEmployee(p.id)
                    window.location.reload()
                  }}>
                    <button className="text-red-500/40 hover:text-red-500 text-xs font-bold transition-opacity opacity-0 group-hover:opacity-100 uppercase tracking-tighter">
                      Remove Access
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
