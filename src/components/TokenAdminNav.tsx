'use client'

import Link from 'next/link'

type Tab = 'dashboard' | 'settings' | 'access' | 'check-in'

export function TokenAdminNav({ token, current }: { token: string; current: Tab }) {
  const base = `/a/${token}`
  const linkClass = (tab: Tab) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      current === tab
        ? 'bg-white/20 text-white'
        : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10'
    }`
  return (
    <nav className="flex flex-wrap gap-2">
      <Link href={base} className={linkClass('dashboard')}>
        Dashboard
      </Link>
      <Link href={`${base}/settings`} className={linkClass('settings')}>
        Settings
      </Link>
      <Link href={`${base}/check-in`} className={linkClass('check-in')}>
        Check-in
      </Link>
      <Link href={`${base}/access`} className={linkClass('access')}>
        Access Management
      </Link>
    </nav>
  )
}
