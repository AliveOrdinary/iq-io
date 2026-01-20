import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/employees', label: 'Employees' },
  { href: '/admin/calendar', label: 'Calendar' },
  { href: '/admin/reports', label: 'Payroll Reports' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')
  
  // Verify user has admin or super_admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    redirect('/employee')
  }

  return (
    <div className="min-h-screen bg-black text-[#e5e5e5] flex flex-col md:flex-row">
      <AdminSidebar 
        title="IQ Automations" 
        subtitle="Admin" 
        navItems={navItems} 
      />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  )
}
