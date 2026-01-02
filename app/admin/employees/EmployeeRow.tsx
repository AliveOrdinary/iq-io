'use client'

import { useState } from 'react'
import { updateProfile, deleteEmployee } from './actions'

type Employee = {
  id: string
  name: string
  email: string
  role: string
  hourly_rate: number
  phone: string | null
  address: string | null
}

export default function EmployeeRow({ emp }: { emp: Employee }) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Local state for the "View" mode to support optimistic updates
  const [displayData, setDisplayData] = useState(emp)

  const [formData, setFormData] = useState({
    name: emp.name || '',
    email: emp.email || '',
    role: emp.role || 'employee',
    hourly_rate: emp.hourly_rate || 0,
    phone: emp.phone || '',
    address: emp.address || ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    setLoading(true)
    const updates = { ...formData, hourly_rate: parseFloat(formData.hourly_rate.toString()) }
    
    const res = await updateProfile(emp.id, updates)
    if (res.error) {
      alert(res.error)
    } else {
      // Update local display data to reflect changes immediately
      setDisplayData({
        ...displayData,
        ...formData,
        hourly_rate: updates.hourly_rate
      } as Employee)
      setIsEditing(false)
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this employee?')) return
    await deleteEmployee(emp.id)
    window.location.reload()
  }

  if (isEditing) {
    return (
      <tr className="bg-white/[0.05]">
        <td className="px-6 py-4">
          <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-xs mb-1" placeholder="Name" />
          <input name="email" value={formData.email} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-gray-300 text-xs" placeholder="Email" />
        </td>
        <td className="px-6 py-4">
          <select name="role" value={formData.role} onChange={handleChange} className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-xs">
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </td>
        <td className="px-6 py-4">
          <input name="hourly_rate" type="number" step="0.01" value={formData.hourly_rate} onChange={handleChange} className="w-20 bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-xs" />
        </td>
        <td className="px-6 py-4">
          <input name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-gray-300 text-xs mb-1" placeholder="Phone" />
          <input name="address" value={formData.address} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-gray-300 text-xs" placeholder="Address" />
        </td>
        <td className="px-6 py-4 text-right space-x-2">
          <button onClick={handleSave} disabled={loading} className="text-green-400 hover:text-green-300 text-xs font-bold uppercase">
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button onClick={() => setIsEditing(false)} disabled={loading} className="text-gray-400 hover:text-gray-300 text-xs font-bold uppercase">
            Cancel
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="hover:bg-white/[0.02] transition-colors group">
      <td className="px-6 py-4">
        <div className="font-semibold text-white">{displayData.name}</div>
        <div className="text-xs text-gray-500">{displayData.email}</div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
          displayData.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        }`}>
          {displayData.role}
        </span>
      </td>
      <td className="px-6 py-4 font-mono text-blue-400">
        ${displayData.hourly_rate?.toFixed(2)}
      </td>
      <td className="px-6 py-4 text-xs text-gray-400">
        <div>{displayData.phone || 'No phone'}</div>
        <div className="truncate max-w-[150px]">{displayData.address || 'No address'}</div>
      </td>
      <td className="px-6 py-4 text-right space-x-3">
        <button onClick={() => setIsEditing(true)} className="text-blue-500 hover:text-blue-400 text-xs font-bold transition-colors opacity-0 group-hover:opacity-100 uppercase tracking-tighter">
          Edit
        </button>
        <button onClick={handleDelete} className="text-red-500/40 hover:text-red-500 text-xs font-bold transition-colors opacity-0 group-hover:opacity-100 uppercase tracking-tighter">
          Delete
        </button>
      </td>
    </tr>
  )
}
