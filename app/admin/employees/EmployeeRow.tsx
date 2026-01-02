'use client'

import { useState } from 'react'
import { updateProfile, deleteEmployee } from './actions'
import { useToast } from '@/components/ui/Toast'

type Employee = {
  id: string
  name: string
  email: string
  role: 'employee' | 'admin'
  hourly_rate: number
  phone: string | null
  address: string | null
}

export default function EmployeeRow({ emp }: { emp: Employee }) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  
  const [displayData, setDisplayData] = useState(emp)

  const [formData, setFormData] = useState<{
    name: string
    email: string
    role: 'employee' | 'admin'
    hourly_rate: number
    phone: string
    address: string
  }>({
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
      showToast(res.error, 'error')
    } else {
      setDisplayData({
        ...displayData,
        ...formData,
        hourly_rate: updates.hourly_rate
      } as Employee)
      setIsEditing(false)
      showToast('Employee updated', 'success')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this employee?')) return
    const res = await deleteEmployee(emp.id)
    if (res.error) {
      showToast(res.error, 'error')
    } else {
      showToast('Employee removed', 'success')
      window.location.reload()
    }
  }

  if (isEditing) {
    return (
      <tr className="bg-[#0a0a0a]">
        <td>
          <input name="name" value={formData.name} onChange={handleChange} className="w-full mb-1" placeholder="Name" />
          <input name="email" value={formData.email} onChange={handleChange} className="w-full text-xs" placeholder="Email" />
        </td>
        <td>
          <select name="role" value={formData.role} onChange={handleChange} className="w-full">
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </td>
        <td>
          <input name="hourly_rate" type="number" step="0.01" value={formData.hourly_rate} onChange={handleChange} className="w-20" />
        </td>
        <td className="hidden md:table-cell">
          <input name="phone" value={formData.phone} onChange={handleChange} className="w-full mb-1" placeholder="Phone" />
          <input name="address" value={formData.address} onChange={handleChange} className="w-full text-xs" placeholder="Address" />
        </td>
        <td className="text-right space-x-3">
          <button onClick={handleSave} disabled={loading} className="text-accent hover:opacity-80 text-xs font-medium">
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button onClick={() => setIsEditing(false)} disabled={loading} className="text-[#666] hover:text-white text-xs font-medium">
            Cancel
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="group">
      <td>
        <div className="font-medium text-white">{displayData.name}</div>
        <div className="text-xs text-[#666]">{displayData.email}</div>
      </td>
      <td>
        <span className={`text-xs ${displayData.role === 'admin' ? 'text-accent' : 'text-[#666]'}`}>
          {displayData.role}
        </span>
      </td>
      <td className="font-mono text-accent">
        ${displayData.hourly_rate?.toFixed(2)}
      </td>
      <td className="text-xs text-[#666] hidden md:table-cell">
        <div>{displayData.phone || '—'}</div>
        <div className="truncate max-w-[150px]">{displayData.address || '—'}</div>
      </td>
      <td className="text-right space-x-3">
        <button onClick={() => setIsEditing(true)} className="text-[#666] hover:text-white text-xs font-medium md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          Edit
        </button>
        <button onClick={handleDelete} className="text-[#666] hover:text-[#ef4444] text-xs font-medium md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          Delete
        </button>
      </td>
    </tr>
  )
}
