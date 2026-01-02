import Link from 'next/link'
import { logout } from '@/app/login/actions'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-xl font-bold tracking-tight">
            IQ <span className="text-blue-500">Automations</span>
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">Super Admin Portal</p>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/super-admin" className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-gray-300 hover:text-white">
            Dashboard
          </Link>
          <Link href="/super-admin/employees" className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-gray-300 hover:text-white">
            Manage Team
          </Link>
          <Link href="/super-admin/time-entries" className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-gray-300 hover:text-white">
            Time Corrections
          </Link>
          <Link href="/super-admin/settings" className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-gray-300 hover:text-white font-semibold text-blue-400">
            System Settings
          </Link>
        </nav>

        <div className="pt-6 border-t border-white/5 mt-auto">
          <form action={logout}>
            <button className="w-full text-left px-4 py-3 text-sm text-gray-500 hover:text-red-400 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
