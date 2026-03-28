// /home/user/LockIn/components/Navigation.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Dumbbell, FileText, CalendarDays, Flame, Settings } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Body', icon: Dumbbell, href: '/body' },
  { label: 'Notes', icon: FileText, href: '/notes' },
  { label: 'Calendar', icon: CalendarDays, href: '/calendar' },
  { label: 'Focus', icon: Flame, href: '/focus' },
]

interface NavigationProps {
  mobile?: boolean
}

export default function Navigation({ mobile = false }: NavigationProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  if (mobile) {
    return (
      <nav className="bg-surface border-t border-bdr px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map(({ label, icon: Icon, href }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors',
                  active ? 'text-accent' : 'text-textSecondary hover:text-textPrimary'
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    )
  }

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-bdr flex flex-col z-40">
      {/* App name */}
      <div className="px-6 py-6 border-b border-bdr">
        <div className="flex items-center gap-2">
          <span className="font-syne text-2xl font-bold text-textPrimary">Clutch</span>
          <span className="w-2 h-2 rounded-full bg-accent" />
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, icon: Icon, href }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium',
                active
                  ? 'bg-accent/10 text-accent'
                  : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceElevated'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className="text-sm">{label}</span>
            </Link>
          )
        })}
      </div>

      {/* Settings at bottom */}
      <div className="px-3 py-4 border-t border-bdr">
        <Link
          href="/settings"
          className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium',
            isActive('/settings')
              ? 'bg-accent/10 text-accent'
              : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceElevated'
          )}
        >
          <Settings size={20} strokeWidth={isActive('/settings') ? 2.5 : 2} />
          <span className="text-sm">Settings</span>
        </Link>
      </div>
    </nav>
  )
}
