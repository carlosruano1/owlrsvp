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
      <div className="pt-16">
        {children}
      </div>
      <ScrollToTop />
    </>
  )
}

