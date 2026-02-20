'use client'

import AdminNavigation from '@/components/AdminNavigation'
import ScrollToTop from '@/components/ScrollToTop'

export default function EventAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AdminNavigation />
      <div className="pt-16 min-h-screen relative">
        <div className="absolute inset-0 bind8-bg" />
        <div className="absolute inset-0 bind8-glow" />
        <div className="relative z-10">
          {children}
        </div>
      </div>
      <ScrollToTop />
    </>
  )
}

