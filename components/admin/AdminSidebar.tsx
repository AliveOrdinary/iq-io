import Link from 'next/link'
import { logout } from '@/app/login/actions'

type NavItem = {
  href: string
  label: string
  highlight?: boolean
}

type AdminSidebarProps = {
  title: string
  subtitle: string
  navItems: NavItem[]
}

export function AdminSidebar({ title, subtitle, navItems }: AdminSidebarProps) {
  return (
    <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col">
      <div className="mb-12 text-center md:text-left">
        <h1 className="text-xl font-bold tracking-tight">
          IQ <span className="text-blue-500">Automations</span>
        </h1>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">{subtitle}</p>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href} 
            className={`block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-gray-300 hover:text-white ${
              item.highlight ? 'font-semibold text-blue-400' : ''
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="pt-6 border-t border-white/5 mt-auto">
        <form action={logout}>
          <button className="w-full text-left px-4 py-3 text-sm text-gray-500 hover:text-red-400 transition-colors">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
