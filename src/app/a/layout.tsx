'use client'

import AdminNavigation from '@/components/AdminNavigation'

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
    </>
  )
}

