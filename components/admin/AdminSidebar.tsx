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
    <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r border-[#222] p-5 flex flex-col bg-black">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-white tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-[#666] mt-0.5">{subtitle}</p>
      </div>

      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href} 
            className={`block px-3 py-2 text-sm text-[#999] hover:text-white hover:bg-[#111] transition-colors rounded ${
              item.highlight ? 'text-accent' : ''
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="pt-4 border-t border-[#222] mt-auto">
        <form action={logout}>
          <button className="text-sm text-[#666] hover:text-[#ef4444] transition-colors">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
